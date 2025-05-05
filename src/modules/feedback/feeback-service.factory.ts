import type { FactoryProvider } from '@nestjs/common';

import { LoggerService } from 'src/infrastructure/logger/index.js';
import { AppHttpService } from 'src/infrastructure/http/app-http-service.js';

import { FeedbackService } from './common/feedback-service.js';
import { FEEDBACK_CONFIG } from './feedback.constants.js';
import { DefaultFeedbackService } from './providers/default-feedback.service.js';
import { GithubFeedbackService } from './providers/github-feedback.service.js';
import { MailFeedbackService } from './providers/mail-feedback.service.js';
import { RedmineFeedbackService } from './providers/redmine-feedback.service.js';
import type { FeedbackConfigType } from './config/schema/feedback.config.schema.js';

export const feedbackServiceFactory: FactoryProvider = {
  provide: FeedbackService,
  useFactory: (
    feedbackConfig: FeedbackConfigType,
    httpService: AppHttpService,
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
  inject: [FEEDBACK_CONFIG, AppHttpService, LoggerService],
};
