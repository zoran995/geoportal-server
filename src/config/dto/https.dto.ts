import { HttpsOptions } from '@nestjs/common/interfaces/external/https-options.interface';
import {
  IsBoolean,
  IsObject,
  IsOptional,
  ValidateNested,
} from 'class-validator';

export class HttpsDto {
  /**
   * Name and location of ssl keys.
   * @example
   * You can make self-signed certs for testing like:
   * ```
   * openssl req -nodes -new -x509 -keyout key.pem -out cert.pem
   * ```
   */
  @IsObject()
  @IsOptional()
  @ValidateNested()
  httpsOptions: HttpsOptions;

  /**
   * True to automatically redirect `http` requests to `https`. If `trustProxy`
   * is defined, the protocol will be determined from the `X-Forwarded-Proto`
   * header if it exists. The default is false.
   */
  @IsBoolean()
  @IsOptional()
  redirectToHttps = false;
}
