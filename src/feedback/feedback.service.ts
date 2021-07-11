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
import { AbstractFeedbackService } from './providers/abstract-feedback.service';
import { FeedbackServiceDtoType } from './types/feedback-service.type';

@Injectable()
export class FeedbackService {
  private readonly logger = new Logger(FeedbackService.name);
  constructor(
    private readonly feedbackServiceManager: FeedbackServiceManager,
    private readonly feedbackConfigService: FeedbackConfigService,
  ) {}

  /**
   * Stores feedback in configured feedback service
   * @param feedbackData - Feedback payload {@link CreateFeedbackDto}
   * @param request - Express request
   * @returns
   */
  async create(
    feedbackData: CreateFeedbackDto,
    request: Request,
  ): Promise<any> | never {
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

    return feedback.post(feedbackData, request);
  }
}
