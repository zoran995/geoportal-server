import { isArray, isObject } from 'src/common/helpers/index.js';

import { ConfigurationType } from './schema/configuration.schema.js';
import { loadEnvFile } from './utils/load-env.util.js';
import { loadJsonConfig } from './utils/load-json-config.util.js';
import { loadYargs, YargsConfigType } from './utils/load-yargs.util.js';
import { validate } from './validators/config.validator.js';

export declare type IConfigurationType = ConfigurationType & YargsConfigType;

// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class ConfigLoader {
  static load(validator = validate): IConfigurationType {
    const yargsConfig = loadYargs();

    const dotEnvConfig: Record<string, string> = loadEnvFile({
      ignoreEnvFile: yargsConfig['ignore-env-file'],
      envFilePath: yargsConfig['env-file-path'],
    });

    const jsonConfig = loadJsonConfig({ filePath: yargsConfig['config-file'] });

    const expandedConfig = ConfigLoader.expand(
      jsonConfig as unknown as Record<string, unknown>,
      dotEnvConfig,
    ).config;

    const validatedConfig = validator(expandedConfig as never);

    return Object.assign(validatedConfig, yargsConfig) as never;
  }

  private static expandValue(
    value: string,
    environment: Record<string, string>,
    runningParsed: Record<string, unknown> = {},
  ) {
    const env = { ...runningParsed, ...environment }; // process.env wins

    const regex = /(?<!\\)\${([^{}]+)}|(?<!\\)\$([A-Za-z_][A-Za-z0-9_]*)/g;

    let result = value;
    let match;
    const seen = new Set(); // self-referential checker

    while ((match = regex.exec(result)) !== null) {
      seen.add(result);

      const [template, bracedExpression, unbracedExpression] = match;
      const expression = bracedExpression || unbracedExpression;

      // match the operators `:+`, `+`, `:-`, and `-`
      const opRegex = /(:\+|\+|:-|-)/;
      // find first match
      const opMatch = opRegex.exec(expression);
      const splitter = (opMatch ? opMatch[0] : null)!;

      const r = expression.split(splitter as never);

      let defaultValue;
      let value;

      const key = r.shift()!;

      if ([':+', '+'].includes(splitter as never)) {
        defaultValue = env[key] ? r.join(splitter as never) : '';
        value = null;
      } else {
        defaultValue = r.join(splitter);
        value = env[key];
      }

      if (value) {
        // self-referential check
        if (seen.has(value)) {
          result = result.replace(template, defaultValue);
        } else {
          result = result.replace(template, value as never);
        }
      } else {
        result = result.replace(template, defaultValue);
      }

      // if the result equaled what was in process.env and runningParsed then stop expanding
      if (result === runningParsed[key]) {
        break;
      }

      regex.lastIndex = 0; // reset regex search position to re-evaluate after each replacement
    }

    return result;
  }

  private static expand(
    config: Record<string, unknown>,
    environment: Record<string, string>,
  ): {
    config: Record<string, unknown>;
    runningParsed: Record<string, unknown>;
  } {
    // for use with progressive expansion
    const runningParsed: Record<string, unknown> = {};

    Object.keys(config).forEach((key) => {
      const value = config[key];

      if (isObject(value)) {
        const expanded = this.expand(value, environment);
        config[key] = expanded.config;
        runningParsed[key] = expanded.runningParsed;
        return;
      }

      if (isArray(value)) {
        runningParsed[key] = [];
        for (let i = 0; i < value.length; i++) {
          const currentValue = value[i];

          if (typeof currentValue === 'string') {
            const expanded = this.resolveEscapeSequences(
              this.expandValue(currentValue, environment, runningParsed),
            );
            value[i] = expanded;
          } else {
            const expanded = this.expand(
              currentValue as Record<string, unknown>,
              environment,
            );
            value[i] = expanded.config;
            (runningParsed[key] as unknown[])[i] = expanded.runningParsed;
          }
        }
        return;
      }

      if (typeof value === 'string') {
        config[key] = this.resolveEscapeSequences(
          this.expandValue(value, environment, runningParsed),
        );

        runningParsed[key] = config[key];
      }
    });
    return { config, runningParsed };
  }

  private static resolveEscapeSequences(value: string) {
    return value.replace(/\\\$/g, '$');
  }
}
