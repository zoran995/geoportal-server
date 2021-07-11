import { HttpService } from '@nestjs/axios';
import { Test, TestingModule } from '@nestjs/testing';
import { HttpModule } from 'src/http/http.module';
import { ShareGistDto } from './dto/share-gist.dto';
import { ShareS3Dto } from './dto/share-s3.dto';
import { GistShareService } from './providers/gist-share.service';
import { S3ShareService } from './providers/s3-share.service';
import { ShareServiceManager } from './share-service-manager.service';

const gistConf: ShareGistDto = {
  service: 'gist',
  prefix: 'test',
  apiUrl: '',
  accessToken: '',
};

const s3Conf: ShareS3Dto = {
  service: 's3',
  prefix: 's3test',
  region: '',
  bucket: '',
};

const unknownService = {
  service: 'test-unknown',
  id: 'test',
};

const mockHttpPost = jest.fn();

describe('ShareServiceManager', () => {
  let service: ShareServiceManager;
  let httpService: HttpService;
  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [HttpModule],
      providers: [
        {
          provide: HttpService,
          useValue: {
            post: mockHttpPost,
          },
        },
        ShareServiceManager,
      ],
    }).compile();

    service = module.get<ShareServiceManager>(ShareServiceManager);
    httpService = module.get<HttpService>(HttpService);
  });

  afterEach(async () => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('httpService should be defined', () => {
    expect(httpService).toBeDefined();
  });

  it('succesfully create instance and stores it', async () => {
    const share = service.create(gistConf);
    expect(share).toBeInstanceOf(GistShareService);
    expect(service.shareServices).toHaveLength(1);
  });

  it('keep instance stored', () => {
    const exists = service.has(gistConf.prefix);
    expect(exists).toBe(true);
    expect(service.shareServices).toHaveLength(1);
  });

  it('succesfully resolve stored instance', () => {
    const share = service.get(gistConf.prefix);
    expect(share).toBeInstanceOf(GistShareService);
    expect(service.shareServices).toHaveLength(1);
  });

  it('succesfully create service instance and stores it', async () => {
    const share = service.create(s3Conf);
    expect(share).toBeInstanceOf(S3ShareService);
    expect(service.shareServices).toHaveLength(2);
  });

  it('succesfully removes stored instance', () => {
    const removed = service.remove(gistConf.prefix);
    expect(removed).toBeTruthy();
    expect(service.shareServices).toHaveLength(1);
  });

  it("return false when removing service that doesn't exist", () => {
    const removed = service.remove(gistConf.prefix);
    expect(removed).toBe(false);
    expect(service.shareServices).toHaveLength(1);
  });

  it('successfully recreates service instance', () => {
    expect(service.shareServices).toHaveLength(1);
    const share = service.create(s3Conf);
    expect(share).toBeInstanceOf(S3ShareService);
    expect(service.shareServices).toHaveLength(1);
  });

  it("throws an error when getting instance of service that doesn't exist", () => {
    try {
      const share = service.get(gistConf.prefix);
      expect(share).toBeUndefined();
    } catch (err) {
      expect(err).toBeDefined();
      expect(JSON.stringify(err.message)).toContain(gistConf.prefix);
    }
  });

  it('throws an error on unknown service type', () => {
    try {
      const share = service.create(unknownService as any);
      expect(share).toBeUndefined();
    } catch (err) {
      expect(err).toBeDefined();
      expect(JSON.stringify(err.message)).toContain(unknownService.service);
    }
  });
});
