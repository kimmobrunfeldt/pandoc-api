var fs = require('fs');
var path = require('path');
var nodeUrl = require('url');
var childProcess = require('child_process');
var Promise = require('bluebird');
var request = Promise.promisifyAll(require('request'));
var logger = require('../logger')(__filename);
var CONST = require('../constants');
var queue = require('../core/queue').connect();

var workDir = path.join(__dirname, '../../_worker');

function start() {
    queue.worker.process((job) => {
        logger.info('Processing job with id', job.jobId);

        logger.info('Downloading url:', job.data.url, '..');
        return downloadFile(job)
        .tap(() => logger.info('Downloaded.'))
        .then(() => runPandoc(job))
        .then((result) => {
            logger.info('pandoc exited with', result.process.exitCode);
            if (result.process.exitCode !== 0) {
                throw new Error('Failed to run command: ' + result.process.stderr);
            }

            return sendResult({
                id: job.jobId,
                payload: path.join(workDir, result.outputFileName)
            });
        })
        .catch(err => {
            logger.error('Error while processing job', job.jobId);
            logger.error(err);

            return sendResult({
                id: job.jobId,
                error: true,
                status: err.status,
                payload: err.message
            });
        })
        .tap(() => logger.info('Job', job.jobId, 'processed.'));
    });

    return queue.worker;
}

function downloadFile(job) {
    var req = request(job.data.url, {
        encoding: null,
        headers: {
            'Accept-Charset': 'utf-8'
        },
        timeout: CONST.REQUEST_TIMEOUT
    });

    var inputFileName = resolveInputFileName(job);
    var writeStream = fs.createWriteStream(path.join(workDir, inputFileName));
    req.pipe(writeStream);

    var writeStreamPromise = writeStreamToPromise(writeStream);
    var responsePromise = new Promise((resolve, reject) => {
        req.on('response', resolve);
        req.on('error', reject);
    });

    return responsePromise.then(function(response) {
        if (response.statusCode !== 200) {
            // Explicitly close write stream just in case;
            writeStream.end();

            var message = 'Remote responded with status ' + response.statusCode;
            var err = new Error(message);
            err.status = response.statusCode;
            throw err;
        }

        return writeStreamPromise;
    });
}

function runPandoc(job) {
    var inputFileName = resolveInputFileName(job);
    var outputFileName = resolveOutputFileName(job);
    var command = [
        'docker run -v `pwd`:/source jagregory/pandoc',
        '-t html -s',
        '-o ' + outputFileName,
        inputFileName
    ].join(' ');

    logger.info('Running', command);
    return Promise.props({
        process: run(command, {cwd: workDir}),
        outputFileName: outputFileName
    });
}

function sendResult(result) {
    return queue.server.add(result);
}

function resolveInputFileName(job) {
    return job.jobId + extensionFromUrl(job.data.url);
}

function resolveOutputFileName(job) {
    return job.jobId + '.' + job.data.toFormat;
}

function extensionFromUrl(url) {
    var urlPath = nodeUrl.parse(url).pathname;
    return path.extname(urlPath);
}

function writeStreamToPromise(writeStream) {
    return new Promise(function(resolve, reject) {
        writeStream.on('finish', resolve);
        writeStream.on('error', reject);
    });
}

function run(cmd, opts) {
    return new Promise(function(resolve, reject) {
        var child;

        try {
            child = childProcess.spawn('/bin/bash', ['-c', cmd], {
                cwd: opts.cwd
            });
        } catch (e) {
            return Promise.reject(e);
        }

        var stdoutBufs = [];
        child.stdout.on('data', d => stdoutBufs.push(d));
        var stderrBufs = [];
        child.stderr.on('data', d => stderrBufs.push(d));

        child.once('error', reject);
        child.once('close', function(exitCode) {
            var result = {
                exitCode: exitCode,
                stdout: Buffer.concat(stdoutBufs).toString(),
                stderr: Buffer.concat(stderrBufs).toString()
            };

            resolve(result);
        });
    });
}

if (require.main === module) {
    // Script is directly executed
    start();
}

module.exports = {
    start: start
};
