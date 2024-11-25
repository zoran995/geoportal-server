import {
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { shareGist } from '../../config/schema/share-gist.schema';
import { GistShareService } from '../gist-share.service';
import { TestLoggerService } from 'src/infrastructure/logger/test-logger.service';

describe('GistShareService', () => {
  let service: GistShareService;
  let httpServiceMock: { get: jest.Mock; post: jest.Mock };
  let gistShareConfig: any;

  const defaultHeaders = {
    'User-Agent': 'TerriaJS-Server',
    Accept: 'application/vnd.github.v3+json',
  };

  beforeEach(() => {
    httpServiceMock = {
      get: jest.fn(),
      post: jest.fn(),
    };

    gistShareConfig = shareGist.parse({
      service: 'gist',
      prefix: 'test',
      apiUrl: 'http://example.co',
      accessToken: 'aa',
    });

    service = new GistShareService(
      gistShareConfig,
      httpServiceMock as never,
      new TestLoggerService(),
    );
  });

  describe('save', () => {
    describe('when saving successfully', () => {
      it('should send post request with correct headers and auth token', async () => {
        httpServiceMock.post.mockReturnValue(of({ data: { id: 'test' } }));

        await service.save({ conf: 'test' });

        expect(httpServiceMock.post).toHaveBeenCalledWith(
          gistShareConfig.apiUrl,
          expect.anything(),
          {
            headers: {
              ...defaultHeaders,
              Authorization: `Token ${gistShareConfig.accessToken}`,
            },
          },
        );
      });

      it('should return prefixed id', async () => {
        httpServiceMock.post.mockReturnValue(of({ data: { id: 'testId' } }));

        const result = await service.save({ conf: 'test' });

        expect(result.id).toBe(`${gistShareConfig.prefix}-${'testId'}`);
      });
    });

    describe('when access token is not provided', () => {
      beforeEach(() => {
        const conf = { ...gistShareConfig, accessToken: undefined };
        service = new GistShareService(
          conf,
          httpServiceMock as never,
          new TestLoggerService(),
        );
      });

      it('should not include authorization header', async () => {
        httpServiceMock.post.mockReturnValue(of({ data: { id: 'test' } }));

        await service.save({ conf: 'test' });

        expect(httpServiceMock.post).toHaveBeenCalledWith(
          gistShareConfig.apiUrl,
          expect.anything(),
          { headers: defaultHeaders },
        );
      });
    });

    describe('when errors occur', () => {
      it('should throw NotFoundException when response data is missing', async () => {
        httpServiceMock.post.mockReturnValue(of({}));

        await expect(service.save({ conf: 'test' })).rejects.toThrow(
          NotFoundException,
        );
      });

      it('should throw NotFoundException when id is missing', async () => {
        httpServiceMock.post.mockReturnValue(of({ data: {} }));

        await expect(service.save({ conf: 'test' })).rejects.toThrow(
          NotFoundException,
        );
      });

      it('should throw InternalServerErrorException on API error', async () => {
        httpServiceMock.post.mockReturnValue(
          throwError(() => new Error('test error')),
        );

        await expect(service.save({ conf: 'test' })).rejects.toThrow(
          InternalServerErrorException,
        );
      });
    });
  });

  describe('resolve', () => {
    describe('when resolving successfully', () => {
      it('should send get request with correct headers and auth token', async () => {
        httpServiceMock.get.mockReturnValue(
          of({ data: { files: { '1st': 'first file' } } }),
        );

        await service.resolve('test');

        expect(httpServiceMock.get).toHaveBeenCalledWith(
          `${gistShareConfig.apiUrl}/${'test'}`,
          {
            headers: {
              ...defaultHeaders,
              Authorization: `Token ${gistShareConfig.accessToken}`,
            },
          },
        );
      });

      it('should return first file content', async () => {
        httpServiceMock.get.mockReturnValue(
          of({
            data: {
              files: {
                '1st': { content: '1st file content' },
                '2nd': { content: '2nd' },
              },
            },
          }),
        );

        const result = await service.resolve('test');

        expect(result).toBe('1st file content');
      });
    });

    describe('when errors occur', () => {
      it('should throw NotFoundException when files are undefined', async () => {
        httpServiceMock.get.mockReturnValue(of({ data: { files: undefined } }));

        await expect(service.resolve('test')).rejects.toThrow(
          NotFoundException,
        );
      });

      it('should throw NotFoundException when files are empty', async () => {
        httpServiceMock.get.mockReturnValue(of({ data: { files: {} } }));

        await expect(service.resolve('test')).rejects.toThrow(
          NotFoundException,
        );
      });

      it('should throw NotFoundException on API error', async () => {
        httpServiceMock.get.mockReturnValue(
          throwError(() => new Error('test error')),
        );

        await expect(service.resolve('test')).rejects.toThrow(
          NotFoundException,
        );
      });
    });
  });
});
