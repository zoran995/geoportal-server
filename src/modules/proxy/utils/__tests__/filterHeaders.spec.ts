import { filterHeaders } from '../filterHeaders.js';

describe('proxy filterHeaders', () => {
  const headers: Record<string, string> = {
    'Proxy-Connection': 'delete me!',
    unfilteredheader: "don't delete me!",
  };
  it('properly filters', () => {
    const headers = {
      'Proxy-Connection': 'delete me!',
      unfilteredheader: "don't delete me!",
    };

    const filteredHeaders = filterHeaders(headers);
    expect(filteredHeaders['Proxy-Connection']).toBeUndefined();
    expect(filteredHeaders['unfilteredheader']).toBe(headers.unfilteredheader);
  });

  it('properly filters when socket defined', () => {
    const socket = { remoteAddress: 'test' };
    const filteredHeaders = filterHeaders(headers, <never>socket);
    expect(filteredHeaders['x-forwarded-for']).toBe(socket.remoteAddress);
  });

  it('properly combines x-forwarded-for header with socket remote address', () => {
    const socket = { remoteAddress: 'test' };
    headers['x-forwarded-for'] = 'x-forwarded-for';
    const filteredHeaders = filterHeaders(headers, <never>socket);
    expect(filteredHeaders['x-forwarded-for']).toBe(
      `${headers['x-forwarded-for']}, ${socket.remoteAddress}`,
    );
  });
});
