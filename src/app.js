var koa = require('koa');
var koaLogger = require('koa-logger');
var koaJson = require('koa-json');
var koaCompress = require('koa-compress');
var errorHandler = require('./middlewares/error-handler');
var router = require('./router');

function createApp() {
    var app = koa();

    if (process.env.NODE_ENV === 'development' || process.env.VERBOSE_TESTS === 'true') {
        // Have logger above error handler in the stack so that error codes
        // are logged correctly in local env
        app.use(koaLogger());
        app.use(koaJson());
    }

    app.use(errorHandler());

    app.use(koaCompress({
        threshold: 2048,
    }));

    // Setup routes
    app.use(router.routes())
    app.use(router.allowedMethods());

    return app;
}

module.exports = createApp;
