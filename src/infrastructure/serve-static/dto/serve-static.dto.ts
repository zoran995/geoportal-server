import { z } from 'zod';

export const serveStatic = z.object({
  /**
   * whether to serve static directory of files
   * @defaultValue `true`
   */
  serveStatic: z.boolean().default(true),
  /**
   * The index file served at root.
   */
  resolvePathRelativeToWwwroot: z.string().default('/index.html'),
  /**
   * Whether to route unmatched routes to /index.html and let the frontend resolve the route
   */
  resolveUnmatchedPathsWithIndexHtml: z.boolean().default(false),
});

export type ServeStaticType = z.infer<typeof serveStatic>;
