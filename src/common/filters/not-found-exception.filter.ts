import { ArgumentsHost, Catch, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { existsSync } from 'fs';
import path from 'path';
import { IConfigurationType } from 'src/config/configurator';
import { ServeStaticDto } from 'src/serve-static/dto/serve-static.dto';
import { HttpExceptionFilter } from './http-exception.filter';

@Catch(NotFoundException)
export class NotFoundExceptionFilter extends HttpExceptionFilter {
  constructor(
    private readonly configService: ConfigService<IConfigurationType>,
    private readonly wwwroot: string,
  ) {
    super();
  }
  catch(exception: NotFoundException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const serveStatic = this.configService.get<ServeStaticDto>('serveStatic');
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
