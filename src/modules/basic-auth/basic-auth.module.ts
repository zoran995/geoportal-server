import { type DynamicModule, type ModuleMetadata } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { BasicAuthGuard } from './basic-auth.guard.js';
import { BASIC_AUTH_OPTIONS } from './contants.js';
import type { BasicAuthenticationOptions } from './config/basic-authentication.schema.js';

export class BasicAuthModule {
  static forRootAsync(options: AuthModuleAsyncOptions): DynamicModule {
    return {
      module: BasicAuthModule,
      imports: options.imports,
      providers: [
        {
          provide: BASIC_AUTH_OPTIONS,
          useFactory: options.useFactory,
          inject: options.inject ?? [],
        },
        {
          provide: APP_GUARD,
          useFactory: (basicAuthGuard: BasicAuthGuard) => {
            return basicAuthGuard;
          },
        },
        BasicAuthGuard,
      ],
      exports: [BasicAuthGuard],
    };
  }
}

interface AuthModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  inject?: any[];
  useFactory: (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...args: any[]
  ) =>
    | Promise<BasicAuthenticationOptions | undefined>
    | BasicAuthenticationOptions
    | undefined;
}
