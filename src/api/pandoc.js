var Promise = require('bluebird');
var _ = require('lodash');
var fs = Promise.promisifyAll(require('fs'));
var path = require('path');
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
    // XXX: Can result be emitted to queue before we call this?
    var result = yield queue.getResult(job.id);;
    if (result.error) {
        var err = new Error(result.payload);
        if (_.isNumber(result.status)) {
            // Remote server returned a HTTP error when downloading file
            err.status = 502;
        } else {
            err.status = 500;
        }

        throw err;
    }

    var filePath = result.payload;
    var fstat = yield fs.statAsync(filePath);
    if (!fstat.isFile()) {
        return this.throw(500, 'Worker returned non-existing file.');
    }

    this.type = path.extname(filePath);
    this.body = fs.createReadStream(filePath);
}

module.exports = {
    getPandoc: getPandoc
};
