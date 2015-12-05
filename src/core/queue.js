var EventEmitter = require('events');
var _ = require('lodash');
var createQueue = require('bull');
var redis = require('./redis');
var logger = require('../logger')(__filename);
var CONST = require('../constants');

// Contains quite a lot of "wirings"
// Task -> Worker Queue -> Server Queue -> push to results -> emit result
// All this trouble because:
// * bull fails if you try to add .process handler multiple times,
//   that's why the results are piped via the results array and event emitter
// * Worker can process the task before getResult is called, we need to save the
//   results temporarily in array to prevent failing in those scenarios

var resultEmitter = new EventEmitter();
var results = [];
var serverQueue = null;
var workerQueue = null;

function connect() {
    if (serverQueue === null && workerQueue === null) {
        serverQueue = createQueue('server');
        workerQueue = createQueue('worker');
    }

    function close() {
        serverQueue.close().then(() => {
            logger.info('server queue closed.');
        });

        workerQueue.close().then(() => {
            logger.info('worker queue closed.');
        });
    }

    function getResult(jobId) {
        return new Promise((resolve, reject) => {
            var timer;

            function maybeResolveWithResult() {
                var result = popResult(jobId);
                if (result !== null) {
                    resolve(result);
                    clean();
                    return true;
                }

                return false;
            }

            function clean() {
                // Remove listener to prevent memory leaks
                resultEmitter.removeListener('result', maybeResolveWithResult);
                if (timer) {
                    clearTimeout(timer);
                }
            }

            if (maybeResolveWithResult()) {
                return;
            }

            resultEmitter.on('result', maybeResolveWithResult);
            timer = setTimeout(() => reject(new Error('Job timeout')), CONST.WORKER_TIMEOUT);
        });
    }

    function popResult(jobId) {
        var index = _.findIndex(results, res => res.id === jobId);
        if (index === -1) {
            return null;
        }

        return results.splice(index, 1)[0];
    }

    function listenServerQueue() {
        serverQueue.process(job => {
            results.push(job.data);
            resultEmitter.emit('result');
        });
    }

    return {
        getResult: getResult,
        server: serverQueue,
        worker: workerQueue,
        close: close,
        listenServerQueue: listenServerQueue
    };
}

function createQueue(name) {
    var components = redis.parse();
    newQueue = createQueue(name, components.port, components.hostname, {
        'auth_pass': components.password
    });

    newQueue.on('error', (err) => {
        logger.error('Error in queue', name, err);
    });

    newQueue.on('ready', () => {
        logger.info('Queue', name, 'ready.');
    });

    newQueue.on('cleaned', (job, type) => {
        logger.info('Cleaned', job.length, type, 'jobs in queue', name);
    });

    return newQueue;
}

module.exports = {
    connect
};
