import _ from 'lodash';
import { Account, AuditAction, CreditLineState, PhoneNumber } from '@prisma/client';
import * as api from './api';
import prisma from '../../prisma';
import compareAndFindNewWabas from './helpers/compareAndFindNewWabas';
import mapFbTimezoneIdToStandardTimezone from './helpers/mapFbTimezoneIdToStandardTimezone';
import shareCreditLine from './shareCreditLine';
import * as audit from '../audit';
import { updateOrCreateAPhoneNumber } from '../phoneNumber';
import logger from '../../logger';
import { updateUplineForUser } from '../user';
import { account } from '..';

type WabaAccountPhoneNumbers = {
  account: Account;
  newPhoneNumbers: PhoneNumber[];
};

/**
 * Upsert phone numbers and filter accounts with new phone numbers
 * @param wabaIds WABA IDs received from Facebook's Graph API
 * @param allAccounts All existing accounts in KeyReply system that have System User attached to WABA
 */
export const addPhoneNumbersForWabas = async (wabaIds: string[], allAccounts: Account[]) => {
  const wabaPhoneNumbers: WabaAccountPhoneNumbers[] = [];
  for (let wabaIndex = 0; wabaIndex < wabaIds.length; wabaIndex += 1) {
    const wabaId = wabaIds[wabaIndex];
    const currentAccount = _.find(allAccounts, (account) => account.wabaId === wabaId);
    if (!currentAccount) {
      continue;
    }
    const newPhoneNumbers: PhoneNumber[] = [];
    const whatsappPhoneNumbers = await api.getPhoneNumbers(wabaId);

    for (let phoneNumberIndex = 0; phoneNumberIndex < whatsappPhoneNumbers.length; phoneNumberIndex += 1) {
      const whatsappPhoneNumber = whatsappPhoneNumbers[phoneNumberIndex];
      const phoneNumber = await updateOrCreateAPhoneNumber(whatsappPhoneNumber, currentAccount.id);
      if (!phoneNumber) continue;
      const wasCreated = compareDates(phoneNumber.createdAt, phoneNumber.updatedAt);
      if (wasCreated) {
        newPhoneNumbers.push(phoneNumber);
      }
    }
    if (newPhoneNumbers.length > 0) {
      wabaPhoneNumbers.push({ account: currentAccount, newPhoneNumbers });
    }
  }
  return wabaPhoneNumbers;
};

// Gives KeyReply programmatic access to WABA
// TODO: handle when some data is already existing
const connectWabaToKeyReply = async (
  oauthToken: string,
  userId: number,
  partnerTokenId?: number,
  partnerId?: number,
): Promise<null | WabaAccountPhoneNumbers[]> => {
  try {
    const wabaIds = await api.getSharedWhatsAppAccountIds(oauthToken);
    if (!wabaIds) {
      logger.info('No WABA found!');
      return null;
    }

    // Get Accounts from db
    const accounts = await prisma.account.findMany({
      where: { wabaId: { in: wabaIds } },
    });
    // Diff to find newly shared one
    const newWabaIds = compareAndFindNewWabas(wabaIds, accounts);
    const allWabas = await account.getWabasByIds(wabaIds);
    const newWabas = _.filter(allWabas, (w) => newWabaIds.includes(w.id));
    const addSystemUserPromises = newWabas.map(async (waba) => {
      // First step to ensure that all accounts in our db have a system user
      await audit.insertAudit(AuditAction.WABA_CONNECTION_REQUEST, {
        wabaId: waba.id,
        name: waba.name,
      });
      await api.addSystemUserToWaba(waba.id);
      logger.info(`Inserting account: |WABA-${waba.id}|Name=${waba.name}|`);
      const { id: businessId, name: businessName } = waba.owner_business_info;
      const account = await prisma.account.upsert({
        where: { wabaId: waba.id },
        create: {
          timezone: mapFbTimezoneIdToStandardTimezone(waba.timezone_id).tzCode,
          wabaId: waba.id,
          userId,
          name: waba.name,
          businessId,
          businessName,
          currency: waba.currency,
          status: waba.account_review_status,
        },
        update: {},
      });
      const wasCreated = compareDates(account.createdAt, account.updatedAt);

      if (!wasCreated) {
        return account;
      }

      try {
        await prisma.wABAMigration.update({
          where: {
            newWABAId: account.wabaId,
          },
          data: {
            krWABACreated: true,
            WABAReviewStatus: account.status,
          },
        });
      } catch (error) {
        logger.info(`Does not found migration record, ignore updating Migration status`);
      }

      await audit.insertAudit(AuditAction.WABA_CONNECTED, {
        wabaId: waba.id,
        name: waba.name,
      });

      // Share credit line
      const creditLineAllocationConfigId = await shareCreditLine(waba.id);

      await prisma.manager.create({
        data: {
          state: 'IN_PROGRESS',
          accountId: account.id,
          partnerId,
          partnerTokenId,
          creditLineAllocationConfigId,
          creditLineState: CreditLineState.SHARED,
        },
      });

      if (partnerTokenId) {
        await prisma.partnerToken.update({ where: { id: partnerTokenId }, data: { usedAt: new Date() } });
        await audit.insertAudit(AuditAction.PARTNER_TOKEN_USED, '' + partnerTokenId);
      }

      if (partnerId) {
        await updateUplineForUser(userId, partnerId);
      }

      await api.subscribeToWebhookForWaba(waba.id);
      return account;
    });
    await Promise.all(addSystemUserPromises);
    const allAccounts = await prisma.account.findMany({
      where: { wabaId: { in: wabaIds } },
      include: {
        manager: {
          include: {
            partner: {
              include: {
                user: {
                  select: {
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
    });
    const newWabaAccountPhoneNumbers = await addPhoneNumbersForWabas(wabaIds, allAccounts);
    return newWabaAccountPhoneNumbers;
  } catch (error) {
    logger.error(error.message);
    throw error;
  }
};

const compareDates = (date1: Date, date2: Date): boolean => {
  return Math.round(+date1 / 1000) === Math.round(+date2 / 1000);
};

export default connectWabaToKeyReply;
