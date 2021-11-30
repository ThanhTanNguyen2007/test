import { AuditAction } from "@prisma/client";
import prisma from '../prisma';
import logger from '../logger';

export const insertAudit = async(action: AuditAction, payload: string | Record<string, string>) => {
    try {
        const audit = await prisma.audit.create({
            data: {
                action,
                payload: typeof payload === "string" ? payload : JSON.stringify(payload)
            }
        });
        return audit;
    } catch (error) {
        logger.error(error.message);
        return null;
    }
};

export const getAudits = async (start: string, end: string) => {
    try {
        const startDate = start ? new Date(+start) : new Date();
        const endDate = end ? new Date(+end) : new Date();
        startDate.setHours(0,0,0,0);
        endDate.setHours(23,59,59,999);
        const audits = await prisma.audit.findMany({
            where: {
                timestamp: {
                    gte: startDate,
                    lt: endDate
                }
            },
            orderBy: [
                {
                    timestamp: 'desc'
                }
            ]
        });
        return audits;
    } catch (error) {
        logger.error(error.message);
        throw error;
    }
}

