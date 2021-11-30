import { PrismaClient } from '@prisma/client';
import logger from './logger';
const prisma = new PrismaClient();

const testConnection = async () => {
  try {
    await prisma.$connect();
    await prisma.$disconnect();
    logger.info('DB connection available');
  } catch (err) {
    logger.info('DB connection not available');
    throw err;
  }
};

testConnection();

export default prisma;
