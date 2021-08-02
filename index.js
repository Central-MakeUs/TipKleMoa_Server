const express = require('./config/express');
const {logger} = require('./config/winston');

const admin = require('firebase-admin');
let serAccount = require('./config/fcm-admin.json');

const port = 3000;
express().listen(port);
logger.info(`${process.env.NODE_ENV} - API Server Start At Port ${port}`);

admin.initializeApp({
  credential: admin.credential.cert(serAccount),
});