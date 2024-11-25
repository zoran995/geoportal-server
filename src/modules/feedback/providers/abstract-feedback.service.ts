import { Request } from 'express';

import { BaseFeedbackType } from '../config/schema/base-feedback.schema';
import { CreateFeedbackDto } from '../dto/create-feedback.dto';

export abstract class AbstractFeedbackService<T extends BaseFeedbackType> {
  readonly id: string;

  constructor(protected readonly options: T) {
    this.id = options.id;
  }

  /**
   *
   * @param feedback - payload
   * @param request  - request
   */
  abstract post(
    feedback: CreateFeedbackDto,
    request: Request,
  ): Promise<unknown>;
}
