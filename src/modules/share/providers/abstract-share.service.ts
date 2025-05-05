import type { Request } from 'express';

import type { LoggerService } from 'src/infrastructure/logger/index.js';

import { ShareType } from '../schema/share.schema.js';
import { ShareResult } from '../interfaces/save-share-response.interface.js';

interface IShareProvider {
  save(data: ShareData, req: Request): Promise<ShareResult>;
  resolve(id: string): Promise<ShareData>;
}

/**
 * Abstract base class for share providers
 * @template T - The share configuration type
 */
export abstract class AbstractShareService<T extends ShareType = ShareType>
  implements IShareProvider
{
  readonly prefix: string;

  constructor(
    protected readonly config: T,
    protected readonly logger: LoggerService,
  ) {
    this.prefix = config.prefix;
  }

  /**
   * @param data - The data to be shared
   * @param req - Express request object
   * @returns Promise containing share result with ID, path and url
   * @throws {InternalServerErrorException} If save operation fails
   */
  abstract save(
    data: Record<string, unknown>,
    req: Request,
  ): Promise<ShareResult>;

  /**
   * @param id - Share ID
   * @returns Resolve share data
   * @throws {NotFoundException} If share not found
   */
  abstract resolve(id: string): Promise<Record<string, unknown>>;

  protected buildResponse(id: string, req: Request): ShareResult {
    const shareId = `${this.prefix}-${id}`;
    const url = `${req.protocol}://${req.headers.host}${req.path}/${shareId}`;
    return {
      id: `${shareId}`,
      path: `${req.path}/${shareId}`,
      url,
    };
  }
}
