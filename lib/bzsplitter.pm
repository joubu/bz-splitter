package BZSplitter;

use Modern::Perl;
use Dancer ':syntax';

use Dancer::Plugin::Database;
use Dancer::Plugin::DBIC qw(schema resultset);
use Dancer::Plugin::Ajax;

use HTML::Entities;

our $VERSION = '0.1';

our $config = {
    bugzilla => {
        base_url => 'http://bugs.koha-community.org/bugzilla3/',
    }
};

our @STATUSES = (
    { id => 'nso', name => 'Needs Signoff' },
    { id => 'so',  name => 'Signed Off'},
    { id => 'fqa', name => 'Failed QA'},
    { id => 'pqa', name => 'Passed QA'},
);

get '/' => sub {
    template 'index';
};

get '/files' => sub {
    my $statuses = param "status";
    my @statuses = ( $statuses ? ref $statuses ? @$statuses : $statuses : () );
    my $files = get_files({
        statuses => \@statuses,
    });
    template 'files' => {
        action => 'list',
        files  => $files,
        statuses => get_statuses( \@statuses ),
    };
};

get '/authors' => sub {
    my $statuses = param "status";
    my @statuses = ( $statuses ? ref $statuses ? @$statuses : $statuses : () );
    my $authors = get_authors({
        statuses => \@statuses,
    });
    template 'authors' => {
        action  => 'list',
        authors => $authors,
        statuses => get_statuses( \@statuses ),
    };
};

get '/patterns' => sub {
    template 'patterns';
};

ajax '/bugs/file/' => sub {
    my $filepath = params->{filepath};
    my $statuses = param "status";
    my @statuses = ( $statuses ? ref $statuses ? @$statuses : $statuses : () );
    my $bugs = get_bugs( { filepath => $filepath, statuses => \@statuses } );
    {
        bugs     => $bugs,
        base_url => $config->{bugzilla}{base_url},
    };
};

ajax '/bugs/authors/:author_name' => sub {
    my $author_name = params->{author_name};
    my $statuses = param "status";
    my @statuses = ( $statuses ? ref $statuses ? @$statuses : $statuses : () );
    my $bugs = get_bugs( { author_name => $author_name, statuses => \@statuses } );
    {
        author_name => $author_name,
        bugs        => $bugs,
    };
};

ajax '/bugs/patterns/:pattern' => sub {
    my $pattern = params->{pattern};
    my $bugs = get_bugs( { pattern => $pattern, limit => 100 } );
    {
        pattern => $pattern,
        bugs    => $bugs,
    };
};

ajax '/patches/bug/:bug_id/file/' => sub {
    my $bug_id   = param('bug_id');
    my $filepath = params->{filepath};
    my $patches  = get_patches(
        {
            bug_id   => $bug_id,
            filepath => $filepath,
        }
    );
    for my $patch (@$patches) {
        $patch->{diff} = encode_entities( $patch->{diff} );
    }
    {
        filepath => $filepath,
        patches  => $patches,
        base_url => $config->{bugzilla}{base_url},
    };
};

ajax '/patches/bug/:bug_id/author/:author_name' => sub {
    my $bug_id      = param('bug_id');
    my $author_name = param('author_name');
    my $patches     = get_patches(
        {
            bug_id      => $bug_id,
            author_name => $author_name,
        }
    );
    for my $patch (@$patches) {
        $patch->{diff} = encode_entities( $patch->{diff} );
    }
    {
        author_name => $author_name,
        patches     => $patches,
        base_url => $config->{bugzilla}{base_url},
    };
};

ajax '/patches/bug/:bug_id/pattern/:pattern' => sub {
    my $bug_id      = param('bug_id');
    my $pattern     = param('pattern');
    my $patches     = get_patches(
        {
            bug_id  => $bug_id,
            pattern => $pattern,
        }
    );
    for my $patch (@$patches) {
        $patch->{diff} = encode_entities( $patch->{diff} );
    }
    {
        pattern  => $pattern,
        patches  => $patches,
        base_url => $config->{bugzilla}{base_url},
    };
};

