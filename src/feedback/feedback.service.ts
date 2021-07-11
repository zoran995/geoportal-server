import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { isDefined } from 'class-validator';
import { Request } from 'express';
import { arrayContainsObjectKey } from 'src/common/validators/array-contains-object-key.validator';
import { FeedbackConfigService } from './config/feedback.config.service';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { FeedbackServiceManager } from './feedback-service-manager.service';
import { FeedbackServiceDtoType } from './types/feedback-service.type';
import { AbstractFeedbackService } from './providers/abstract-feedback.service';

@Injectable()
export class FeedbackService {
  constructor(
    private readonly feedbackServiceManager: FeedbackServiceManager,
    private readonly feedbackConfigService: FeedbackConfigService,
    private readonly logger: Logger,
  ) {
    logger.setContext(FeedbackService.name);
  }

  async create(
    createFeedback: CreateFeedbackDto,
    request: Request,
  ): Promise<any> {
    const primaryId = this.feedbackConfigService.primaryId;
    if (!isDefined(primaryId)) {
      this.logger.error(
        'Feedback could not be created. PrimaryId is not defined',
      );
      throw new NotFoundException(
        'Server is not configured to accept feedback.',
      );
    } else if (
      !arrayContainsObjectKey(
        this.feedbackConfigService.options,
        'id',
        primaryId,
      )
    ) {
      this.logger.error(
        `Feedback options doesn\'t contain object with id ${primaryId}.`,
      );
      throw new InternalServerErrorException();
    }

    let feedback: AbstractFeedbackService<FeedbackServiceDtoType>;
    if (!this.feedbackServiceManager.has(primaryId)) {
      const feedbackConfig = this.feedbackConfigService.options.find(
        (option) => option.id === primaryId,
      );
      try {
        feedback = this.feedbackServiceManager.create(feedbackConfig);
      } catch (err) {
        this.logger.error(
          `An error occurred while sending feedback`,
          JSON.stringify(err),
        );
        throw new InternalServerErrorException();
      }
    } else {
      feedback = this.feedbackServiceManager.get(primaryId);
    }

    return feedback.post(createFeedback, request);
  }
}
