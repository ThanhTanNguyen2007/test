import { CreditLineState } from '@prisma/client';
import prisma from '../prisma';
import * as api from './facebook';

export const findManagers = async () => {
  try {
    const managers = await prisma.manager.findMany();
    return managers;
  } catch (err) {
    throw err;
  }
};

export const findManagersByPartnerId = async (partnerId: number) => {
  try {
    const managers = await prisma.manager.findMany({ where: { partnerId } });
    return managers;
  } catch (err) {
    throw err;
  }
};

export const findManagersByUserId = async (userId: number) => {
  try {
    const accounts = await prisma.account.findMany({ where: { userId } });
    const accountIds = accounts.map((account: { id: number; }) => account.id);
    const managers = await prisma.manager.findMany({ where: { accountId: { in: accountIds } } });
    return managers;
  } catch (err) {
    throw err;
  }
};

export const getManager = async (managerId: number) => {
  try {
    const manager = await prisma.manager.findFirst({
      where: { id: managerId },
      include: { account: true },
    });
    return manager;
  } catch (err) {
    throw err;
  }
};

export const enableCreditLine = async (managerId: number) => {
  try {
    const manager = await prisma.manager.findFirst({ where: { id: managerId }, include: { account: true } });
    if (!manager) {
      return null;
    }
    const creditLineAllocationConfigId = await api.shareCreditLine(manager.account.wabaId);
    const updatedManager = await prisma.manager.update({
      where: { id: managerId },
      data: { creditLineAllocationConfigId, creditLineState: CreditLineState.SHARED },
    });
    return updatedManager;
  } catch (err) {
    throw err;
  }
};

export const disableCreditLine = async (managerId: number) => {
  try {
    const manager = await prisma.manager.findFirst({ where: { id: managerId }, include: { account: true } });
    if (!manager || !manager.creditLineAllocationConfigId) {
      return null;
    }
    await api.revokeCreditLineWithAllocationId(manager.creditLineAllocationConfigId);
    const updatedManager = await prisma.manager.update({
      where: { id: managerId },
      data: { creditLineAllocationConfigId: null, creditLineState: CreditLineState.MANUALLY_REVOKED },
    });
    return updatedManager;
  } catch (err) {
    throw err;
  }
};
