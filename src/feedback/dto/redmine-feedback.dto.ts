import {
  Equals,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsPositive,
  IsString,
  IsUrl,
} from 'class-validator';
import { FeedbackServiceType } from '../types/feedback-service.type';
import { BaseFeedbackDto } from './base-feedback.dto';

export class RedmineFeedbackDto extends BaseFeedbackDto {
  @IsString()
  @Equals('redmine')
  @IsIn(['redmine'])
  readonly service: FeedbackServiceType = 'redmine';

  /**
   * Id of redmine project.
   */
  @IsInt()
  @IsPositive()
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
