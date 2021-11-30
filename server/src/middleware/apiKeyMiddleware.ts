import { Response, NextFunction } from 'express';
import StatusCodes from 'http-status-codes';
import * as services from '../services';
import { RequestWithUserInfo } from '../types';
import logger from '../logger';

const apiKeyMiddleware = async (
  req: RequestWithUserInfo,
  res: Response,
  next: NextFunction,
): Promise<void | Response> => {
  try {
    const PUBLIC_PATHS = ['/api/health', '/api/login', '/api/me'];
    if (PUBLIC_PATHS.includes(req.path)) {
      next();
      return;
    }
    const apiKey = req.headers["x-api-key"];
    if (!apiKey || typeof apiKey !== 'string') {
      return res.status(StatusCodes.UNAUTHORIZED).send('API key is missing');
    }

    const sanitizedUser = await services.user.getUserByApiKey(apiKey);

    if (!sanitizedUser) {
      return res.status(StatusCodes.UNAUTHORIZED).send('Invalid API key');
    }

    if(!sanitizedUser.partner?.id) return res.status(StatusCodes.FORBIDDEN).send('This API does not have rights to process.');

    req.user = sanitizedUser;
    return next();
  } catch (error) {
    logger.info(error.message);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR);
  }
};

export default apiKeyMiddleware;