sub get_files {
    my ($filters) = @_;
    my $statuses  = $filters->{statuses} || [];
    return database->selectall_arrayref(
        q|
            SELECT  distinct(filepath),
                    SUM(num_lines_added) AS num_lines_added,
                    SUM(num_lines_deleted) AS num_lines_deleted,
                    COUNT(DISTINCT(attachment_id)) AS num_patches,
                    COUNT(DISTINCT(bug_id)) AS num_bugs
            FROM diff
            WHERE 1 |
        . ( @$statuses ? q| AND bug_status IN ( | . join( ', ', ('?') x scalar( @$statuses ) ) . q| ) | : '' )
        . q|
            GROUP BY filepath
            ORDER BY filepath
        |,
        { Slice => {} },
        (
            @$statuses,
        )
    );
}

sub get_authors {
    my ($filters) = @_;
    my $statuses  = $filters->{statuses} || [];
    return database->selectall_arrayref(
        q|
            SELECT  distinct(author_name),
                    SUM(num_lines_added) AS num_lines_added,
                    SUM(num_lines_deleted) AS num_lines_deleted,
                    COUNT(DISTINCT(attachment_id)) AS num_patches,
                    COUNT(DISTINCT(bug_id)) AS num_bugs
            FROM diff
            WHERE 1 |
        . ( @$statuses ? q| AND bug_status IN ( | . join( ', ', ('?') x scalar( @$statuses ) ) . q| ) | : '' )
        . q|
            GROUP BY author_name
            ORDER BY author_name
        |,

        { Slice => {} },
        (
            @$statuses,
        )
    );
}

sub get_bugs {
    my ($params)    = @_;
    my $filepath    = $params->{filepath};
    my $author_name = $params->{author_name};
    my $pattern     = $params->{pattern};
    my $limit       = $params->{limit};
    my $statuses    = $params->{statuses} || [];

    return database->selectall_arrayref(
        q|
            SELECT  DISTINCT(bug_id),
                    bug_title,
                    bug_status,
                    SUM(num_lines_added) AS num_lines_added,
                    SUM(num_lines_deleted) AS num_lines_deleted
            FROM diff
            WHERE 1 |
          . ( $filepath    ? q| AND filepath = ? |    : '' )
          . ( $author_name ? q| AND author_name = ? | : '' )
          . ( $pattern     ? q| AND diff LIKE ? |     : '' )
          . ( @$statuses   ? q| AND bug_status IN ( | . join( ', ', ('?') x scalar( @$statuses ) ) . q| ) | : '' )
          . q|
            GROUP BY bug_id, bug_title, bug_status
            ORDER BY bug_id
            |
          . ( $limit ? qq| LIMIT $limit| : '' ),
        { Slice => {} },
        (
            ( $filepath    ? $filepath    : () ),
            ( $author_name ? $author_name : () ),
            ( $pattern     ? "%$pattern%" : () ),
            @$statuses,

        )
    );
}

sub get_patches {
    my ($params)    = @_;
    my $bug_id      = $params->{bug_id};
    my $filepath    = $params->{filepath};
    my $author_name = $params->{author_name};
    my $pattern     = $params->{pattern};
    return database->selectall_arrayref(
        q|
            SELECT  attachment_id,
                    date,
                    diff,
                    attachment_description,
                    author_name,
                    filepath
            FROM diff
            WHERE bug_id = ? |
              . ( $filepath    ? q| AND filepath = ? |    : '' )
              . ( $author_name ? q| AND author_name = ? | : '' )
              . ( $pattern     ? q| AND diff LIKE ? |   : '' )
              . q| ORDER BY date
        |,
        { Slice => {} },
        (
            $bug_id,
            ( $filepath    ? $filepath    : () ),
            ( $author_name ? $author_name : () ),
            ( $pattern     ? "%$pattern%" : () ),
        )
    );
}

sub get_statuses {
    my ( $selected ) = @_;
    $selected = [ map{ $_->{name} } @STATUSES ] unless $selected and @$selected;
    my @statuses;
    for my $status( @STATUSES ) {
        push @statuses, {
            id       => $status->{id},
            name     => $status->{name},
            selected => ( grep /^$status->{name}$/, @$selected ) ? 1: 0 ,
        };
    }
    return \@statuses;
}

true;
