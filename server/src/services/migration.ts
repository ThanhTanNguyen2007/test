import { AuditAction, CreditLineState, WABAMigration } from '@prisma/client';
import prisma from '../prisma';
import { utils, WorkBook } from 'xlsx';
import logger from '../logger';
import * as apis from './facebook/api'
import { audit } from '.';
import mapFbTimezoneIdToStandardTimezone from './facebook/helpers/mapFbTimezoneIdToStandardTimezone';
import { shareCreditLine } from './facebook';
import config from '../config';
import { findOrCreateUserByEmail } from './user';

export const importMigrationList = async (wb: WorkBook): Promise<string[]> => {
    const errorList: string[] = [];
    const migrations: string[][] = utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1 });
    // Remove headers
    migrations.shift()
    for (const migration of migrations) {
        try {
            if (migration.length === 0) continue;
            const partner = await prisma.partner.findFirst({
                where: {
                    id: +migration[1],
                },
                include: {
                    user: {
                        select: {
                            email: true,
                            id: true
                        }
                    }
                }
            });

            if (!partner) {
                const message = `Partner with id ${migration[1]} is not existed`;
                logger.error(message)
                errorList.push(message)
                continue;
            }
            logger.info(`Importing to migration list WABA ${migration[4]}`)

            let owner = null;

            if(migration[0] && migration[0] !== '') {
                owner = await findOrCreateUserByEmail(migration[0], partner?.id); 
            } else {
                logger.info(`No owner email found, use partner email instead`)
                owner = partner.user;
            }

            const newWABAId = migration[4];

            if (!newWABAId || newWABAId === '') {
                const message = `New WABA Id for phone number ${migration[7]} is empty`
                logger.error(message)
                errorList.push(message)
                continue;
            }

            const waba = await apis.getWabaInfo(newWABAId)

            const { name, currency, timezone_id, account_review_status: status, owner_business_info: { id: businessId, name: businessName } } = waba;
            await audit.insertAudit(AuditAction.WABA_CONNECTION_REQUEST, {
                wabaId: waba.id,
                name,
            });
            await apis.addSystemUserToWaba(waba.id);
            logger.info(`Inserting account: |WABA-${waba.id}|Name=${name}|`)
            const account = await prisma.account.upsert({
                where: { wabaId: waba.id },
                create: {
                    timezone: mapFbTimezoneIdToStandardTimezone(timezone_id).tzCode,
                    wabaId: waba.id,
                    userId: owner.id,
                    name,
                    businessId,
                    businessName,
                    currency,
                    status,
                },
                update: {
                    timezone: mapFbTimezoneIdToStandardTimezone(timezone_id).tzCode,
                    userId: owner.id,
                    name,
                    businessId,
                    businessName,
                    currency,
                    status,
                },
            });

            if (!account) {
                logger.error(`Failed to connect WABA to WA-portal for WABA ${newWABAId}`)
                continue;
            }

            await audit.insertAudit(AuditAction.WABA_CONNECTED, {
                wabaId: waba.id,
                name: waba.name,
            });

            let creditLineAllocationConfigId = null;

            if(config.FACEBOOK_KEYREPLY_BUSINESS_ID !== account.businessId) {
                // Share credit line
                creditLineAllocationConfigId = await shareCreditLine(waba.id);
            }
            

            await prisma.manager.upsert({
                where: { accountId: account.id },
                update: {},
                create: { state: 'IN_PROGRESS', accountId: account.id, partnerId: migration[0] ? partner.id : null, partnerTokenId: null, creditLineAllocationConfigId, creditLineState: creditLineAllocationConfigId ? CreditLineState.SHARED : CreditLineState.NONE },
            });

            await apis.subscribeToWebhookForWaba(waba.id);

            let phoneNumbersStr = migration[7] || '';
            phoneNumbersStr = phoneNumbersStr.replace("'", '');
            const phoneNumbers: string[] = phoneNumbersStr.split(',');

            const newMigration = await prisma.wABAMigration.upsert({
                where: {
                    newWABAId,
                },
                update: {
                    ownerEmail: owner.email,
                    partnerEmail: partner.user.email,
                    existingWABAId: migration[2],
                    existingWABAName: migration[3],
                    newWABAName: account.name || migration[5],
                    businessManagerId: account.businessId || migration[6],
                    phoneNumbers,
                    businessVerificationStatus: migration[8],
                    WABAReviewStatus: account.status,
                    twoFADisabled: checkInputValueIsYes(migration[10]),
                    krWABACreated: !!account,
                    clientConfirm: checkInputValueIsYes(migration[12]),
                    readyForMigration: checkInputValueIsYes(migration[13]),
                    migrationInitiated: checkInputValueIsYes(migration[14]),
                    migrationConfirmed: checkInputValueIsYes(migration[15]),
                },
                create: {
                    ownerEmail: owner.email,
                    partnerEmail: partner.user.email,
                    existingWABAId: migration[2],
                    existingWABAName: migration[3],
                    newWABAId,
                    newWABAName: account.name || migration[5],
                    businessManagerId: account.businessId || migration[6],
                    phoneNumbers,
                    businessVerificationStatus: migration[8],
                    WABAReviewStatus: account.status,
                    twoFADisabled: checkInputValueIsYes(migration[10]),
                    krWABACreated: !!account,
                    clientConfirm: checkInputValueIsYes(migration[12]),
                    readyForMigration: checkInputValueIsYes(migration[13]),
                    migrationInitiated: checkInputValueIsYes(migration[14]),
                    migrationConfirmed: checkInputValueIsYes(migration[15]),
                }
            });

            if (!newMigration) {
                logger.error(`Failed to import migration with WABA ${migration[4]}`)
            } else {
                logger.info(`Successfully imported migration with WABA ${migration[4]}`)
            }
        } catch (error) {
            logger.error(error.message);
            continue;
        }
    }
    return errorList;
}

const checkInputValueIsYes = (input: string | undefined): boolean => {
    return input?.toLowerCase() === 'yes';
}

export const find = async (email: string, isAdmin: boolean): Promise<WABAMigration[]> => {
    const migrations = await prisma.wABAMigration.findMany({
        where: {
            ...(!isAdmin && { partnerEmail: email })
        }
    });

    return migrations;
}

export const getWabaIdByPhone = async (phone: string, email: string): Promise<string | undefined> => {
    const wabaMigrations = await prisma.wABAMigration.findMany({
        where: {
            partnerEmail: email,
        }
    });

    const wabaMigration = wabaMigrations.find(({phoneNumbers}) => {
        // Due to lack of time, we do not support same number with different country code
        const selectedPhoneNumber = phoneNumbers.find((phoneNumber) => phoneNumber.replace(/\D/g, '').endsWith(phone))
        return !!selectedPhoneNumber;
    });

    return wabaMigration?.newWABAId;
}