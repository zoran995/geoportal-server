import { processHeaders } from '../processHeaders';

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

  it("don't set duration when undefined", () => {
    const headers = {
      'Proxy-Connection': 'delete me!',
      unfilteredheader: "don't delete me!",
    };

    const result = processHeaders(headers, undefined);
    expect(result['Proxy-Connection']).toBeUndefined();
    expect(result['unfilteredheader']).toBe(headers.unfilteredheader);
    expect(result['Cache-Control']).toBeUndefined();
    expect(result['Access-Control-Allow-Origin']).toBe('*');
  });
});
