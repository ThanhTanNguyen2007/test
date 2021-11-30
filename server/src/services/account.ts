import _ from 'lodash';
import { Account, CreditLineState, Manager, User } from '@prisma/client';

import axios from 'axios';
import prisma from '../prisma';
import logger from '../logger';
import config from '../config';
import * as api from './facebook';
import revokeCreditLineWithWabaId from './facebook/revokeCreditLineWithWabaId';
import { getWabaInfo } from './facebook/api';
import { updateUplineForUser } from './user';
import { fetchAndUpdatePhoneNumbers } from '../services/phoneNumber';

export const findAccounts = async (
  userId?: number,
  isGettingAll = false,
  page = 1,
  size = 10,
  search = '',
  filterWabaId?: string,
  filterPhoneNumber?: string,
) => {
  try {
    const where = userId
      ? {
          OR: [
            {
              manager: {
                partner: {
                  userId,
                },
              },
            },
            {
              userId,
            },
          ],
        }
      : undefined;

    const accounts = await prisma.account.findMany({
      where: {
        ...where,
        ...(filterWabaId && {
          wabaId: filterWabaId,
        }),
        AND: {
          OR: [
            {
              wabaId: {
                contains: search,
              },
            },
            {
              name: {
                contains: search,
                mode: 'insensitive',
              },
            },
            {
              businessName: {
                contains: search,
                mode: 'insensitive',
              },
            },
            {
              manager: {
                partner: {
                  user: {
                    email: {
                      startsWith: search,
                    },
                  },
                },
              },
            },
          ],
        },
      },
      ...(!isGettingAll && { skip: (page - 1) * size }),
      ...(!isGettingAll && { take: size }),
      include: {
        phoneNumber: !filterPhoneNumber
          ? true
          : {
              where: {
                value: `+${filterPhoneNumber.trim()}`,
              },
            },
        user: true,
        manager: {
          include: {
            partner: {
              include: { user: true },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
    const total = await prisma.account.count({
      where: {
        ...where,
        ...(filterWabaId && {
          wabaId: filterWabaId,
        }),
        AND: {
          OR: [
            {
              wabaId: {
                contains: search,
              },
            },
            {
              name: {
                contains: search,
                mode: 'insensitive',
              },
            },
            {
              businessName: {
                contains: search,
                mode: 'insensitive',
              },
            },
            {
              manager: {
                partner: {
                  user: {
                    email: {
                      startsWith: search,
                    },
                  },
                },
              },
            },
          ],
        },
      },
    });
    return {
      accounts,
      total,
      page,
      size,
    };
  } catch (error) {
    logger.info('Error in findAccountsByIds');
    throw error;
  }
};

export const updateWabaInfo = async (wabaId: string) => {
  try {
    const currentTime = new Date(Date.now());
    console.log(`Updating waba with id: `, wabaId);
    const account = await prisma.account.findFirst({
      where: {
        wabaId,
      },
    });
    if (!account) {
      logger.infor(`Couldnt found waba with id: ${wabaId}`);
    } else {
      const expiresAt = account.updatedAt.getTime() + 60 * 60 * 1000;
      if (expiresAt < currentTime.getTime()) {
        await fetchAndUpdateWabaInfo(account);
        await fetchAndUpdatePhoneNumbers(account);
        logger.info('Reload Waba Info Success');
        await prisma.account.update({
          where: { wabaId },
          data: {
            updatedAt: currentTime,
          },
        });
        logger.info('Update updatedAt Success');
        return true;
      } else {
        logger.info('Disable Update');
        return;
      }
    }
  } catch (error) {
    logger.info(error.message);
    throw error;
  }
};

export const findAllWabaId = async (userId?: number) => {
  try {
    const where = userId
      ? {
          OR: [
            {
              manager: {
                partner: {
                  userId,
                },
              },
            },
            {
              userId,
            },
          ],
        }
      : undefined;

    const wabaIds = await prisma.account.findMany({
      where: {
        ...where,
      },
      select: {
        wabaId: true,
        phoneNumber: {
          select: {
            id: true,
            value: true,
          },
        },
      },
    });
    return wabaIds;
  } catch (error) {
    logger.info('Error in findAllWabaIds');
    throw error;
  }
};

export const getAccount = async (accountId: number) => {
  try {
    const accounts = await prisma.account.findFirst({ where: { id: accountId } });
    return accounts;
  } catch (error) {
    logger.info('Error in getAccount');
    throw error;
  }
};

export const getExportingAccounts = async (userId?: number, partnerId?: number) => {
  try {
    const where = userId
      ? {
          OR: [
            {
              manager: {
                partner: {
                  userId,
                },
              },
            },
            {
              userId,
            },
          ],
        }
      : undefined;

    const accounts = await prisma.account.findMany({
      where,
      include: {
        phoneNumber: true,
        user: true,
        manager: {
          include: {
            partner: {
              include: { user: true },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    const csvData = _.map(accounts, (account) => {
      const row: any = {
        'Created At': account.createdAt,
        'WABA ID': '' + account.wabaId,
        'WABA Name': account.name,
        'Owner Email': account.user?.email,
        Timezone: account.timezone,
        'Business name': account.businessName,
        'Phone Numbers': `'${_.map(account.phoneNumber, (phoneNumber) => phoneNumber.value).join(' \r\n')}`,
        'WABA Status': account.status,
        'Credit Line Status': account.manager?.creditLineState.toString().replace('_', ' '),
      };
      if (!userId) {
        row['Partner Email'] = account.manager?.partner?.user?.email;
      } else if (partnerId) {
        row['Is Linked User?'] = account.manager?.partnerId === partnerId ? 'Yes' : 'No';
      }
      row['Credit Line'] = account.manager?.creditLineAllocationConfigId ? 'On' : 'Off';
      return row;
    });

    return csvData;
  } catch (error) {
    logger.info('Error in findAccountsByIds');
    throw error;
  }
};

export const getAccountByWabaId = async (wabaId: string) => {
  try {
    const accounts = await prisma.account.findFirst({ where: { wabaId } });
    return accounts;
  } catch (error) {
    logger.info('Error in getAccount');
    throw error;
  }
};

export const shareCreditLine = async (wabaId: string, userId: number): Promise<void> => {
  const manager = await prisma.manager.findFirst({
    where: {
      OR: [
        {
          partner: {
            userId,
          },
        },
        {
          account: {
            userId,
          },
        },
      ],
      account: {
        wabaId,
      },
    },
  });
  if (!manager) throw new Error(`You are not the manager of WABA ${wabaId}`);
  const creditLineAllocationConfigId = await api.shareCreditLine(wabaId);
  await prisma.manager.update({
    where: { id: manager.id },
    data: { creditLineAllocationConfigId, creditLineState: CreditLineState.SHARED },
  });
};

export const revokeCreditLine = async (wabaId: string, userId: number): Promise<void> => {
  const manager = await prisma.manager.findFirst({
    where: {
      OR: [
        {
          partner: {
            userId,
          },
        },
        {
          account: {
            userId,
          },
        },
      ],
      account: {
        wabaId,
      },
    },
  });
  if (!manager) throw new Error(`You are not the manager of WABA ${wabaId}`);
  await revokeCreditLineWithWabaId(wabaId);
  await prisma.manager.update({
    where: { id: manager.id },
    data: {
      creditLineAllocationConfigId: null,
      creditLineState: CreditLineState.MANUALLY_REVOKED,
    },
  });
};

export const getWABAStatus = async (wabaId: string, partnerId: number): Promise<string> => {
  const account = await prisma.account.findFirst({
    where: {
      wabaId,
      OR: [
        {
          user: {
            partner: {
              id: partnerId,
            },
          },
        },
        {
          manager: {
            partnerId,
          },
        },
      ],
    },
  });
  if (!account) throw new Error('No WABA found or you are not the owner of this WABA');
  return account.status || 'NA';
};

export const getTemplateToken = async (wabaId: string): Promise<string> => {
  const response = await axios.get(
    `https://whatsapp.dark.keyreply.com/v10.0/${wabaId}/create?access_token=${config.KEYREPLY_DARK_WHATSAPP_TOKEN}`,
  );
  return response.data;
};
export const removeAccount = async (accountId: number) => {
  await prisma.$transaction([
    prisma.manager.delete({
      where: {
        accountId,
      },
    }),
    prisma.phoneNumber.deleteMany({
      where: {
        accountId,
      },
    }),
    prisma.account.delete({
      where: {
        id: accountId,
      },
    }),
  ]);

  return true;
};

export const fetchAndUpdateWabaInfo = async (account: Account) => {
  try {
    logger.info(`Updating WABA ${account.name}`);
    const waba = await getWabaInfo(account.wabaId);
    if (!waba) return;
    const {
      name,
      currency,
      account_review_status: status,
      owner_business_info: { id: businessId, name: businessName },
    } = waba;
    await prisma.account.update({
      where: {
        id: account.id,
      },
      data: {
        name,
        businessId,
        businessName,
        status,
        currency,
      },
    });
    logger.info(`Updated WABA ${account.name}`);
    return;
  } catch (error) {
    logger.error(`Migrated failed WABA ${account.name} with error ${error.message}`);
    return;
  }
};

export const updateUplineUser = async (
  account: Account & { manager: Manager | null; user: { uplineUser: User | null } },
) => {
  try {
    logger.info(`Migrating User for WABA ${account.name}`);
    if (account.manager?.partnerId && !account.user.uplineUser) {
      logger.info(`Updating upline user for user ${account.userId}`);
      await updateUplineForUser(account.userId, account.manager?.partnerId);
      logger.info(`Updated upline user for user ${account.userId}`);
    }
  } catch (error) {
    logger.error(`Failed migrating upline user`);
    return;
  }
}

export const getWabasByIds = async (wabaIds: string[]) => {
  const wabas = [];
  for (const wabaId of wabaIds) {
    try {
      const waba = await getWabaInfo(wabaId);
      if(!waba) continue;
      wabas.push(waba);
    } catch (error) {
      logger.error(error.message);
      continue;
    }
  }
  return wabas;
}
