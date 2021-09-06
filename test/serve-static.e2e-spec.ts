// eslint-disable-next-line @typescript-eslint/no-var-requires
const yargs = require('yargs');
import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { DirectoryJSON, fs, vol } from 'memfs';
import { AppModule } from 'src/app.module';
import { HttpExceptionFilter } from 'src/common/filters/http-exception.filter';
import { InternalServerErrorExceptionFilter } from 'src/common/filters/internal-server-error-exception.filter';
import { NotFoundExceptionFilter } from 'src/common/filters/not-found-exception.filter';
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
  './mockwwwroot/index.html': '<body>mock index html</body>',
  './mockwwwroot/404.html': '404!',
  './mockwwwroot/actual-json.json': JSON.stringify({}),
  './mockwwwroot/actual-html-file.html': '<body>an actual html file</body>',
  './routingOffConfig': JSON.stringify({ serveStatic: routingOff }),
  './routingOnConfig': JSON.stringify({ serveStatic: routingOn }),
  './routingBadPathConfig': JSON.stringify({ serveStatic: routingBadPath }),
  './serveStaticOff': JSON.stringify({ serveStatic: undefined }),
};

vol.fromJSON(volJson);

async function buildApp(configFile: string, wwwrootPath?: string) {
  if (wwwrootPath) {
    yargs(`--config-file ${configFile} ${wwwrootPath}`);
  } else {
    yargs(`--config-file ${configFile}`);
  }
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();
  const configService = app.get(ConfigService);
  app.useGlobalFilters(
    new HttpExceptionFilter(),
    new InternalServerErrorExceptionFilter(configService),
    new NotFoundExceptionFilter(configService),
  );
  await app.init();

  const agent = supertest.agent(app.getHttpServer());
  return { app, agent };
}

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let agent: SuperAgentTest;

  describe('should return 404', () => {
    it('with bad wwwroot', async () => {
      ({ app, agent } = await buildApp(
        './routingOffConfig',
        './nonexistentwwwroot',
      ));
      agent.get('/blah2').expect(404);
    });

    it('with good wwwroot, specifying invalid path', async () => {
      ({ app, agent } = await buildApp(
        './routingBadPathConfig',
        './mockwwwroot',
      ));
      agent.get('/blah2').expect(404);
    });

    it('when serve static off', async () => {
      ({ app, agent } = await buildApp('./serveStaticOff', './mockwwwroot'));
      agent.get('/blah2').expect(404);
    });
  });

  describe('with routing off', () => {
    it('should return 404', async () => {
      ({ app, agent } = await buildApp('./routingOffConfig', './mockwwwroot'));
      agent.get('/blah2').expect(404);
    });

    it('should return an actual html file', async () => {
      ({ app, agent } = await buildApp('./routingOffConfig', './mockwwwroot'));
      agent
        .get('/actual-html-file.html')
        .expect(200)
        .expect('Content-Type', /html/)
        .then((response) => {
          expect(response.text).toBe(
            fs.readFileSync('./mockwwwroot/actual-html-file.html', 'utf8'),
          );
        });
    });

    it('should return an actual json  file', async () => {
      ({ app, agent } = await buildApp('./routingOffConfig', './mockwwwroot'));
      agent
        .get('/actual-json.json')
        .expect(200)
        .expect('Content-Type', /json/)
        .then((response) => {
          expect(response.text).toBe(
            fs.readFileSync('./mockwwwroot/actual-json.json', 'utf8'),
          );
        });
    });
  });

  describe('with routing on', () => {
    it('should return 404', async () => {
      ({ app, agent } = await buildApp('./routingOnConfig', './mockwwwroot'));
      agent
        .get('/blah2')
        .expect(200)
        .expect('Content-Type', /html/)
        .then((response) => {
          expect(response.text).toBe(
            fs.readFileSync('./mockwwwroot/index.html', 'utf8'),
          );
        });
    });

    it('should return an actual html file', async () => {
      ({ app, agent } = await buildApp('./routingOnConfig', './mockwwwroot'));
      agent
        .get('/actual-html-file.html')
        .expect(200)
        .expect('Content-Type', /html/)
        .then((response) => {
          expect(response.text).toBe(
            fs.readFileSync('./mockwwwroot/actual-html-file.html', 'utf8'),
          );
        });
    });

    it('should return an actual json  file', async () => {
      ({ app, agent } = await buildApp('./routingOnConfig', './mockwwwroot'));
      agent
        .get('/actual-json.json')
        .expect(200)
        .expect('Content-Type', /json/)
        .then((response) => {
          expect(response.text).toBe(
            fs.readFileSync('./mockwwwroot/actual-json.json', 'utf8'),
          );
        });
    });
  });

  afterEach(async () => {
    await app?.close();
  });
});
