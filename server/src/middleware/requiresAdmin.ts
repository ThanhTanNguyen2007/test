import { Response, NextFunction } from 'express';
import StatusCodes from 'http-status-codes';
import { RequestWithUserInfo } from '../types';
import logger from '../logger';

/**
 * Middleware to restrict route to users with admin access ONLY
 */
const requiresAdmin = async (req: RequestWithUserInfo, res: Response, next: NextFunction): Promise<void | Response> => {
  try {
    if (req.user.isAdmin) {
      return next();
    }
    return res.status(StatusCodes.FORBIDDEN).send();
  } catch (error) {
    logger.info(error.message);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send();
  }
};

export default requiresAdmin;
