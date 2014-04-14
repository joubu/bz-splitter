use Modern::Perl;
use Test::More tests => 4;
use bzsplitter;
use Dancer::Test;

response_content_like [ GET => '/' ],
    qr{<h1>Browse patches</h1>}ms,
    "index returns the app title";

response_content_like [ GET => '/files' ],
    qr{<h2>Browse by files</h2>}ms,
    "/files returns an appropriate title";

response_content_like [ GET => '/authors' ],
    qr{<h2>Browse by authors</h2>}ms,
    "/authors returns an appropriate title";

response_content_like [ GET => '/patterns' ],
    qr{<h2>Browse by patterns</h2>}ms,
    "/patterns returns an appropriate title";

