import { PhoneNumber } from '@prisma/client';
import { findAccounts } from '../account';
import * as api from './api';
import logger from '../../logger';
import * as analyticCacheManager from '../../cacheManager';

type CachedValue = {
  sent: number;
  start: number;
  delivered: number;
  lastFetchTime: number;
};

type analytic = {
  wabaId: string;
  phoneNumbers: PhoneNumber[];
  email: string;
  sentMessagesCount: number;
  deliveredMessagesCount: number;
  wabaName: string | null;
  fetchedTime: Date;
  dividedMessagesEachDates: {
    date: number;
    sent: number;
    delivered: number;
  }[];
};

type analyticsChart = {
  date: number;
  sent: number;
  delivered: number;
};

const getWabaAnalytics = async (
  start?: string,
  end?: string,
  userId?: number,
  filterWabaId?: string,
  filterPhoneNumber?: string,
  page = 1,
  size = 10,
) => {
  const {
    accounts,
    total,
    page: currentPage,
    size: currentSize,
  } = await findAccounts(userId, true, page, size, '', filterWabaId, filterPhoneNumber);
  const analytics = [];

  const presentDate = new Date();
  presentDate.setHours(23, 59, 59, 999);

  for (let index = 0; index < accounts.length; index++) {
    const account = accounts[index];
    const {
      wabaId,
      phoneNumber,
      user: { email },
      name,
    } = account;

    let phoneNumberShortenValue: string | null = '';
    if (filterPhoneNumber && phoneNumber.length > 0) {
      phoneNumberShortenValue = phoneNumber[0].shortenValue;
    }

    const startDate = start ? new Date(+start) : new Date();
    startDate.setHours(0, 0, 0, 0);
    const endDate = end ? new Date(+end) : new Date();
    endDate.setHours(23, 59, 59, 999);
    const isTodayIncluded = endDate.toDateString() === presentDate.toDateString();

    const analytic: analytic = {
      wabaId,
      phoneNumbers: phoneNumber,
      email,
      sentMessagesCount: 0,
      deliveredMessagesCount: 0,
      wabaName: name,
      fetchedTime: new Date(),
      dividedMessagesEachDates: initialAnaChartData(start, end),
    };
    let needToFetch = true;
    let startDateToFetch = null,
      endDateToFetch = null;
    const cachedData = new Map<string, CachedValue>();

    while (startDateToFetch === null || endDateToFetch === null) {
      if (startDateToFetch === null) {
        const startCacheKey = exposeKey(wabaId, phoneNumberShortenValue, startDate);
        const startDataPoint: CachedValue = await analyticCacheManager.getCache(startCacheKey);
        if (!startDataPoint) {
          startDateToFetch = startDate;
        } else {
          cachedData.set(startCacheKey, startDataPoint);
          startDate.setDate(startDate.getDate() + 1);
        }
      }
      if (endDateToFetch === null) {
        const endCacheKey = exposeKey(wabaId, phoneNumberShortenValue, endDate);
        const endDataPoint: CachedValue = await analyticCacheManager.getCache(endCacheKey);
        if (!endDataPoint) {
          endDateToFetch = endDate;
        } else {
          cachedData.set(endCacheKey, endDataPoint);
          endDate.setDate(endDate.getDate() - 1);
        }
      }
      if (startDate > endDate) {
        needToFetch = false;
        break;
      }
    }

    if (isTodayIncluded && (!endDateToFetch || presentDate.toDateString() !== endDateToFetch.toDateString())) {
      const todayCacheKey = exposeKey(wabaId, phoneNumberShortenValue, presentDate);
      const todayCache = cachedData.get(todayCacheKey);
      if (!todayCache || new Date().getTime() - todayCache.lastFetchTime > 30 * 60 * 1000) {
        await fetchAndAddToCache(wabaId, phoneNumberShortenValue, new Date(), new Date(), cachedData);
      }
    }

    if (needToFetch && startDateToFetch && endDateToFetch) {
      await fetchAndAddToCache(wabaId, phoneNumberShortenValue, startDateToFetch, endDateToFetch, cachedData);
    }

    for (const { sent, delivered, start } of cachedData.values()) {
      analytic.sentMessagesCount += sent;
      analytic.deliveredMessagesCount += delivered;

      addToAnaChart(analytic, start * 1000, sent, delivered);
    }
    analytics.push(analytic);
  }
  return {
    analytics,
    currentPage,
    currentSize,
    total,
  };
};

