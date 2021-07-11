import { IsDefined, IsString, ValidateNested } from 'class-validator';
import { FeedbackServiceType } from '../types/feedback-service.type';
import { AdditionalParametersDto } from './additional-parameters.dto';

export class BaseFeedbackDto {
  @IsString()
  @IsDefined()
  readonly service: FeedbackServiceType;

  @IsString()
  @IsDefined()
  readonly id: string;

  @ValidateNested({ each: true })
  readonly additionalParameters?: AdditionalParametersDto[];
}
