import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { AppModule } from 'src/app.module.js';

describe('Proj4 endpoint (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  it('should return the correct proj4 definition', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/proj4def/epsg:4326')
      .expect(200);

    expect(response.type).toEqual('text/plain');
    expect(response.text).toEqual('+proj=longlat +datum=WGS84 +no_defs');
  });

  it('should return 400 on string EPSG code', async () => {
    await request(app.getHttpServer())
      .get('/api/proj4def/epsg:test')
      .expect(400);
  });

  it('should return 404 when definition is not found', async () => {
    await request(app.getHttpServer())
      .get('/api/proj4def/epsg:999999')
      .expect(404);
  });
});
