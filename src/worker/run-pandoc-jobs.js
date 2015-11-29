var Promise = require('bluebird');
var jobs = require('../core/queue').connect().jobs;

jobs.process((job) => {
    console.log('process job', job.jobId);
    return Promise.resolve({test: true});
});
