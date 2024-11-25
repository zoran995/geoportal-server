import { Body, Controller, Inject, Post, Req } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { Request } from 'express';

import { FeedbackService } from './common/feedback-service';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import type { AbstractFeedbackService } from './providers/abstract-feedback.service';

@Controller('feedback')
@ApiTags('feedback')
export class FeedbackController {
  constructor(
    @Inject(FeedbackService)
    private readonly feedbackService: AbstractFeedbackService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Send new feedback' })
  @ApiCreatedResponse({ description: 'Feedback successfully sent.' })
  @ApiBadRequestResponse({ description: 'Bad Request.' })
  @ApiInternalServerErrorResponse({ description: 'An error occurred.' })
  async create(
    @Req() request: Request,
    @Body() createFeedbackDto: CreateFeedbackDto,
  ) {
    return this.feedbackService.post(createFeedbackDto, request);
  }
}
