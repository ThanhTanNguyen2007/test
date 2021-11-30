import redis, { RedisClient } from 'redis';
import logger from './logger';
import { promisify } from 'util';
import config from './config';

export const client = redis.createClient({
  url: config.REDIS_SERVER_URL,
});

client.on('error', (err) => {
  logger.error(err);
});

export const setCache = (key: string, value: unknown, expire: number | null = null) => {
  // Expired in 3 months
  const expiredTime: number = expire ? expire : 60 * 60 * 24 * 31 * 3; // seconds * minutes * hours * days * months

  try {
    if (typeof value === 'string') {
      client.setex(key, expiredTime, value, redis.print);
    } else {
      client.setex(key, expiredTime, JSON.stringify(value), redis.print);
    }
  } catch (error) {
    logger.error(`Cannot set cache value for key ${key}`);
  }
};

const get = promisify(client.get).bind(client);

const keys = promisify(client.keys).bind(client);

export const getCache = async (key: string) => {
  client.get(key, (err, reply) => {
    if (err) {
      logger.error(err.message);
    }
    return reply;
  });

  try {
    const cachedValue = await get(key);
    return cachedValue && JSON.parse(cachedValue);
  } catch (error) {
    logger.error(`Cannot parse cached value for key ${key}, return raw`);
    return null;
  }
};

export const getAllKeys = async (key: string) => {
  try {
    const cachedKeys = await keys(key);
    return cachedKeys;
  } catch (error) {
    logger.error(`Cannot parse cached value for key ${key}, return raw`);
    return null;
  }
};

export const deleteCache = (key: string) => {
  client.del(key, (err, reply) => {
    if (err) {
      logger.error(err);
      return false;
    }
    return reply !== 0;
  });
};
