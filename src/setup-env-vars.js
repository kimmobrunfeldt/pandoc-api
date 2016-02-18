// All input to the Koa app is given via environment variables
var _ = require('lodash');

function validate() {
    const validEnvs = ['test', 'development', 'production'];
    if (!_.contains(validEnvs, process.env.NODE_ENV)) {
        console.error('Set NODE_ENV to one of:', validEnvs.join(', '));
        throw new Error('NODE_ENV is not set');
    }
}

try {
    validate();
} catch (err) {
    console.error('There was a problem with environment variables.');
    console.error('You must set them properly before running the app.');
    console.error('To start app for local development:');
    console.error('  $ source .env');
    console.error('  $ npm start');
    throw err;
}

process.env.PORT = process.env.PORT || 5000;

if (process.env.VERBOSE_TESTS === 'true') {
    process.env.LOG_LEVEL = 'silly';
}

console.log('LOG_LEVEL=' + process.env.LOG_LEVEL);
