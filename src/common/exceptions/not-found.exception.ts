import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  NotFoundException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { existsSync } from 'fs';
import { CustomConfigService } from 'src/config/config.service';
import { ServeStaticDto } from 'src/config/dto/serve-static.dto';
import { defaultExceptionResponse } from './default-exception-response';

@Catch(NotFoundException)
export class NotFoundExceptionFilter implements ExceptionFilter {
  constructor(private readonly configService: CustomConfigService) {}
  catch(exception: NotFoundException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    let wwwroot = process.cwd() + '/wwwroot';
    // take the wwwroot location from config if defined
    if (this.configService.get<string[]>('_').length > 0) {
      wwwroot = this.configService.get<string[]>('_')[0];
    }
    const serveStatic = this.configService.get<ServeStaticDto>('serveStatic');
    if (existsSync(wwwroot + '/404.html')) {
      response.sendFile(wwwroot + '/404.html');
    } else if (existsSync(wwwroot + serveStatic.resolvePathRelativeToWwwroot)) {
      response.redirect(303, '/');
    } else {
      defaultExceptionResponse(exception, response, request);
    }
  }
}
