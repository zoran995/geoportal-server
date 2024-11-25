import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { FeedbackConfigType } from '../dto/feedback.config.dto';

@Injectable()
export class FeedbackConfigService {
  constructor(private readonly configService: ConfigService) {}

  get primaryId() {
    return this.feedbackConfig?.primaryId;
  }

  get options() {
    return this.feedbackConfig?.options;
  }

  private get feedbackConfig() {
    return this.configService.get<FeedbackConfigType>('feedback');
  }
}
