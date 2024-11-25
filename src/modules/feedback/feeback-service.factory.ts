import { HttpService } from '@nestjs/axios';
import type { FactoryProvider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { LoggerService } from 'src/infrastructure/logger';

import type { ConfigurationType } from '../config';
import { FeedbackService } from './common/feedback-service';
import { DefaultFeedbackService } from './providers/default-feedback.service';
import { GithubFeedbackService } from './providers/github-feedback.service';
import { MailFeedbackService } from './providers/mail-feedback.service';
import { RedmineFeedbackService } from './providers/redmine-feedback.service';

export const feedbackServiceFactory: FactoryProvider = {
  provide: FeedbackService,
  useFactory: (
    configService: ConfigService<ConfigurationType, true>,
    httpService: HttpService,
    logger: LoggerService,
  ) => {
    const feedbackConfigs = configService.get('feedback', { infer: true });
    const primaryId = feedbackConfigs?.primaryId;
    const config = feedbackConfigs.options?.find(
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
  inject: [ConfigService, HttpService, LoggerService],
};
