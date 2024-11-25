import { urlValidator } from '../urlValidator';

describe('proxy urlValidator', () => {
  it('return true on http url', () => {
    const result = urlValidator('http://example.com');
    expect(result).toBe(true);
  });

  it('return true on https url', () => {
    const result = urlValidator('https://example.com');
    expect(result).toBe(true);
  });

  it('fails on wrong protocol', () => {
    const result = urlValidator('ftp://example.com.');
    expect(result).toBe(false);
  });

  it('fails on missing domain', () => {
    const result = urlValidator('http://example');

    expect(result).toBe(false);
  });
});
