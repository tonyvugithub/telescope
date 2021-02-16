const service = require('.');

const port = parseInt(process.env.FEED_DISCOVERY_PORT || 6666, 10);

service.start(port);
