import { Module } from '@nestjs/common';
import { FeedbackConfigService } from './config/feedback.config.service';
import { FeedbackServiceManager } from './feedback-service-manager.service';
import { FeedbackController } from './feedback.controller';
import { FeedbackService } from './feedback.service';

@Module({
  controllers: [FeedbackController],
  providers: [FeedbackService, FeedbackServiceManager, FeedbackConfigService],
})
export class FeedbackModule {}
