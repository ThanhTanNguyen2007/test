import { Response } from 'express';
import StatusCodes from 'http-status-codes';
import { ZodError } from 'zod';
import { RequestWithUserInfo } from '../types';
import * as services from '../services';
import * as validators from './validators/partner';
import logger from '../logger';
import * as analyticCacheManager from '../cacheManager';
import { Partner } from '@prisma/client';

export type PartnerApiUsageCache = {
  key: string;
  total: string;
};

export type InfoApiUsage = {
  partner: Partner;
  apiUsage: PartnerApiUsageCache[] | unknown[];
};

export const find = async (req: RequestWithUserInfo, res: Response): Promise<void | Response> => {
  try {
    const partners = await services.partner.findPartners();
    const sanitizedPartners = partners.map((partner) => {
      return {
        id: partner.id,
        user: partner.user
          ? {
              id: partner.user.id,
              email: partner.user.email,
            }
          : null,
        timezone: partner.timezone,
        createdAt: partner.createdAt,
        updatedAt: partner.updatedAt,
      };
    });
    return res.send(sanitizedPartners);
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(StatusCodes.BAD_REQUEST).send(err.errors);
    }
    logger.info(err);
    return res.status(StatusCodes.BAD_REQUEST).send();
  }
};

export const create = async (req: RequestWithUserInfo, res: Response): Promise<void | Response> => {
  try {
    const { body } = validators.create(req);
    const partner = await services.partner.createPartner(body);
    if (!partner) {
      return res.status(StatusCodes.CONFLICT).send();
    }
    const sanitizedPartner = {
      id: partner.id,
      userId: partner.userId,
      timezone: partner.timezone,
      createdAt: partner.createdAt,
      updatedAt: partner.updatedAt,
    };
    return res.send(sanitizedPartner);
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(StatusCodes.BAD_REQUEST).send(err.errors);
    }
    logger.info(err);
    return res.status(StatusCodes.BAD_REQUEST).send();
  }
};

export const get = async (req: RequestWithUserInfo, res: Response): Promise<void | Response> => {
  try {
    const { params } = validators.get(req);
    const isSelf = req.user.partner && params.partnerId === req.user.partner.id;
    if (!req.user.isAdmin && !isSelf) {
      return res.status(StatusCodes.FORBIDDEN).send();
    }
    const partner = await services.partner.getPartnerById(params.partnerId);
    if (!partner) {
      return res.status(StatusCodes.NOT_FOUND).send();
    }
    const sanitizedPartner = {
      id: partner.id,
      timezone: partner.timezone,
      createdAt: partner.createdAt,
      updatedAt: partner.updatedAt,
    };
    return res.send(sanitizedPartner);
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(StatusCodes.BAD_REQUEST).send(err.errors);
    }
    logger.info(err);
    return res.status(StatusCodes.BAD_REQUEST).send();
  }
};

export const update = async (req: RequestWithUserInfo, res: Response): Promise<void | Response> => {
  try {
    const { params, body } = validators.update(req);
    const updatedCount = await services.partner.updatePartner(params.partnerId, body);
    if (!updatedCount) {
      return res.status(StatusCodes.NOT_FOUND).send();
    }
    return res.send();
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(StatusCodes.BAD_REQUEST).send(err.errors);
    }
    logger.info(err);
    return res.status(StatusCodes.BAD_REQUEST).send();
  }
};

export const changeActivation = async (req: RequestWithUserInfo, res: Response): Promise<void | Response> => {
  try {
    const { params, body } = validators.changeActivation(req);
    const { isAdmin } = req.user;
    if (!isAdmin) return res.status(StatusCodes.UNAUTHORIZED).send();
    const { partnerId } = params;
    const updatedPartner = await services.partner.changeActivation(partnerId, body.isActivated);
    return res.send(updatedPartner);
  } catch (error) {
    logger.error(error.message);
    return res.status(StatusCodes.BAD_REQUEST).send();
  }
};

export const generateApiKey = async (req: RequestWithUserInfo, res: Response): Promise<void | Response> => {
  try {
    const partnerId = req.user.partner?.id;
    if (!partnerId) return res.status(StatusCodes.UNAUTHORIZED).send();
    const apiKey = await services.partner.generateApiKey(partnerId);
    return res.send(apiKey);
  } catch (error) {
    logger.error(error.message);
    return res.status(StatusCodes.BAD_REQUEST).send();
  }
};

export const deactivateApiKey = async (req: RequestWithUserInfo, res: Response): Promise<void | Response> => {
  try {
    const partnerId = req.user.partner?.id;
    if (!partnerId) return res.status(StatusCodes.UNAUTHORIZED).send();
    const updatedApiKey = await services.partner.deactivateApiKey(partnerId);
    return res.send(updatedApiKey);
  } catch (error) {
    logger.error(error.message);
    return res.status(StatusCodes.BAD_REQUEST).send();
  }
};

export const getApiKey = async (req: RequestWithUserInfo, res: Response): Promise<void | Response> => {
  try {
    const partnerId = req.user.partner?.id;
    if (!partnerId) return res.status(StatusCodes.UNAUTHORIZED).send();
    const apiKey = await services.partner.getApiKey(partnerId);
    return res.send(apiKey);
  } catch (error) {
    logger.error(error.message);
    return res.status(StatusCodes.BAD_REQUEST).send();
  }
};

export const getEmbeddedUrl = async (req: RequestWithUserInfo, res: Response): Promise<void | Response> => {
  try {
    const partnerId = req.user.partner?.id;
    if (!partnerId) return res.status(StatusCodes.UNAUTHORIZED).send();
    const embeddedUrl = await services.partner.getEmbeddedUrl(partnerId);
    return res.send(embeddedUrl);
  } catch (error) {
    logger.error(error.message);
    return res.status(StatusCodes.BAD_REQUEST).send();
  }
};

export const getPartnerApiUsage = async (req: RequestWithUserInfo, res: Response): Promise<void | Response> => {
  try {
    const partners = await services.partner.findPartners();
    const results: InfoApiUsage[] = [];
    const partnerApiUsageCacheFetchingPromises = partners.map(async (partner) => {
      const partnerKey = `api:${partner.userId}:*`;
      const cacheKeys = await analyticCacheManager.getAllKeys(partnerKey);
      const temp = cacheKeys.map(async (key: string) => {
        const total = await analyticCacheManager.getCache(key);
        return {
          key: key,
          total: total,
        };
      });
      const apiUsage = await Promise.all(temp);
      if (apiUsage.length > 0) {
        results.push({ partner: partner, apiUsage: apiUsage });
        return {
          results,
        };
      }
    });
    await Promise.all(partnerApiUsageCacheFetchingPromises);

    return res.status(StatusCodes.ACCEPTED).send({ infoApiUsage: results });
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(StatusCodes.BAD_REQUEST).send(err.errors);
    }
    logger.info(err);
    return res.status(StatusCodes.BAD_REQUEST).send();
  }
};
