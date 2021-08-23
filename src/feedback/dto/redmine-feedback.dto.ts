import { Equals, IsNotEmpty, IsNumber, IsString, IsUrl } from 'class-validator';
import { FeedbackServiceType } from '../types/feedback-service.type';
import { BaseFeedbackDto } from './base-feedback.dto';

export class RedmineFeedbackDto extends BaseFeedbackDto {
  @IsString()
  @Equals('redmine')
  readonly service: FeedbackServiceType = 'redmine';

  @IsNumber()
  project_id!: number;

  @IsUrl()
  issuesUrl!: string;

  @IsString()
  @IsNotEmpty()
  username!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;
}
