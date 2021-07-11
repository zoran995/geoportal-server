import { GithubFeedbackDto } from '../dto/github-feedback.dto';
import { MailFeedbackDto } from '../dto/mail-feedback.dto';
import { RedmineFeedbackDto } from '../dto/redmine-feedback.dto';

export type FeedbackServiceType = 'github' | 'mail' | 'redmine';

export type FeedbackServiceDtoType =
  | GithubFeedbackDto
  | MailFeedbackDto
  | RedmineFeedbackDto;
