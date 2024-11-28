import { BadRequestException, Inject, Injectable } from '@nestjs/common';

import { ShareResult } from './interfaces/save-share-response.interface';
import { ShareServiceManager } from './share-service-manager.service';
import type { Request } from 'express';
import { SHARE_OPTIONS } from './share.constants';
import type { ShareConfigType } from './schema/share.config.schema';

@Injectable()
export class ShareService {
  constructor(
    @Inject(SHARE_OPTIONS) private readonly shareOptions: ShareConfigType,
    private readonly shareServiceManager: ShareServiceManager,
  ) {}

  /**
   * Save the share data
   * @param data - Share data
   * @returns Share id
   */
  async save(
    data: Record<string, unknown>,
    req: Request,
  ): Promise<ShareResult> {
    const prefix = this.shareOptions.newPrefix;

    const provider = this.shareServiceManager.getProvider(prefix);

    return provider.save(data, req);
  }

  /**
   * Resolves the share data using id
   * @param id - Share id
   * @returns Share data
   */
  async resolve(id: string): Promise<Record<string, unknown>> {
    const [prefix, shareId] = this.parseShareId(id);

    const provider = this.shareServiceManager.getProvider(prefix);

    return provider.resolve(shareId);
  }

  private parseShareId(id: string): [string, string] {
    const match = id.match(/^(?:([^-]+)-)?(.+)$/);

    if (!match || match.length < 3 || !match[1] || !match[2]) {
      throw new BadRequestException('Invalid share id format');
    }

    return [match[1], match[2]];
  }
}
