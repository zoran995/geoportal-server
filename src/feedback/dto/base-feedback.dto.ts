import { IsIn, IsNotEmpty, IsString, ValidateNested } from 'class-validator';
import {
  FeedbackServiceType,
  FeedbackServiceTypeArr,
} from '../types/feedback-service.type';
import { AdditionalParametersDto } from './additional-parameters.dto';

export class BaseFeedbackDto {
  /**
   * Service to use.
   */
  @IsString()
  @IsIn(FeedbackServiceTypeArr)
  @IsNotEmpty()
  readonly service!: FeedbackServiceType;

  /**
   * Id of feedback service.
   */
  @IsString()
  @IsNotEmpty()
  readonly id!: string;

  @ValidateNested({ each: true })
  readonly additionalParameters?: AdditionalParametersDto[];
}
