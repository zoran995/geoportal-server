import {
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';

import { plainToClass } from 'class-transformer';
import { of, throwError } from 'rxjs';

import { ShareGistDto } from '../../dto/share-gist.dto';
import { GistShareService } from '../gist-share.service';

const mockHttpPost = jest.fn();
const mockHttpGet = jest.fn();
const httpServiceMock = {
  get: mockHttpGet,
  post: mockHttpPost,
};

const gistShareConfig = plainToClass(ShareGistDto, {
  service: 'gist',
  prefix: 'test',
  apiUrl: 'http://example.co',
  accessToken: '',
});

describe('GistShareService', () => {
  let service: GistShareService;
  beforeEach(() => {
    service = new GistShareService(gistShareConfig, httpServiceMock as never);
  });

  afterEach(() => {
    mockHttpGet.mockClear();
    mockHttpPost.mockClear();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('save', () => {
    it('should send post request', async () => {
      const responseData = { id: 'test' };
      mockHttpPost.mockReturnValue(of({ data: responseData }));
      const headers = {
        'User-Agent': 'TerriaJS-Server',
        Accept: 'application/vnd.github.v3+json',
        Authorization: `Token ${gistShareConfig.accessToken}`,
      };
      const payload = {
        conf: 'test',
      };
      await service.save(payload);
      expect(mockHttpPost).toBeCalledTimes(1);
      expect(mockHttpPost).toHaveBeenCalledWith(
        gistShareConfig.apiUrl,
        expect.anything(),
        { headers },
      );
    });

    it("don't set authorization header when there is no accessToken", async () => {
      const conf = { ...gistShareConfig };
      conf.accessToken = undefined;
      service = new GistShareService(conf, httpServiceMock as never);
      const responseData = { id: 'test' };
      mockHttpPost.mockReturnValue(of({ data: responseData }));
      const headers = {
        'User-Agent': 'TerriaJS-Server',
        Accept: 'application/vnd.github.v3+json',
      };
      const payload = {
        conf: 'test',
      };
      await service.save(payload);
      expect(mockHttpPost).toBeCalledTimes(1);
      expect(mockHttpPost).toHaveBeenCalledWith(
        gistShareConfig.apiUrl,
        expect.anything(),
        { headers },
      );
    });

    it('should return id', async () => {
      const responseData = { id: 'test' };
      mockHttpPost.mockReturnValue(of({ data: responseData }));
      const result = await service.save({});
      expect(result.id).toBe(`${gistShareConfig.prefix}-${responseData.id}`);
    });

    it('should throw an error when response data is undefined', async () => {
      expect.assertions(2);
      mockHttpPost.mockReturnValue(of({}));
      let result;
      try {
        result = await service.save({});
      } catch (err) {
        expect(result).not.toBeDefined();
        expect(err).toBeInstanceOf(NotFoundException);
      }
    });

    it('should throw error when id is undefined', async () => {
      expect.assertions(2);
      mockHttpPost.mockReturnValue(of({ data: {} }));
      let result;
      try {
        result = await service.save({});
      } catch (err) {
        expect(result).not.toBeDefined();
        expect(err).toBeInstanceOf(NotFoundException);
      }
    });

    it('should throw an InternalServerErrorException on gist api error', async () => {
      expect.assertions(2);
      mockHttpPost.mockReturnValue(throwError(() => new Error('test error')));
      let result;
      try {
        result = await service.save({});
      } catch (err) {
        expect(result).not.toBeDefined();
        expect(err).toBeInstanceOf(InternalServerErrorException);
      }
    });
  });

  describe('resolve', () => {
    it('should send get request', async () => {
      const responseData = {
        files: { '1st': { filename: '1st' }, '2nd': { filename: '2nd' } },
      };
      mockHttpGet.mockReturnValue(of({ data: responseData }));
      const headers = {
        'User-Agent': 'TerriaJS-Server',
        Accept: 'application/vnd.github.v3+json',
        Authorization: `Token ${gistShareConfig.accessToken}`,
      };
      const id = 'test';
      await service.resolve(id);
      expect(mockHttpGet).toBeCalledTimes(1);
      expect(mockHttpGet).toHaveBeenCalledWith(
        gistShareConfig.apiUrl + '/' + id,
        { headers },
      );
    });

    it("don't set authorization header when there is no accessToken", async () => {
      const conf = { ...gistShareConfig };
      conf.accessToken = undefined;
      service = new GistShareService(conf, httpServiceMock as never);
      const responseData = {
        files: { '1st': { filename: '1st' }, '2nd': { filename: '2nd' } },
      };
      mockHttpGet.mockReturnValue(of({ data: responseData }));
      const headers = {
        'User-Agent': 'TerriaJS-Server',
        Accept: 'application/vnd.github.v3+json',
      };
      const id = 'test';
      await service.resolve(id);
      expect(mockHttpGet).toBeCalledTimes(1);
      expect(mockHttpGet).toHaveBeenCalledWith(
        gistShareConfig.apiUrl + '/' + id,
        { headers },
      );
    });

    it('returns a NotFoundException when files undefined', async () => {
      expect.assertions(2);
      const responseData = { files: undefined };
      mockHttpGet.mockReturnValue(of({ data: responseData }));
      const id = 'test';
      let result;
      try {
        result = await service.resolve(id);
      } catch (err) {
        expect(result).not.toBeDefined();
        expect(err).toBeInstanceOf(NotFoundException);
      }
    });

    it('returns a NotFoundException when there is no files saved', async () => {
      expect.assertions(2);
      const responseData = { files: {} };
      mockHttpGet.mockReturnValue(of({ data: responseData }));
      const id = 'test';
      let result;
      try {
        result = await service.resolve(id);
      } catch (err) {
        expect(result).not.toBeDefined();
        expect(err).toBeInstanceOf(NotFoundException);
      }
    });

    it('returns 1st file', async () => {
      const responseData = {
        files: { '1st': { content: '1st' }, '2nd': { content: '2nd' } },
      };
      mockHttpGet.mockReturnValue(of({ data: responseData }));
      const id = 'test';
      const result = await service.resolve(id);
      expect(result).toBe(responseData.files['1st'].content);
    });

    it('should throw an InternalServerErrorException on gist api error', async () => {
      expect.assertions(2);
      mockHttpGet.mockReturnValue(throwError(() => new Error('test error')));
      let result;
      try {
        const id = 'test';
        result = await service.resolve(id);
      } catch (err) {
        expect(result).not.toBeDefined();
        expect(err).toBeInstanceOf(NotFoundException);
      }
    });
  });
});
