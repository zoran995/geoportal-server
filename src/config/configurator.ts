import { ConfigurationDto } from './dto/configuration.dto';
import { loadJsonConfig } from './utils/load-json-config.util';
import { loadYargs, YargsConfigType } from './utils/load-yargs.util';
import { validate } from './validators/config.validator';

export declare type IConfigurationType = ConfigurationDto & YargsConfigType;

export function configurator(): IConfigurationType {
  const yargsConfig = loadYargs();
  const jsonConfig = loadJsonConfig({ filePath: yargsConfig['config-file'] });

  const validatedJsonConfig = validate(jsonConfig);
  const config = Object.assign(validatedJsonConfig, yargsConfig);

  return config;
}