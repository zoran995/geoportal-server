export const PROXY_OPTIONS = Symbol('PROXY_OPTIONS');
export const DURATION_REGEX = /^(\d+|\d+\.\d+)(ms|s|m|h|d|w|y)$/;
export const PROTOCOL_REGEX = /^\w+:\//;
export const DO_NOT_PROXY_REGEX =
  /^(?:Host|X-Forwarded-Host|Proxy-Connection|Connection|Keep-Alive|Transfer-Encoding|TE|Trailer|Proxy-Authorization|Proxy-Authenticate|Upgrade|Expires|pragma|Strict-Transport-Security|Content-Length|content-encoding)$/i;
export const DEFAULT_MAX_AGE_SECONDS = 1209600;
export const DEFAULT_MAX_SIZE = 102400;

export const DURATION_UNITS: Record<string, number> = {
  ms: 1.0 / 1000,
  s: 1.0,
  m: 60.0,
  h: 60.0 * 60.0,
  d: 24.0 * 60.0 * 60.0,
  w: 7.0 * 24.0 * 60.0 * 60.0,
  y: 365 * 24.0 * 60.0 * 60.0,
};

export const DEFAULT_BLACKLIST = [
  // loopback addresses
  '127.0.0.0/8',
  '::1/128',
  // link local addresses
  '169.254.0.0/16',
  'fe80::/10',
  // private network addresses
  '10.0.0.0/8',
  '172.16.0.0/12',
  '192.168.0.0/16',
  'fc00::/7',
  // other
  '0.0.0.0/8',
  '100.64.0.0/10',
  '192.0.0.0/24',
  '192.0.2.0/24',
  '198.18.0.0/15',
  '192.88.99.0/24',
  '198.51.100.0/24',
  '203.0.113.0/24',
  '224.0.0.0/4',
  '240.0.0.0/4',
  '255.255.255.255/32',
  '::/128',
  '2001:db8::/32',
  'ff00::/8',
];
