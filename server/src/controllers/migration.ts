import { Request, Response } from 'express';
import * as validators from './validators/migration';
import * as services from '../services';
import logger from '../logger';
import { StatusCodes } from 'http-status-codes';
import { ZodError } from 'zod';
import { UploadedFile } from 'express-fileupload';
import { read } from 'xlsx';
import { RequestWithUserInfo } from '../types';
import { getPhoneNumberFromFB, updateOrCreateAPhoneNumber } from '../services/phoneNumber';
import { AuditAction, prisma } from '.prisma/client';

export const initiatePhoneMigration = async (req: Request, res: Response): Promise<void | Response> => {
    try {
        const { body: { countryCode, phoneNumber, wabaId } } = validators.initiatePhoneMigration(req);
        const phoneNumbersFromWaba = await services.phoneNumber.getAllPhoneNumbersOfWaba(undefined, wabaId);
        const existedPhoneNumber = phoneNumbersFromWaba.find(({value}) => value.replace(/\D/g, '').endsWith('' + phoneNumber))
        if(existedPhoneNumber) {
            return res.send({
                phoneNumberId: existedPhoneNumber.phoneNumberId,
                verified: existedPhoneNumber?.codeVerificationStatus === "VERIFIED"
            });
        }
        const phoneNumberId = await services.facebook.phoneMigration.initiatePhoneMigration(countryCode, phoneNumber, wabaId);
        if (!phoneNumberId) {
            return res.status(StatusCodes.BAD_REQUEST).send();
        }
        const phoneNumberFromFb = await getPhoneNumberFromFB(phoneNumberId);
        if (phoneNumberFromFb) {
            const account = await services.account.getAccountByWabaId(wabaId);
            if(!account) logger.error(`Account not found for waba ${wabaId}, skip adding phone number`);
            else {
                logger.info(`Add phone number ${phoneNumberId} to WABA ${wabaId}`)
                await updateOrCreateAPhoneNumber(phoneNumberFromFb, account.id);
            }
        }
        
        await services.audit.insertAudit(AuditAction.PHONE_MIGRATION_INIT, {
            phoneNumberId,
            status: '' + phoneNumberFromFb?.code_verification_status
        });

        return res.send({
            phoneNumberId,
            verified: phoneNumberFromFb?.code_verification_status === "VERIFIED"
        });
    } catch (err) {
        await services.audit.insertAudit(AuditAction.PHONE_MIGRATION_INIT_FAILED, {
            phoneNumber: req.body.phoneNumber,
            error: err.message
        });
        logger.error(err.message);
        if (err instanceof ZodError) {
            return res.status(StatusCodes.BAD_REQUEST).send(err.errors);
        }
        return res.status(StatusCodes.BAD_REQUEST).send();
    }
};

export const requestOTP = async (req: Request, res: Response): Promise<void | Response> => {
    try {
        const { body: { phoneNumberId, codeMethod } } = validators.requestOTP(req);
        const isSuccess = await services.facebook.phoneMigration.requestOTP(codeMethod, phoneNumberId);
        await services.audit.insertAudit(AuditAction.PHONE_MIGRATION_REQUEST_OTP, {
            phoneNumber: req.body.phoneNumber,
            isSuccess: '' + isSuccess
        });
        return res.send(isSuccess);
    } catch (err) {
        await services.audit.insertAudit(AuditAction.PHONE_MIGRATION_REQUEST_OTP_FAILED, {
            phoneNumber: req.body.phoneNumber,
            error: err.message
        });
        logger.error(err.message);
        if (err instanceof ZodError) {
            return res.status(StatusCodes.BAD_REQUEST).send(err.errors);
        }
        return res.status(StatusCodes.BAD_REQUEST).send(err.message);
    }
};

export const verifyCode = async (req: Request, res: Response): Promise<void | Response> => {
    try {
        const { body: { code, phoneNumberId } } = validators.verifyCode(req);
        const isSuccess = await services.facebook.phoneMigration.verifyCode(code, phoneNumberId);
        if(isSuccess) {
            await services.phoneNumber.updateCodeStatus(phoneNumberId)
        }
        await services.audit.insertAudit(AuditAction.PHONE_MIGRATION_VERIFY_OTP, {
            phoneNumber: req.body.phoneNumber,
            isSuccess: '' + isSuccess
        });
        return res.send(isSuccess);
    } catch (err) {
        await services.audit.insertAudit(AuditAction.PHONE_MIGRATION_VERIFY_OTP, {
            phoneNumber: req.body.phoneNumber,
            error: err.message
        });
        logger.error(err.message);
        if (err instanceof ZodError) {
            return res.status(StatusCodes.BAD_REQUEST).send(err.errors);
        }
        return res.status(StatusCodes.BAD_REQUEST).send();
    }
};

export const uploadMigrationList = async (req: RequestWithUserInfo, res: Response): Promise<void | Response> => {
    try {
        if(!req.files) {
            logger.error('No file uploaded');
            return res.status(StatusCodes.BAD_REQUEST).send();
        }

        const migrationListFile: UploadedFile = req.files.migrationList as UploadedFile;
        const wb = read(migrationListFile.data, {type:'buffer'});
        if(!wb) {
            logger.error('Workbook is not valid');
            return res.status(StatusCodes.BAD_REQUEST).send();
        }
        const errorList = await services.migration.importMigrationList(wb);
        return res.send(errorList);
    } catch (err) {
        logger.error(err.message);
        if (err instanceof ZodError) {
            return res.status(StatusCodes.BAD_REQUEST).send(err.errors);
        }
        return res.status(StatusCodes.BAD_REQUEST).send();
    }
}

export const find = async (req: RequestWithUserInfo, res: Response): Promise<void | Response> => {
    try {
        const migrationList = await services.migration.find(req.user.email, req.user.isAdmin);
        return res.send(migrationList);
    } catch (err) {
        logger.error(err.message);
        return res.status(StatusCodes.BAD_REQUEST).send();
    }
}

export const getWabaIdByPhone = async (req: Request, res: Response): Promise<void | Response> => {
    try {
        const {query: {phone, email} } = validators.getWabaIdByPhone(req);
        const wabaId = await services.migration.getWabaIdByPhone(phone, email);
        if(!wabaId) throw new Error(`No WABA id found for phone ${phone}`)
        return res.send(wabaId);
    } catch (err) {
        logger.error(err.message);
        return res.status(StatusCodes.BAD_REQUEST).send();
    }
}