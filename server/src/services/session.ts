import { v4 as uuidv4 } from 'uuid';
import { addMinutes } from 'date-fns';
import prisma from '../prisma';
import config from '../config';
import { SanitizedUser, UserStatus } from '../types';
import logger from '../logger';

export const createSession = async (userId: number, sessionDurationMinutes: number) => {
  const session = await prisma.session.create({
    data: { userId, expiresAt: addMinutes(new Date(), sessionDurationMinutes), token: uuidv4(), data: '' },
  });
  return session;
};

export const checkAndExtendSession = async (email: string, token: string): Promise<null | SanitizedUser> => {
  try {
    const user = await prisma.user.findFirst({ where: { email }, include: { partner: true } });
    if (!user) {
      return null;
    }
    const now = new Date();
    const session = await prisma.session.findFirst({ where: { userId: user.id, token, expiresAt: { gte: now } } });
    if (!session) {
      return null;
    }
    const newExpiresAt = addMinutes(now, config.SESSION_DURATION_MINUTES);
    await prisma.session.update({ where: { id: session.id }, data: { expiresAt: newExpiresAt } });
    return {
      id: user.id,
      email: user.email,
      isAdmin: user.isAdmin,
      partner: user.partner ? { id: user.partner.id, timezone: user.partner.timezone } : null,
      status: user.status as UserStatus,
    };
  } catch (error) {
    logger.error(error.message);
    return null;
  }
};

export const endSession = async (userId: number, token: string) => {
  try {
    await prisma.session.updateMany({ where: { userId, token }, data: { expiresAt: new Date() } });
  } catch (error) {
    logger.error(error.message);
  }
};
