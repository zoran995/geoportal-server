import {
  Global,
  Module,
  type DynamicModule,
  type ModuleMetadata,
} from '@nestjs/common';

import type { RateLimitConfigType } from './config/rate-limit.schema';
import { RATE_LIMITER_CONFIG } from './constants';
import { RateLimiterService } from './rate-limiter.service';

@Global()
@Module({})
export class RateLimiterModule {
  static forRootAsync(options: RateLimiterAsyncOptions): DynamicModule {
    return {
      global: true,
      module: RateLimiterModule,
      imports: options.imports ?? [],
      providers: [
        {
          provide: RATE_LIMITER_CONFIG,
          useFactory: options.useFactory,
          inject: options.inject ?? [],
        },
        RateLimiterService,
      ],
      exports: [RateLimiterService],
    };
  }
}

interface RateLimiterAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  inject: any[];
  useFactory: (...args: never[]) => Promise<RateLimitConfigType>;
}
