import { type DynamicModule, type ModuleMetadata } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';

import { WWWROOT_TOKEN } from 'src/common/utils/index.js';
import { type ServeStaticType } from 'src/common/schema/index.js';

import { AppServeStatic } from './app-serve-static.js';
import { SERVE_STATIC_OPTIONS } from './serve-static.constants.js';

export class AppServeStaticModule {
  static forRoot(options: AppServeStaticModuleOptions): DynamicModule {
    return {
      module: AppServeStaticModule,
      imports: [
        ServeStaticModule.forRootAsync({
          useClass: AppServeStatic,
          inject: [WWWROOT_TOKEN, SERVE_STATIC_OPTIONS],
          extraProviders: [
            {
              provide: SERVE_STATIC_OPTIONS,
              useFactory: options.useFactory,
              inject: options.inject ?? [],
            },
          ],
        }),
      ],
      exports: [ServeStaticModule],
    };
  }
}

interface AppServeStaticModuleOptions extends Pick<ModuleMetadata, 'imports'> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  inject?: any[];
  useFactory: (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...args: any[]
  ) => Promise<ServeStaticType | undefined> | ServeStaticType | undefined;
}
