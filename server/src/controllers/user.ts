import { Response } from 'express';
import StatusCodes from 'http-status-codes';
import { ZodError } from 'zod';
import { setCookie } from '../helpers';
import { RequestWithUserInfo, SanitizedUser, UserStatusEnum } from '../types';
import * as services from '../services';
import config from '../config';
import * as validators from './validators/user';
import logger from '../logger';

const clearCookies = (res: Response) => {
  setCookie('email', '', 0, res);
  setCookie('token', '', 0, res);
  return res.send();
};

export const me = async (req: RequestWithUserInfo, res: Response): Promise<void | Response> => {
  try {
    const { cookies } = validators.me(req);
    const email = cookies.email;
    const token = cookies.token;
    // /me is unauthenticated and is the first api call from the dashboard
    // we want to clean dashboard cookies and let it know it is logged out to render the right view
    let sanitizedUser: SanitizedUser | null;
    if (!email || !token) {
      return clearCookies(res);
    } else {
      sanitizedUser = await services.session.checkAndExtendSession(email, token);
      if (!sanitizedUser) {
        return clearCookies(res);
      }
    }

    const oneDayInMilliseconds = config.SESSION_DURATION_MINUTES * 60 * 1000;
    // TODO: Refactor cookie adding and remove to one place
    setCookie('email', email, oneDayInMilliseconds, res);
    setCookie('token', token, oneDayInMilliseconds, res);

    return res.send({
      email: sanitizedUser.email,
      id: sanitizedUser.id,
      isAdmin: sanitizedUser.isAdmin,
      partnerId: sanitizedUser.partner?.id,
      status: sanitizedUser.status,
    });
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
    const {
      query: { search, page, size },
    } = validators.find(req);
    const {
      users,
      page: selectedPage,
      size: selectedSize,
      total,
    } = await services.user.findUsers(req.user, page, size, search);
    const sanitizedUsers = users.map((user) => {
      return {
        id: user.id,
        email: user.email,
        isAdmin: user.isAdmin,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        partner: user.partner,
        status: user.status,
        uplineEmail: user.uplineUser?.email,
      };
    });
    return res.send({
      users: sanitizedUsers,
      selectedSize,
      selectedPage,
      total,
    });
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
    const isSelf = params.userId === req.user.id;
    if (!req.user.isAdmin && !isSelf) {
      return res.status(StatusCodes.FORBIDDEN).send();
    }
    const user = await services.user.getUserById(params.userId);
    if (!user) {
      return res.status(StatusCodes.NOT_FOUND).send();
    }
    const sanitizedUser = {
      id: user.id,
      email: user.email,
      isAdmin: user.isAdmin,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      status: user.status,
    };
    return res.send(sanitizedUser);
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
    if (!req.user.isAdmin) {
      const isSelf = params.userId === req.user.id;
      const isTryingToChangeAdmin = body.isAdmin !== undefined;
      if (!isSelf || isTryingToChangeAdmin) {
        return res.status(StatusCodes.FORBIDDEN).send();
      }
    }
    const updatedCount = await services.user.updateUser(params.userId, body);
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

export const initiateOnboardingProcess = async (req: RequestWithUserInfo, res: Response): Promise<void | Response> => {
  try {
    await services.user.changeOnboardingStatus(req.user.id, UserStatusEnum.Initiated);
    return res.send();
  } catch (error) {
    logger.error(error.message);
    return res.status(StatusCodes.BAD_REQUEST).send();
  }
};

export const getCustomerId = async (req: RequestWithUserInfo, res: Response): Promise<void | Response> => {
  try {
    const {
      query: { email },
    } = validators.getCustomerId(req);
    const customerId = await services.user.getCustomerId(req.user, email);
    return res.send(customerId);
  } catch (error) {
    logger.error(error.message);
    if (error.message.includes('User is not a customer of partner')) {
      return res.status(StatusCodes.BAD_REQUEST).send(error.message);
    }
    return res.status(StatusCodes.BAD_REQUEST).send();
  }
};
