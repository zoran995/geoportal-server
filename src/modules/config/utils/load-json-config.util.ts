import { EncodingOption, existsSync, readFileSync } from 'fs';

import { ConfigurationType } from '../schema/configuration.schema';

interface ILoadJsonConfigOptions {
  filePath: string | string[];
  encoding?: EncodingOption;
}

export function loadJsonConfig(
  options: ILoadJsonConfigOptions,
): ConfigurationType {
  const jsonFilePaths = Array.isArray(options.filePath)
    ? options.filePath
    : [options.filePath];
  let config = {};
  for (const jsonFilePath of jsonFilePaths) {
    if (existsSync(jsonFilePath)) {
      config = Object.assign(
        config,
        JSON.parse(
          readFileSync(jsonFilePath, options.encoding ?? 'utf-8').toString(),
        ),
      ) as ConfigurationType;
    }
  }
  return config as unknown as ConfigurationType;
}
