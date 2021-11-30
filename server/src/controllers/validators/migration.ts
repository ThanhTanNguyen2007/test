import { Request } from 'express';
import * as z from 'zod';

export const initiatePhoneMigration = (req: Request) => {
    const schema = z.object({
        body: z.object({
            wabaId: z.string(),
            countryCode: z.string().transform((arg) => Number(arg))
                .refine((val) => !isNaN(val), { message: 'Country code should be a number' }),
            phoneNumber: z.string().transform((arg) => Number(arg))
                .refine((val) => !isNaN(val), { message: 'Phone number should be a number' }),
        }),
    });
    return schema.parse(req);
};

export const requestOTP = (req: Request) => {
    const schema = z.object({
        body: z.object({
            codeMethod: z.string(),
            phoneNumberId: z.string(),
        }),
    });
    return schema.parse(req);
};

export const verifyCode = (req: Request) => {
    const schema = z.object({
        body: z.object({
            code: z.string(),
            phoneNumberId: z.string(),
        }),
    });
    return schema.parse(req);
};

export const getWabaIdByPhone = (req: Request) => {
    const schema = z.object({
        query: z.object({
            phone: z.string(),
            email: z.string(),
        }),
    });
    return schema.parse(req);
};