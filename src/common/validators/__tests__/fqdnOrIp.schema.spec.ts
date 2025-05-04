import { fqdnOrIp } from '../fqdnOrIp.schema.js';

describe('fqdnOrIp', () => {
  describe('single', () => {
    it('should not throw when valid IPv4', () => {
      expect.assertions(1);

      const result = fqdnOrIp().safeParse('192.168.1.1');

      expect(result.success).toBe(true);
    });

    it('should not throw when valid IPv6', () => {
      expect.assertions(1);

      const result = fqdnOrIp().safeParse('::ffff:127.0.0.1');

      expect(result.success).toBe(true);
    });

    it('should not throw when valid fqdn', () => {
      expect.assertions(1);

      const result = fqdnOrIp().safeParse('example.com');

      expect(result.success).toBe(true);
    });

    it('should throw error when invalid IPv4', () => {
      expect.assertions(1);

      const result = fqdnOrIp().safeParse('::/128');

      expect(result.success).toBe(false);
    });

    it('should throw error when invalid IPv6', () => {
      expect.assertions(1);

      const result = fqdnOrIp().safeParse('::11111');

      expect(result.success).toBe(false);
    });

    it('should throw error when invalid fqdn', () => {
      expect.assertions(1);

      const result = fqdnOrIp().safeParse('http://example.com');

      expect(result.success).toBe(false);
    });

    it('should throw error when undefined', () => {
      expect.assertions(1);

      const result = fqdnOrIp().safeParse(undefined);

      expect(result.success).toBe(false);
    });

    it('should properly validate IP with valid port', () => {
      expect.assertions(1);

      const result = fqdnOrIp().safeParse('127.0.0.1:3001');

      expect(result.success).toBe(true);
    });

    it('should properly validate fqdn with valid port', () => {
      expect.assertions(1);

      const result = fqdnOrIp().safeParse('example.com:3001');

      expect(result.success).toBe(true);
    });

    it('should return error when IP with invalid port', () => {
      expect.assertions(1);

      const result = fqdnOrIp().safeParse('127.0.0.1:658898');

      expect(result.success).toBe(false);
    });

    it('should return error when fqdn with invalid port', () => {
      expect.assertions(1);

      const result = fqdnOrIp().safeParse('example.com:658898');

      expect(result.success).toBe(false);
    });

    it('should return error when IP with empty port', () => {
      expect.assertions(1);

      const result = fqdnOrIp().safeParse('127.0.0.1:');

      expect(result.success).toBe(false);
    });
  });
});
