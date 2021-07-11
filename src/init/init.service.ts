import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import fs from 'fs';
import * as path from 'path';

@Injectable()
export class InitService {
  constructor(private readonly configService: ConfigService) {}

  /**
   * Gets the path to the requested file
   * @param fileName Name of the file
   * @returns file path
   */
  getFilePath(fileName: string): string | undefined {
    const configFile = this.configService.get('configFile');

    const configFileBase = configFile
      ? path.resolve(configFile)
      : process.cwd();
    let filePath: string = undefined;
    this.configService.get<string[]>('initPaths').some((initPath) => {
      const resolvedPath = path.resolve(configFileBase, initPath, fileName);
      if (fs.existsSync(resolvedPath)) {
        filePath = resolvedPath;
        return true;
      }
    });
    return filePath;
  }
}
