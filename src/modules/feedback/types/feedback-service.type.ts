import { GithubFeedbackDto } from '../dto/github-feedback.dto';
import { MailFeedbackDto } from '../dto/mail-feedback.dto';
import { RedmineFeedbackDto } from '../dto/redmine-feedback.dto';

export const FeedbackServiceTypeArr = ['github', 'mail', 'redmine'] as const;
export type FeedbackServiceType = (typeof FeedbackServiceTypeArr)[number];

export type FeedbackServiceDtoType =
  | GithubFeedbackDto
  | MailFeedbackDto
  | RedmineFeedbackDto;
