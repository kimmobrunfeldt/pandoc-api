var fs = require('fs');
var uuid = require('node-uuid');
var _ = require('lodash');
var pandocCore = require('../core/pandoc');

function* getDocument(next) {
    var opts = {
        id: uuid.v4(),
        url: this.query.url,
        toFormat: 'html'
    };

    var result = yield pandocCore.convertDocument(opts);
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

    this.type = opts.toFormat;
    this.body = fs.createReadStream(result.filepath);
}

module.exports = {
    getDocument: getDocument
};
