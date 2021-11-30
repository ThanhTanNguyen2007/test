import { Response } from 'express';
import StatusCodes from 'http-status-codes';
import { ZodError } from 'zod';
import { RequestWithUserInfo } from '../types';
import * as services from '../services';
import * as validators from './validators/partnerToken';
import logger from '../logger';

export const find = async (req: RequestWithUserInfo, res: Response): Promise<void | Response> => {
  try {
    let partnerId = req.user.partner?.id;
    if(!partnerId) {
      const { params } = validators.find(req);
      partnerId = params.partnerId;
    }

    const partnerTokens = await services.partnerToken.findPartnerTokens(partnerId);
    const allowedData = partnerTokens.filter((partnerToken) => {
      return req.user.isAdmin || partnerToken.partner?.userId === req.user.id;
    });

    const mappedPartnerToken = [];
    for (let index = 0; index < allowedData.length; index++) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const {partner, accountId, partnerId, ...partnerToken} = allowedData[index];
      const usage = await services.partnerToken.getPartnerTokenUsage(partnerToken.id);
      mappedPartnerToken.push({
        ...partnerToken,
        usage
      });
    }

    return res.send(mappedPartnerToken);
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
    let partnerId = req.user.partner?.id;
    if(!partnerId) {
      const { params } = validators.create(req);
      partnerId = params.partnerId;
    }
    
    const partnerToken = await services.partnerToken.createPartnerToken(partnerId);
    return res.send(partnerToken);
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(StatusCodes.BAD_REQUEST).send(err.errors);
    }
    logger.info(err);
    return res.status(StatusCodes.BAD_REQUEST).send();
  }
};

export const revoke = async (req: RequestWithUserInfo, res: Response): Promise<void | Response> => {
  try {
    const { params: { partnerKeyId } } = validators.revoke(req);
    
    const partnerKey = await services.partnerToken.getPartnerKey(partnerKeyId);
    const isBelongsToPartner = req.user.partner?.id === partnerKey?.partner.id;
    if (!req.user.isAdmin && !isBelongsToPartner) {
      return res.status(StatusCodes.FORBIDDEN).send();
    }

    const partnerToken = await services.partnerToken.revokePartnerToken(partnerKeyId);
    if (!partnerToken) {
      return res.status(StatusCodes.NOT_FOUND).send();
    }
    return res.send(partnerToken);
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(StatusCodes.BAD_REQUEST).send(err.errors);
    }
    logger.info(err);
    return res.status(StatusCodes.BAD_REQUEST).send();
  }
};
// TODO: VERIFY REVOKE
