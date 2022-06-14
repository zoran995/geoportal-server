import { isURL } from 'class-validator';

export const urlValidator = (url: string) => {
  return isURL(url, {
    protocols: ['http', 'https'],
    require_protocol: false,
  });
};
