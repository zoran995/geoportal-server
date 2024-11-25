import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';

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
   * @param id - ID of the feedback service
   */
  has(id: string): boolean {
    return !!this.feedbackServices.find((feedback) => feedback.id === id);
  }

  /**
   * Gets registered feedback service with given id.
   * @param id - ID of the feedback service.
   * @returns Instance of the feedback service.
   * @throws {@link Error} If feedback with given name was not found.
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
   * @param id - ID of the feedback service.
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
   * @param options - Feedback configuration
   * @returns Instance of feedback service
   * @throws {@link Error} Unknown feedback service specified.
   */
  register(
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
      const feedback = new GithubFeedbackService(options, this.httpService);
      this.feedbackServices.push(feedback);
      return feedback;
    } else if (options.service === 'mail') {
      const feedback = new MailFeedbackService(options);
      this.feedbackServices.push(feedback);
      return feedback;
    } else if (options.service === 'redmine') {
      const feedback = new RedmineFeedbackService(options, this.httpService);
      this.feedbackServices.push(feedback);
      return feedback;
    } else {
      throw new Error(
        `Unknown feedback service "${(options as Record<string, unknown>).service}" specified`,
      );
    }
  }
}
