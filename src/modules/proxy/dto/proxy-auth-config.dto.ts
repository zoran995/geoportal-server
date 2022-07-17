import { Type } from 'class-transformer';
import { IsArray, IsOptional, IsString, ValidateNested } from 'class-validator';

export class ProxyAuthConfigDto {
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProxyAuthHeaders)
  headers?: ProxyAuthHeaders[];

  @IsString()
  @IsOptional()
  authorization?: string;
}

class ProxyAuthHeaders {
  @IsString()
  name!: string;
  @IsString()
  value!: string;
}
