const { SQS } = require('aws-sdk');

const sqs = new SQS();

module.exports = sqs;
