// Wrapper module for supertest.
// This allows adding assertions fo all test requests

var request = require('supertest');
var createApp = require('../../src/app');

function createRequest(url) {
    var server = createApp().listen();

    function get() {
        var args = Array.prototype.slice.call(arguments);
        return _callRequest.apply(this, ['get'].concat(args));
    }

    function _callRequest() {
        var args = Array.prototype.slice.call(arguments);
        var method = args.shift().toLowerCase();
        return request(server)[method].apply(this, args);
    }

    return {
        get: get
    };
}

module.exports = createRequest;
