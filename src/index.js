require('./setup-env-vars');
var logger = require('./logger')(__filename);
var createApp = require('./app');

var app = createApp();
app.listen(process.env.PORT, () => {
    logger.info(
        'Server listening on port %d.. NODE_ENV=%s',
        process.env.PORT,
        process.env.NODE_ENV
    );
});
