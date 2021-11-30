import dotenv from 'dotenv';
dotenv.config();

const parseString = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`${key} is not present`);
  }
  return value;
};

const parseNumber = (key: string): number => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`${key} is not present`);
  }
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    throw new Error(`${key} should be a number`);
  }
  return parsed;
};

const parseBoolean = (key: string): boolean => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`${key} is not present`);
  }
  if (value === 'TRUE' || value === 'true') {
    return true;
  } else if (value === 'FALSE' || value === 'false') {
    return false;
  }
  throw new Error(`${key} should be TRUE or true or FALSE or false`);
};

export default {
  AUTH0_CALLBACK_URL: parseString('AUTH0_CALLBACK_URL'),
  AUTH0_CLIENT_ID: parseString('AUTH0_CLIENT_ID'),
  AUTH0_CLIENT_SECRET: parseString('AUTH0_CLIENT_SECRET'),
  AUTH0_DOMAIN: parseString('AUTH0_DOMAIN'),
  FACEBOOK_ADMIN_SYSTEM_USER_ACCESS_TOKEN: parseString('FACEBOOK_ADMIN_SYSTEM_USER_ACCESS_TOKEN'),
  FACEBOOK_GRAPH_BASE_URL: parseString('FACEBOOK_GRAPH_BASE_URL'),
  FACEBOOK_KEYREPLY_BUSINESS_ID: parseString('FACEBOOK_KEYREPLY_BUSINESS_ID'),
  FACEBOOK_SYSTEM_USER_ACCESS_TOKEN: parseString('FACEBOOK_SYSTEM_USER_ACCESS_TOKEN'),
  FACEBOOK_SYSTEM_USER_ID: parseString('FACEBOOK_SYSTEM_USER_ID'),
  NODE_ENV: parseString('NODE_ENV'),
  PARTNER_TOKEN_DURATION_SECONDS: parseNumber('PARTNER_TOKEN_DURATION_SECONDS'),
  POSTGRES_DATABASE_URL: parseString('POSTGRES_DATABASE_URL'),
  SERVER_PORT: parseString('SERVER_PORT'),
  SERVER_URL: parseString('SERVER_URL'),
  SESSION_DURATION_MINUTES: parseNumber('SESSION_DURATION_MINUTES'),
  STATIC_DIR: parseString('STATIC_DIR'),
  CLIENT_URL: parseString('CLIENT_URL'),
  BASE_URL: parseString('BASE_URL'),
  FACEBOOK_WEBHOOK_VERIFY_TOKEN: parseString('FACEBOOK_WEBHOOK_VERIFY_TOKEN'),
  LONG_MIGRATION: parseBoolean('LONG_MIGRATION'),  
  KEYREPLY_DARK_WHATSAPP_TOKEN: parseString('KEYREPLY_DARK_WHATSAPP_TOKEN'),
  REDIS_SERVER_URL: parseString('REDIS_SERVER_URL'),
  CERT_PATH: parseString('CERT_PATH'),
  KEY_PATH: parseString('KEY_PATH'),
};
