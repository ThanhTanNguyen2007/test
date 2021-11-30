import { Response } from 'express';
import StatusCodes from 'http-status-codes';
import { ZodError } from 'zod';
import { RequestWithUserInfo } from '../types';
import * as services from '../services';
import * as validators from './validators/manager';
import logger from '../logger';

export const find = async (req: RequestWithUserInfo, res: Response): Promise<void | Response> => {
  try {
    const managers = await services.manager.findManagers();
    return res.send(managers);
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(StatusCodes.BAD_REQUEST).send(err.errors);
    }
    logger.info(err);
    return res.status(StatusCodes.BAD_REQUEST).send();
  }
};

export const partnerFind = async (req: RequestWithUserInfo, res: Response): Promise<void | Response> => {
  try {
    const { params } = validators.partnerFind(req);
    if (!req.user.isAdmin && req.user.partner?.id !== params.partnerId) {
      return res.status(StatusCodes.FORBIDDEN).send();
    }
    const managers = await services.manager.findManagersByPartnerId(params.partnerId);
    return res.send(managers);
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(StatusCodes.BAD_REQUEST).send(err.errors);
    }
    logger.info(err);
    return res.status(StatusCodes.BAD_REQUEST).send();
  }
};

export const userFind = async (req: RequestWithUserInfo, res: Response): Promise<void | Response> => {
  try {
    const { params } = validators.userFind(req);
    if (!req.user.isAdmin && req.user.id !== params.userId) {
      return res.status(StatusCodes.FORBIDDEN).send();
    }
    const managers = await services.manager.findManagersByUserId(params.userId);
    return res.send(managers);
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(StatusCodes.BAD_REQUEST).send(err.errors);
    }
    logger.info(err);
    return res.status(StatusCodes.BAD_REQUEST).send();
  }
};

export const enableCreditLine = async (req: RequestWithUserInfo, res: Response): Promise<void | Response> => {
  try {
    const { params } = validators.enableCreditLine(req);
    const updatedManager = await services.manager.enableCreditLine(params.managerId);
    if (!updatedManager) {
      return res.status(StatusCodes.NOT_FOUND).send();
    }
    return res.send(updatedManager);
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(StatusCodes.BAD_REQUEST).send(err.errors);
    }
    logger.info(err);
    return res.status(StatusCodes.BAD_REQUEST).send();
  }
};

export const disableCreditLine = async (req: RequestWithUserInfo, res: Response): Promise<void | Response> => {
  try {
    const { params } = validators.disableCreditLine(req);
    const updatedManager = await services.manager.disableCreditLine(params.managerId);
    if (!updatedManager) {
      return res.status(StatusCodes.NOT_FOUND).send();
    }
    return res.send(updatedManager);
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(StatusCodes.BAD_REQUEST).send(err.errors);
    }
    logger.info(err);
    return res.status(StatusCodes.BAD_REQUEST).send();
  }
};
