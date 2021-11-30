import { findOrCreateUserByEmail } from '../services/user';
import partnerWithWabaIds from '../manualWABA.json';
import prisma from '../prisma';
import logger from '../logger';
import { getWabaInfo } from '../services/facebook/api';
import { audit } from '../services';
import { AuditAction, CreditLineState } from '.prisma/client';
import * as api from '../services/facebook/api'
import mapFbTimezoneIdToStandardTimezone from '../services/facebook/helpers/mapFbTimezoneIdToStandardTimezone';
import { addPhoneNumbersForWabas } from '../services/facebook/connectWabaToKeyReply';
import { shareCreditLine } from '../services/facebook';

const compareDates = (date1: Date, date2: Date): boolean => {
    return Math.round(+date1 / 1000) === Math.round(+date2 / 1000);
}

async function doManualWABAMigration() {
    try {
        const { partnerEmail, wabaIds } = partnerWithWabaIds;
        if(!partnerEmail || partnerEmail === '' || !wabaIds || wabaIds.length === 0) {
            logger.info(`Empty migration data, skip migration`);
        }
        const assignedUser = await findOrCreateUserByEmail(partnerEmail);
        for (let i = 0; i < wabaIds.length; i++) {
            const wabaId = wabaIds[i];
            try {
                const existedWABA = await prisma.account.findFirst({
                    where: {
                        wabaId
                    }
                });
                if (existedWABA) {
                    logger.info(`WABA: ${wabaId} is existed, skip migration`)
                    continue;
                }
                logger.info(`Trying to get WABA: ${wabaId}`)
                const waba = await getWabaInfo(wabaId);
                // First step to ensure that all accounts in our db have a system user
                const { name, currency, timezone_id, account_review_status: status, owner_business_info: { id: businessId, name: businessName } } = waba;
                await audit.insertAudit(AuditAction.WABA_CONNECTION_REQUEST, {
                    wabaId: waba.id,
                    name,
                });
                await api.addSystemUserToWaba(waba.id);
                logger.info(`Inserting account: |WABA-${waba.id}|Name=${name}|`)
                const account = await prisma.account.upsert({
                    where: { wabaId: waba.id },
                    create: {
                        timezone: mapFbTimezoneIdToStandardTimezone(timezone_id).tzCode,
                        wabaId: waba.id,
                        userId: assignedUser.id,
                        name,
                        businessId,
                        businessName,
                        currency,
                        status,
                    },
                    update: {},
                });
                const wasCreated = compareDates(account.createdAt, account.updatedAt);

                if (!wasCreated) {
                    continue;
                }

                await audit.insertAudit(AuditAction.WABA_CONNECTED, {
                    wabaId: waba.id,
                    name: waba.name,
                });

                // Share credit line
                const creditLineAllocationConfigId = await shareCreditLine(waba.id);

                await prisma.manager.upsert({
                    where: { accountId: account.id },
                    update: {},
                    create: { state: 'IN_PROGRESS', accountId: account.id, partnerId: null, partnerTokenId: null, creditLineAllocationConfigId, creditLineState: CreditLineState.SHARED },
                });

                await api.subscribeToWebhookForWaba(waba.id);
            } catch (error) {
                logger.info(error.response.data || error.message);
            }
        }
        const allAccounts = await prisma.account.findMany({
            where: { wabaId: { in: wabaIds } },
            include: { manager: { include: { partner: true } } },
        });
        await addPhoneNumbersForWabas(wabaIds, allAccounts);
        logger.info(`Migrated phone numbers`)
    } catch (error) {
        logger.error(error.response?.data?.error || error.message)
    }

    process.exit();
}

(async () => await doManualWABAMigration())()