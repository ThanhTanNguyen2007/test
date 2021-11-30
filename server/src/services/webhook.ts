import prisma from "../prisma";
import logger from "../logger"
import { fetchAndUpdateWabaInfo } from "./account";
import { fetchAndUpdatePhoneNumbers } from "./phoneNumber";

type WebhookEntry = {
    id: string,
    time: number,
    changes: []
}


export const handleWebhookEvents = async (entries: WebhookEntry[]) => {
    for (const entry of entries) {
        const { id: wabaId, changes } = entry;
        for (const change of changes) {
            const { field, value } = change;
            switch (field) {
                case "phone_number_quality_update":
                    await handlePhoneNumberQualityUpdate(value);
                    break;
                case "phone_number_name_update":
                    await handlePhoneNumberNameUpdate(wabaId);
                    break;
                case "account_review_update":
                case "account_update":
                    await handleAccountStatusUpdate(wabaId);
                    break;
                default:
                    break;
            }
        }
    }
}

const handlePhoneNumberQualityUpdate = async (value: never): Promise<void> => {
    logger.info("Received phone_number_quality_update event");
    const { display_phone_number, event, current_limit } = value;
    logger.info(`Updating phone number ${display_phone_number} with status ${event} and limit ${current_limit}`);
    const phoneNumber = await prisma.phoneNumber.findFirst({
        where: {
            OR: [
                {shortenValue: display_phone_number},
                {value: display_phone_number}
            ]
            
        }
    });
    if(!phoneNumber) {
        logger.error(`Cannot find phone number with value ${display_phone_number}`);
        return;
    }

    await prisma.phoneNumber.update({
        where: {
            id: phoneNumber.id,
        },
        data: {
            status: event,
            limit: current_limit
        }
    });
}

const handlePhoneNumberNameUpdate = async (wabaId: string): Promise<void> => {
    logger.info("Received phone_number_name_update event");
    // Name status update -> cert update, need to fetch cert again
    try {
        const account = await prisma.account.findFirst({
            where: {
                wabaId
            },
            include: {
                phoneNumber: true,
            }
        });
        if (!account) {
            logger.error(`Couldnt find WABA with id ${wabaId}`);
            return;
        }
        await fetchAndUpdatePhoneNumbers(account)
    } catch (error) {
        logger.error(error.message);
        return;
    }
}

const handleAccountStatusUpdate = async (wabaId: string): Promise<void> => {
    try {
        logger.info("Received account_update event");
        const account = await prisma.account.findFirst({
            where: {
                wabaId
            },
            include: {
                phoneNumber: true,
            }
        });
        if (!account) {
            logger.error(`Couldnt find WABA with id ${wabaId}`);
            return;
        }
        await fetchAndUpdateWabaInfo(account)
        await fetchAndUpdatePhoneNumbers(account)
        logger.info(`Updated waba info with id ${wabaId}`);
    } catch (error) {
        logger.error(error.message);
        return;
    }
}
