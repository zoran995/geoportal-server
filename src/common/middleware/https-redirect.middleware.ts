import { Inject, Injectable } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

import type { HttpsOptions } from '../schema';
import { HTTPS_OPTIONS } from '../utils/https-options.token';

@Injectable()
export class HttpsRedirectMiddleware {
  constructor(
    @Inject(HTTPS_OPTIONS) private readonly httpsOptions?: HttpsOptions,
  ) {}

  use(req: Request, res: Response, next: NextFunction) {
    if (!this.httpsOptions || !this.httpsOptions.redirectToHttps) {
      return next();
    }

    if (this.httpsOptions?.httpAllowedHosts.includes(req.hostname)) {
      return next();
    }

    if (this.httpsOptions?.strictTransportSecurity) {
      res.setHeader(
        'Strict-Transport-Security',
        this.httpsOptions.strictTransportSecurity,
      );
    }

    if (req.secure) {
      return next();
    }

    const host = req.headers.host;
    res.redirect(301, `https://${host}${req.originalUrl}`);
  }
}
