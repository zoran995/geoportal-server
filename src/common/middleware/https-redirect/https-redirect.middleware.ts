import { Injectable, NestMiddleware } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NextFunction, Request, Response } from 'express';
import { HttpsDto } from './https.dto';

@Injectable()
export class HttpsRedirectMiddleware implements NestMiddleware {
  private httpsConfig: HttpsDto | undefined;

  constructor(private readonly configService: ConfigService) {
    this.httpsConfig = this.configService.get('https');
  }

  use(req: Request, res: Response, next: NextFunction) {
    if (
      !this.httpsConfig?.redirectToHttps ||
      this.httpsConfig.httpAllowedHosts.indexOf(req.hostname) >= 0
    ) {
      next();
      return;
    }

    if (!req.secure) {
      const url = `https://${req.headers.host}${req.originalUrl}`;
      res.redirect(301, url);
      return;
    } else {
      if (this.httpsConfig?.strictTransportSecurity) {
        res.setHeader(
          'Strict-Transport-Security',
          this.httpsConfig.strictTransportSecurity,
        );
      }
      next();
      return;
    }
  }
}
