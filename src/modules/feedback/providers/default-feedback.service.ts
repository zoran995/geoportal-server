import { NotImplementedException } from '@nestjs/common';
import { DEFAULT_FEEDBACK_ID } from '../config/schema/feedback.config.schema.js';
import { AbstractFeedbackService } from './abstract-feedback.service.js';

export class DefaultFeedbackService extends AbstractFeedbackService {
  constructor() {
    super({
      id: DEFAULT_FEEDBACK_ID,
    });
  }

  post(): Promise<unknown> {
    throw new NotImplementedException('Feedback creation not supported.');
  }
}
