import mapFbTimezoneIdToStandardTimezone, { compareTimezoneNames } from './mapFbTimezoneIdToStandardTimezone';

describe('Test compareTimezoneNames works as expected', () => {
  test('comparison is correct for both true and false', () => {
    expect(compareTimezoneNames('Pacific/Niue', 'TZ_PACIFIC_NIUE')).toEqual(true);
    expect(compareTimezoneNames('America/Santo_Domingo', 'TZ_AMERICA_SANTO_DOMINGO')).toEqual(true);
    expect(compareTimezoneNames('America/Santo_DOmingo', 'TZ_AMERICA_SANTO_DOMINGO')).toEqual(true);
    expect(compareTimezoneNames('America/Santo_DOmingo ', 'TZ_AMERICA_SANTO_DOMINGO')).toEqual(false);
  });
});

describe('Test mapFbTimezoneIdToStandardTimezone works as expected', () => {
  test('comparison is correct for both true and false', () => {
    expect(mapFbTimezoneIdToStandardTimezone('1').tzCode).toEqual('America/Los_Angeles');
    expect(() => mapFbTimezoneIdToStandardTimezone('0').tzCode).toThrowError('No timezone found');
    expect(() => mapFbTimezoneIdToStandardTimezone('9999').tzCode).toThrowError('No timezone found');
  });
});
