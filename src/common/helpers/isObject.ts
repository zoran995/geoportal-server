export function isObject<T = unknown>(
  item: unknown,
): item is Record<string, T> {
  return !!(item && typeof item === 'object' && !Array.isArray(item));
}