const initialAnaChartData = (start?: string, end?: string): analyticsChart[] => {
  const startDate = start ? new Date(+start) : new Date();
  startDate.setHours(0, 0, 0, 0);

  const endDate = end ? new Date(+end) : new Date();
  endDate.setHours(0, 0, 0, 0);

  const arr: analyticsChart[] = [];
  while (startDate.getTime() <= endDate.getTime()) {
    arr.push({
      date: startDate.getTime(),
      sent: 0,
      delivered: 0,
    });
    startDate.setDate(startDate.getDate() + 1);
  }
  return arr;
};

const addToAnaChart = (analytic: analytic, dateTime: number, sent = 0, delivered = 0) => {
  const date = new Date(dateTime);
  date.setHours(0, 0, 0, 0);

  const found = analytic.dividedMessagesEachDates.some((el) => el.date === date.getTime());
  if (!found) {
    analytic.dividedMessagesEachDates.push({ date: date.getTime(), sent, delivered });
  } else
    analytic.dividedMessagesEachDates.forEach((el) => {
      if (el.date === date.getTime()) {
        el.sent += sent;
        el.delivered += delivered;
      }
    });

  analytic.dividedMessagesEachDates.sort((a, b) => (a.date > b.date ? 1 : -1));
};

const fetchAndAddToCache = async (
  wabaId: string,
  phoneNumberShortenValue: string | null,
  startDateToFetch: Date,
  endDateToFetch: Date,
  cachedData: Map<string, CachedValue>,
) => {
  startDateToFetch.setHours(0, 0, 0, 0);
  endDateToFetch.setHours(23, 59, 59, 999);

  const anaData = await api.getWabaAnalytics(
    wabaId,
    phoneNumberShortenValue ? phoneNumberShortenValue : null,
    Math.round(startDateToFetch.getTime() / 1000),
    Math.round(endDateToFetch.getTime() / 1000),
  );
  if (!anaData) {
    logger.info(`Cannot fetch ${wabaId} analytics, skip`);
  } else {
    logger.info(`----${wabaId} analytics:`);
    const dataPoints = anaData?.analytics?.data_points;
    if (dataPoints) {
    }
    dataPoints &&
      dataPoints.forEach(({ sent, delivered, start }) => {
        const cacheKey = exposeKey(wabaId, phoneNumberShortenValue, new Date(start * 1000));
        const cacheData = { sent, delivered, start, lastFetchTime: new Date().getTime() };
        analyticCacheManager.setCache(cacheKey, cacheData);
        cachedData.set(cacheKey, cacheData);
      });
  }
};

// expose key to "analytics:wabaId:year_month_day"
// or expose key to "analytics:wabaId:phone_number:year_month_day"
const exposeKey = (wabaId: string, phoneNumberShortenValue: string | null, currentDate: Date): string => {
  const year = currentDate.getFullYear();
  const month =
    (currentDate.getMonth() + 1).toString().length > 1
      ? currentDate.getMonth() + 1
      : '0' + (currentDate.getMonth() + 1);
  const day = currentDate.getDate().toString().length > 1 ? currentDate.getDate() : '0' + currentDate.getDate();

  return `analytics:${wabaId}${phoneNumberShortenValue ? `:${phoneNumberShortenValue}` : ''}:${year}_${month}_${day}`;
};

export default getWabaAnalytics;
