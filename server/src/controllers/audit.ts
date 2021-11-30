import { RequestWithUserInfo } from '../types';
import * as services from '../services';
import { Response } from 'express';
import { StatusCodes } from 'http-status-codes';

export const find = async (req: RequestWithUserInfo, res: Response) : Promise<void | Response> => {
    try {
        const { start, end } = req.query as { [key: string]: string};
        const analytics = await services.audit.getAudits(start, end);
        res.send(analytics);
    } catch (error) {
        return res.status(StatusCodes.BAD_REQUEST).send();
    }
}
