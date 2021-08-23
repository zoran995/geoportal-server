import { IsIn, IsNotEmpty, IsString, ValidateNested } from 'class-validator';
import {
  FeedbackServiceType,
  FeedbackServiceTypeArr,
} from '../types/feedback-service.type';
import { AdditionalParametersDto } from './additional-parameters.dto';

export class BaseFeedbackDto {
  @IsString()
  @IsIn(FeedbackServiceTypeArr)
  @IsNotEmpty()
  readonly service!: FeedbackServiceType;

  @IsString()
  @IsNotEmpty()
  readonly id!: string;

  @ValidateNested({ each: true })
  readonly additionalParameters?: AdditionalParametersDto[];
}
