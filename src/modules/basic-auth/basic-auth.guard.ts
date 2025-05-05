import {
  Inject,
  Injectable,
  Optional,
  UnauthorizedException,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import type { Request, Response } from 'express';

import type { BasicAuthenticationOptions } from './config/basic-authentication.schema.js';
import { BASIC_AUTH_OPTIONS } from './contants.js';

const CREDENTIALS_REGEXP =
  /^ *(?:[Bb][Aa][Ss][Ii][Cc]) +([A-Za-z0-9._~+/-]+=*) *$/;
const USER_PASS_REGEXP = /^([^:]*):(.*)$/;

@Injectable()
export class BasicAuthGuard implements CanActivate {
  constructor(
    @Optional()
    @Inject(BASIC_AUTH_OPTIONS)
    private readonly options?: BasicAuthenticationOptions,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request: Request = context.switchToHttp().getRequest();
    const response: Response = context.switchToHttp().getResponse();

    return this.validateRequest(request, response);
  }

  validateRequest(request: Request, response: Response) {
    if (!this.options) {
      return true;
    }

    try {
      const authorization = request.headers.authorization;
      if (!authorization || typeof authorization !== 'string') {
        throw new Error('Authorization header is missing');
      }

      const user = this.parseAuthorization(authorization);

      if (!user) {
        throw new Error('Invalid authorization header');
      }

      if (
        user.username !== this.options.username ||
        user.password !== this.options.password
      ) {
        throw new Error('Invalid username or password');
      }
    } catch {
      response.setHeader('WWW-Authenticate', 'Basic realm="terriajs-server"');
      throw new UnauthorizedException();
    }

    return true;
  }

  private parseAuthorization(authorization: string) {
    const match = CREDENTIALS_REGEXP.exec(authorization);
    if (!match) {
      return null;
    }

    const userPass = USER_PASS_REGEXP.exec(atob(match[1]));
    if (!userPass) {
      return undefined;
    }

    return {
      username: userPass[1],
      password: userPass[2],
    };
  }
}
