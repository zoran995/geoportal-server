import { ArgumentsHost, Catch, NotFoundException } from '@nestjs/common';

import { Response } from 'express';
import { existsSync } from 'fs';
import path from 'path';

import type { ServeStaticType } from '../schema/index.js';
import { HttpExceptionFilter } from './http-exception.filter.js';

@Catch(NotFoundException)
export class NotFoundExceptionFilter extends HttpExceptionFilter {
  constructor(
    private readonly serveStatic: ServeStaticType | undefined,
    private readonly wwwroot: string,
  ) {
    super();
  }
  catch(exception: NotFoundException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const file404 = path.resolve(path.join(this.wwwroot, '/404.html'));

    if (existsSync(file404)) {
      response.status(404);
      response.sendFile(file404);
    } else if (
      this.serveStatic?.serveStatic &&
      this.serveStatic.resolveUnmatchedPathsWithIndexHtml &&
      existsSync(
        path.join(this.wwwroot, this.serveStatic.resolvePathRelativeToWwwroot),
      )
    ) {
      response.redirect(303, '/');
    } else {
      super.catch(exception, host);
    }
  }
}
