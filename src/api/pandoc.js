var pandocCore = require('../core/pandoc');
var validatePandocJob = require('../validation/pandoc-job').validate;
var queue = require('../core/queue').connect();

function* getPandoc(next) {
    var pandocJob = {
        url: this.query.url,
        toFormat: 'html'
    };

    validatePandocJob(pandocJob);
    var job = yield pandocCore.addJob(pandocJob);
    this.body = yield queue.wait(job.jobId);
}

module.exports = {
    getPandoc: getPandoc
};
