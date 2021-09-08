import { Type } from 'class-transformer';
import {
  IsArray,
  IsDefined,
  IsNotEmpty,
  IsString,
  ValidateNested,
} from 'class-validator';
import { ArrayContainsObjectKey } from '../../common/validators/array-contains-object-key.validator';
import { FeedbackServiceDtoType } from '../types/feedback-service.type';
import { BaseFeedbackDto } from './base-feedback.dto';
import { GithubFeedbackDto } from './github-feedback.dto';
import { MailFeedbackDto } from './mail-feedback.dto';
import { RedmineFeedbackDto } from './redmine-feedback.dto';

export class FeedbackConfigDto {
  /**
   * Which service of those defined in the options will be used when sending new
   * feedback.
   */
  @IsString()
  @IsNotEmpty()
  primaryId?: string;

  /**
   * List of available feedback services.
   */
  @IsDefined()
  @IsArray()
  @ArrayContainsObjectKey('primaryId', 'id')
  @ValidateNested({ each: true })
  @Type(() => BaseFeedbackDto, {
    discriminator: {
      property: 'service',
      subTypes: [
        { value: GithubFeedbackDto, name: 'github' },
        { value: MailFeedbackDto, name: 'mail' },
        { value: RedmineFeedbackDto, name: 'redmine' },
      ],
    },
  })
  options?: FeedbackServiceDtoType[];
}
