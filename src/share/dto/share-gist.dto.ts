import { Equals, IsNotEmpty, IsString, IsUrl } from 'class-validator';
import { NotNull } from 'src/common/validators/not-null.validator';
import { ShareType } from '../types/share.type';
import { ShareDto } from './share.dto';

export class ShareGistDto extends ShareDto {
  @IsString()
  @Equals('gist')
  readonly service: ShareType = 'gist';

  /**
   * Url of gist api.
   */
  @IsUrl()
  apiUrl = 'https://api.github.com/gists';

  /**
   * Github access token with access to create gist.
   */
  @NotNull()
  @IsString()
  @IsNotEmpty()
  accessToken?: string;

  /**
   * User agent HTTP Header to set
   */
  @IsString()
  userAgent?: string = 'TerriaJS-Server';

  /**
   * The filename to give to the gist file
   */
  @IsString()
  @NotNull()
  fileName?: string = 'usercatalog.json';

  /**
   * The description attached to each Gist
   */
  @IsString()
  @NotNull()
  description?: string = 'User-created catalog';
}
