import { Request, Response, NextFunction } from 'express';
import StatusCodes from 'http-status-codes';
import path from 'path';
import { isReqPathInApiPaths } from '../helpers';
import config from '../config';
import logger from '../logger';

const apiOrDashboardController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (isReqPathInApiPaths(req)) {
      return next();
    }
    res.sendFile(path.join(config.STATIC_DIR, 'index.html'));
  } catch (error) {
    logger.info(error.message);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR);
    return;
  }
};

export default apiOrDashboardController;
