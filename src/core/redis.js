// node_redis must be used as long as bull relies on it
var Redis = require('redis');
var redisUrl = require('redis-url');
var logger = require('../logger')(__filename);

var redis = null;
function connect() {
    if (redis === null) {
        redis = Redis.createClient(process.env.REDIS_URL);

        redis.on('error', function(err) {
            logger.error('Error occured with redis:');
            logger.error(err);
        });

        redis.on('ready', function() {
            logger.info('Connected to redis.');
        });

        var components = redisUrl.parse(process.env.REDIS_URL);
        redis.select(components.database, (err) => {
            if (err) {
                logger.error('Error when selecting redis database', components.database);
                logger.error(err);
            }
        });
    }

    return redis;
}

module.exports = {
    connect: connect
};
