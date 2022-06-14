/* eslint-disable @typescript-eslint/ban-types */
import {
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { ShareS3Dto } from '../dto/share-s3.dto';
import { idToObject, S3ShareService, shortId } from './s3-share.service';

const mockSave = jest.fn();
const mockResolveObject = jest.fn();
jest.mock('src/infrastructure/aws-sdk/aws-s3.service', () => {
  return {
    AwsS3Service: jest.fn().mockImplementation(() => ({
      save: mockSave,
      resolveObject: mockResolveObject,
    })),
  };
});

const share_body = { test: 'test' };
const share_id = 'uTWsg2nu8NqYcGhTAmjRYuRIQpM';
const share_idObject = 'u/T/uTWsg2nu8NqYcGhTAmjRYuRIQpM';

const s3shareConfig = plainToClass(ShareS3Dto, {
  service: 's3',
  prefix: 's3test',
  region: '',
  bucket: '',
});

describe('GistShareService', () => {
  let service: S3ShareService;
  beforeEach(() => {
    service = new S3ShareService(s3shareConfig);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('properly generates id', () => {
    const id = shortId(share_body, 200);
    expect(id).toEqual(share_id);
  });

  it('properly converts id to object', () => {
    const idObject = idToObject(share_id);
    expect(idObject).toEqual(share_idObject);
  });

  describe('save', () => {
    it('should save and return id', async () => {
      mockSave.mockImplementationOnce(() => Promise.resolve('test'));
      const result = await service.save(share_body);
      expect(mockSave).toHaveBeenCalledTimes(1);
      expect(result.id).toEqual(`${s3shareConfig.prefix}-${share_id}`);
    });

    it('should return InternalServerErrorException on s3 error', async () => {
      mockSave.mockImplementationOnce(() => Promise.reject('test'));
      let result;
      try {
        result = await service.save({});
      } catch (err) {
        expect(mockSave).toHaveBeenCalledTimes(1);
        expect(result).not.toBeDefined();
        expect(err).toBeInstanceOf(InternalServerErrorException);
      }
    });
  });

  describe('resolve', () => {
    it('should resolve id', async () => {
      mockResolveObject.mockImplementationOnce(() =>
        Promise.resolve(share_body),
      );
      const result = await service.resolve(share_id);
      expect(mockResolveObject).toHaveBeenCalledTimes(1);
      expect(result).toEqual(share_body);
    });
  });

  it('should return NotFoundException on s3 error', async () => {
    mockResolveObject.mockImplementationOnce(() => Promise.reject('test'));
    let result;
    try {
      result = await service.resolve(share_id);
    } catch (err) {
      expect(mockResolveObject).toHaveBeenCalledTimes(1);
      expect(result).not.toBeDefined();
      expect(err).toBeInstanceOf(NotFoundException);
    }
  });
});
