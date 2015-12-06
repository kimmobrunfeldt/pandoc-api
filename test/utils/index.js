var path = require('path');
var fs = require('fs');
var Promise = require('bluebird');
var url = require('url');
var redis = require('../../src/core/redis').connect();

function createTestUrl(relativeUrl) {
    var base = 'http://127.0.0.1:' + process.env.TEST_FILE_SERVER_PORT;
    return url.resolve(base, relativeUrl);
}

function expectedContent(fileName) {
    var filePath = path.join(__dirname, '../expected', fileName);
    return fs.readFileSync(filePath, {encoding: 'utf8'});
}

// Delete all the keys of the currently selected DB
// XXX: For some reason promisify didn't work
function flushRedis() {
    return new Promise((resolve, reject) => {
        redis.flushdb((err) => {
            if (err) {
                return reject(err);
            }

            resolve();
        });
    });
}

module.exports = {
    createTestUrl: createTestUrl,
    expectedContent: expectedContent,
    flushRedis: flushRedis
};
