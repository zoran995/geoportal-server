import { ArgumentsHost, Catch, NotFoundException } from '@nestjs/common';
import { Response } from 'express';
import { existsSync } from 'fs';
import { CustomConfigService } from 'src/config/config.service';
import { ServeStaticDto } from 'src/config/dto/serve-static.dto';
import { HttpExceptionFilter } from './http-exception.filter';

@Catch(NotFoundException)
export class NotFoundExceptionFilter extends HttpExceptionFilter {
  constructor(private readonly configService: CustomConfigService) {
    super();
  }
  catch(exception: NotFoundException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
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
      super.catch(exception, host);
    }
  }
}
