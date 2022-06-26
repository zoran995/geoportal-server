import { Injectable, NestMiddleware } from '@nestjs/common';

import { NextFunction, Request, Response } from 'express';

import { LoggerService } from 'src/infrastructure/logger';

@Injectable()
export class HttpLoggerMiddleware implements NestMiddleware {
  private readonly logger = new LoggerService(HttpLoggerMiddleware.name);

  use(req: Request, res: Response, next: NextFunction) {
    const { body, params, query } = req;
    const requestUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`;

    this.logger.verbose('----------------------------------------------------');
    this.logger.verbose(`request method: ${req.method}`);
    this.logger.verbose(`request url: ${requestUrl}`);
    this.logger.verbose(`request body: ${JSON.stringify(body)}`);
    this.logger.verbose(`request query: ${JSON.stringify(query)}`);
    this.logger.verbose(`request params: ${JSON.stringify(params)}`);
    this.logger.verbose('----------------------------------------------------');
    next();
  }
}
