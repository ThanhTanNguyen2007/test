import { AuditAction, CreditLineState, Manager } from '@prisma/client';
import { account, audit } from '.';
import prisma from '../prisma';
import { shareCreditLine } from './facebook';
import revokeCreditLineWithWabaId from './facebook/revokeCreditLineWithWabaId';
import uuidAPIKey from 'uuid-apikey';
import { createPartnerToken } from './partnerToken';
import config from '../config';

export const findPartners = async () => {
  try {
    const partners = await prisma.partner.findMany({ include: { user: true } });
    return partners;
  } catch (error) {
    throw error;
  }
};

export const getPartnerById = async (partnerId: number) => {
  try {
    const partner = await prisma.partner.findFirst({ where: { id: partnerId } });
    return partner;
  } catch (error) {
    throw error;
  }
};

type PartnerAttributes = {
  userId: number;
  timezone: string;
};
export const createPartner = async (attributes: PartnerAttributes) => {
  try {
    const partner = await prisma.partner.create({ data: attributes });
    await audit.insertAudit(AuditAction.PARTNER_PROMOTED, '' + partner.id);
    return partner;
  } catch (err) {
    throw err;
  }
};

type UpdatePartnerAttributes = {
  timezone?: string;
  isActivated?: boolean;
};
export const updatePartner = async (partnerId: number, attributes: UpdatePartnerAttributes) => {
  try {
    const partner = await prisma.partner.update({ data: attributes, where: { id: partnerId } });
    return partner;
  } catch (error) {
    throw error;
  }
};

export const changeActivation = async (partnerId: number, isActivated: boolean) => {
  try {
    const updatedPartner = await updatePartner(partnerId, { isActivated });
    if (!updatedPartner.userId) throw new Error(`Cannot find user id of partner ${partnerId}`);
    const { accounts: accountsUnderPartner } = await account.findAccounts(
      updatedPartner.userId,
      true,
      undefined,
      undefined,
    );
    if (accountsUnderPartner && accountsUnderPartner.length > 0) {
      for (let index = 0; index < accountsUnderPartner.length; index++) {
        const account = accountsUnderPartner[index];
        if (isActivated) {
          const { creditLineState } = account.manager as Manager;
          if (creditLineState !== CreditLineState.AUTO_REVOKED && creditLineState !== CreditLineState.NONE) continue;
          const creditLineAllocationConfigId = await shareCreditLine(account.wabaId);
          await prisma.manager.update({
            data: {
              creditLineAllocationConfigId,
              creditLineState: CreditLineState.SHARED,
            },
            where: {
              id: account.manager?.id,
            },
          });
          await audit.insertAudit(AuditAction.PARTNER_ACTIVATED, '' + updatedPartner.id);
        } else {
          if ((account.manager as Manager).creditLineState !== CreditLineState.SHARED) continue;
          await revokeCreditLineWithWabaId(account.wabaId);
          await prisma.manager.update({
            data: {
              creditLineAllocationConfigId: null,
              creditLineState: CreditLineState.AUTO_REVOKED,
            },
            where: {
              id: account.manager?.id,
            },
          });
          await audit.insertAudit(AuditAction.PARTNER_DEACTIVATED, '' + updatedPartner.id);
        }
      }
    }
    return updatedPartner;
  } catch (error) {
    throw error;
  }
};

export const generateApiKey = async (partnerId: number): Promise<any> => {
  const partner = await getPartnerById(partnerId);
  if (!partner) throw new Error(`Cannot find partner ${partnerId}`);
  const { apiKey } = uuidAPIKey.create();
  const newApiKey = await prisma.apiKey.upsert({
    where: {
      partnerId,
    },
    create: {
      value: apiKey,
      partnerId,
    },
    update: {
      value: apiKey,
      isActive: true,
    },
  });

  return {
    value: newApiKey.value,
    isActive: newApiKey.isActive,
  };
};

export const deactivateApiKey = async (partnerId: number): Promise<any | null> => {
  const updatedApiKey = await prisma.apiKey.update({
    where: {
      partnerId,
    },
    data: {
      isActive: false,
    },
  });

  if (updatedApiKey) {
    const { value, isActive } = updatedApiKey;
    return {
      isActive,
      value: value.substr(0, 7) + '************************',
    };
  }
};

export const getApiKey = async (partnerId: number): Promise<any | null> => {
  const apiKey = await prisma.apiKey.findFirst({
    where: {
      partnerId,
    },
  });
  if (apiKey) {
    const { value, isActive } = apiKey;
    return {
      isActive,
      value: value.substr(0, 7) + '************************',
    };
  }

  return null;
};

export const getEmbeddedUrl = async (partnerId: number): Promise<string> => {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  let partnerToken: any = await prisma.partnerToken.findFirst({
    where: {
      partnerId,
      revokedAt: null,
      expiresAt: { gte: startOfToday },
    },
  });

  if (!partnerToken) {
    partnerToken = await createPartnerToken(partnerId);
  }

  const embeddedUrl = `${config.CLIENT_URL}/wa-client?partner=${partnerToken.value}`;
  return embeddedUrl;
};
