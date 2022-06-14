import {
  ArgumentsHost,
  Catch,
  Inject,
  InternalServerErrorException,
} from '@nestjs/common';
import { Response } from 'express';
import { existsSync } from 'fs';
import path from 'path';
import { WWWROOT_TOKEN } from 'src/infrastructure/config/app-config.module';
import { HttpExceptionFilter } from './http-exception.filter';

@Catch(InternalServerErrorException)
export class InternalServerErrorExceptionFilter extends HttpExceptionFilter {
  constructor(@Inject(WWWROOT_TOKEN) private readonly wwwroot: string) {
    super();
  }
  catch(exception: InternalServerErrorException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const file500 = path.resolve(path.join(this.wwwroot, '/500.html'));

    if (existsSync(file500)) {
      response.status(500);
      response.sendFile(file500);
    } else {
      super.catch(exception, host);
    }
  }
}
