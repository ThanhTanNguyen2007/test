import { Response } from 'express';
import StatusCodes from 'http-status-codes';
import { ZodError } from 'zod';
import { RequestWithUserInfo } from '../types';
import * as services from '../services';
import * as validators from './validators/phoneNumber';
import logger from '../logger';

import * as analyticCacheManager from '../cacheManager';

export const find = async (req: RequestWithUserInfo, res: Response): Promise<void | Response> => {
  try {
    const { id, isAdmin } = req.user;
    const {
      query: { search, page, size, is_getting_all },
    } = validators.find(req);

    const phoneNumbersList = await services.phoneNumber.findPhoneNumbers(
      isAdmin ? undefined : id,
      !!is_getting_all,
      page,
      size,
      search,
    );
    return res.send(phoneNumbersList);
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(StatusCodes.BAD_REQUEST).send(err.errors);
    }
    logger.info(err);
    return res.status(StatusCodes.BAD_REQUEST).send();
  }
};

export const getPhoneCert = async (req: RequestWithUserInfo, res: Response): Promise<void | Response> => {
  try {
    const { params } = validators.getPhoneCert(req);
    const phoneNumber = await services.phoneNumber.getPhoneNumber(params.phoneNumberId);
    if (!phoneNumber) {
      return res.status(StatusCodes.NOT_FOUND).send();
    }
    const isOwner = phoneNumber.account.userId === req.user.id;
    const isManagerPartner = req.user.partner && phoneNumber.account.manager?.partnerId === req.user.partner.id;
    const isAllowed = req.user.isAdmin || isOwner || isManagerPartner;
    if (!isAllowed) {
      return res.send(StatusCodes.FORBIDDEN).send();
    }

    let phoneCert;
    const cacheKey = `${phoneNumber.account.wabaId}:cert`;
    phoneCert = await analyticCacheManager.getCache(cacheKey);
    if (!phoneCert) {
      phoneCert = await services.phoneNumber.getPhoneCert(phoneNumber.account.wabaId, phoneNumber.value);
      if (!phoneCert) return res.status(StatusCodes.NOT_FOUND).send();
      analyticCacheManager.setCache(cacheKey, phoneCert);
    }

    const sanitizedData = {
      id: phoneNumber.id,
      cert: phoneCert.certificate || 'N/A',
      value: phoneNumber.value,
    };
    return res.send(sanitizedData);
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(StatusCodes.BAD_REQUEST).send(err.errors);
    }
    logger.error(err.message);
    return res.status(StatusCodes.BAD_REQUEST).send();
  }
};

export const getPhoneStatus = async (req: RequestWithUserInfo, res: Response): Promise<void | Response> => {
  try {
    const { params } = validators.getPhoneStatus(req);
    const phoneNumberId = params.phoneNumberId;
    const partnerId = req.user.partner?.id;
    if (!partnerId) return res.status(StatusCodes.UNAUTHORIZED).send();

    const status = await services.phoneNumber.getPhoneStatus(phoneNumberId, partnerId);
    return res.send(status);
  } catch (error) {
    logger.error(error.message);
    return res.status(StatusCodes.BAD_REQUEST).send();
  }
};

export const getPhoneNameStatus = async (req: RequestWithUserInfo, res: Response): Promise<void | Response> => {
  try {
    const { params } = validators.getPhoneStatus(req);
    const phoneNumberId = params.phoneNumberId;
    const partnerId = req.user.partner?.id;
    if (!partnerId) return res.status(StatusCodes.UNAUTHORIZED).send();

    const status = await services.phoneNumber.getPhoneNameStatus(phoneNumberId, partnerId);
    return res.send(status);
  } catch (error) {
    logger.error(error.message);
    return res.status(StatusCodes.BAD_REQUEST).send();
  }
};

export const getQualityRating = async (req: RequestWithUserInfo, res: Response): Promise<void | Response> => {
  try {
    const { params } = validators.getPhoneStatus(req);
    const phoneNumberId = params.phoneNumberId;
    const partnerId = req.user.partner?.id;
    if (!partnerId) return res.status(StatusCodes.UNAUTHORIZED).send();

    const status = await services.phoneNumber.getQualityRating(phoneNumberId, partnerId);
    return res.send(status);
  } catch (error) {
    logger.error(error.message);
    return res.status(StatusCodes.BAD_REQUEST).send();
  }
};

export const getAllPhoneNumbersOfWaba = async (req: RequestWithUserInfo, res: Response): Promise<void | Response> => {
  try {
    const partnerId = req.user.partner?.id;
    if (!partnerId) return res.status(StatusCodes.UNAUTHORIZED).send();
    const { query } = validators.getAllPhoneNumbersOfWaba(req);
    const wabaId = query.wabaId;
    const phoneNumbers = await services.phoneNumber.getAllPhoneNumbersOfWaba(req.user.id, wabaId);
    return res.send(phoneNumbers);
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(StatusCodes.BAD_REQUEST).send(error.errors);
    }
    logger.error(error.message);
    return res.status(StatusCodes.BAD_REQUEST).send();
  }
};
