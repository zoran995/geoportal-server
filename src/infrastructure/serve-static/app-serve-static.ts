import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ServeStaticModuleOptions,
  ServeStaticModuleOptionsFactory,
} from '@nestjs/serve-static';
import { existsSync } from 'fs';
import path, { extname } from 'path';
import { isDefined } from 'src/common/helpers/isDefined';
import { WWWROOT_TOKEN } from '../config/app-config.module';
import { IConfigurationType } from '../config/config-loader';
import { ServeStaticDto } from './dto/serve-static.dto';

@Injectable()
export class AppServeStatic implements ServeStaticModuleOptionsFactory {
  constructor(
    private readonly configService: ConfigService<IConfigurationType>,
    @Inject(WWWROOT_TOKEN) private readonly wwwroot: string,
  ) {}

  createLoggerOptions(): ServeStaticModuleOptions[] {
    const serveStatic = this.configService.get<ServeStaticDto>('serveStatic');
    // check if the index file actually exists so we can share. If the file
    // doesn't exist disable serve static, so we don't receive error on each
    // access.
    if (
      !isDefined(serveStatic) ||
      !serveStatic.serveStatic ||
      !existsSync(this.wwwroot + serveStatic.resolvePathRelativeToWwwroot)
    ) {
      return [];
    }
    let wwwroot;
    try {
      wwwroot = path.resolve(this.wwwroot);
    } catch (err) {
      wwwroot = this.wwwroot;
    }

    return [
      {
        rootPath: wwwroot,
        renderPath: serveStatic.resolveUnmatchedPathsWithIndexHtml ? '*' : '/',
        serveStaticOptions: {
          dotfiles: 'ignore',
          index: serveStatic.resolvePathRelativeToWwwroot,
          setHeaders: (res, path) => {
            const type = extname(path);
            if (type === '.czml' || type === '.geojson') {
              res.header('Content-type', 'application/json');
            } else if (type === '.glsl') {
              res.header('Content-type', 'text/plain');
            }
          },
        },
      },
    ];
  }
}
