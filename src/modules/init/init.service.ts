import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import fs from 'fs';
import * as path from 'path';

import { WWWROOT_TOKEN } from 'src/common/utils';

import { IConfigurationType } from '../config';

@Injectable()
export class InitService {
  private readonly initPaths: string[] = [];
  constructor(
    private readonly configService: ConfigService<IConfigurationType>,
    @Inject(WWWROOT_TOKEN) private readonly wwwroot: string,
  ) {
    const initPaths = this.configService.get('initPaths', { infer: true });
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
    const configFile = this.configService.get('config-file', { infer: true });

    const configFileBase = configFile
      ? path.dirname(configFile)
      : process.cwd();
    let filePath: string | undefined = undefined;
    this.configService.get('initPaths', { infer: true })?.some((initPath) => {
      const resolvedPath = path.resolve(configFileBase, initPath, fileName);
      if (fs.existsSync(resolvedPath)) {
        filePath = resolvedPath;
        return true;
      }
    });
    return filePath;
  }
}
