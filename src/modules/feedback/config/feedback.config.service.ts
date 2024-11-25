import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { ConfigurationType } from 'src/modules/config';

@Injectable()
export class FeedbackConfigService {
  constructor(
    private readonly configService: ConfigService<ConfigurationType>,
  ) {}

  get primaryId() {
    return this.feedbackConfig?.primaryId;
  }

  get options() {
    return this.feedbackConfig?.options;
  }

  private get feedbackConfig() {
    return this.configService.get('feedback', { infer: true });
  }
}
