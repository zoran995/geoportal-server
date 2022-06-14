import { createMock } from '@golevelup/ts-jest';
import { ExecutionContext } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { FeedbackController } from './feedback.controller';
import { FeedbackService } from './feedback.service';

const mockCreate = jest.fn();

const mockFeedbackService = {
  create: mockCreate,
};

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

const req = mockExecutionContext.switchToHttp().getRequest();

const feedbackPayload: CreateFeedbackDto = {
  title: 'feedback',
  name: 'test',
  email: 'info@geo.test',
  shareLink: 'https://geo.test/test-testid',
  comment: 'everything works correctly',
};

describe('FeedbackController', () => {
  let controller: FeedbackController;

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
    mockCreate.mockReturnValueOnce('test');
    const result = await controller.create(req as any, feedbackPayload);
    expect(result).toBe('test');
    expect(mockCreate).toHaveBeenCalledWith(feedbackPayload, req);
  });
});
