import logger from '../logger';
import prisma from '../prisma';
import { fetchAndUpdateWabaInfo } from '../services/account';
import { fetchAndUpdatePhoneNumbers } from '../services/phoneNumber';

export const updateWabaInfo = async (wabaId: string) => {
  try {
    logger.info(`Updating waba with id: ${wabaId}`)
      const account = await prisma.account.findFirst({
        where: {
          wabaId
        }
      });
      if(!account) {
        logger.error(`Couldnt found waba with id: ${wabaId}`);
      }else {
        await fetchAndUpdateWabaInfo(account);
        await fetchAndUpdatePhoneNumbers(account);
        logger.info(`Updated waba with id: ${wabaId}`)
      }
  } catch (error) {
      logger.error(error.message)
  }
  process.exit();
}

(async () => await updateWabaInfo(''))()