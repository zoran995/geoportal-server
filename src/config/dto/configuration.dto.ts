import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsObject,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { NotNull } from 'src/common/validators/not-null.validator';
import { FeedbackConfigDto } from 'src/feedback/dto/feedback.config.dto';
import { ProxyConfigDto } from 'src/proxy/dto/proxy-config.dto';
import { ServeStaticDto } from 'src/serve-static/dto/serve-static.dto';
import { ShareConfigDto } from 'src/share/dto/share.config.dto';
import { BasicAuthenticationDto } from './basic-authentication.dto';

export class ConfigurationDto {
  /* @IsEnum(Environment) NODE_ENV: Environment; */

  /**
   * Use the compression middleware package to enable gzip compression of
   * responses. For high-traffic websites in production, it is strongly
   * recommended to offload compression from the application server typically in
   * a reverse proxy (e.g., Nginx). In that case, you should not use compression
   * middleware.
   */
  @IsBoolean()
  @NotNull()
  compressResponse = true;

  @IsObject()
  @NotNull()
  @ValidateNested()
  basicAuthentication?: BasicAuthenticationDto;

  /**
   * Port to listen on. Overridden by the --port command line setting.
   */
  @IsNumber()
  @Min(0)
  @Max(65535)
  @NotNull()
  port = 3001;

  /**
   * List of directories where init (catalog) files will be sought, before
   * defaulting to wwwroot/init. This helps with managing catalog files
   * separately from the main codebase.
   */
  @IsArray()
  @IsString({ each: true })
  @NotNull()
  initPaths: string[] = [];

  /**
   * Configuration for the share service. If not defined share service will be
   * disabled.
   */
  @IsObject()
  @NotNull()
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
  @NotNull()
  @ValidateNested()
  feedback?: FeedbackConfigDto;

  /**
   * Configuration for the proxy service.
   */
  @IsObject()
  @NotNull()
  @ValidateNested()
  proxy: ProxyConfigDto = new ProxyConfigDto();

  /**
   * The value of the Express "trust proxy" application setting. Set this to
   * true if you want to provide publicly usable URLs behind a reverse proxy For
   * more details read
   * {@link http://expressjs.com/en/guide/behind-proxies.html | express behind proxies}
   * {@link http://expressjs.com/en/api.html#trust.proxy.options.table}
   */
  @NotNull()
  trustProxy: boolean | string | string[] | number = false;

  /**
   * Configuration for serving static files.
   * {@link ServeStaticDto}
   */
  @IsObject()
  @NotNull()
  @ValidateNested()
  serveStatic: ServeStaticDto = new ServeStaticDto();
}
