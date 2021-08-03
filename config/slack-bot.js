const { WebClient, LogLevel } = require("@slack/web-api");
const secret_config = require('./secret');

const API_TOKEN = secret_config.slack_token;
const client = new WebClient(API_TOKEN, {
    logLevel: LogLevel.ERROR
});

module.exports = client