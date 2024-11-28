import { Inject, Injectable, type OnModuleInit } from '@nestjs/common';

import fs from 'fs';
import * as path from 'path';

import { WWWROOT_TOKEN } from 'src/common/utils';

import { INIT_OPTIONS } from './init.constants';
import type { InitOptions } from './interfaces/init.options';

@Injectable()
export class InitService implements OnModuleInit {
  private readonly initPaths: string[] = [];

  constructor(
    @Inject(INIT_OPTIONS) private readonly initOptions: InitOptions,
    @Inject(WWWROOT_TOKEN) private readonly wwwroot: string,
  ) {}

  onModuleInit() {
    const initPaths = this.initOptions.initPaths;
    const serveStatic = this.initOptions.shouldServeStatic;
    this.initPaths.push(...initPaths);

    const initPath = path.join(this.wwwroot, 'init');
    if (
      serveStatic &&
      !initPaths.some((iPath) => iPath === initPath.replace(/\\/g, '/'))
    ) {
      this.initPaths.push(initPath);
    }
  }

  /**
   * Gets the path to the requested file
   * @param fileName - Name of the file
   * @returns file path
   */
  getFilePath(fileName: string): string | undefined {
    const configFile = this.initOptions.configFilePath;

    const configFileBase = configFile
      ? path.dirname(configFile)
      : process.cwd();

    let filePath: string | undefined = undefined;
    this.initPaths?.some((initPath) => {
      const resolvedPath = path.resolve(configFileBase, initPath, fileName);
      if (fs.existsSync(resolvedPath)) {
        filePath = resolvedPath;
        return true;
      }
    });
    return filePath;
  }
}
