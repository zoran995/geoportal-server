import { Request } from 'express';
import { BaseFeedbackDto } from '../dto/base-feedback.dto';
import { CreateFeedbackDto } from '../dto/create-feedback.dto';

export abstract class AbstractFeedbackService<T extends BaseFeedbackDto> {
  readonly id: string;

  constructor(protected readonly options: T) {
    this.id = options.id;
  }

  /**
   *
   * @param feedback - payload
   * @param request  - request
   */
  abstract post(feedback: CreateFeedbackDto, request: Request): Promise<any>;
}
