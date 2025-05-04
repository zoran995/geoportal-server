import {
  InternalServerErrorException,
  NotFoundException,
  type ExecutionContext,
} from '@nestjs/common';
import type { Request } from 'express';

import { createMock } from '@golevelup/ts-jest';

import { TestLoggerService } from 'src/infrastructure/logger/test-logger.service.js';
import { shareS3 } from '../../schema/share-s3.schema.js';
import {
  generateShareId,
  idToPath,
  S3ShareService,
} from '../s3-share.service.js';

const mockSave = jest.fn();
const mockResolveObject = jest.fn();

jest.mock('src/infrastructure/aws-sdk/aws-s3.service', () => ({
  AwsS3Service: jest.fn().mockImplementation(() => ({
    save: mockSave,
    resolveObject: mockResolveObject,
  })),
}));

describe('S3ShareService', () => {
  let service: S3ShareService;

  const mockExecutionContext = createMock<ExecutionContext>({
    switchToHttp: () => ({
      getRequest: () =>
        ({
          protocol: 'http',
          path: '/api/share',
          ip: '127.0.0.1',

          headers: {
            host: 'example.co',
          },
        }) as Request,
    }),
  });

  const testData = {
    shareBody: { test: 'test' },
    shareId: 'uTWsg2nu8NqYcGhTAmjRYuRIQpM',
    shareIdObject: 'u/T/uTWsg2nu8NqYcGhTAmjRYuRIQpM',
  };

  const s3Config = shareS3.parse({
    service: 's3',
    prefix: 's3test',
    region: 'test-region',
    bucket: 'test-bucket',
  });

  beforeEach(() => {
    service = new S3ShareService(s3Config, new TestLoggerService());
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should properly initialize the service', () => {
      expect(service).toBeDefined();
    });
  });

  describe('idToPath', () => {
    it('should properly convert id to object path', () => {
      const result = idToPath(testData.shareId);

      expect(result).toBe(testData.shareIdObject);
    });
  });

  describe('generateShareId', () => {
    it('should properly generate share id', () => {
      const result = generateShareId(testData.shareBody);

      expect(result).toBe(testData.shareId);
    });
  });

  describe('save', () => {
    it('should successfully save and return correct id', async () => {
      const req = mockExecutionContext.switchToHttp().getRequest<Request>();
      mockSave.mockResolvedValueOnce({ ETag: 'test-etag' });

      const result = await service.save(testData.shareBody, req);

      expect(mockSave).toHaveBeenCalledTimes(1);
      expect(mockSave).toHaveBeenCalledWith(
        expect.objectContaining({
          Body: JSON.stringify(testData.shareBody),
          Bucket: s3Config.bucket,
        }),
      );
      expect(result).toEqual({
        id: `${s3Config.prefix}-${testData.shareId}`,
        path: `/api/share/${s3Config.prefix}-${testData.shareId}`,
        url: `http://example.co/api/share/${s3Config.prefix}-${testData.shareId}`,
      });
    });

    it('should throw InternalServerErrorException when save fails', async () => {
      const req = mockExecutionContext.switchToHttp().getRequest<Request>();
      mockSave.mockRejectedValueOnce(new Error('S3 Error'));

      await expect(service.save(testData.shareBody, req)).rejects.toThrow(
        InternalServerErrorException,
      );

      expect(mockSave).toHaveBeenCalledTimes(1);
    });
  });

  describe('resolve', () => {
    it('should successfully resolve share by id', async () => {
      mockResolveObject.mockResolvedValueOnce(
        JSON.stringify(testData.shareBody),
      );

      const result = await service.resolve(testData.shareId);

      expect(mockResolveObject).toHaveBeenCalledTimes(1);
      expect(mockResolveObject).toHaveBeenCalledWith({
        Bucket: s3Config.bucket,
        Key: testData.shareIdObject,
      });
      expect(result).toEqual(testData.shareBody);
    });

    it('should throw NotFoundException when resolve fails', async () => {
      mockResolveObject.mockRejectedValueOnce(new Error('S3 Error'));

      await expect(service.resolve(testData.shareId)).rejects.toThrow(
        NotFoundException,
      );

      expect(mockResolveObject).toHaveBeenCalledTimes(1);
    });
  });
});
