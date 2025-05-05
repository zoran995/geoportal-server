import { LoggerService } from 'src/infrastructure/logger/index.js';

import { configuration } from '../schema/configuration.schema.js';

/* enum Environment {Development = 'development', Production = 'production',
  Test = 'test', Provision = 'provision',
} */

export function validate(config: Record<string, unknown>) {
  const logger = new LoggerService('Config validation');
  const validationResult = configuration.safeParse(config);

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
