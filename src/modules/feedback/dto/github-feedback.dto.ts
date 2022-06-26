import {
  Equals,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
} from 'class-validator';

import { FeedbackServiceType } from '../types/feedback-service.type';
import { BaseFeedbackDto } from './base-feedback.dto';

export class GithubFeedbackDto extends BaseFeedbackDto {
  /**
   * {@inheritdoc}
   */
  @IsString()
  @Equals('github')
  @IsIn(['github'])
  readonly service: FeedbackServiceType = 'github';

  /**
   * Github API issues url.
   *
   * See
   * {@link https://docs.github.com/en/rest/reference/issues#create-an-issue | Github API create an issue}
   * for details.
   */
  @IsUrl()
  issuesUrl!: string;

  /**
   * Github access token with permission to create issue.
   */
  @IsString()
  @IsNotEmpty()
  accessToken!: string;

  /**
   * Http user agent.
   */
  @IsString()
  @IsOptional()
  userAgent = 'TerriaJS-Bot';
}
