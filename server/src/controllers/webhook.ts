import config from '../config';
import { Request, Response } from "express";
import { StatusCodes } from 'http-status-codes';
import * as services from '../services';
import logger from '../logger';

export const validateVerificationRequests = (req: Request, res: Response) => {
  try {
    const verifyToken = req.query['hub.verify_token'];
    if (verifyToken === config.FACEBOOK_WEBHOOK_VERIFY_TOKEN) {
      const challenge = req.query['hub.challenge'];
      return res.send(challenge)
    }
    return res.status(StatusCodes.BAD_REQUEST).send();
  } catch (error) {
    logger.error(error.message)
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send();
  }

}

export const handleWebhookEvents = async (req: Request, res: Response) => {
  try {
    const { entry } = req.body;
    if (entry) {
      await services.webhook.handleWebhookEvents(entry);
    }
    return res.send()
  } catch (error) {
    logger.error(error.message)
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send();
  }
}