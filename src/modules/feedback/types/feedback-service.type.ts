import { GithubFeedbackType } from '../dto/github-feedback.dto';
import { MailFeedbackType } from '../dto/mail-feedback.dto';
import { RedmineFeedbackType } from '../dto/redmine-feedback.dto';

export const FeedbackServiceType = ['github', 'mail', 'redmine'] as const;

export type FeedbackServiceDtoType =
  | GithubFeedbackType
  | MailFeedbackType
  | RedmineFeedbackType;
