import * as dotenv from 'dotenv';
import { expand } from 'dotenv-expand';
import fs from 'fs';
import { resolve } from 'path';

interface EnvConfigOptions {
  ignoreEnvFile: boolean;
  ignoreEnvVars: boolean;
  envFilePath?: string;
}

export class EnvConfigLoader {
  public static load(
    options: EnvConfigOptions = { ignoreEnvFile: false, ignoreEnvVars: false },
  ) {
    let config = options.ignoreEnvFile
      ? {}
      : this.loadEnvFile(options.envFilePath);

    if (!options.ignoreEnvVars) {
      config = { ...config, ...process.env };
    }
    return config;
  }

  private static loadEnvFile(envFilePath?: string): Record<string, any> {
    envFilePath = envFilePath ?? resolve(process.cwd(), '.env');

    let config: ReturnType<typeof dotenv.parse> = {};

    if (fs.existsSync(envFilePath)) {
      config = Object.assign(
        dotenv.parse(fs.readFileSync(envFilePath)),
        config,
      );
      config = expand({ parsed: config }).parsed || config;
    }

    return config;
  }
}
