var koa = require('koa');
var koaLogger = require('koa-logger');
var koaJson = require('koa-json');
var errorHandler = require('./middlewares/error-handler');
var requestId = require('./middlewares/request-id');
var router = require('./router');

function createApp() {
    var app = koa();
    app.use(requestId());
    app.use(errorHandler());

    if (process.env.NODE_ENV === 'development' || process.env.VERBOSE_TESTS === 'true') {
        app.use(koaLogger());
        app.use(koaJson());
    }

    // Setup routes
    app.use(router.routes())
    app.use(router.allowedMethods());

    return app;
}

module.exports = createApp;
