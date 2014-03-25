package BZSplitter;

use Modern::Perl;
use Dancer ':syntax';

use Dancer::Plugin::Database;
use Dancer::Plugin::Ajax;

use HTML::Entities;

our $VERSION = '0.1';

our $config = {
    bugzilla => {
        base_url => 'http://bugs.koha-community.org/bugzilla3/show_bug.cgi?id=',
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

ajax '/bugs/file/' => sub {
    my $filepath = params->{filepath};
    my $bugs = get_bugs_by_filepath( { filepath => $filepath } );
    {
        bugs     => $bugs,
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

sub get_bugs_by_filepath {
    my ($params) = @_;
    my $filepath = $params->{filepath};
    return database->selectall_arrayref(
        q|
            SELECT  DISTINCT(bug_id),
                    bug_title,
                    bug_status,
                    SUM(num_lines_added) AS num_lines_added,
                    SUM(num_lines_deleted) AS num_lines_deleted
            FROM diff
            WHERE filepath = ?
            GROUP BY bug_id
            ORDER BY bug_id
        |,
        { Slice => {} },
        $filepath
    );
}


true;
