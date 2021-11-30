import createGraphUrl from './createGraphUrl';

describe('Test createGraphUrl works as expected', () => {
  test('Graph url with path', () => {
    const url = createGraphUrl('debug_token');
    const expected = 'https://graph.facebook.com/v8.0/debug_token?access_token';
    expect(url.toString().startsWith(expected)).toEqual(true);
  });
  test('Graph url with added search params', () => {
    const url = createGraphUrl('debug_token');
    url.searchParams.set('test', 'test');
    const expected = 'https://graph.facebook.com/v8.0/debug_token?access_token';
    expect(url.toString().startsWith(expected)).toEqual(true);
    expect(url.toString().endsWith('&test=test')).toEqual(true);
  });
});
