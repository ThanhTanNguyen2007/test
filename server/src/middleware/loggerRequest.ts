import { Response, NextFunction } from 'express';
import StatusCodes from 'http-status-codes';
import { RequestWithUserInfo } from '../types';
import logger from '../logger';
import * as services from '../services';
import * as analyticCacheManager from '../cacheManager';

const loggerRequest = async (req: RequestWithUserInfo, res: Response, next: NextFunction): Promise<void | Response> => {
  try {
    const apiKey = req.headers['x-api-key'];
    if (!apiKey || typeof apiKey !== 'string') {
      return res.status(StatusCodes.UNAUTHORIZED).send('API key is missing');
    }
    const apiRouter = req.url.includes('?') ? req.url.split('?')[0].split('/')[1] : req.url.split('/')[1];
    const sanitizedUser = await services.user.getUserByApiKey(apiKey);
    const cacheKey = `api:${sanitizedUser?.id}:${apiRouter}`;
    const cacheValue = await analyticCacheManager.getCache(cacheKey);
    const expire = 60 * 60 * 24 * 31 * 1;
    if (cacheValue) {
      analyticCacheManager.setCache(cacheKey, cacheValue + 1, expire);
    } else {
      analyticCacheManager.setCache(cacheKey, 1, expire);
    }
  } catch (error) {
    logger.info(error.message);
  } finally {
    return next();
  }
};

export default loggerRequest;
