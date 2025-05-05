import type { Request } from 'express';

import type { BaseFeedbackType } from '../config/schema/base-feedback.schema.js';
import { CreateFeedbackDto } from '../dto/create-feedback.dto.js';

export abstract class AbstractFeedbackService<
  T extends BaseFeedbackType = BaseFeedbackType,
> {
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
