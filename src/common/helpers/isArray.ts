// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isArray<T>(obj: any): obj is Array<T> {
  return !!(obj && typeof obj.length === 'number' && Array.isArray(obj));
}
