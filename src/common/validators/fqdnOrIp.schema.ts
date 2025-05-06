import { z } from 'zod';

import { portSchema } from './port.schema.js';
import { fqdn } from './fqdn.schema.js';

const ipWithPort = (ipVersion?: 'v4' | 'v6') => {
  return z.custom<string>(
    (val?: string) => {
      const split = val?.split(':');
      if (split?.length !== 2) {
        return false;
      }
      const port = split[1];
      if (port === '' || !portSchema.safeParse(port).success) {
        return false;
      }

      const ip = split[0];
      return (
        z.string().ip(ipVersion).safeParse(ip).success ||
        fqdn.safeParse(ip).success
      );
    },
    { fatal: false },
  );
};

export const fqdnOrIp = (ipVersion?: 'v4' | 'v6') =>
  z.union([fqdn, ipWithPort(ipVersion), z.string().ip(ipVersion)], {
    message: 'Property must be an IP address or fqdn',
  });
