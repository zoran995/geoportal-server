import { Equals, IsNotEmpty, IsString, IsUrl } from 'class-validator';
import { FeedbackServiceType } from '../types/feedback-service.type';
import { BaseFeedbackDto } from './base-feedback.dto';

export class GithubFeedbackDto extends BaseFeedbackDto {
  @IsString()
  @Equals('github')
  readonly service: FeedbackServiceType = 'github';

  @IsUrl()
  issuesUrl: string;

  @IsString()
  @IsNotEmpty()
  accessToken: string;

  @IsString()
  userAgent?: string = 'TerriaJS-Bot';
}
