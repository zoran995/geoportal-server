import { ExecutionContext } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { createMock } from '@golevelup/ts-vitest';

import { FeedbackService } from '../common/feedback-service.js';
import { FeedbackController } from '../feedback.controller.js';

describe('FeedbackController', () => {
  let controller: FeedbackController;

  const mockExecutionContext = createMock<ExecutionContext>({
    switchToHttp: () => ({
      getRequest: () => ({
        ip: '127.0.0.1',
        header: () => {
          return 'test';
        },
      }),
    }),
  });

  const postMock = vi.fn();

  const mockFeedbackService = {
    post: postMock,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [],
      controllers: [FeedbackController],
      providers: [
        {
          provide: FeedbackService,
          useValue: mockFeedbackService,
        },
      ],
    }).compile();

    controller = module.get<FeedbackController>(FeedbackController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should succesfully save feedback', async () => {
    postMock.mockReturnValueOnce('test');
    const req = mockExecutionContext.switchToHttp().getRequest();

    const result = await controller.create(req as never, {
      title: 'feedback',
      name: 'test',
      email: 'info@geo.test',
      shareLink: 'https://geo.test/test-testid',
      comment: 'everything works correctly',
    });

    expect(result).toBe('test');
    expect(postMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'feedback',
        name: 'test',
        email: 'info@geo.test',
        shareLink: 'https://geo.test/test-testid',
        comment: 'everything works correctly',
      }),
      req,
    );
  });
});
