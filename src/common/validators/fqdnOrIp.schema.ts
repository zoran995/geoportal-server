import { z } from 'zod';

import { portSchema } from './port.schema';

const hostNameRegex =
  /^(?!-)(?!.*--)(?!.*\.\.)(?!.*\.$)[a-zA-Z0-9-]{1,63}(?<!-)(\.[a-zA-Z0-9-]{1,63})*$/;

const ipWithPort = (ipVersion?: 'v4' | 'v6') => {
  return z.custom<string>(
    (val: string) => {
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
        z.string().regex(hostNameRegex).safeParse(ip).success
      );
    },
    { fatal: false },
  );
};

export const fqdnOrIp = (ipVersion?: 'v4' | 'v6') =>
  z.union(
    [
      z.string().regex(hostNameRegex),
      ipWithPort(ipVersion),
      z.string().ip(ipVersion),
    ],
    {
      message: 'Property must be an IP address or fqdn',
    },
  );
