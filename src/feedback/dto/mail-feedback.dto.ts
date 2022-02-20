import { Type } from 'class-transformer';
import {
  Equals,
  IsBoolean,
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsString,
} from 'class-validator';
import { NotNull } from '../../common/validators/not-null.validator';
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
  readonly service: FeedbackServiceType = 'mail';

  /**
   * Hostname or IP address of smtp server to connect to.
   */
  @IsString()
  @IsNotEmpty()
  smtpHost!: string;

  /**
   * Port of smtp server to connect to.
   */
  @IsInt()
  @IsNotEmpty()
  smtpPort!: number;

  @IsBoolean()
  secure = false;

  //@ValidateIf((o: MailFeedbackDto) => o.secure)
  @NotNull()
  @Type(() => MailFeedbackAuth)
  auth?: MailFeedbackAuth;

  @IsEmail()
  email!: string;
}
