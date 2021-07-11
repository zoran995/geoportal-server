export const DURATION_REGEX = /^(\d+|\d+\.\d+)(ms|s|m|h|d|w|y)$/;
export const PROTOCOL_REGEX = /^\w+:\//;
export const DO_NOT_PROXY_REGEX =
  /^(?:Host|X-Forwarded-Host|Proxy-Connection|Connection|Keep-Alive|Transfer-Encoding|TE|Trailer|Proxy-Authorization|Proxy-Authenticate|Upgrade|Expires|pragma|Strict-Transport-Security)$/i;
export const DEFAULT_MAX_AGE_SECONDS = 1209600;
export const DEFAULT_MAX_SIZE = 102400;

export const DURATION_UNITS = {
  ms: 1.0 / 1000,
  s: 1.0,
  m: 60.0,
  h: 60.0 * 60.0,
  d: 24.0 * 60.0 * 60.0,
  w: 7.0 * 24.0 * 60.0 * 60.0,
  y: 365 * 24.0 * 60.0 * 60.0,
};
