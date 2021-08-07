import {
  ArgumentsHost,
  Catch,
  InternalServerErrorException,
} from '@nestjs/common';
import { Response } from 'express';
import { existsSync } from 'fs';
import { CustomConfigService } from 'src/config/config.service';
import { HttpExceptionFilter } from './http-exception.filter';

@Catch(InternalServerErrorException)
export class InternalServerErrorExceptionFilter extends HttpExceptionFilter {
  constructor(private readonly configService: CustomConfigService) {
    super();
  }
  catch(exception: InternalServerErrorException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    let wwwroot = process.cwd() + '/wwwroot';
    // take the wwwroot location from config if defined
    if (this.configService.get<string[]>('_').length > 0) {
      wwwroot = this.configService.get<string[]>('_')[0];
    }
    if (existsSync(wwwroot + '/500.html')) {
      response.sendFile(wwwroot + '/500.html');
    } else {
      super.catch(exception, host);
    }
  }
}
