import {
  Equals,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
} from 'class-validator';
import { ShareType } from '../types/share.type';
import { ShareDto } from './share.dto';

export class ShareGistDto extends ShareDto {
  @IsString()
  @Equals('gist')
  readonly service: ShareType = 'gist';

  @IsUrl()
  apiUrl = 'https://api.github.com/gists';

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  accessToken?: string;

  @IsString()
  userAgent?: string = 'TerriaJS-Server';

  @IsString()
  @IsOptional()
  fileName?: string = 'usercatalog.json';

  @IsString()
  description?: string = 'User-created catalog';
}
