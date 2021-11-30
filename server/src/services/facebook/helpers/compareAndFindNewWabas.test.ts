import { Account } from '@prisma/client';
import compareAndFindNewWabas from './compareAndFindNewWabas';

describe('Test compareAndFindNewWabas works as expected', () => {
  const wabaIds = ['1', '2'];
  const account: Account[] = [];
  const diffArray = compareAndFindNewWabas(wabaIds, account);
  const expectedArray: string[] = ['1', '2'];
  test('Graph url with path', () => {
    expect(diffArray).toEqual(expectedArray);
  });
});
