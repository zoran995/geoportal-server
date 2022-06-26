import { Type } from 'class-transformer';
import {
  Equals,
  IsBoolean,
  IsEmail,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsPort,
  IsString,
} from 'class-validator';

import { NotNull, isFqdnOrIp } from 'src/common/validators';

import { FeedbackServiceType } from '../types/feedback-service.type';
import { BaseFeedbackDto } from './base-feedback.dto';

export class MailFeedbackAuth {
  /**
   * Name of the user that will be used to connect to smtpServer.
   */
  @IsString()
  @IsNotEmpty()
  user!: string;
  /**
   * Password of the user that will be used to connect to smtpServer.
   */
  @IsString()
  @IsNotEmpty()
  pass!: string;
}

export class MailFeedbackDto extends BaseFeedbackDto {
  @IsString()
  @Equals('mail')
  @IsIn(['mail'])
  readonly service: FeedbackServiceType = 'mail';

  /**
   * Hostname or IP address of smtp server to connect to.
   */
  @IsString()
  @IsNotEmpty()
  @isFqdnOrIp()
  smtpHost!: string;

  /**
   * Port of smtp server to connect to.
   */
  @IsInt()
  @IsNotEmpty()
  @IsPort()
  smtpPort!: number;

  /**
   * Whether authentication should be done against SMPT server.
   */
  @IsBoolean()
  secure = false;

  //@ValidateIf((o: MailFeedbackDto) => o.secure)
  @NotNull()
  @Type(() => MailFeedbackAuth)
  auth?: MailFeedbackAuth;

  /**
   * Email to which feedback will be sent.
   */
  @IsEmail()
  email!: string;
}
