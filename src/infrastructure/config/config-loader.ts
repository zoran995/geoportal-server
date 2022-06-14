import { isArray, isObject } from 'src/common/helpers/helpers';
import { ConfigurationDto } from './dto/configuration.dto';
import { EnvConfigLoader } from './utils/load-env.util';
import { loadJsonConfig } from './utils/load-json-config.util';
import { loadYargs, YargsConfigType } from './utils/load-yargs.util';
import { validate } from './validators/config.validator';

export declare type IConfigurationType = ConfigurationDto & YargsConfigType;

export class ConfigLoader {
  static load(): IConfigurationType {
    const yargsConfig = loadYargs();
    const dotEnvConfig = EnvConfigLoader.load({
      ignoreEnvFile: yargsConfig['ignore-env-file'],
      ignoreEnvVars: yargsConfig['ignore-env-vars'],
      envFilePath: yargsConfig['env-file-path'],
    });
    const jsonConfig = loadJsonConfig({ filePath: yargsConfig['config-file'] });
    const expandedConfig = ConfigLoader.expand(
      jsonConfig,
      dotEnvConfig,
    ) as ConfigurationDto;
    const validatedConfig = validate(expandedConfig);
    const config = Object.assign(validatedConfig, yargsConfig);

    return config;
  }

  /**
   * Interpolate values in config using provided environment values. FUnction
   * implementation is taken from dotenv-expand.
   *
   * Rules:
   * - $KEY will expand any env with the name KEY
   * - ${KEY} will expand any env with the name KEY
   * - \$KEY will escape the $KEY rather than expand
   * - ${KEY:-default} will first attempt to expand any env with the name KEY. If
   *   not one, then it will return default
   *
   * @param configValue
   * @param environment
   * @returns
   */
  private static interpolate(configValue: string, environment: any): string {
    const matches = configValue.match(/(.?\${*[\w]*(?::-)?[\w]*}*)/g) || [];
    return matches.reduce((newVal: any, match: any, index: any) => {
      const parts = /(.?)\${*([\w]*(?::-)?[\w]*)?}*/g.exec(match);
      if (!parts || parts.length === 0) {
        return newVal;
      }
      const prefix = parts[1];
      let value, replacePart;
      if (prefix === '\\') {
        replacePart = parts[0];
        value = replacePart.replace('\\$', '$');
      } else {
        const keyParts = parts[2].split(':-');
        const key = keyParts[0];
        replacePart = parts[0].substring(prefix.length);
        value = Object.prototype.hasOwnProperty.call(environment, key)
          ? environment[key]
          : keyParts[1] || '';

        if (keyParts.length > 1 && value) {
          const replaceNested = matches[index + 1];
          matches[index + 1] = '';
          newVal = newVal.replace(replaceNested, '');
        }

        value = this.interpolate(value, environment);
      }
      return newVal.replace(replacePart, value);
    }, configValue);
  }

  private static expand(
    config: Record<string, any>,
    environment: Record<string, string>,
  ) {
    Object.keys(config).forEach((key) => {
      const value = config[key];
      if (isObject(value)) {
        config[key] = this.expand(value, environment);
      } else if (isArray(value)) {
        for (let i = 0; i < value.length; i++) {
          const currentValue = value[i];
          if (typeof currentValue === 'string') {
            config[key][i] = this.interpolate(currentValue, environment);
          } else {
            config[key][i] = this.expand(currentValue as any, environment);
          }
        }
      } else if (typeof value === 'string') {
        config[key] = this.interpolate(value, environment);
      }
    });
    return config;
  }
}
