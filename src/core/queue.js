var _ = require('lodash');
var createQueue = require('bull');
var redis = require('./redis');
var logger = require('../logger')(__filename);

var jobQueue = null;
function connect() {
    var completed = [];

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

        jobQueue.on('completed', (job, result) => {
            console.log('completed1')
            completed.push({
                job: job,
                result: result
            });
        });
    }

    function wait(jobId) {
        return new Promise(function(resolve, reject) {
            var timer = setTimeout(
                reject.bind(null, new Error('Timeout')),
                1000 * 10
            );

            function resolveWithCompleted() {
                var found = _.find(completed, complete => complete.job.jobId === jobId);
                if (found) {
                    completed = _.reject(completed, complete => complete.job.jobId === jobId);
                    clearTimeout(timer);
                    jobQueue
                    return resolve(found);
                }
            }

            // Check if the task has been already completed
            resolveWithCompleted();

            jobQueue.on('completed', (job, result) => {
                console.log('completed2')
                // This handler is called after the previously set handler,
                // so we can rely that completed array already contains
                // the job
                if (jobId === job.jobId) {
                    resolveWithCompleted();
                }
            });
        });
    }

    function _close() {
        jobQueue.close().then(() => {
            logger.info('Job queue closed.');
        });
    }

    return {
        jobs: jobQueue,
        wait: wait,
        close: _close
    };
}

module.exports = {
    connect
};
