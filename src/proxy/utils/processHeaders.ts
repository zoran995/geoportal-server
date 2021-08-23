import { DEFAULT_MAX_AGE_SECONDS } from '../proxy.constants';
import { filterHeaders } from './filterHeaders';

/**
 * Filters out headers that shouldn't be proxied, overrides caching so files are
 * retained for {@link DEFAULT_MAX_AGE_SECONDS}, and sets CORS headers to allow all
 * origins
 *
 * @param headers The original object of headers. This is not mutated.
 * @param maxAgeSeconds the amount of time in seconds to cache for. This will
 *          override what the original server specified because we know better
 *          than they do.
 * @returns The new headers object.
 */
export function processHeaders(
  headers: Record<string, unknown>,
  maxAgeSeconds: number | undefined = DEFAULT_MAX_AGE_SECONDS,
) {
  const result = filterHeaders(headers);

  if (maxAgeSeconds !== undefined) {
    result['Cache-Control'] = 'public,max-age=' + maxAgeSeconds;
  }

  result['Access-Control-Allow-Origin'] = '*';
  return result;
}
