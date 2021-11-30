import { Response, NextFunction } from 'express';
import StatusCodes from 'http-status-codes';
import { setCookie } from '../helpers';
import * as services from '../services';
import { RequestWithUserInfo } from '../types';
import config from '../config';
import logger from '../logger';

const sessionManager = async (
  req: RequestWithUserInfo,
  res: Response,
  next: NextFunction,
): Promise<void | Response> => {
  try {
    const PUBLIC_PATHS = ['/api/health', '/api/login', '/api/me', '/webhooks', '/api/account/connectWithCustomerId', '/api/account/userWithCustomerIdCanceledFacebookFlow', '/api/migration/init', '/api/migration/requestOTP', '/api/migration/verifyCode', '/api/migration/waba'];
    if (PUBLIC_PATHS.includes(req.path) || req.path.startsWith('/partnerApi')) {
      next();
      return;
    }
    
    const email = req?.cookies?.email;
    const token = req?.cookies?.token;

    const sanitizedUser = await services.session.checkAndExtendSession(email, token);
    if (!sanitizedUser) {
      setCookie('email', '', 0, res);
      setCookie('token', '', 0, res);
      return res.status(StatusCodes.UNAUTHORIZED).send();
    }
    const oneDayInMilliseconds = config.SESSION_DURATION_MINUTES * 60 * 1000;
    // TODO: Refactor cookie adding and remove to one place
    setCookie('email', email, oneDayInMilliseconds, res);
    setCookie('token', token, oneDayInMilliseconds, res);
    req.user = sanitizedUser;
    next();
  } catch (error) {
    logger.info(error.message);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR);
  }
};

export default sessionManager;
