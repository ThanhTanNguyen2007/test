import logger from '../logger';
import prisma from '../prisma';
import timezoneMapping from '../consts/timezoneMapping';

const findTimeZoneForUpdate = (tz: string) => {
  const arrTz = tz.split('/');
  return timezoneMapping.find((x) => {
    const arrTz2 = x.tzCode.split('/');
    if(!arrTz2[1] || !arrTz[1]) return false;
    return arrTz2[1].toLowerCase() === arrTz[1].toLowerCase();
  });
};

export const updateTimeZone = async () => {
  try {
    const accounts = await prisma.account.findMany();
    for (const account of accounts) {
      const timezoneToUpdate = findTimeZoneForUpdate(account.timezone);
      if (timezoneToUpdate) {
        logger.info(`Updating timezone for wabaid: ${account.wabaId}`);
        await prisma.account.update({
          where: {
            id: account.id,
          },
          data: {
            timezone: timezoneToUpdate.tzCode,
          },
        });
      }
    }

    const partners = await prisma.partner.findMany();
    for (const partner of partners) {
      const timezoneToUpdate = findTimeZoneForUpdate(partner.timezone);
      if (timezoneToUpdate) {
        logger.info(`Updating timezone for partner: ${partner.id}`);
        await prisma.partner.update({
          where: {
            id: partner.id,
          },
          data: {
            timezone: timezoneToUpdate.tzCode,
          },
        });
      }
    }
  } catch (error) {
    logger.error(error.message);
  }
  process.exit();
};

(async () => await updateTimeZone())()