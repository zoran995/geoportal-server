import { Logger } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import {
  IsAlphanumeric,
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsPositive,
  ValidateNested,
  validateSync,
} from 'class-validator';
import { ValidationErrorsFormatter } from 'src/common/validators/validation-errors.formater';
import { FeedbackConfigDto } from 'src/feedback/dto/feedback.config.dto';
import { ProxyConfigDto } from 'src/proxy/dto/proxy-config.dto';
import { ShareConfigDto } from 'src/share/dto/share.config.dto';
import { HttpsDto } from '../dto/Https.dto';
import { ServeStaticDto } from '../dto/serve-static.dto';

/* enum Environment {Development = 'development', Production = 'production',
  Test = 'test', Provision = 'provision',
} */

export type ConfigurationType =
  | 'configFile'
  | 'port'
  | 'initPaths'
  | 'feedback'
  | 'share';

class RateLimitDto {
  /**
   * The number of retries the user gets before they need to start waiting.
   */
  @IsNumber()
  @IsOptional()
  freeRetries? = 2;

  /**
   * The initial wait time (in milliseconds) after the free retries above.
   */
  @IsNumber()
  @IsOptional()
  minWait? = 200;
  /**
   * The maximum time that the user will need to wait.
   */
  @IsNumber()
  @IsOptional()
  maxWait? = 6000;
}

export class BasicAuthenticationDto {
  /**
   * Username of the user that is used for login.
   */
  @IsAlphanumeric()
  @IsNotEmpty()
  username: string;

  /**
   * Password of the user that is used for login.
   */
  @IsAlphanumeric()
  @IsNotEmpty()
  password: string;

  /**
   * Rate limits basic authentication requests. Note that this uses simple
   * in-memory storage of requests, which means that the actual allowed rate
   * will be higher when multiple terriajs-server processes. The first two wait
   * times after `freeRetries` are `minWait`. Successive wait times are the sum
   * of the two previous wait times, up to `maxWait`.
   */
  @IsObject()
  @IsOptional()
  @ValidateNested()
  rateLimit?: RateLimitDto;
}

export class ConfigurationVariables {
  /* @IsEnum(Environment) NODE_ENV: Environment; */

  /**
   * Use the compression middleware package to enable gzip compression of
   * responses. For high-traffic websites in production, it is strongly
   * recommended to offload compression from the application server typically in
   * a reverse proxy (e.g., Nginx). In that case, you should not use compression
   * middleware.
   */
  @IsBoolean()
  @IsOptional()
  compressResponse = true;

  @IsObject()
  @IsOptional()
  @ValidateNested()
  basicAuthentication?: BasicAuthenticationDto;

  /**
   * Port to listen on. Overridden by the --port command line setting.
   */
  @IsNumber()
  @IsPositive()
  @IsOptional()
  port = 3001;

  /**
   * List of directories where init (catalog) files will be sought, before
   * defaulting to wwwroot/init. This helps with managing catalog files
   * separately from the main codebase.
   */
  @IsArray()
  initPaths: string[] = [];

  /**
   * Configuration for the share service. If not defined share service will be
   * disabled.
   */
  @IsObject()
  @IsOptional()
  @ValidateNested()
  share?: ShareConfigDto;

  /**
   * Configuration for the feedback service. If not defined feedback service
   * will be disabled.
   * @example
   * This service accepts posted JSON like
   * ```
   * {
   *   "name":"My Name",
   *   "email":"myemail@example.com",
   *   "comment":"This thing is so great! yeah!"
   * }
   * ```
   */
  @IsObject()
  @IsOptional()
  @ValidateNested()
  feedback?: FeedbackConfigDto;

  /**
   * Configuration for the proxy service.
   */
  @IsObject()
  @IsOptional()
  @ValidateNested()
  proxy?: ProxyConfigDto = new ProxyConfigDto();

  /**
   * The value of the Express "trust proxy" application setting. Set this to
   * true if you want to provide publicly usable URLs behind a reverse proxy For
   * more details read
   * {@link http://expressjs.com/en/guide/behind-proxies.html | express behind proxies}
   * {@link http://expressjs.com/en/api.html#trust.proxy.options.table}
   */
  trustProxy: boolean | string | string[] | number = false;

  /**
   * Configuration for the https
   */
  @IsObject()
  @IsOptional()
  @ValidateNested()
  https?: HttpsDto = undefined;

  /**
   * Configuration for serving static files.
   * {@link ServeStaticDto}
   */
  @IsObject()
  @IsOptional()
  @ValidateNested()
  serveStatic: ServeStaticDto = new ServeStaticDto();
}

export function validate(config: Record<string, unknown>) {
  const logger = new Logger('Config validation');
  const validatedConfig = plainToClass(ConfigurationVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });
  if (errors.length > 0) {
    logger.error(ValidationErrorsFormatter.format(errors));
    throw new Error('Configuration validation failed.');
  }

  return validatedConfig;
}
