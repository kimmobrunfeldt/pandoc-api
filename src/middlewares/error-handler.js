var logger = require('../logger')(__filename);

// Global error handler for Koa application
function* errorHandler(next) {
    try {
        yield next;
    } catch (err) {
        // This is needed.
        // https://github.com/koajs/koa/issues/146
        this.app.emit('error', err, this);

        var status = err.status || 500;
        if (err.name === 'ValidationError') {
            status = 400;
        }
        this.status = status

        var errorResponse = {message: err.message};
        if (process.env.NODE_ENV !== 'production') {
            errorResponse.stack = err.stack;
        }
        this.body = {error: errorResponse};

        const doLog = process.env.NODE_ENV !== 'test' ||
            process.env.VERBOSE_TESTS === 'true';
        if (doLog && shouldLogStack(this.status)) {
            logger.error('Error in request', this.requestId);
            logger.error(err.stack);
        }
    }
}

function shouldLogStack(status) {
    return status >= 400 && status !== 404;
}

module.exports = () => errorHandler;
