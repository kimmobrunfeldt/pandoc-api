var path = require('path');
var fs = require('fs');
var url = require('url');

function createTestUrl(relativeUrl) {
    var base = 'http://127.0.0.1:' + process.env.TEST_FILE_SERVER_PORT;
    return url.resolve(base, relativeUrl);
}

function expectedContent(fileName) {
    var filePath = path.join(__dirname, '../expected', fileName);
    return fs.readFileSync(filePath, {encoding: 'utf8'});
}

module.exports = {
    createTestUrl: createTestUrl,
    expectedContent: expectedContent
};
