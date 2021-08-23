import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import fs from 'fs';
import * as path from 'path';
import { IConfigurationType } from 'src/config/configuration';

@Injectable()
export class InitService {
  constructor(
    private readonly configService: ConfigService<IConfigurationType>,
  ) {}

  /**
   * Gets the path to the requested file
   * @param fileName Name of the file
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
