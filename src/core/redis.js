// node_redis must be used as long as bull relies on it
var Redis = require('redis');
var redisUrl = require('redis-url');
var logger = require('../logger')(__filename);

var redis = null;
function connect() {
    if (redis === null) {
        var components = parse();
        redis = Redis.createClient(components.port, components.hostname, {
            'auth_pass': components.password
        });

        redis.on('error', function(err) {
            logger.error('Error occured with redis:');
            logger.error(err);
        });

        redis.on('ready', function() {
            logger.info('Connected to redis.');
        });

        redis.select(components.database, (err) => {
            if (err) {
                logger.error('Error when selecting redis database', components.database);
                logger.error(err);
            }
        });
    }

    return redis;
}

function parse() {
    return redisUrl.parse(process.env.REDIS_URL);
}

module.exports = {
    connect: connect,
    parse: parse
};
