var _ = require('lodash');
var Promise = require('bluebird');
var jobs = require('../core/queue').connect().jobs;

var addJob = Promise.coroutine(function* addJob(job) {
    var newJob = yield jobs.add(job, {
        timeout: 1000 * 10
    });

    var pandocJob = _.merge({
        id: newJob.jobId
    }, newJob.data);

    return pandocJob;
});

module.exports = {
    addJob: addJob
};
