import { HttpService } from '@nestjs/axios';
import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { of } from 'rxjs';
import { ShareConfigService } from './config/share-config.service';
import { ShareConfigDto } from './dto/share.config.dto';
import { ShareServiceManager } from './share-service-manager.service';
import { ShareService } from './share.service';

const mockHttpPost = jest.fn();
const mockHttpGet = jest.fn();
const configGet = jest.fn();

class ConfigServiceMock {
  get = configGet;
}

class HttpServiceMock {
  post = mockHttpPost;
  get = mockHttpGet;
}

const shareConfig: ShareConfigDto = {
  newPrefix: 'test',
  maxRequestSize: 200,
  availablePrefixes: [
    {
      service: 'gist',
      prefix: 'test',
      apiUrl: 'http://example.co',
      accessToken: '',
    },
  ],
};

describe('ShareService', () => {
  let service: ShareService;
  let shareConfigService: ShareConfigService;
  let shareServiceManager: ShareServiceManager;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ConfigModule, ShareService],
      providers: [
        {
          provide: ConfigService,
          useClass: ConfigServiceMock,
        },
        ShareConfigService,
        ShareServiceManager,
        ShareService,
        {
          provide: HttpService,
          useClass: HttpServiceMock,
        },
      ],
    }).compile();

    service = module.get(ShareService);
    shareConfigService = module.get<ShareConfigService>(ShareConfigService);
    shareServiceManager = module.get<ShareServiceManager>(ShareServiceManager);
  });

  afterEach(async () => {
    jest.clearAllMocks();
    configGet.mockClear();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('shareConfigService should be defined', () => {
    expect(shareConfigService).toBeDefined();
  });

  it('shareServiceManager should be defined', () => {
    expect(shareServiceManager).toBeDefined();
  });

  describe('save', () => {
    it('should throw a NotFoundException when newPrefix is not specified in config', async () => {
      const shareConf = { ...shareConfig };
      shareConf.newPrefix = undefined;
      configGet.mockReturnValue(shareConf);
      try {
        await service.save({});
      } catch (err) {
        expect(err).toBeInstanceOf(NotFoundException);
      }
    });

    it('should throw a NotFoundException when there is availablePrefixes configured', async () => {
      const shareConf = { ...shareConfig };
      shareConf.availablePrefixes = undefined;
      configGet.mockReturnValue(shareConf);
      try {
        await service.save({});
      } catch (err) {
        expect(err).toBeInstanceOf(NotFoundException);
      }
    });

    it('properly saves', async () => {
      configGet.mockReturnValue(shareConfig);
      mockHttpPost.mockReturnValue(of({ data: { id: 'test' } }));
      const shareServiceSpy = jest.spyOn(service, 'save');
      const result = await service.save({});
      expect(shareServiceSpy).toHaveBeenCalledTimes(1);
      expect(result).toBe('test');
    });

    it('should reuse connection', async () => {
      configGet.mockReturnValue(shareConfig);
      const shareServiceSpy = jest.spyOn(service, 'save');
      const shareManagerHasSpy = jest.spyOn(shareServiceManager, 'has');

      const shareManagerGetSpy = jest.spyOn(shareServiceManager, 'get');
      const shareManagerCreateSpy = jest.spyOn(shareServiceManager, 'create');
      mockHttpPost.mockReturnValue(of({ data: { id: 'test' } }));
      await service.save({});

      expect(shareServiceSpy).toHaveBeenCalledTimes(1);
      expect(shareManagerHasSpy).toHaveBeenCalledTimes(1);
      expect(shareManagerCreateSpy).toHaveBeenCalledTimes(1);
      expect(shareManagerGetSpy).not.toHaveBeenCalled();

      await service.save({});
      expect(shareServiceSpy).toHaveBeenCalledTimes(2);
      expect(shareManagerHasSpy).toHaveBeenCalledTimes(2);
      expect(shareManagerCreateSpy).toHaveBeenCalledTimes(1);
      expect(shareManagerGetSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('resolve', () => {
    it('throws an error when id is in form prefix-id', async () => {
      let result;
      try {
        result = await service.resolve('testId');
      } catch (err) {
        expect(result).toBeUndefined();
        expect(err).toBeInstanceOf(BadRequestException);
      }
    });

    it('properly resolves ', async () => {
      const data = { files: [{ content: 'test' }] };
      configGet.mockReturnValue(shareConfig);
      mockHttpGet.mockReturnValue(of({ data }));
      const result = await service.resolve('test-id');
      expect(result).toBe(data.files[0].content);
    });

    it('throws a NotFoundException on unknown prefix ', async () => {
      const data = { files: [{ content: 'test' }] };
      configGet.mockReturnValue(shareConfig);
      mockHttpGet.mockReturnValue(of({ data }));
      let result;
      try {
        result = await service.resolve('test1-id');
      } catch (err) {
        expect(result).toBeUndefined();
        expect(err).toBeInstanceOf(NotFoundException);
      }
    });

    it('should reuse connection', async () => {
      const data = { files: [{ content: 'test' }] };
      configGet.mockReturnValue(shareConfig);
      const shareServiceSpy = jest.spyOn(service, 'resolve');
      const shareManagerHasSpy = jest.spyOn(shareServiceManager, 'has');

      const shareManagerGetSpy = jest.spyOn(shareServiceManager, 'get');
      const shareManagerCreateSpy = jest.spyOn(shareServiceManager, 'create');
      mockHttpPost.mockReturnValue(of({ data }));
      await service.resolve('test-id');

      expect(shareServiceSpy).toHaveBeenCalledTimes(1);
      expect(shareManagerHasSpy).toHaveBeenCalledTimes(1);
      expect(shareManagerCreateSpy).toHaveBeenCalledTimes(1);
      expect(shareManagerGetSpy).not.toHaveBeenCalled();

      await service.resolve('test-id1');
      expect(shareServiceSpy).toHaveBeenCalledTimes(2);
      expect(shareManagerHasSpy).toHaveBeenCalledTimes(2);
      expect(shareManagerCreateSpy).toHaveBeenCalledTimes(1);
      expect(shareManagerGetSpy).toHaveBeenCalledTimes(1);
    });
  });

  it('should throw InternalServerErrorException when unknown service', async () => {
    const shareConf = { ...shareConfig };
    (<any>shareConf.availablePrefixes[0]).service = 'test';
    configGet.mockReturnValue(shareConf);
    try {
      await service.save({});
    } catch (err) {
      expect(err).toBeInstanceOf(InternalServerErrorException);
    }
  });
});
