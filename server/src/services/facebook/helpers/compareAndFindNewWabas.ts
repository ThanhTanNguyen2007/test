import _ from 'lodash';
import { Account } from '@prisma/client';

const compareAndFindNewWabas = (wabaIds: string[], accounts: Account[]): string[] => {
  const newWabaIds: string[] = [];
  wabaIds.forEach((wabaId) => {
    const account = _.find(accounts, (account) => account.wabaId === wabaId);
    if (!account) {
      newWabaIds.push(wabaId);
    }
  });
  return newWabaIds;
};

export default compareAndFindNewWabas;
