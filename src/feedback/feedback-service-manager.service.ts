import { HttpService, Injectable } from '@nestjs/common';
import { GithubFeedbackDto } from './dto/github-feedback.dto';
import { MailFeedbackDto } from './dto/mail-feedback.dto';
import { RedmineFeedbackDto } from './dto/redmine-feedback.dto';
import { AbstractFeedbackService } from './providers/abstract-feedback.service';
import { GithubFeedbackService } from './providers/github-feedback.service';
import { MailFeedbackService } from './providers/mail-feedback.service';
import { RedmineFeedbackService } from './providers/redmine-feedback.service';
import { FeedbackServiceDtoType } from './types/feedback-service.type';

@Injectable()
export class FeedbackServiceManager {
  public readonly feedbackServices: (
    | GithubFeedbackService
    | MailFeedbackService
    | RedmineFeedbackService
  )[] = [];

  constructor(private readonly httpService: HttpService) {}

  /**
   * Check if feedback service with given id exists in manager
   * @param id ID of the feedback service
   */
  has(id: string): boolean {
    return !!this.feedbackServices.find((feedback) => feedback.id === id);
  }

  /**
   * Gets registered feedback service with given id.
   * @param id ID of the feedback service.
   * @returns instance of the feedback service.
   * @throws {Error} if feedback with given name was not found.
   */
  get(id: string): AbstractFeedbackService<FeedbackServiceDtoType> {
    const feedbackService = this.feedbackServices.find(
      (feedback) => feedback.id === id,
    );
    if (!feedbackService)
      throw new Error(`Feedback with id "${id}" was not found`);
    return feedbackService;
  }

  /**
   *
   * @param options
   * @returns
   */
  remove(id: string): boolean {
    const feedback = this.feedbackServices.find((service) => service.id === id);
    if (feedback) {
      this.feedbackServices.splice(this.feedbackServices.indexOf(feedback), 1);
      return true;
    }
    return false;
  }

  /**
   * Creates new instance of feedback service and registers it in manager.
   * @param options feedback configuration
   * @returns instance of feedback service
   * @throws {Error} Unknown feedback service specified.
   */
  create(
    options: FeedbackServiceDtoType,
  ): AbstractFeedbackService<FeedbackServiceDtoType> | never {
    const existFeedback = this.feedbackServices.find(
      (feedback) => feedback.id === options.id,
    );
    if (existFeedback) {
      this.feedbackServices.splice(
        this.feedbackServices.indexOf(existFeedback),
        1,
      );
    }
    if (options.service === 'github') {
      const feedback = new GithubFeedbackService(
        <GithubFeedbackDto>options,
        this.httpService,
      );
      this.feedbackServices.push(feedback);
      return feedback;
    } else if (options.service === 'mail') {
      const feedback = new MailFeedbackService(<MailFeedbackDto>options);
      this.feedbackServices.push(feedback);
      return feedback;
    } else if (options.service === 'redmine') {
      const feedback = new RedmineFeedbackService(
        <RedmineFeedbackDto>options,
        this.httpService,
      );
      this.feedbackServices.push(feedback);
      return feedback;
    } else {
      throw new Error(
        `Unknown feedback service "${options.service}" specified`,
      );
    }
  }
}
