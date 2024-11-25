import { GithubFeedbackType } from '../config/schema/github-feedback.schema';
import { MailFeedbackType } from '../config/schema/mail-feedback.schema';
import { RedmineFeedbackType } from '../config/schema/redmine-feedback.schema';

export const FeedbackServiceType = ['github', 'mail', 'redmine'] as const;

export type FeedbackServiceDtoType =
  | GithubFeedbackType
  | MailFeedbackType
  | RedmineFeedbackType;
