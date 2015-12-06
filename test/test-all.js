require('../src/setup-env-vars');

var path = require('path');
var Promise = require('bluebird');
var worker = require('../src/worker/run-pandoc-jobs');
var utils = require('./utils');
var createTestApp = require('./utils/server');
var testPandoc = require('./test-pandoc');
var logger = require('../src/logger')(__filename);

var TEST_WEB_ROOT = path.join(__dirname, 'data');

describe('functional', () => {
    var _worker;
    var _testServer;

    before(() => {
        logger.info('Starting worker..');
        _worker = worker.start();

        logger.info('Flushing redis db..')
        return utils.flushRedis()
            .tap(() => logger.info('Redis keys deleted.'))
            .then(startServer)
            .tap(testServer => {
                _testServer = testServer;
            });
    });

    after(() => {
        logger.info('Closing worker..');
        _worker.close();

        logger.info('Closing test file server..');
        _testServer.close();
    });

    testPandoc();
});

function startServer() {
    return new Promise((resolve, reject) => {
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
