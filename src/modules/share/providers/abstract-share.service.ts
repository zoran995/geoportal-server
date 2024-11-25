import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';

import { ShareType } from '../config/schema/share.schema';
import { ShareResult } from '../interfaces/save-share-response.interface';
import type { LoggerService } from 'src/infrastructure/logger';

interface IShareProvider {
  save(data: ShareData): Promise<ShareResult>;
  resolve(id: string): Promise<ShareData>;
  validate(): Promise<boolean>;
}

@Injectable()
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
   * @param data - share data
   * @returns id of saved share data
   */
  abstract save(data: Record<string, unknown>): Promise<ShareResult>;

  /**
   * @param id - Share ID
   * @returns Resolve share data
   */
  abstract resolve(id: string): Promise<Record<string, unknown>>;

  async validate(): Promise<boolean> {
    return Promise.resolve(true);
  }

  protected handleError(error: Error): never {
    this.logger.error(`Share provider error: ${error.message}`);
    if (error instanceof NotFoundException) {
      throw error;
    }
    throw new InternalServerErrorException('Share operation failed');
  }
}
