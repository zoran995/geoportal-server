export const ShareTypeArr = ['gist', 's3'] as const;
export type ShareType = typeof ShareTypeArr[number];

export type Type<T> = new (...args: any[]) => T;
