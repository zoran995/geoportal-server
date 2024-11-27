import {
  BadRequestException,
  HttpStatus,
  Inject,
  Injectable,
} from '@nestjs/common';

import { RateLimiterMemory, type RateLimiterRes } from 'rate-limiter-flexible';
import type { NextFunction, Request, Response } from 'express';

import type { RateLimitConfigType } from './config/rate-limit.schema';
import { RATE_LIMITER_CONFIG } from './constants';

@Injectable()
export class RateLimiterService {
  rateLimiter: RateLimiterMemory;

  constructor(@Inject(RATE_LIMITER_CONFIG) config: RateLimitConfigType) {
    this.rateLimiter = new RateLimiterMemory({
      points: config.points,
      duration: config.duration,
      blockDuration: config.blockDuration,
    });
  }

  async middleware(req: Request, res: Response, next: NextFunction) {
    if (!req.ip) {
      throw new BadRequestException('IP address not found');
    }
    try {
      await this.rateLimiter.consume(req.ip);

      next();
    } catch (err) {
      if (err instanceof Error) {
        throw err;
      }
      const rateLimiterEr = err as RateLimiterRes;
      res.set(
        'Retry-After',
        String(Math.ceil(rateLimiterEr.msBeforeNext / 1000)) || '1',
      );
      res.status(HttpStatus.TOO_MANY_REQUESTS).send('Too many requests');
    }
  }
}
