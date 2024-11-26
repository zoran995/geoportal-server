import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { POST_SIZE_LIMIT } from 'src/common/interceptor';

import type { ConfigurationType } from '../config';
import { ShareConfigService } from './config/share-config.service';
import { ShareServiceManager } from './share-service-manager.service';
import { ShareController } from './share.controller';
import { ShareService } from './share.service';

@Module({
  controllers: [ShareController],
  providers: [
    ShareConfigService,
    ShareServiceManager,
    ShareService,
    {
      provide: POST_SIZE_LIMIT,
      useFactory: (configService: ShareConfigService) => {
        return configService.maxRequestSize;
      },
      inject: [ShareConfigService],
    },
  ],
})
export class ShareModule {
  constructor(
    private readonly shareServiceManager: ShareServiceManager,
    private readonly configService: ConfigService<ConfigurationType, true>,
  ) {}
  async onModuleInit() {
    await this.shareServiceManager.initializeProviders(
      this.configService.get('share.availablePrefixes', { infer: true }),
    );
  }
}
