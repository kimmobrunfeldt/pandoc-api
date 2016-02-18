require('../src/setup-env-vars');

var path = require('path');
var BPromise = require('bluebird');
var utils = require('./utils');
var createTestApp = require('./utils/server');
var testPandoc = require('./test-pandoc');
var logger = require('../src/logger')(__filename);

var TEST_WEB_ROOT = path.join(__dirname, 'data');

describe('functional', () => {
    var _testServer;

    before(() => {
        logger.info('Starting local test file server..')
        return startServer()
        .tap(testServer => {
            _testServer = testServer;
        });
    });

    after(() => {
        logger.info('Closing test file server..');
        _testServer.close();
    });

    testPandoc();
});

function startServer() {
    return new BPromise((resolve, reject) => {
        var testApp = createTestApp(TEST_WEB_ROOT);
        var testServer = testApp.listen(process.env.TEST_FILE_SERVER_PORT, (err) => {
            if (err) {
                return reject(err);
            }

            logger.info(
                'Test file server listening on port %d..',
                process.env.TEST_FILE_SERVER_PORT
            );

            resolve(testServer);
        });
    });
}
