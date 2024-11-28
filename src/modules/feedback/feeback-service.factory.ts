import { HttpService } from '@nestjs/axios';
import type { FactoryProvider } from '@nestjs/common';

import { LoggerService } from 'src/infrastructure/logger';

import { FeedbackService } from './common/feedback-service';
import { FEEDBACK_CONFIG } from './feedback.constants';
import { DefaultFeedbackService } from './providers/default-feedback.service';
import { GithubFeedbackService } from './providers/github-feedback.service';
import { MailFeedbackService } from './providers/mail-feedback.service';
import { RedmineFeedbackService } from './providers/redmine-feedback.service';
import type { FeedbackConfigType } from './config/schema/feedback.config.schema';

export const feedbackServiceFactory: FactoryProvider = {
  provide: FeedbackService,
  useFactory: (
    feedbackConfig: FeedbackConfigType,
    httpService: HttpService,
    logger: LoggerService,
  ) => {
    const primaryId = feedbackConfig?.primaryId;
    const config = feedbackConfig.options?.find(
      (option) => option.id === primaryId,
    );

    switch (config?.service) {
      case 'github':
        return new GithubFeedbackService(config, httpService, logger);
      case 'mail':
        return new MailFeedbackService(config, logger);
      case 'redmine':
        return new RedmineFeedbackService(config, httpService, logger);
      default:
        return new DefaultFeedbackService();
    }
  },
  inject: [FEEDBACK_CONFIG, HttpService, LoggerService],
};
