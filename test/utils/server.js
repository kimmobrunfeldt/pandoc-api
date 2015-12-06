// Simple static file server for testing

var koa = require('koa');
var koaLogger = require('koa-logger');
var koaServe = require('koa-static');

function createApp(root, opts) {
    var app = koa();

    if (process.env.VERBOSE_TESTS === 'true') {
        app.use(koaLogger());
    }
    app.use(koaServe(root, opts));

    return app;
}

module.exports = createApp;
