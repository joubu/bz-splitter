package BZSplitter;

use Modern::Perl;
use Dancer ':syntax';

use Dancer::Plugin::Database;
use Dancer::Plugin::Ajax;

use HTML::Entities;

our $VERSION = '0.1';

our $config = {
    bugzilla => {
        base_url => 'http://bugs.koha-community.org/bugzilla3/',
    }
};

get '/' => sub {
    template 'index';
};

get '/files' => sub {
    my $files = get_files();
    template 'files' => {
        action => 'list',
        files  => $files,
    };
};

get '/authors' => sub {
    my $authors = get_authors();
    template 'authors' => {
        action  => 'list',
        authors => $authors,
    };
};

get '/patterns' => sub {
    template 'patterns';
};

ajax '/bugs/file/' => sub {
    my $filepath = params->{filepath};
    my $bugs = get_bugs( { filepath => $filepath } );
    {
        bugs     => $bugs,
        base_url => $config->{bugzilla}{base_url},
    };
};

ajax '/bugs/authors/:author_name' => sub {
    my $author_name = params->{author_name};
    my $bugs = get_bugs( { author_name => $author_name } );
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
    return database->selectall_arrayref(
        q|
            SELECT  distinct(filepath),
                    SUM(num_lines_added) AS num_lines_added,
                    SUM(num_lines_deleted) AS num_lines_deleted
            FROM diff
            GROUP BY filepath
            ORDER BY filepath
        |,
        { Slice => {} }
    );
}

sub get_authors {
    my ($filters) = @_;
    return database->selectall_arrayref(
        q|
            SELECT  distinct(author_name),
                    SUM(num_lines_added) AS num_lines_added,
                    SUM(num_lines_deleted) AS num_lines_deleted,
                    COUNT(DISTINCT(attachment_id)) AS num_patches,
                    COUNT(DISTINCT(bug_id)) AS num_bugs
            FROM diff
            GROUP BY author_name
            ORDER BY author_name
        |,

        { Slice => {} }
    );
}

sub get_bugs {
    my ($params)    = @_;
    my $filepath    = $params->{filepath};
    my $author_name = $params->{author_name};
    my $pattern     = $params->{pattern};
    my $limit       = $params->{limit};
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
          . q|
            GROUP BY bug_id
            ORDER BY bug_id
            |
          . ( $limit ? qq| LIMIT $limit| : '' ),
        { Slice => {} },
        (
            ( $filepath    ? $filepath    : () ),
            ( $author_name ? $author_name : () ),
            ( $pattern     ? "%$pattern%" : () ),

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

true;
