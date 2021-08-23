import { ArgumentsHost, Catch, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { existsSync } from 'fs';
import { IConfigurationType } from 'src/config/configuration';
import { ServeStaticDto } from 'src/config/dto/serve-static.dto';
import { HttpExceptionFilter } from './http-exception.filter';

@Catch(NotFoundException)
export class NotFoundExceptionFilter extends HttpExceptionFilter {
  constructor(
    private readonly configService: ConfigService<IConfigurationType>,
  ) {
    super();
  }
  catch(exception: NotFoundException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    let wwwroot = process.cwd() + '/wwwroot';
    const initYargs = this.configService.get<string[]>('_');
    // take the wwwroot location from config if defined
    if (initYargs && initYargs.length > 0) {
      wwwroot = initYargs[0];
    }
    const serveStatic = this.configService.get<ServeStaticDto>('serveStatic');
    if (existsSync(wwwroot + '/404.html')) {
      response.sendFile(wwwroot + '/404.html');
    } else if (
      serveStatic &&
      existsSync(wwwroot + serveStatic.resolvePathRelativeToWwwroot)
    ) {
      response.redirect(303, '/');
    } else {
      super.catch(exception, host);
    }
  }
}
