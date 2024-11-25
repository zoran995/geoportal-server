import { z } from 'zod';

export const urlValidator = (url: string) => {
  return z
    .string()
    .url()
    .regex(/^(http:|https:)/)
    .refine((url) => {
      const parts = url.split('.');
      return parts.length > 1;
    })
    .safeParse(url).success;
};
