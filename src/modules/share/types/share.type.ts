export const ShareTypeArr = ['gist', 's3'] as const;
export type ShareType = (typeof ShareTypeArr)[number];
