// dotenv must be at the top as other modules use the loaded environment variables
import dotenv from 'dotenv';
import https from 'https';
import fs from 'fs';
dotenv.config();
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import proxy from 'express-http-proxy';
import expressFileupload from 'express-fileupload';

import sessionManager from './middleware/sessionManager';
import apiOrDashboardController from './middleware/apiOrDashboardController';
import config from './config';
import './prisma'; // eager load to test connection
import apiRouter from './apiRouter';
import partnerApiRouter from './partnerApiRouter';
import { unlessStartsWith } from './helpers';
import swaggerUI from 'swagger-ui-express';
import swaggerConfig from './swagger.json';
import { apiPaths } from './types';
import webhookRouter from './webhookRouter';
import logger, { pinoHttpLogger } from './logger';
import cron from 'node-cron';
import { fetchCertForPhoneNumber } from './services/phoneNumber';
import loggerRequest from './middleware/loggerRequest';

const app = express();
// TODO: Set up webhook handling endpoints

app.use(expressFileupload());

// Middleware (sequence matters!)
app.use(
  cors({
    // Required for using cross domain api calls
    credentials: true,
    origin: config.CLIENT_URL,
  }),
);

// Redirect for dashboard files
if (config.NODE_ENV === 'development') {
  // proxy requests to development frontend
  app.use(unlessStartsWith(apiPaths, proxy(config.CLIENT_URL)));
} else {
  // STATIC_DIR gets populated in a whatsapp-self-serve build
  // It comes from the built react folder
  // TODO: build both dashboard and server and test the routing
  app.use(unlessStartsWith(apiPaths, express.static(config.STATIC_DIR)));
}
app.use(apiOrDashboardController);
app.use(pinoHttpLogger);

// API related middleware
app.use(cookieParser());
app.use(bodyParser.json({ type: 'application/json' }));
swaggerConfig.host = config.BASE_URL;
app.use('/api-docs', swaggerUI.serve);
app.get('/api-docs', swaggerUI.setup(swaggerConfig));
app.use(sessionManager);
app.use('/webhooks', webhookRouter());
app.use('/api', apiRouter());
app.use('/partnerApi', loggerRequest, partnerApiRouter());

cron.schedule('0 1 * * *', async () => {
  logger.info('Do cert fetching');
  await fetchCertForPhoneNumber();
});

if(config.NODE_ENV === 'DEV') {
  console.log(config.CERT_PATH);
  console.log(config.KEY_PATH);
  const options = {
    key: fs.readFileSync(config.KEY_PATH),
    cert: fs.readFileSync(config.CERT_PATH),
  };
  https.createServer(options, app).listen(config.SERVER_PORT, () => {
    logger.info('Server listening on port ' + config.SERVER_PORT);
  });
} else {
  app.listen(config.SERVER_PORT, (): void => {
    logger.info(`Example app listening at ${config.SERVER_URL}:${config.SERVER_PORT}`);
  });
}