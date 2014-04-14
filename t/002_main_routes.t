use Modern::Perl;

use Test::More tests => 8;

# the order is important
use bzsplitter;
use Dancer::Test;

route_exists [GET => '/'], 'a route handler is defined for /';
response_status_is ['GET' => '/'], 200, 'response status is 200 for /';

route_exists [GET => '/files'], 'a route handler is defined for /files';
response_status_is ['GET' => '/files'], 200, 'response status is 200 for /files';

route_exists [GET => '/authors'], 'a route handler is defined for /authors';
response_status_is ['GET' => '/authors'], 200, 'response status is 200 for /authors';

route_exists [GET => '/patterns'], 'a route handler is defined for /patterns';
response_status_is ['GET' => '/patterns'], 200, 'response status is 200 for /patterns';
