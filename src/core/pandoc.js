var _ = require('lodash');
var Promise = require('bluebird');
var queue = require('../core/queue').connect();
var CONST = require('../constants');

var addJob = Promise.coroutine(function* addJob(job) {
    var newJob = yield queue.worker.add(job, {
        timeout: CONST.WORKER_TIMEOUT
    });

    var pandocJob = _.merge({
        id: newJob.jobId
    }, newJob.data);

    return pandocJob;
});

module.exports = {
    addJob: addJob
};
