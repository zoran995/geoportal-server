import {
  Module,
  type DynamicModule,
  type ModuleMetadata,
} from '@nestjs/common';

import { POST_SIZE_LIMIT } from 'src/common/interceptor';

import type { ProxyOptions } from './proxy-options';
import { PROXY_OPTIONS } from './proxy.constants';
import { ProxyController } from './proxy.controller';
import { ProxyService } from './proxy.service';
import { ProxyListService } from './utils/proxy-list.service';

@Module({})
export class ProxyModule {
  static forRoot(options: ProxyModuleOptions): DynamicModule {
    return {
      module: ProxyModule,
      imports: options.imports ?? [],
      controllers: [ProxyController],
      providers: [
        {
          provide: PROXY_OPTIONS,
          useFactory: options.useFactory,
          inject: options.inject ?? [],
        },
        {
          provide: POST_SIZE_LIMIT,
          useFactory: (proxyOptions: ProxyOptions) => {
            return proxyOptions.postSizeLimit;
          },
          inject: [PROXY_OPTIONS],
        },
        ProxyService,
        ProxyListService,
      ],
      exports: [ProxyListService],
    };
  }
}

interface ProxyModuleOptions extends Pick<ModuleMetadata, 'imports'> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  inject?: any[];
  useFactory: (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...args: any[]
  ) => Promise<ProxyOptions | undefined> | ProxyOptions | undefined;
}
