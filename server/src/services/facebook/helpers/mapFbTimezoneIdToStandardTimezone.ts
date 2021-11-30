import _ from 'lodash';
import timezoneMapping from '../../../consts/timezoneMapping';
import facebookTimezoneIds from '../../../consts/facebookTimezoneIds';
import logger from '../../../logger';

export const compareTimezoneNames = (standardName: string, facebookName: string) => {
  const normalizedStandardName = standardName
    .replace('/', '_')
    .replace('GMT+', 'GMT_PLUS_')
    .replace('GMT-', 'GMT_MINUS_')
    .toUpperCase();
  const normalizedFacebookName = facebookName.replace(/^TZ_/, '');
  return normalizedStandardName === normalizedFacebookName;
};
const naTimezone = {
  label: 'NA',
  tzCode: 'NA',
  name: 'NA',
  utc: 'NA',
};
const mapFbTimezoneIdToStandardTimezone = (timezoneId: string) => {
  logger.info(`Timezone Id: ${timezoneId}`);
  if (timezoneId === '0') {
    logger.info(`No timezone found for Id: ${timezoneId}`);
    //throw new Error('No timezone found');
    return naTimezone;
  }
  const facebookTimezoneName = _.find(
    facebookTimezoneIds,
    (fbTimezone) => fbTimezone.timezoneId === Number(timezoneId),
  );
  if (!facebookTimezoneName) {
    logger.info(`No timezone name found for Id: ${timezoneId}`);
    //throw new Error('No timezone found');
    return naTimezone;
  }
  const timezoneItem = _.find(timezoneMapping, (zone) =>
    compareTimezoneNames(zone.tzCode, facebookTimezoneName.facebookName),
  );
  if (!timezoneItem) {
    logger.info(`No timezone item found for Id: ${timezoneId}`);
    const normalizedFacebookName = facebookTimezoneName.facebookName.replace(/^TZ_/, '');
    const nameArr = normalizedFacebookName
      .split('_')
      .map((part) => part[0] + part.slice(1).toLocaleLowerCase())
      .join('_');
    const changedFirstUnderscore = nameArr.replace('_', '/');
    const underscoredReplaced = changedFirstUnderscore.replace(/_/g, '');
    const minusReplaced = underscoredReplaced.replace('Minus', '-');
    const plusReplaced = minusReplaced.replace('Plus', '+');

    //throw new Error('No timezone found');
    return {
      label: 'NA',
      tzCode: plusReplaced,
      name: 'NA',
      utc: 'NA',
    };
  }
  return timezoneItem;
};

export default mapFbTimezoneIdToStandardTimezone;
