import {
  Equals,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsString,
  IsUrl,
  Min,
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
  @Min(1)
  project_id!: number;

  /**
   * Redmine API url for creating issues.
   */
  @IsUrl()
  issuesUrl!: string;

  /**
   * Username that will be used for authenticating on redmine and creating new issues.
   */
  @IsString()
  @IsNotEmpty()
  username!: string;

  /**
   * Password for authenticating on redmine.
   */
  @IsString()
  @IsNotEmpty()
  password!: string;
}
