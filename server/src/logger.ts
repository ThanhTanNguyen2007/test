import Pino from 'pino';
import {getUserByApiKey} from './services/user';
import pinoHttp from 'pino-http';
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';

const logger = Pino({
  level: LOG_LEVEL,
  prettyPrint: {
    colorize: true,
    translateTime: 'yyyy-mm-dd HH:MM:ss',
    ignore: 'pid,hostname',
  },
});

export const pinoHttpLogger = pinoHttp({
  logger,
  serializers: {
    "Error" (error) {
      return error.message;
    },
    "Request info" (req) {
      const logStr = `${req.method} ${req.url} from ${req.headers.origin || req.headers.referer}`;
      const apiKey = req.headers['x-api-key'];
      if(apiKey) {
        return `${logStr} by ${apiKey}`
      }
      return `${logStr} ${req.headers.cookie ? 'by ' + decodeURIComponent(req.headers.cookie.split(';').find((c: string) => c.startsWith('email'))): 'by unknown'}`
    },
    'Response status' (res) {
      return res.statusCode;
    }
  },
  customSuccessMessage: function (res) {
    if (res.statusCode === 404) {
      return 'Resource not found'
    }
    return `Request completed`
  },
  customAttributeKeys: {
    req: 'Request info',
    res: 'Response status',
    err: 'Error',
    responseTime: 'Time taken'
  },
  wrapSerializers: false,
  autoLogging: {
    ignorePaths: ['/api/health', '/api-docs'],
  }
});

export default logger;
