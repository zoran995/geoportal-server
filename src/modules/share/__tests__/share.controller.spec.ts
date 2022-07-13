import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import { POST_SIZE_LIMIT } from 'src/common/interceptor';

import { ShareConfigService } from '../config/share-config.service';
import { ShareController } from '../share.controller';
import { ShareService } from '../share.service';

const mockSave = jest.fn();
const mockResolve = jest.fn();

const shareServiceMock = {
  save: mockSave,
  resolve: mockResolve,
};

describe('ShareController', () => {
  let controller: ShareController;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [],
      controllers: [ShareController],
      providers: [
        {
          provide: ShareService,
          useValue: shareServiceMock,
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
        ShareConfigService,
        {
          provide: POST_SIZE_LIMIT,
          useValue: 102400,
        },
      ],
    }).compile();

    controller = module.get<ShareController>(ShareController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should properly save', async () => {
    mockSave.mockReturnValueOnce('testid');
    const result = await controller.create({});
    expect(mockSave).toHaveBeenCalledTimes(1);
    expect(result).toEqual('testid');
  });

  it('should properly resolve', async () => {
    mockResolve.mockReturnValueOnce({ data: 'data' });
    const result = await controller.resolve({ id: 'testid' });
    expect(mockResolve).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ data: 'data' });
  });
});
