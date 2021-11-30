import { Account } from '@prisma/client';
import { getShortPhoneNumber } from '../services/phoneNumber';
import prisma from '../prisma';
import { getPhoneNumbers } from '../services/facebook/api'
import logger from '../logger';

const doWabaMigration = async () => {
    try {
        const accounts = await prisma.account.findMany();
        if (accounts.length == 0) {
            logger.info('No accounts to migrate');
            return;
        }

        for (const account of accounts) {
            await fetchAndUpdatePhoneNumbers(account)
        }
    } catch (error) {
        logger.error(error.message)
    }
    process.exit();
}

const oneDayBefore = new Date(new Date().getTime() - (24 * 60 * 60 * 1000));

const fetchAndUpdatePhoneNumbers = async (account: Account) => {
    try {
        logger.info(`Migrating Phonenumbers for WABA ${account.name}`);
        const phoneNumbers = await getPhoneNumbers(account.wabaId);
        for (const phoneNumber of phoneNumbers) {
            logger.info(`Updating phone number name: ${phoneNumber.verified_name} | value: ${phoneNumber.display_phone_number}`)
            const phoneNumberFromDb = await prisma.phoneNumber.findFirst({
                where: {
                    value: phoneNumber.display_phone_number,
                    updatedAt: {
                        lte: oneDayBefore
                    },
                },
            });

            if (!phoneNumberFromDb) {
                logger.info('Already updated recently')
                continue;
            }
            await prisma.phoneNumber.update({
                where: {
                    value: phoneNumber.display_phone_number,
                },
                data: {
                    certLastCheckedAt: new Date(),
                    certAvailableAt: phoneNumber.certificate ? new Date() : null,
                    qualityRating: phoneNumber.quality_rating,
                    nameStatus: phoneNumber.name_status,
                    verifiedName: phoneNumber.verified_name,
                    status: phoneNumber.status,
                    phoneNumberId: phoneNumber.id,
                    shortenValue: getShortPhoneNumber(phoneNumber.display_phone_number),
                    codeVerificationStatus: phoneNumber.code_verification_status,
                }
            })
            logger.info(`Updated phone number name: ${phoneNumber.verified_name}`)
        }
    } catch (error) {
        logger.error(`Failed migrating Phonenumbers for WABA ${account.name} with error ${error.message}`);
        return;
    }
}

(async () => await doWabaMigration())()