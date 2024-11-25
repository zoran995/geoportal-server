import type { ZodAny, ZodObject, ZodRawShape } from 'zod';

import { LoggerService } from 'src/infrastructure/logger';

import { configuration } from '../dto/configuration.dto';

/* enum Environment {Development = 'development', Production = 'production',
  Test = 'test', Provision = 'provision',
} */

export function validate<T extends ZodAny>(
  config: T,
  conf: ZodObject<ZodRawShape> = configuration,
) {
  const logger = new LoggerService('Config validation');
  const validationResult = conf.safeParse(config);

  if (!validationResult.success) {
    logger.error(
      JSON.stringify(
        validationResult.error.format(),
        (key, value) => {
          if (
            (key === '_errors' && value === undefined) ||
            value === null ||
            value.length === 0
          ) {
            return undefined;
          }
          return value as never;
        },
        2,
      ),
    );
    throw new Error('Configuration validation failed.');
  }
  return validationResult.data;
}
