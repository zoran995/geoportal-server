import { Logger } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { validateSync } from 'class-validator';
import { ValidationErrorsFormatter } from 'src/common/validators/validation-errors.formater';
import { ConfigurationDto } from '../dto/configuration.dto';

/* enum Environment {Development = 'development', Production = 'production',
  Test = 'test', Provision = 'provision',
} */

export function validate(config: ConfigurationDto) {
  const logger = new Logger('Config validation');
  const validatedConfig = plainToClass(ConfigurationDto, config, {
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
