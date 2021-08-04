import { Logger } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { validateSync } from 'class-validator';
import { ValidationErrorsFormatter } from 'src/common/validators/validation-errors.formater';
import { ConfigurationDto } from '../dto/configuration.dto';

/* enum Environment {Development = 'development', Production = 'production',
  Test = 'test', Provision = 'provision',
} */

export type ConfigurationType =
  | 'configFile'
  | 'port'
  | 'initPaths'
  | 'feedback'
  | 'share';

export function validate(config: Record<string, unknown>) {
  const logger = new Logger('Config validation');
  const validatedConfig = plainToClass(ConfigurationDto, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });
  if (errors.length > 0) {
    logger.error(ValidationErrorsFormatter.format(errors));
    throw new Error('Configuration validation failed.');
  }

  return validatedConfig;
}
