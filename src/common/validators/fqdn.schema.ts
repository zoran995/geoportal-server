import { z } from 'zod';

const hostNameRegex =
  /^(?!-)(?!.*--)(?!.*\.\.)(?!.*\.$)[a-zA-Z0-9-]{1,63}(?<!-)(\.[a-zA-Z0-9-]{1,63})*$/;

export const fqdn = z.string().regex(hostNameRegex);
