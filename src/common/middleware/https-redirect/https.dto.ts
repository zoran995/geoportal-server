import {
  IsArray,
  IsBoolean,
  IsObject,
  IsString,
  ValidateNested,
} from 'class-validator';
import { NotNull } from '../../validators/not-null.validator';

export class HttpsOptionsDto {
  /**
   * Private key in PEM format. PEM allows the option of private key being encrypted.
   * Encrypted keys will be decrypted with passphrase if provided.
   */
  @IsString()
  keyPath!: string;
  /**
   * Shared passphrase used for a single private key and/or a PFX.
   */
  @IsString()
  @NotNull()
  passphrase?: string;
  /**
   * Path to cert chain in PEM format for provided private key, followed by the PEM
   * formatted intermediate certificates (if any), in order, and not including the root CA.
   * If the intermediate certificates are not provided, the peer will not be able to validate
   * the certificate, and the handshake will fail.
   */
  @IsString()
  certPath!: string;
}

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
  @NotNull()
  @ValidateNested()
  httpsOptions?: HttpsOptionsDto;

  /**
   * True to automatically redirect `http` requests to `https`. If `trustProxy`
   * is defined, the protocol will be determined from the `X-Forwarded-Proto`
   * header if it exists. The default is false.
   */
  @IsBoolean()
  @NotNull()
  redirectToHttps = false;

  /**
   * The list of hosts for which `http` access is allowed, even if `redirectToHttps` is true.
   * This is mostly useful to allow non-https access to localhost in development.
   * The default is `["localhost"]`.
   */
  @IsArray()
  @IsString({ each: true })
  @NotNull()
  httpAllowedHosts: string[] = ['localhost'];

  /**
   * The `Strict-Transport-Security` header value to include in https responses
   * when `{ @link HttpsDto.redirectToHttps }` is enabled. Ignored if
   * `{ @link HttpsDto.redirectToHttps }` is false.
   */
  @IsString()
  @NotNull()
  strictTransportSecurity?: string;
}
