import { RequestWithUserInfo } from '../types';
import * as services from '../services';
import { Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import * as validators from './validators/analytics';

export const getAnalyticOfClients = async (req: RequestWithUserInfo, res: Response): Promise<void | Response> => {
  try {
    const { id, isAdmin } = req.user;
    const {
      query: { page, size },
    } = validators.find(req);
    const { start, end, wabaIds, phoneNumbers } = req.query as { [key: string]: string };
    const result = await services.facebook.getWabaAnalytics(
      start,
      end,
      isAdmin ? undefined : id,
      wabaIds,
      phoneNumbers,
      page,
      size,
    );
    res.send(result);
  } catch (error) {
    return res.status(StatusCodes.BAD_REQUEST).send();
  }
};
