import { IsEmail, IsString, IsUrl, MinLength } from 'class-validator';

import { NotNull } from 'src/common/validators';

export class CreateFeedbackDto {
  /**
   * Title of the feedback.
   */
  @IsString()
  @NotNull()
  readonly title?: string = 'User feedback';

  /**
   * Name of the user sending the feedback.
   */
  @IsString()
  @NotNull()
  readonly name?: string = 'No name';

  /**
   * Email of the user sending the feedback.
   */
  @IsEmail()
  @NotNull()
  readonly email?: string = 'No email';

  /**
   * Map share url.
   */
  @IsUrl()
  @NotNull()
  readonly shareLink?: string;

  /**
   * Actual feedback.
   */
  @IsString()
  @MinLength(30)
  @NotNull()
  readonly comment?: string = 'No comment';
}
