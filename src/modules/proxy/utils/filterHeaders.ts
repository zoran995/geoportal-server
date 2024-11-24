import { Socket } from 'net';

import { DO_NOT_PROXY_REGEX } from '../proxy.constants';

/**
 * Filters headers that are not matched by {@link DO_NOT_PROXY_REGEX} out of an
 * object containing headers. This does not mutate the original list.
 *
 * @param headers - The headers to filter
 * @returns A new object with the filtered headers.
 */
export function filterHeaders(
  headers: Record<string, unknown>,
  socket?: Socket,
) {
  const result: Record<string, string> = {};
  // filter out headers that are listed in the regex
  Object.keys(headers).forEach(function (name) {
    if (!DO_NOT_PROXY_REGEX.test(name)) {
      result[name] = headers[name] as string;
    }
  });

  if (!socket) {
    return result;
  }

  if (result['x-forwarded-for']) {
    result['x-forwarded-for'] =
      `${result['x-forwarded-for']}, ${socket.remoteAddress}`;
  } else if (socket.remoteAddress) {
    result['x-forwarded-for'] = socket.remoteAddress;
  }

  return result;
}
