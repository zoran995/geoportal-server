export function isObject(item: any) {
  return !!(item && typeof item === 'object' && !Array.isArray(item));
}

export function isArray<T>(obj: any): obj is Array<T> {
  return !!(obj && typeof obj.length === 'number' && Array.isArray(obj));
}
