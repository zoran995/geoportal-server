import {
  IsEmail,
  IsOptional,
  IsString,
  IsUrl,
  MinLength,
} from 'class-validator';

export class CreateFeedbackDto {
  /**
   * Title of the feedback.
   */
  @IsString()
  @IsOptional()
  readonly title?: string = 'User feedback';

  /**
   * Name of the user sending the feedback.
   */
  @IsString()
  @IsOptional()
  readonly name?: string = 'No name';

  /**
   * Email of the user sending the feedback.
   */
  @IsEmail()
  @IsOptional()
  readonly email?: string = 'No email';

  /**
   * Map share url.
   */
  @IsUrl()
  @IsOptional()
  readonly shareLink?: string;

  /**
   * Actual feedback.
   */
  @IsString()
  @MinLength(30)
  @IsOptional()
  readonly comment?: string = 'No comment';
}
