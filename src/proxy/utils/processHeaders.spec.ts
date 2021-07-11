import { DEFAULT_MAX_AGE_SECONDS } from '../proxy.constants';
import { processHeaders } from './processHeaders';

describe('proxy processHeaders', () => {
  it('properly set headers', () => {
    const headers = {
      'Proxy-Connection': 'delete me!',
      unfilteredheader: "don't delete me!",
    };

    const result = processHeaders(headers, 1200);
    expect(result['Proxy-Connection']).toBeUndefined();
    expect(result['unfilteredheader']).toBe(headers.unfilteredheader);
    expect(result['Cache-Control']).toBe('public,max-age=1200');
    expect(result['Access-Control-Allow-Origin']).toBe('*');
  });

  it('properly set default max age', () => {
    const headers = {
      'Proxy-Connection': 'delete me!',
      unfilteredheader: "don't delete me!",
    };

    const result = processHeaders(headers);
    expect(result['Proxy-Connection']).toBeUndefined();
    expect(result['unfilteredheader']).toBe(headers.unfilteredheader);
    expect(result['Cache-Control']).toBe(
      `public,max-age=${DEFAULT_MAX_AGE_SECONDS}`,
    );
    expect(result['Access-Control-Allow-Origin']).toBe('*');
  });
});
