// eslint-disable-next-line @typescript-eslint/no-var-requires
const yargs = require('yargs');
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
import { AppModule } from 'src/app.module';
import { HttpExceptionFilter } from 'src/common/filters/http-exception.filter';
import { InternalServerErrorExceptionFilter } from 'src/common/filters/internal-server-error-exception.filter';
import { NotFoundExceptionFilter } from 'src/common/filters/not-found-exception.filter';
import { WWWROOT_TOKEN } from 'src/config/app-config.module';
import { ServeStaticDto } from 'src/serve-static/dto/serve-static.dto';
import supertest, { SuperAgentTest } from 'supertest';
jest.mock('fs');

const routingOff: Partial<ServeStaticDto> = {
  serveStatic: true,
  resolveUnmatchedPathsWithIndexHtml: false,
};

const routingOn: Partial<ServeStaticDto> = {
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
  './routingOffConfig': JSON.stringify({ serveStatic: routingOff }),
  './routingOnConfig': JSON.stringify({ serveStatic: routingOn }),
  './routingBadPathConfig': JSON.stringify({ serveStatic: routingBadPath }),
  './serveStaticOff': JSON.stringify({ serveStatic: undefined }),
};

vol.fromJSON(volJson);

@Controller('test')
export class TestController {
  @Get('response500')
  redirect() {
    throw new InternalServerErrorException();
  }
}

@Module({
  imports: [AppModule],
  controllers: [TestController],
})
class TestModule {}

async function buildApp(configFile: string, wwwrootPath?: string) {
  if (wwwrootPath) {
    yargs(`--config-file ${configFile} ${wwwrootPath}`);
  } else {
    yargs(`--config-file ${configFile}`);
  }

  const app = await NestFactory.create(TestModule);
  const configService = app.get(ConfigService);
  const wwwroot = app.get(WWWROOT_TOKEN);
  app.useGlobalFilters(
    new HttpExceptionFilter(),
    new InternalServerErrorExceptionFilter(wwwroot),
    new NotFoundExceptionFilter(configService, wwwroot),
  );
  await app.init();

  const agent = supertest.agent(app.getHttpServer());
  return { app, agent };
}

describe('Serve static (e2e)', () => {
  let app: INestApplication;
  let agent: SuperAgentTest;

  describe('should return 404', () => {
    it('with bad wwwroot', async () => {
      ({ app, agent } = await buildApp(
        './routingOffConfig',
        './nonexistentwwwroot',
      ));
      await agent.get('/blah2').expect(404);
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
      await agent
        .get('/actual-html-file.html')
        .expect(200)
        .expect('Content-Type', /html/)
        .then((response) => {
          expect(response.text).toBe(
            fs.readFileSync('./test/mockwwwroot/actual-html-file.html', 'utf8'),
          );
        });
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
    it('should return 404', async () => {
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

    it('should return 500', async () => {
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
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await app?.close();
  });
});
