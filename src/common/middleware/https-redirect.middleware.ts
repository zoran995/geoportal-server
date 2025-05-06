import { Inject, Injectable } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

import type { HttpsOptions } from '../schema/index.js';
import { HTTPS_OPTIONS } from '../utils/https-options.token.js';

@Injectable()
export class HttpsRedirectMiddleware {
  constructor(
    @Inject(HTTPS_OPTIONS) private readonly httpsOptions?: HttpsOptions,
  ) {}

  use(req: Request, res: Response, next: NextFunction) {
    if (!this.httpsOptions?.redirectToHttps) {
      next();
      return;
    }

    if (this.httpsOptions.httpAllowedHosts.includes(req.hostname)) {
      next();
      return;
    }

    if (this.httpsOptions.strictTransportSecurity) {
      res.setHeader(
        'Strict-Transport-Security',
        this.httpsOptions.strictTransportSecurity,
      );
    }

    if (req.secure) {
      next();
      return;
    }

    const host = req.headers.host;
    res.redirect(301, `https://${host}${req.originalUrl}`);
  }
}
