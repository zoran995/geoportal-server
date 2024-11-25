import { ArgumentsHost, Catch, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { Response } from 'express';
import { existsSync } from 'fs';
import path from 'path';

import type { ConfigurationType } from 'src/modules/config';

import { HttpExceptionFilter } from './http-exception.filter';

@Catch(NotFoundException)
export class NotFoundExceptionFilter extends HttpExceptionFilter {
  constructor(
    private readonly configService: ConfigService<ConfigurationType, true>,
    private readonly wwwroot: string,
  ) {
    super();
  }
  catch(exception: NotFoundException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const serveStatic = this.configService.get('serveStatic', { infer: true });
    const file404 = path.resolve(path.join(this.wwwroot, '/404.html'));

    if (existsSync(file404)) {
      response.status(404);
      response.sendFile(file404);
    } else if (
      serveStatic?.serveStatic &&
      serveStatic.resolveUnmatchedPathsWithIndexHtml &&
      existsSync(
        path.join(this.wwwroot, serveStatic.resolvePathRelativeToWwwroot),
      )
    ) {
      response.redirect(303, '/');
    } else {
      super.catch(exception, host);
    }
  }
}
