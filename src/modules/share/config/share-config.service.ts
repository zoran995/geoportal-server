import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { IConfigurationType } from '../../config';

@Injectable()
export class ShareConfigService {
  constructor(
    private readonly configService: ConfigService<IConfigurationType>,
  ) {}

  get availablePrefixes() {
    return this.shareConfig?.availablePrefixes;
  }

  get newPrefix() {
    return this.shareConfig?.newPrefix;
  }

  get maxRequestSize() {
    return this.shareConfig?.maxRequestSize;
  }

  private get shareConfig() {
    return this.configService.get('share', { infer: true });
  }
}
