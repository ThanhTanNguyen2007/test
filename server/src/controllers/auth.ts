import { Request, Response } from 'express';
import StatusCodes from 'http-status-codes';
import { ZodError } from 'zod';
import * as services from '../services';
import { setCookie } from '../helpers';
import config from '../config';
import { RequestWithUserInfo } from '../types';
import * as validators from './validators/auth';
import { AuditAction } from '@prisma/client';
import logger from '../logger';

export const login = async (req: Request, res: Response): Promise<void | Response> => {
  try {
    const { body } = validators.login(req);
    const { email, email_verified: isEmailVerified } = await services.auth0.exchangeCodeForToken(body.code);
    if (!isEmailVerified) {
      return res.send({ email, requiresEmailVerification: !isEmailVerified });
    }
    const user = await services.user.findOrCreateUserByEmail(email);
    const session = await services.session.createSession(user.id, config.SESSION_DURATION_MINUTES);

    const oneDayInMilliseconds = config.SESSION_DURATION_MINUTES * 60 * 1000;
    setCookie('email', email, oneDayInMilliseconds, res);
    setCookie('token', session.token, oneDayInMilliseconds, res);
    await services.audit.insertAudit(AuditAction.USER_LOGGED_IN, email);
    return res.send({ email });
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(StatusCodes.BAD_REQUEST).send(err.errors);
    }
    logger.info(err);
    return res.status(StatusCodes.BAD_REQUEST).send();
  }
};

export const logout = async (req: RequestWithUserInfo, res: Response): Promise<void | Response> => {
  try {
    const { cookies } = validators.logout(req);
    await services.session.endSession(req.user.id, cookies.token);
    setCookie('email', '', 0, res);
    setCookie('token', '', 0, res);
    await services.audit.insertAudit(AuditAction.USER_LOGGED_OUT, req.user.email);
    res.send();
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(StatusCodes.BAD_REQUEST).send(err.errors);
    }
    logger.info(err);
    return res.status(StatusCodes.BAD_REQUEST).send();
  }
};
