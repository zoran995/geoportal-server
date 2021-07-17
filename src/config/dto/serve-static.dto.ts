import { IsBoolean, IsString } from 'class-validator';
import { NotNull } from 'src/common/validators/not-null.validator';

export class ServeStaticDto {
  /**
   * whether to serve static directory of files
   * @defaultValue `true`
   */
  @IsBoolean()
  @NotNull()
  serveStatic = true;

  /**
   * The index file served at root.
   */
  @IsString()
  @NotNull()
  resolvePathRelativeToWwwroot = '/index.html';
  /**
   * Whether to route unmatched routes to /index.html and let the frontend resolve the route
   */
  @IsBoolean()
  @NotNull()
  resolveUnmatchedPathsWithIndexHtml = false;
}
