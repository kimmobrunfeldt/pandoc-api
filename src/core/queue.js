var createQueue = require('bull');
var redis = require('./redis');
var logger = require('../logger')(__filename);

var jobQueue = null;
function connect() {
    if (jobQueue === null) {
        var components = redis.parse();
        jobQueue = createQueue('jobs', components.port, components.hostname, {
            'auth_pass': components.password
        });

        jobQueue.on('error', (err) => {
            logger.error('Error in job queue:', err);
        });

        jobQueue.on('ready', () => {
            logger.info('Job queue ready.');
        });

        jobQueue.on('failed', (job, err) => {
            logger.error('Job', job.jobId, 'failed with error:', err);
        });

        jobQueue.on('cleaned', (job, type) => {
            logger.info('Cleaned', job.length, type, 'jobs');
        });
    }

    function _close() {
        jobQueue.close().then(() => {
            logger.info('Job queue closed.');
        });
    }

    return {
        jobs: jobQueue,
        close: _close
    };
}

module.exports = {
    connect
};
