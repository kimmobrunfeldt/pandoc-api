var fs = require('fs');
var uuid = require('node-uuid');
var _ = require('lodash');
var pandocCore = require('../core/pandoc');
var convertSchema = require('../validation/convert-options');
var assertObject = require('../validation').assertObject;

function* getDocument(next) {
    var opts = {
        url: this.query.url,
        toFormat: 'html'
    };
    assertObject(opts, convertSchema);
    opts.id = uuid.v4();

    var result;
    try {
        result = yield pandocCore.convertDocument(opts);
    } catch (err) {
        if (_.isNumber(err.status)) {
            // Remote server returned a HTTP error when downloading file
            err.status = 502;
        } else {
            err.status = 500;
        }

        throw err;
    }

    setTimeout(() => pandocCore.clean(opts), 30 * 1000);

    this.type = opts.toFormat;
    this.body = fs.createReadStream(result.filepath);
}

module.exports = {
    getDocument: getDocument
};
