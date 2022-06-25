import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { Test, TestingModule } from '@nestjs/testing';
import { mockClient } from 'aws-sdk-client-mock';
import { Readable } from 'stream';
import { AwsS3Service } from './aws-s3.service';
jest.mock('src/common/logger/logger.service');

const s3Mock = mockClient(S3Client);

describe('AwsSdkService', () => {
  let service: AwsS3Service;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AwsS3Service],
    }).compile();

    service = module.get<AwsS3Service>(AwsS3Service);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('save', () => {
    it('should properly save', async () => {
      const value = 'fake response';
      s3Mock.on(PutObjectCommand).resolves(value as any);
      const response = await service.save({
        Bucket: 'aaa',
        Key: 'test-key',
        Body: 'test',
      });
      expect(response).toEqual(value);
    });

    it('should properly handle error', async () => {
      expect.assertions(1);
      const value = {
        message: 'fake error',
      };
      s3Mock.on(PutObjectCommand).rejects(value);
      try {
        await service.save({
          Bucket: 'aaa',
          Key: 'test-key',
          Body: 'test',
        });
      } catch (err) {
        expect(JSON.stringify(err)).toContain(JSON.stringify(value));
      }
    });
  });

  describe('resolve', () => {
    it('should properly resolve object', async () => {
      const value = 'fake key';
      const buf = Buffer.from(value);
      const stream = Readable.from(buf);
      s3Mock.on(GetObjectCommand).resolves({ Body: stream });
      const response = await service.resolveObject({
        Bucket: 'aaa',
        Key: 'test-key',
      });
      expect(response).toEqual(value);
    });

    it('should properly handle error while resolving', async () => {
      expect.assertions(1);
      const value = {
        message: 'fake error',
      };
      s3Mock.on(GetObjectCommand).rejects(value);
      try {
        await service.resolveObject({
          Bucket: 'aaa',
          Key: 'test-key',
        });
      } catch (err) {
        expect(JSON.stringify(err)).toContain(JSON.stringify(value));
      }
    });
  });
});
