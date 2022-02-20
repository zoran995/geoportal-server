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
  @IsString()
  @Equals('github')
  @IsIn(['github'])
  readonly service: FeedbackServiceType = 'github';

  @IsUrl()
  issuesUrl!: string;

  @IsString()
  @IsNotEmpty()
  accessToken!: string;

  @IsString()
  @IsOptional()
  userAgent = 'TerriaJS-Bot';
}
