import {
  Controller,
  Get,
  INestApplication,
  InternalServerErrorException,
  Module,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';

import { DirectoryJSON, fs, vol } from 'memfs';
import supertest from 'supertest';

import { AppModule } from 'src/app.module.js';
import { HttpExceptionFilter } from 'src/common/filters/http-exception.filter.js';
import { InternalServerErrorExceptionFilter } from 'src/common/filters/internal-server-error-exception.filter.js';
import { NotFoundExceptionFilter } from 'src/common/filters/not-found-exception.filter.js';
import { type ServeStaticType } from 'src/common/schema/index.js';
import { WWWROOT_TOKEN } from 'src/common/utils/index.js';
import type { ConfigurationType } from 'src/modules/config/index.js';

import { NoopLoggerService } from './helpers/noop-logger.service.js';

vi.mock('fs');
vi.mock('src/infrastructure/logger/logger.service');

const routingOff: Partial<ServeStaticType> = {
  serveStatic: true,
  resolveUnmatchedPathsWithIndexHtml: false,
};

const routingOn: Partial<ServeStaticType> = {
  serveStatic: true,
  resolveUnmatchedPathsWithIndexHtml: false,
  resolvePathRelativeToWwwroot: '/index.html',
};

const routingBadPath = {
  resolvePathRelativeToWwwroot: 'does-not-exist.html',
};

const volJson: DirectoryJSON = {
  './test/mockwwwroot/index.html': '<body>mock index html</body>',
  './test/mockwwwroot/404.html': '404!',
  './test/mockwwwroot/500.html': '500!',
  './test/mockwwwroot/actual-json.json': JSON.stringify({}),
  './test/mockwwwroot/actual-html-file.html':
    '<body>an actual html file</body>',
  './test/mockwwwroot/test.geojson': JSON.stringify({ test: 'geojson' }),
  './test/mockwwwroot/test.czml': JSON.stringify({ test: 'czml' }),
  './test/mockwwwroot/test.glsl': JSON.stringify('test'),
  './routingOffConfig': JSON.stringify({ serveStatic: routingOff }),
  './routingOnConfig': JSON.stringify({ serveStatic: routingOn }),
  './routingBadPathConfig': JSON.stringify({ serveStatic: routingBadPath }),
  './serveStaticOff': JSON.stringify({ serveStatic: undefined }),
};

@Controller('test')
export class TestController {
  @Get('response500')
  response500() {
    throw new InternalServerErrorException();
  }

  @Get('responseError')
  responseError() {
    throw new Error('error');
  }
}

@Module({
  imports: [AppModule],
  controllers: [TestController],
})
class TestModule {}

async function buildApp(configFile: string, wwwrootPath?: string) {
  if (wwwrootPath) {
    process.argv.push('--config-file', configFile, '--wwwroot', wwwrootPath);
  } else {
    process.argv.push('--config-file', configFile);
  }

  const app = await NestFactory.create(TestModule);
  const configService: ConfigService<ConfigurationType, true> =
    app.get(ConfigService);
  const wwwroot = app.get(WWWROOT_TOKEN);
  app.useGlobalFilters(
    new HttpExceptionFilter(),
    new InternalServerErrorExceptionFilter(wwwroot),
    new NotFoundExceptionFilter(
      configService.get('serveStatic', { infer: true }),
      wwwroot,
    ),
  );
  app.useLogger(new NoopLoggerService());
  await app.init();

  const agent = supertest.agent(app.getHttpServer());
  return { app, agent };
}

describe.skip('Serve static (e2e)', () => {
  let app: INestApplication;
  let agent: ReturnType<typeof supertest.agent>;
  beforeEach(() => {
    vol.fromJSON(volJson);
  });

  describe('should return 404', () => {
    it('with bad wwwroot', async () => {
      ({ app, agent } = await buildApp(
        './routingOffConfig',
        './nonexistentwwwroot',
      ));
      await agent.get('/blah2').expect(404).expect('Content-Type', /json/);
    });

    it('with good wwwroot, specifying invalid path', async () => {
      ({ app, agent } = await buildApp(
        './routingBadPathConfig',
        './test/mockwwwroot',
      ));
      await agent.get('/blah2').expect(404);
    });

    it('when serve static off', async () => {
      ({ app, agent } = await buildApp(
        './serveStaticOff',
        './test/mockwwwroot',
      ));
      await agent.get('/blah2').expect(404);
    });
  });

  describe('with routing off', () => {
    it('should return 404', async () => {
      ({ app, agent } = await buildApp(
        './routingOffConfig',
        './test/mockwwwroot',
      ));
      await agent.get('/blah2').expect(404);
    });

    it('should return an actual html file', async () => {
      ({ app, agent } = await buildApp(
        './routingOffConfig',
        './test/mockwwwroot',
      ));
      await agent.get('/actual-html-file.html').expect(200);
      // .expect('Content-Type', /html/)
      // .then((response) => {
      //   expect(response.text).toBe(
      //     fs.readFileSync('./test/mockwwwroot/actual-html-file.html', 'utf8'),
      //   );
      // });
    });

    it('should return an actual json file', async () => {
      ({ app, agent } = await buildApp(
        './routingOffConfig',
        './test/mockwwwroot',
      ));
      await agent
        .get('/actual-json.json')
        .expect(200)
        .expect('Content-Type', /json/)
        .then((response) => {
          expect(response.text).toBe(
            fs.readFileSync('./test/mockwwwroot/actual-json.json', 'utf8'),
          );
        });
    });
  });

  describe('with routing on', () => {
    it.only('should return 404', async () => {
      ({ app, agent } = await buildApp(
        './routingOnConfig',
        './test/mockwwwroot',
      ));
      await agent
        .get('/blah2')
        .expect(404)
        .expect('Content-Type', /html/)
        .then((response) => {
          expect(response.text).toBe(
            fs.readFileSync('./test/mockwwwroot/404.html', 'utf8'),
          );
        });
    });

    it('should return an actual html file', async () => {
      ({ app, agent } = await buildApp(
        './routingOnConfig',
        './test/mockwwwroot',
      ));
      const response = await agent
        .get('/actual-html-file.html')
        .expect(200)
        .expect('Content-Type', /html/);
      expect(response.text).toBe(
        fs.readFileSync('./test/mockwwwroot/actual-html-file.html', 'utf8'),
      );
    });

    it('should return an actual json file', async () => {
      ({ app, agent } = await buildApp(
        './routingOnConfig',
        './test/mockwwwroot',
      ));
      const response = await agent
        .get('/actual-json.json')
        .expect(200)
        .expect('Content-Type', /json/);
      expect(response.text).toBe(
        fs.readFileSync('./test/mockwwwroot/actual-json.json', 'utf8'),
      );
    });

    it('should return 500 html when exists', async () => {
      ({ app, agent } = await buildApp(
        './routingOnConfig',
        './test/mockwwwroot',
      ));
      const response = await agent
        .get('/test/response500')
        .expect(500)
        .expect('Content-Type', /html/);
      expect(response.text).toBe(
        fs.readFileSync('./test/mockwwwroot/500.html', 'utf8'),
      );
    });

    it('should return 500', async () => {
      ({ app, agent } = await buildApp(
        './routingOnConfig',
        './test/nonexistentwwwroot',
      ));
      await agent
        .get('/test/response500')
        .expect(500)
        .expect('Content-Type', /json/);
    });

    it('should return 500 error', async () => {
      ({ app, agent } = await buildApp(
        './routingOnConfig',
        './test/mockwwwroot',
      ));
      await agent
        .get('/test/responseError')
        .expect(500)
        .expect('Content-Type', /json/);
    });
  });

  describe('properly set headers', () => {
    it('should return Content-type json for geojson', async () => {
      ({ app, agent } = await buildApp(
        './routingOnConfig',
        './test/mockwwwroot',
      ));
      const response = await agent
        .get('/test.geojson')
        .expect(200)
        .expect('Content-Type', /json/);
      expect(response.text).toBe(
        fs.readFileSync('./test/mockwwwroot/test.geojson', 'utf8'),
      );
    });

    it('should return Content-type json for czml', async () => {
      ({ app, agent } = await buildApp(
        './routingOnConfig',
        './test/mockwwwroot',
      ));
      const response = await agent
        .get('/test.czml')
        .expect(200)
        .expect('Content-Type', /json/);
      expect(response.text).toBe(
        fs.readFileSync('./test/mockwwwroot/test.czml', 'utf8'),
      );
    });

    it('should return Content-type json for czml', async () => {
      ({ app, agent } = await buildApp(
        './routingOnConfig',
        './test/mockwwwroot',
      ));
      const response = await agent
        .get('/test.glsl')
        .expect(200)
        .expect('Content-Type', /^text\/plain/);
      expect(response.text).toBe(
        fs.readFileSync('./test/mockwwwroot/test.glsl', 'utf8'),
      );
    });
  });

  afterEach(async () => {
    // vi.clearAllMocks();
    await app?.close();
  });
});
