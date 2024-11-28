import {
  Inject,
  type DynamicModule,
  type ModuleMetadata,
} from '@nestjs/common';

import { POST_SIZE_LIMIT } from 'src/common/interceptor';

import type { ShareConfigType } from './schema/share.config.schema';
import { ShareServiceManager } from './share-service-manager.service';
import { SHARE_OPTIONS } from './share.constants';
import { ShareController } from './share.controller';
import { ShareService } from './share.service';

export class ShareModule {
  static forRoot(options: ShareModuleOptions): DynamicModule {
    return {
      module: ShareModule,
      imports: options.imports,
      controllers: [ShareController],
      providers: [
        {
          provide: SHARE_OPTIONS,
          useFactory: options.useFactory,
          inject: options.inject,
        },
        ShareServiceManager,
        ShareService,
        {
          provide: POST_SIZE_LIMIT,
          useFactory: (shareOptions: ShareConfigType) => {
            return shareOptions.maxRequestSize;
          },
          inject: [SHARE_OPTIONS],
        },
      ],
    };
  }

  constructor(
    private readonly shareServiceManager: ShareServiceManager,
    @Inject(SHARE_OPTIONS) private readonly shareOptions: ShareConfigType,
  ) {}

  async onModuleInit() {
    await this.shareServiceManager.initializeProviders(
      this.shareOptions.availablePrefixes || [],
    );
  }
}
interface ShareModuleOptions extends Pick<ModuleMetadata, 'imports'> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  inject?: any[];
  useFactory: (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...args: any[]
  ) => Promise<ShareConfigType | undefined> | ShareConfigType | undefined;
}
