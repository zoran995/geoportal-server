import { configDotenv } from 'dotenv';
import { expand } from 'dotenv-expand';

interface EnvConfigOptions {
  ignoreEnvFile: boolean;
  envFilePath?: string[];
}

export function loadEnvFile(
  options: EnvConfigOptions = { ignoreEnvFile: false },
) {
  const config: Record<string, string> = {};

  if (!options.ignoreEnvFile) {
    expand(
      configDotenv({
        path: options.envFilePath,
        processEnv: config,
      }),
    );
  }

  return config;
}
