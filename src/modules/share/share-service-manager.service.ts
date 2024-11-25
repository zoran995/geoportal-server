import { HttpService } from '@nestjs/axios';
import { Injectable, NotFoundException } from '@nestjs/common';

import { LoggerService } from 'src/infrastructure/logger';
import type { ShareGistConfig } from './config/schema/share-gist.schema';
import type { ShareS3Config } from './config/schema/share-s3.schema';
import type { AbstractShareService } from './providers/abstract-share.service';

@Injectable()
export class ShareServiceManager {
  readonly providers = new Map<string, AbstractShareService>();

  constructor(
    private readonly httpService: HttpService,
    private readonly logger: LoggerService,
  ) {}

  async initializeProviders(
    configs: (ShareGistConfig | ShareS3Config)[],
  ): Promise<void> {
    for (const config of configs) {
      const provider = await this.createProvider(config);
      this.providers.set(provider.prefix, provider);
    }
  }

  getProvider(prefix?: string) {
    if (!prefix) {
      throw new Error('Prefix is required');
    }

    const provider = this.providers.get(prefix);
    if (!provider) {
      throw new NotFoundException(`Share provider ${prefix} not found`);
    }
    return provider;
  }

  private async createProvider(
    config: ShareGistConfig | ShareS3Config,
  ): Promise<AbstractShareService<ShareGistConfig | ShareS3Config>> {
    switch (config.service) {
      case 'gist': {
        const { GistShareService } = await import(
          './providers/gist-share.service'
        );
        return new GistShareService(config, this.httpService, this.logger);
      }
      case 's3': {
        const { S3ShareService } = await import('./providers/s3-share.service');
        return new S3ShareService(config, this.logger);
      }
      default:
        throw new Error(
          `Unknown provider type: "${(config as Record<string, unknown>).service}"`,
        );
    }
  }
}
