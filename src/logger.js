var path = require('path');
var winston = require('winston');
var _ = require('lodash');

const COLORIZE = process.env.NODE_ENV === 'development';

function createLogger(filePath, opts) {
    opts = opts || {};
    var fileName = path.basename(filePath);

    const logger = new winston.Logger({
        transports: [new winston.transports.Console({
            colorize: COLORIZE,
            label: fileName,
            timestamp: true
        })]
    });

    _setLevelForTransports(logger, opts.logLevel || process.env.LOG_LEVEL || 'info');
    return logger;
}

function _setLevelForTransports(logger, level) {
    _.each(logger.transports, function(transport) {
        transport.level = level;
    });
}

module.exports = createLogger;
