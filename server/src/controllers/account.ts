import { Request, Response } from 'express';
import { ZodError } from 'zod';
import StatusCodes from 'http-status-codes';

import logger from '../logger';
import * as validators from './validators/account';
import { RequestWithUserInfo, UserStatusEnum } from '../types';
import { facebook, account, partnerToken, user, audit } from '../services';
import { AuditAction } from '@prisma/client';

// TODO: add phone number if already has WABA
// TODO: add handling for non user (partner embedded) connects
// May use different endpoint and controller
export const connect = async (req: RequestWithUserInfo, res: Response): Promise<void | Response> => {
  try {
    const { body } = validators.connect(req);
    let partnerTokenId: number | undefined;
    let partnerId: number | undefined;
    if (body.partnerToken) {
      const token = await partnerToken.getValidPartnerTokenByValue(body.partnerToken);
      if (!token) {
        return res.status(StatusCodes.NOT_FOUND).send();
      }
      partnerTokenId = token.id;
      partnerId = token.partnerId;
    }

    await audit.insertAudit(AuditAction.WABA_CONNECTION_REQUEST, {
      email: req.user.email,
      partnerToken: '' + body.partnerToken,
      partnerId: '' + partnerId,
    });

    const wabaAccountPhoneNumbers = await facebook.connectWabaToKeyReply(
      body.oauthToken,
      req.user.id,
      partnerTokenId,
      partnerId,
    );

    if (req.user.status !== UserStatusEnum.Completed && wabaAccountPhoneNumbers && wabaAccountPhoneNumbers.length > 0) {
      user.changeOnboardingStatus(req.user.id, UserStatusEnum.Completed);
    }
    res.send(wabaAccountPhoneNumbers || 'WABA connection error');
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(StatusCodes.BAD_REQUEST).send(err.errors);
    }
    logger.info(err);
    return res.status(StatusCodes.BAD_REQUEST).send();
  }
};

export const connectWithCustomerId = async (req: Request, res: Response): Promise<void | Response> => {
  try {
    const { body } = validators.connectWithCustomerId(req);
    const { partnerToken: partnerTokenToConnect, customerId, oauthToken } = body;
    const token = await partnerToken.getValidPartnerTokenByValue(partnerTokenToConnect);
    if (!token) {
      return res.status(StatusCodes.NOT_FOUND).send();
    }
    const partnerTokenId = token.id;
    const partnerId = token.partnerId;

    const userToConnect = await user.findByCustomerId(customerId);
    if (!userToConnect) {
      return res.status(StatusCodes.NOT_FOUND).send();
    }

    const wabaAccountPhoneNumbers = await facebook.connectWabaToKeyReply(
      oauthToken,
      userToConnect.id,
      partnerTokenId,
      partnerId,
    );

    if (
      userToConnect.status !== UserStatusEnum.Completed &&
      wabaAccountPhoneNumbers &&
      wabaAccountPhoneNumbers.length > 0
    ) {
      user.changeOnboardingStatus(userToConnect.id, UserStatusEnum.Completed);
    }
    res.send(wabaAccountPhoneNumbers);
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(StatusCodes.BAD_REQUEST).send(err.errors);
    }
    logger.info(err);
    return res.status(StatusCodes.BAD_REQUEST).send();
  }
};

export const find = async (req: RequestWithUserInfo, res: Response): Promise<void | Response> => {
  try {
    const { id, isAdmin } = req.user;
    const {
      query: { search, page, size, is_getting_all },
    } = validators.find(req);
    const {
      accounts,
      total,
      page: selectedPage,
      size: selectedSize,
    } = await account.findAccounts(isAdmin ? undefined : id, !!is_getting_all, page, size, search);
    const sanitizedAccounts = accounts.map((account) => {
      return {
        id: account.id,
        userId: account.userId,
        wabaId: account.wabaId,
        timezone: account.timezone,
        phoneNumbers: account.phoneNumber,
        ownerEmail: account.user?.email,
        manager: account.manager,
        name: account.name,
        businessName: account.businessName,
        businessId: account.businessId,
        currency: account.currency,
        status: account.status,
        createdAt: account.createdAt,
      };
    });
    res.send({
      accounts: sanitizedAccounts,
      total,
      selectedPage,
      selectedSize,
    });
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(StatusCodes.BAD_REQUEST).send(err.errors);
    }
    logger.info(err);
    return res.status(StatusCodes.BAD_REQUEST).send();
  }
};
export const reload = async (req: RequestWithUserInfo, res: Response): Promise<void | Response> => {
  try {
    const { params } = validators.reload(req);
    const wabaId = params.wabaId;
    const isReload = await account.updateWabaInfo(wabaId);
    if (isReload) {
      res.status(StatusCodes.ACCEPTED).send(isReload);
    } else {
      res.status(StatusCodes.TOO_MANY_REQUESTS).send();
    }
  } catch (err) {
    logger.info(err);
    return res.status(StatusCodes.BAD_REQUEST).send();
  }
};

