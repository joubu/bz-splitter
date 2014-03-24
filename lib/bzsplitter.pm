package BZSplitter;

use Modern::Perl;
use Dancer ':syntax';

our $VERSION = '0.1';

our $config = {
    bugzilla => {
        base_url => 'http://bugs.koha-community.org/bugzilla3/show_bug.cgi?id=',
    }
};

get '/' => sub {
    template 'index';
};

true;
