import type { DynamicModule } from '@nestjs/common';

import { INIT_OPTIONS } from './init.constants.js';
import { InitController } from './init.controller.js';
import { InitService } from './init.service.js';
import type { InitOptions } from './interfaces/init.options.js';

export class InitModule {
  static forRoot(options: InitModuleOptions): DynamicModule {
    return {
      module: InitModule,
      controllers: [InitController],
      providers: [
        InitService,
        {
          provide: INIT_OPTIONS,
          useFactory: options.useFactory,
          inject: options.inject ?? [],
        },
      ],
    };
  }
}

interface InitModuleOptions {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  inject?: any[];
  useFactory: (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...args: any[]
  ) => Promise<InitOptions | undefined> | InitOptions | undefined;
}
