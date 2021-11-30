import { v4 as uuidv4 } from 'uuid';
import { addSeconds } from 'date-fns';
import prisma from '../prisma';
import config from '../config';
import * as audit from './audit';
import { AuditAction } from '@prisma/client';

export const getValidPartnerTokenByValue = async (value: string) => {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0,0,0,0);
    const partnerToken = await prisma.partnerToken.findFirst({
      where: { value, revokedAt: null, expiresAt: { gte: startOfToday } },
      include: { partner: true },
    });
    return partnerToken;
  } catch (error) {
    throw error;
  }
};

export const findPartnerTokens = async (partnerId: number) => {
  try {
    const partnerTokens = await prisma.partnerToken.findMany({ where: { partnerId }, include: { partner: true } });
    return partnerTokens;
  } catch (error) {
    throw error;
  }
};

export const createPartnerToken = async (requestPartnerId: number) => {
  try {
    const value = uuidv4();
    const expiresAt = addSeconds(new Date(), config.PARTNER_TOKEN_DURATION_SECONDS);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const {partnerId, accountId ,...partnerToken} = await prisma.partnerToken.create({ data: { partnerId: requestPartnerId, value, expiresAt } });
    await audit.insertAudit(AuditAction.PARTNER_TOKEN_GENERATED, partnerToken.value);
    return partnerToken;
  } catch (error) {
    throw error;
  }
};

export const getPartnerKey = async (partnerKeyId: number) => {
  try {
    const partnerTokens = await prisma.partnerToken.findFirst({ where: { id: partnerKeyId }, include: { partner: true } });
    return partnerTokens;
  } catch (error) {
    throw error;
  }
};

export const revokePartnerToken = async (partnerKeyId: number) => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const {partnerId, accountId ,...partnerToken} = await prisma.partnerToken.update({
      data: { revokedAt: new Date() },
      where: { id: partnerKeyId },
    });
    await audit.insertAudit(AuditAction.PARTNER_TOKEN_DELETED, partnerToken.value);
    return partnerToken;
  } catch (error) {
    throw error;
  }
};

export const getPartnerTokenUsage = async (partnerKeyId: number) => {
  try {
    const numberOfUsage = await prisma.audit.count({
      where: {
        action: AuditAction.PARTNER_TOKEN_USED,
        payload: '' + partnerKeyId
      }
    });
    return numberOfUsage;
  } catch (error) {
    throw error;
  }
}