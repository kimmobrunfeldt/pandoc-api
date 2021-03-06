var BPromise = require('bluebird');
var fs = BPromise.promisifyAll(require('fs'));
var path = require('path');
var nodeUrl = require('url');
var childProcess = require('child_process');
var path = require('path')
var _ = require('lodash');
var request = require('request');
var logger = require('../logger')(__filename);
var markdownCore = require('./markdown');
var CONST = require('../constants');

var workDir = path.join(__dirname, '../../_files');

var convertDocument = BPromise.coroutine(function* convertDocument(opts) {
    logger.info('Downloading url:', opts.url, '..');
    yield downloadFile(opts.id, opts.url);
    logger.info('Downloaded.');

    logger.info('Transforming markdown..');
    yield transformMarkdownFile(opts);

    var result = yield runPandoc(opts);
    logger.info('pandoc exited with', result.process.exitCode);

    if (result.process.exitCode !== 0) {
        throw new Error('Failed to run command: ' + result.process.stderr);
    }

    return {
        filepath: path.join(workDir, result.outputFilename)
    };
});

// Cleans temporary files from a conversion operation
function clean(opts) {
    logger.info('Cleaning files from conversion', opts.id, '..');
    var inputFilePath = path.join(workDir, resolveInputFileName(opts.id, opts.url));
    var outputFilePath = path.join(workDir, resolveOutputFileName(opts.id, opts.toFormat));

    return fs.unlinkAsync(inputFilePath)
    .then(() => fs.unlinkAsync(outputFilePath))
    .catch(err => {
        logger.error('Unable to clean files:', err);
        throw err;
    });
}

function downloadFile(id, url) {
    var req = request(url, {
        encoding: null,
        headers: {
            'Accept-Charset': 'utf-8'
        },
        timeout: CONST.REQUEST_TIMEOUT
    });

    var inputFilename = resolveInputFileName(id, url);
    var writeStream = fs.createWriteStream(path.join(workDir, inputFilename));
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

function transformMarkdownFile(opts) {
    var inputFilename = resolveInputFileName(opts.id, opts.url);
    var inputFilepath = path.join(workDir, inputFilename);

    return fs.readFileAsync(inputFilepath, {encoding: 'utf8'})
    .then(text => {
        // Remove the file path from url
        var fullUrl = nodeUrl.resolve(opts.url, '.');
        var newText = markdownCore.resolveLinks(fullUrl, text);
        return fs.writeFileAsync(inputFilepath, newText, {encoding: 'utf8'});
    });
}

function runPandoc(opts) {
    var inputFilename = resolveInputFileName(opts.id, opts.url);
    var outputFilename = resolveOutputFileName(opts.id, opts.toFormat);
    var command = [
        'docker run -v `pwd`:/source jagregory/pandoc',
        '-t html -s',
        '-o ' + outputFilename,
        inputFilename
    ].join(' ');

    logger.info('Running', command);
    return BPromise.props({
        process: run(command, {cwd: workDir}),
        outputFilename: outputFilename
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
    convertDocument: convertDocument,
    clean: clean
};
