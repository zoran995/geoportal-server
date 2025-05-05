import { combineURLs } from '../combineURLs.js';

describe('combineUrls', () => {
  const url = 'http://test.com/';

  it('properly combines', () => {
    const id = 'test';
    expect(combineURLs(url, id)).toBe(`${url}${id}`);
  });

  it('properly joins with multiple slashes', () => {
    const id = 'test';
    expect(combineURLs(`${url}//`, `//${id}`)).toBe(`${url}${id}`);
  });

  it('returns base url', () => {
    expect(combineURLs(url)).toBe(url);
  });
});
