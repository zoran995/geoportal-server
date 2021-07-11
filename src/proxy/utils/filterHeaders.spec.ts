import { filterHeaders } from './filterHeaders';

describe('proxy filterHeaders', () => {
  it('properly filters', () => {
    const headers = {
      'Proxy-Connection': 'delete me!',
      unfilteredheader: "don't delete me!",
    };

    const filteredHeaders = filterHeaders(headers);
    expect(filteredHeaders['Proxy-Connection']).toBeUndefined();
    expect(filteredHeaders['unfilteredheader']).toBe(headers.unfilteredheader);
  });
});
