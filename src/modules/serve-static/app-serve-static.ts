import { Inject, Injectable } from '@nestjs/common';
import {
  ServeStaticModuleOptions,
  ServeStaticModuleOptionsFactory,
} from '@nestjs/serve-static';
import { Response } from 'express';

import { existsSync } from 'fs';
import path, { extname } from 'path';

import { isDefined } from 'src/common/helpers';
import { type ServeStaticType } from 'src/common/schema';
import { WWWROOT_TOKEN } from 'src/common/utils';

import { SERVE_STATIC_OPTIONS } from './serve-static.constants';

@Injectable()
export class AppServeStatic implements ServeStaticModuleOptionsFactory {
  constructor(
    @Inject(WWWROOT_TOKEN) private readonly wwwroot: string,
    @Inject(SERVE_STATIC_OPTIONS)
    private readonly serveStaticOptions?: ServeStaticType,
  ) {}

  createLoggerOptions(): ServeStaticModuleOptions[] {
    const serveStatic = this.serveStaticOptions;
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
          setHeaders: (res: Response, path) => {
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