export const getExportingAccounts = async (req: RequestWithUserInfo, res: Response): Promise<void | Response> => {
  try {
    const { id, isAdmin, partner } = req.user;
    const exportingData = await account.getExportingAccounts(isAdmin ? undefined : id, partner?.id);
    res.send(exportingData);
  } catch (err) {
    logger.info(err);
    return res.status(StatusCodes.BAD_REQUEST).send();
  }
};

export const findForPartnerApi = async (req: RequestWithUserInfo, res: Response): Promise<void | Response> => {
  try {
    const { id, isAdmin } = req.user;
    const { accounts } = await account.findAccounts(isAdmin ? undefined : id, true, undefined, undefined, '');
    const sanitizedAccounts = accounts.map((account) => {
      return {
        wabaId: account.wabaId,
        timezone: account.timezone,
        phoneNumbers: account.phoneNumber,
        ownerEmail: account.user?.email,
        name: account.name,
        businessName: account.businessName,
        businessId: account.businessId,
        currency: account.currency,
        status: account.status,
        createdAt: account.createdAt,
        updatedAt: account.updatedAt,
      };
    });
    res.send(sanitizedAccounts);
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
    const acct = await account.getAccount(params.accountId);
    if (!acct) {
      return res.status(StatusCodes.NOT_FOUND).send();
    }
    if (!req.user.isAdmin && acct.userId !== req.user.id) {
      return res.status(StatusCodes.FORBIDDEN).send();
    }
    const sanitizedAccount = {
      id: acct.id,
      userId: acct.userId,
      wabaId: acct.wabaId,
      timezone: acct.timezone,
    };
    res.send(sanitizedAccount);
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(StatusCodes.BAD_REQUEST).send(err.errors);
    }
    logger.info(err);
    return res.status(StatusCodes.BAD_REQUEST).send();
  }
};

export const getWABAStatus = async (req: RequestWithUserInfo, res: Response): Promise<void | Response> => {
  try {
    const { params } = validators.getWABAStatus(req);
    const wabaId = params.wabaId;
    const partnerId = req.user.partner?.id;
    if (!partnerId) return res.status(StatusCodes.UNAUTHORIZED).send();

    const status = await account.getWABAStatus(wabaId, partnerId);
    return res.send(status);
  } catch (error) {
    logger.error(error.message);
    return res.status(StatusCodes.BAD_REQUEST).send();
  }
};

export const remove = async (req: RequestWithUserInfo, res: Response): Promise<void | Response> => {
  try {
    const { params } = validators.remove(req);
    const { accountId } = params;
    const isRemove = await account.removeAccount(accountId);

    return res.send(isRemove);
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
    const wabaId = params.wabaId;
    const partnerId = req.user.partner?.id;
    if (!partnerId) return res.status(StatusCodes.UNAUTHORIZED).send();

    await account.shareCreditLine(wabaId, req.user.id);

    res.send();
  } catch (error) {
    logger.error(error.message);
    return res.status(StatusCodes.BAD_REQUEST).send();
  }
};

export const disableCreditLine = async (req: RequestWithUserInfo, res: Response): Promise<void | Response> => {
  try {
    const { params } = validators.disableCreditLine(req);
    const wabaId = params.wabaId;
    const partnerId = req.user.partner?.id;
    if (!partnerId) return res.status(StatusCodes.UNAUTHORIZED).send();

    await account.revokeCreditLine(wabaId, req.user.id);

    res.send();
  } catch (error) {
    logger.error(error.message);
    return res.status(StatusCodes.BAD_REQUEST).send();
  }
};

export const getTemplateToken = async (req: RequestWithUserInfo, res: Response): Promise<void | Response> => {
  try {
    const { params } = validators.getTemplateToken(req);
    const wabaId = params.wabaId;
    const partnerId = req.user.partner?.id;
    if (!partnerId) return res.status(StatusCodes.UNAUTHORIZED).send();

    const templateToken = await account.getTemplateToken(wabaId);
    return res.send(templateToken);
  } catch (error) {
    logger.error(error.message);
    return res.status(StatusCodes.BAD_REQUEST).send();
  }
};

export const userCanceledFacebookFlow = async (req: RequestWithUserInfo, res: Response): Promise<void | Response> => {
  try {
    await audit.insertAudit(AuditAction.USER_CANCEL_FACEBOOK_FLOW, {
      user: req.user.email,
    });
    return res.send();
  } catch (error) {
    logger.error(error.message);
    return res.status(StatusCodes.BAD_REQUEST).send();
  }
};

export const userWithCustomerIdCanceledFacebookFlow = async (req: Request, res: Response): Promise<void | Response> => {
  try {
    const { body } = validators.userWithCustomerIdCanceledFacebookFlow(req);
    const { partnerToken, customerId } = body;
    const owner = await user.findByCustomerId(customerId);
    await audit.insertAudit(AuditAction.USER_CANCEL_FACEBOOK_FLOW, {
      partnerToken: '' + partnerToken,
      user: owner?.email || customerId,
    });
    return res.send();
  } catch (error) {
    logger.error(error.message);
    return res.status(StatusCodes.BAD_REQUEST).send();
  }
};
