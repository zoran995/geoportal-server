import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  InternalServerErrorException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { existsSync } from 'fs';
import { CustomConfigService } from 'src/config/config.service';
import { defaultExceptionResponse } from './default-exception-response';

@Catch(InternalServerErrorException)
export class InternalServerErrorExceptionFilter implements ExceptionFilter {
  constructor(private readonly configService: CustomConfigService) {}
  catch(exception: InternalServerErrorException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    let wwwroot = process.cwd() + '/wwwroot';
    // take the wwwroot location from config if defined
    if (this.configService.get<string[]>('_').length > 0) {
      wwwroot = this.configService.get<string[]>('_')[0];
    }
    if (existsSync(wwwroot + '/500.html')) {
      response.sendFile(wwwroot + '/500.html');
    } else {
      defaultExceptionResponse(exception, response, request);
    }
  }
}
