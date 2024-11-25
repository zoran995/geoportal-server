import { BadRequestException, Injectable } from '@nestjs/common';

import { ShareConfigService } from './config/share-config.service';
import { ShareResult } from './interfaces/save-share-response.interface';
import { ShareServiceManager } from './share-service-manager.service';

@Injectable()
export class ShareService {
  constructor(
    private readonly configService: ShareConfigService,
    private readonly shareServiceManager: ShareServiceManager,
  ) {}

  /**
   * Save the share data
   * @param data - Share data
   * @returns Share id
   */
  async save(data: Record<string, unknown>): Promise<ShareResult> {
    const prefix = this.configService.newPrefix;

    const provider = this.shareServiceManager.getProvider(prefix);

    return provider.save(data);
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
