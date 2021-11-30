import { Request, Response } from 'express';
import logger from '../logger';

export const check = async (req: Request, res: Response): Promise<void | Response> => {
  try {
    return res.send();
  } catch (error) {
    logger.error(error.message);
  }
};
