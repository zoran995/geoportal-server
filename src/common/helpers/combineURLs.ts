/**
 * Creates a new URL by combining the specified URLs
 *
 * @param baseURL The base URL
 * @param relativeURL The relative URL
 * @returns The combined URL
 */
export function combineURLs(baseURL: string, relativeURL: string): string {
  return relativeURL
    ? baseURL.replace(/\/+$/, '') + '/' + relativeURL.replace(/^\/+/, '')
    : baseURL;
}
