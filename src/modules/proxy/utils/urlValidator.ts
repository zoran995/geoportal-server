import { z } from 'zod';

export const urlValidator = (url: string) => {
  return z
    .string()
    .url()
    .regex(/^(http:|https:)/)
    .safeParse(url).success;
};
