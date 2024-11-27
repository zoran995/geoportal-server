import {
  Injectable,
  UnauthorizedException,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { IConfigurationType } from '../config';
import type { Request, Response } from 'express';

const CREDENTIALS_REGEXP =
  /^ *(?:[Bb][Aa][Ss][Ii][Cc]) +([A-Za-z0-9._~+/-]+=*) *$/;
const USER_PASS_REGEXP = /^([^:]*):(.*)$/;

@Injectable()
export class BasicAuthGuard implements CanActivate {
  constructor(
    private readonly configService: ConfigService<IConfigurationType, true>,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request: Request = context.switchToHttp().getRequest();
    const response: Response = context.switchToHttp().getResponse();

    return this.validateRequest(request, response);
  }

  validateRequest(request: Request, response: Response) {
    const basicAuthentication = this.configService.get('basicAuthentication');

    if (!basicAuthentication) {
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
        user.username !== basicAuthentication.username ||
        user.password !== basicAuthentication.password
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
