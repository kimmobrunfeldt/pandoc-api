var fs = require('fs');
var path = require('path');
var nodeUrl = require('url');
var childProcess = require('child_process');
var Promise = require('bluebird');
var request = require('request');
var logger = require('../logger')(__filename);
var queue = require('../core/queue').connect();

var workDir = path.join(__dirname, '../../_worker');

queue.worker.process((job) => {
    logger.info('Processing job with id', job.jobId);

    var inputFileName = resolveInputFileName(job);
    var stream = request(job.data.url, {
        encoding: null,
        headers: {
            'Accept-Charset': 'utf-8'
        }
    });
    var streamPromise = streamToPromise(stream);
    stream.pipe(fs.createWriteStream(path.join(workDir, inputFileName)));

    logger.info('Downloading url:', job.data.url, '..');

    return Promise.resolve(streamToPromise)
    .tap(() => logger.info('Downloaded.'))
    .then(() => {
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
    })
    .then((result) => {
        logger.info('pandoc exited with', result.process.exitCode);
        if (result.process.exitCode !== 0) {
            throw new Error('Failed to run command: ' + result.process.stderr);
        }

        queue.server.add({
            id: job.jobId,
            payload: path.join(workDir, result.outputFileName)
        });
    })
    .catch(err => {
        logger.error('Error while processing job', job.jobId);
        logger.error(err);

        queue.server.add({
            id: job.jobId,
            error: true,
            payload: err.message
        });

        throw err;
    });
});

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

function streamToPromise(stream) {
    return new Promise(function(resolve, reject) {
        stream.on('end', resolve);
        stream.on('error', reject);
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
