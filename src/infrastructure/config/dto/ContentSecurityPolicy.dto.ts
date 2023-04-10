import { IsArray, IsString } from 'class-validator';
import { NotNull } from 'src/common/validators';

export class ContentSecurityPolicyDto {
  @IsArray()
  @IsString({ each: true })
  @NotNull()
  scriptSrc: string[] = ["'self'", "'unsafe-inline'", "'unsafe-eval'"];

  @IsArray()
  @IsString({ each: true })
  @NotNull()
  connectSrc: string[] = ['*'];

  @IsArray()
  @IsString({ each: true })
  @NotNull()
  imgSrc: string[] = ['self', 'data:', '*'];

  @IsArray()
  @IsString({ each: true })
  @NotNull()
  frameSrc: string[] = [];

  @IsArray()
  @IsString({ each: true })
  @NotNull()
  frameAncestors: string[] = [];
}
