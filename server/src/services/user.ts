import { SanitizedUser, UserStatus } from '../types';
import prisma from '../prisma';
import logger from '../logger';
import { getPartnerById } from './partner';
import { User } from '@prisma/client';

export const findOrCreateUserByEmail = async (email: string, partnerUserId: number | null = null) => {
  try {
    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        ...(partnerUserId && { uplineUserId: partnerUserId }),
      },
    });
    return user;
  } catch (error) {
    logger.info('Error in findOrCreateUserByEmail');
    throw error;
  }
};

export const findUsers = async (requestUser: SanitizedUser, page = 1, size = 10, search = '') => {
  try {
    const where = !requestUser.isAdmin
      ? {
          uplineUserId: requestUser.id,
        }
      : undefined;

    const users = await prisma.user.findMany({
      where: {
        ...where,
        AND: {
          OR: [
            {
              email: {
                contains: search,
                mode: 'insensitive',
              },
            },
            {
              uplineUser: {
                email: {
                  startsWith: search,
                  mode: 'insensitive',
                },
              },
            },
          ],
        },
      },
      skip: (page - 1) * size,
      take: size,
      include: {
        partner: true,
        uplineUser: {
          select: {
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
    const total = await prisma.user.count({
      where: {
        ...where,
        AND: {
          OR: [
            {
              email: {
                contains: search,
                mode: 'insensitive',
              },
            },
            {
              uplineUser: {
                email: {
                  startsWith: search,
                  mode: 'insensitive',
                },
              },
            },
          ],
        },
      },
    });
    return {
      users,
      total,
      page,
      size,
    };
  } catch (error) {
    throw error;
  }
};

export const getUserById = async (userId: number) => {
  try {
    const user = await prisma.user.findFirst({ where: { id: userId } });
    return user;
  } catch (error) {
    throw error;
  }
};

type UpdateUserAttributes = {
  isAdmin?: boolean;
};
export const updateUser = async (userId: number, attributes: UpdateUserAttributes) => {
  try {
    const user = await prisma.user.update({ data: attributes, where: { id: userId } });
    return user;
  } catch (error) {
    throw error;
  }
};

export const changeOnboardingStatus = async (userId: number, status: UserStatus) => {
  try {
    await prisma.user.update({
      data: {
        status,
      },
      where: {
        id: userId,
      },
    });
  } catch (error) {
    throw error;
  }
};

export const getUserByApiKey = async (apiKey: string): Promise<SanitizedUser | null> => {
  try {
    const user = await prisma.user.findFirst({
      where: {
        partner: {
          apiKey: {
            value: apiKey,
            isActive: true,
          },
        },
      },
      include: {
        partner: true,
      },
    });
    if (!user) {
      return null;
    }
    return {
      id: user.id,
      email: user.email,
      isAdmin: user.isAdmin,
      partner: user.partner ? { id: user.partner.id, timezone: user.partner.timezone } : null,
      status: user.status as UserStatus,
    };
  } catch (error) {
    return null;
  }
};

export const getCustomerId = async (partnerUser: SanitizedUser, email: string): Promise<string | undefined> => {
  let user = await prisma.user.findFirst({
    where: {
      email,
    },
  });

  if (!user) {
    user = await findOrCreateUserByEmail(email, partnerUser.id);
  } else if (user.uplineUserId !== partnerUser.id && user.id !== partnerUser.id) {
    throw new Error(`User is not a customer of partner ${partnerUser.email}`);
  } else {
    user = await updateUplineForUser(user.id, partnerUser.id);
  }

  if (user) {
    return user.customerId;
  }
  throw new Error('Cannot find the customer id');
};

export const updateUplineForUser = async (userId: number, partnerId: number): Promise<User> => {
  const partner = await getPartnerById(partnerId);
  return await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      uplineUserId: partner?.userId,
    },
  });
};

export const findByCustomerId = async (customerId: string): Promise<User | null> => {
  const user = await prisma.user.findFirst({
    where: {
      customerId,
    },
  });
  return user;
};
