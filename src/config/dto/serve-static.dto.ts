import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class ServeStaticDto {
  /**
   * whether to serve static directory of files
   * @defaultValue `true`
   */
  @IsBoolean()
  @IsOptional()
  serveStatic = true;

  /**
   * The index file served at root.
   */
  @IsString()
  @IsOptional()
  resolvePathRelativeToWwwroot = '/index.html';
  /**
   * Whether to route unmatched routes to /index.html and let the frontend resolve the route
   */
  @IsBoolean()
  @IsOptional()
  resolveUnmatchedPathsWithIndexHtml = false;
}
