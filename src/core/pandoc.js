var fs = require('fs');
var path = require('path');
var nodeUrl = require('url');
var childProcess = require('child_process');
var path = require('path')
var _ = require('lodash');
var BPromise = require('bluebird');
var request = BPromise.promisifyAll(require('request'));
var logger = require('../logger')(__filename);
var CONST = require('../constants');

var workDir = path.join(__dirname, '../../_files');

var convertDocument = BPromise.coroutine(function* convertDocument(opts) {
    logger.info('Downloading url:', opts.url, '..');
    yield downloadFile(opts.id, opts.url);
    logger.info('Downloaded.');

    var result = yield runPandoc(opts);
    logger.info('pandoc exited with', result.process.exitCode);

    if (result.process.exitCode !== 0) {
        throw new Error('Failed to run command: ' + result.process.stderr);
    }

    return {
        filepath: path.join(workDir, result.outputFileName)
    };
});

function downloadFile(id, url) {
    var req = request(url, {
        encoding: null,
        headers: {
            'Accept-Charset': 'utf-8'
        },
        timeout: CONST.REQUEST_TIMEOUT
    });

    var inputFileName = resolveInputFileName(id, url);
    var writeStream = fs.createWriteStream(path.join(workDir, inputFileName));
    req.pipe(writeStream);

    var writeStreamPromise = writeStreamToPromise(writeStream);
    var responsePromise = new BPromise((resolve, reject) => {
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

function runPandoc(opts) {
    var inputFileName = resolveInputFileName(opts.id, opts.url);
    var outputFileName = resolveOutputFileName(opts.id, opts.toFormat);
    var command = [
        'docker run -v `pwd`:/source jagregory/pandoc',
        '-t html -s',
        '-o ' + outputFileName,
        inputFileName
    ].join(' ');

    logger.info('Running', command);
    return BPromise.props({
        process: run(command, {cwd: workDir}),
        outputFileName: outputFileName
    });
}

function resolveInputFileName(id, url) {
    return id + extensionFromUrl(url);
}

function resolveOutputFileName(id, toFormat) {
    return id + '.' + toFormat;
}

function extensionFromUrl(url) {
    var urlPath = nodeUrl.parse(url).pathname;
    return path.extname(urlPath);
}

function writeStreamToPromise(writeStream) {
    return new BPromise(function(resolve, reject) {
        writeStream.on('finish', resolve);
        writeStream.on('error', reject);
    });
}

function run(cmd, opts) {
    return new BPromise(function(resolve, reject) {
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

module.exports = {
    convertDocument: convertDocument
};
