var Promise = require('bluebird');
var EventEmitter = require('events');
var _ = require('lodash');
var RedisSMQ = require('rsmq');
var redis = require('./redis').connect();
var logger = require('../logger')(__filename);
var CONST = require('../constants');

var rsmq = null;
function connect() {
    if (rsmq === null) {
        rsmq = Promise.promisifyAll(new RedisSMQ({client: redis}));

        rsmq.createQueueAsync({qname: 'worker'})
        .then(response => {
            if (response === 1) {
                logger.info('worker queue created');
            } else {
                logger.info('worker queue not created:', response);
            }
        })
        .catch(err => {
            logger.warn(err);
        });
    }

    function sendMessage(job) {
        var message = JSON.stringify(job);
        return rsmq.sendMessageAsync({qname: 'worker', message: message})
        .then(resp => {
            if (resp) {
                logger.debug('Message sent');
            }
        });
    }

    function receiveMessage() {
        return rsmq.receiveMessageAsync({qname: 'worker'})
        .then(resp => {
            if (resp.id) {
                logger.info('Message received', resp);
            } else {
                logger.info('No messages available.');
            }
        });
    }

    return {
        sendMessage: sendMessage,
        receiveMessage: receiveMessage
    };
}

module.exports = {
    connect
};
