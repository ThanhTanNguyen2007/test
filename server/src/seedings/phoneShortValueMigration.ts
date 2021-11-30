import { getShortPhoneNumber } from "../services/phoneNumber";
import prisma from "../prisma"
import logger from "../logger";

const migratePhoneShortValue = async () => {
    logger.info('Start migrating short phone number value')
    const phoneNumbers = await prisma.phoneNumber.findMany({
        where: {
            shortenValue: null
        }
    });
    for (const phoneNumber of phoneNumbers) {
        try {
            logger.info(`Migrating phone number ${phoneNumber.value}`)
            await prisma.phoneNumber.update({
                where: {
                    id: phoneNumber.id
                },
                data: {
                    shortenValue: getShortPhoneNumber(phoneNumber.value)
                }
            })
            logger.info(`Updated short phone number ${phoneNumber.shortenValue}`)
        } catch (error) {
            logger.error(error.message)
            continue;
        }
    }

    process.exit();
}

(async () => await migratePhoneShortValue())()