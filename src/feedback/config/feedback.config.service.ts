import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FeedbackConfigDto } from '../dto/feedback.config.dto';

@Injectable()
export class FeedbackConfigService {
  constructor(private readonly configService: ConfigService) {}

  get primaryId(): string | undefined {
    return this.feedbackConfig.primaryId;
  }

  get options() {
    return this.feedbackConfig.options;
  }

  private get feedbackConfig(): FeedbackConfigDto {
    return this.configService.get('feedback');
  }
}
