import {
  Equals,
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsString,
} from 'class-validator';
import { NotNull } from 'src/common/validators/not-null.validator';
import { FeedbackServiceType } from '../types/feedback-service.type';
import { BaseFeedbackDto } from './base-feedback.dto';

export class MailFeedbackAuth {
  /**
   * Name of the user that will be used to connect to smtpServer.
   */
  @IsString()
  @IsNotEmpty()
  user: string;
  /**
   * Password of the user that will be used to connect to smtpServer.
   */
  @IsString()
  @IsNotEmpty()
  pass: string;
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
  smtpHost: string;

  /**
   * Port of smtp server to connect to.
   */
  @IsNumber()
  @IsNotEmpty()
  smtpPort: number;

  @IsBoolean()
  secure?: boolean = false;

  //@ValidateIf((o: MailFeedbackDto) => o.secure)
  @NotNull()
  auth?: MailFeedbackAuth;

  @IsEmail()
  email: string;
}
