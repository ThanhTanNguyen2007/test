import { fetchAndUpdatePhoneNumbers } from '../services/phoneNumber';
import prisma from '../prisma';
import logger from '../logger';
import { updateUplineUser, fetchAndUpdateWabaInfo } from '../services/account';

export const doWabaMigration = async () => {
    try {
        const accounts = await prisma.account.findMany({
            include: {
                phoneNumber: true,
                manager: true,
                user: {
                    select: {
                        uplineUser: true
                    }
                }
            }
        });
        const accountsNeedToUpdateInfo = accounts.filter(
            ({
                name,
                businessName,
                businessId,
                status,
                currency 
            }) => !name || !businessName || !businessId || !status || !currency);

        if(accounts.length == 0) {
            logger.info('No accounts to migrate');
            return;
        }

        for(const account of accounts){
            await fetchAndUpdatePhoneNumbers(account)
            await updateUplineUser(account)
        }
        
        if (accountsNeedToUpdateInfo.length > 0) {
            logger.info(`${accountsNeedToUpdateInfo.length} accounts to be migrated`);
            for (const account of accountsNeedToUpdateInfo) {
                await fetchAndUpdateWabaInfo(account);
            }
            logger.info(`Done account migration`);
        }
    } catch (error) {
        logger.error(error.message)
    }
}