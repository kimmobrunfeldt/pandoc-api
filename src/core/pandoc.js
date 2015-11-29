var jobs = require('../core/queue').connect().jobs;

function addJob(job) {
    return jobs.add(job);
}

module.exports = {
    addJob: addJob
};
