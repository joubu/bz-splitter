#!/usr/bin/perl

use Modern::Perl;

use DBI;
use URI::Escape qw( uri_unescape );


# CREATE DATABASE bzsplitter;
# Add privileges on bzsplitter to bugs user

my $config = {
    bugzilla => {
        db_driver => 'mysql',
        db_name => 'bugs_bz',
        db_host => 'localhost',
        db_port => '3306',
        db_user => 'bugs',
        db_passwd => 'passwd',
    },
    stats => {
        db_driver => 'mysql',
        db_name => 'bzsplitter',
        db_host => 'localhost',
        db_port => '3306',
        db_user => 'bugs',
        db_passwd => 'passwd',
    }
};

my @statuses = (
    'Needs Signoff',
    'Signed Off',
    'Passed QA',
    'Failed QA',
);

our $db_opts = ($config->{bugzilla}{db_driver} eq 'mysql')
             ? { RaiseError => 1, mysql_enable_utf8 => 1 }
             : ($config->{bugzilla}{db_driver} eq 'Pg')
                ? { RaiseError => 1, pg_enable_utf8    => 1 }
                : {};

sub get_bugzilla_dbh {
  my $dbh = DBI->connect( "DBI:$config->{bugzilla}{db_driver}:dbname=$config->{bugzilla}{db_name};host=$config->{bugzilla}{db_host};port=$config->{bugzilla}{db_port}",
    $config->{bugzilla}{db_user}, $config->{bugzilla}{db_passwd}, $db_opts )
  or die $DBI::errstr;
  return $dbh;
}

sub get_stats_dbh {
  my $dbh = DBI->connect( "DBI:$config->{stats}{db_driver}:dbname=$config->{stats}{db_name};host=$config->{stats}{db_host};port=$config->{stats}{db_port}",
    $config->{stats}{db_user}, $config->{stats}{db_passwd}, $db_opts )
  or die $DBI::errstr;
  return $dbh;
}

my $dbh = get_bugzilla_dbh();

my @bug_numbers = @{
    $dbh->selectcol_arrayref(
        q|
    SELECT bug_id
    FROM bugs
    WHERE bug_status IN( | . join( ', ', ('?') x scalar (@statuses )) . q| )
    ORDER BY bug_id
    |,
    {}, @statuses )
  };

my $stats_dbh = get_stats_dbh();
$stats_dbh->{AutoCommit} = 0;
init_db( $stats_dbh );

for my $bug_number ( @bug_numbers ) {
    say "Bug $bug_number...";
    my @attachments = @{
        $dbh->selectall_arrayref( q|
        SELECT bugs.short_desc, bugs.bug_status, attach_data.thedata, attachments.attach_id, attachments.description, attachments.creation_ts
        FROM attach_data
        LEFT JOIN attachments ON attach_data.id = attachments.attach_id
        LEFT JOIN profiles ON attachments.submitter_id = profiles.userid
        LEFT JOIN bugs ON attachments.bug_id = bugs.bug_id
        WHERE attachments.bug_id = ?
        AND ispatch = 1
        AND isobsolete = 0
    |, { Slice => {} }, $bug_number )};
    my @patches;
    for my $attachment ( @attachments ) {
        my %details;
        my $hunks = get_hunks( $attachment->{thedata} );
        $details{bug_id} = $bug_number;
        $details{bug_title} = $attachment->{short_desc};
        $details{bug_status} = $attachment->{bug_status};
        $details{hunks} = $hunks->{hunks};
        $details{attachment_id} = $attachment->{attach_id};
        $details{attachment_description} = $attachment->{description};
        $details{author} = $hunks->{author_name};
        $details{date} = $attachment->{creation_ts};
        push @patches, \%details;
    }
    insert_patches_data( \@patches, $stats_dbh );
}
$stats_dbh->commit;


sub init_db {
    # It would be great to put data into a NoSQL DB
    my ( $dbh ) = @_;
    $dbh->do(q|
        DROP TABLE IF EXISTS diff;
    |);

    $dbh->do(
        q|
            CREATE TABLE diff (
                id INT(11) NOT NULL AUTO_INCREMENT,
                bug_id INT(11) NOT NULL,
                bug_title VARCHAR(255) NOT NULL,
                bug_status VARCHAR(64) NOT NULL DEFAULT '',
                attachment_id INT(11) NOT NULL,
                attachment_description TINYTEXt,
                author_name VARCHAR(255) NOT NULL,
                date TIMESTAMP,
                filepath TEXT,
                diff LONGTEXT,
                num_lines_added int(11),
                num_lines_deleted int(11),
                PRIMARY KEY (id)
            ) ENGINE=MyISAM DEFAULT CHARSET=utf8;
        |
    );
}

sub insert_patches_data {
    my ( $patches, $dbh ) = @_;
    my $sth = $dbh->prepare(q|
        INSERT INTO diff(bug_id, bug_title, bug_status, attachment_id, attachment_description, author_name, date, filepath, diff, num_lines_added, num_lines_deleted)
        VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    |);
    for my $patch ( @$patches ) {
        my $bug_id = $patch->{bug_id};
        my $bug_title = $patch->{bug_title};
        my $bug_status = $patch->{bug_status};
        my $attachment_id = $patch->{attachment_id};
        my $attachment_description = $patch->{attachment_description};
        my $author = $patch->{author};
        my $date = $patch->{date};
        for my $filepath ( keys %{$patch->{hunks}} ) {
            my $diff = $patch->{hunks}{$filepath}{diff};
            my $num_lines_added = $patch->{hunks}{$filepath}{num_lines_added};
            my $num_lines_deleted = $patch->{hunks}{$filepath}{num_lines_deleted};
            $sth->execute(
                $bug_id,
                $bug_title,
                $bug_status,
                $attachment_id,
                $attachment_description,
                $author,
                $date,
                $filepath,
                (join "\n", @$diff),
                $num_lines_added // 0,
                $num_lines_deleted // 0,
            );
        }
    }
}

sub get_hunks {
    my ( $patch_content ) = @_;
    my ( $author_name, $filename, %data );
    for my $line ( split '\n', $patch_content ) {
        next if $line =~ m|---\s.*|; # TODO Maybe should we manage deleted files here.
        if ( $line =~ m|^From: ([^<]*)<.*| ) {
            $author_name = $1;
            $author_name=~ s/"//g;
            next;
        }
        if ( $line =~ m|\+\+\+\sb/(.*)| ) {
            $filename = $1;
            next;
        }
        next unless $filename and $author_name;
        next if $line =~ m|^--\s|;
        $data{hunks}{$filename}{num_lines_added}  ++ if $line =~ m|^\+|;
        $data{hunks}{$filename}{num_lines_deleted}++ if $line =~ m|^-|;
        push @{ $data{hunks}{$filename}{diff} }, $line;
    }

    $data{author_name} = email_decode( $author_name );
    return \%data;
}

sub email_decode {
    my ( $email ) = @_;
    return q{} unless $email;
    my @pairs = split '\?', $email;
    return $pairs[0] if @pairs <= 1;
    return $pairs[3] unless $pairs[1] =~ m|utf-8|i;
    $email = $pairs[3];
    $email =~ s/=/%/g;
    $email = URI::Escape::uri_unescape( $email );

    return $email;

}
