import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import fs from 'fs';
import * as path from 'path';

import { WWWROOT_TOKEN } from 'src/infrastructure/config/app-config.module';
import { IConfigurationType } from 'src/infrastructure/config/config-loader';

@Injectable()
export class InitService {
  private readonly initPaths: string[] = [];
  constructor(
    private readonly configService: ConfigService<IConfigurationType>,
    @Inject(WWWROOT_TOKEN) private readonly wwwroot: string,
  ) {
    const initPaths = this.configService.get<string[]>('initPaths');
    const initPath = path.join(this.wwwroot, 'init');

    if (!initPaths?.some((iPath) => iPath === initPath.replace(/\\/g, '/'))) {
      initPaths?.push(initPath);
    }
  }

  /**
   * Gets the path to the requested file
   * @param fileName - Name of the file
   * @returns file path
   */
  getFilePath(fileName: string): string | undefined {
    const configFile = this.configService.get<string>('config-file');

    const configFileBase = configFile
      ? path.dirname(configFile)
      : process.cwd();
    let filePath: string | undefined = undefined;
    this.configService.get<string[]>('initPaths')?.some((initPath) => {
      const resolvedPath = path.resolve(configFileBase, initPath, fileName);
      if (fs.existsSync(resolvedPath)) {
        filePath = resolvedPath;
        return true;
      }
    });
    return filePath;
  }
}
