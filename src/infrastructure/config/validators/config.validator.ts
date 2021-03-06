import { ClassConstructor, plainToClass } from 'class-transformer';
import { validateSync } from 'class-validator';

import { ValidationErrorsFormatter } from 'src/common/validators';
import { LoggerService } from 'src/infrastructure/logger';

import { ConfigurationDto } from '../dto/configuration.dto';

/* enum Environment {Development = 'development', Production = 'production',
  Test = 'test', Provision = 'provision',
} */

export function validate<T extends ConfigurationDto>(
  config: T,
  cls?: ClassConstructor<T>,
) {
  const logger = new LoggerService('Config validation');
  const validatedConfig = plainToClass(cls || ConfigurationDto, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
    //whitelist: true,
    //forbidNonWhitelisted: true,
  });
  if (errors.length > 0) {
    logger.error(ValidationErrorsFormatter.format(errors));
    throw new Error('Configuration validation failed.');
  }

  return validatedConfig;
}
