import { Module } from '@nestjs/common';

import { feedbackServiceFactory } from './feeback-service.factory';
import { FeedbackController } from './feedback.controller';

@Module({
  controllers: [FeedbackController],
  providers: [feedbackServiceFactory],
})
export class FeedbackModule {}
