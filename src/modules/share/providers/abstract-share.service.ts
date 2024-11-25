import { Injectable } from '@nestjs/common';

import { ShareType } from '../dto/share.dto';
import { ISaveShareResponse } from '../interfaces/save-share-response.interface';

@Injectable()
export abstract class AbstractShareService<T extends ShareType> {
  readonly id: string;

  constructor(protected readonly config: T) {
    this.id = config.prefix;
  }

  /**
   * @param data - share data
   * @returns id of saved share data
   */
  abstract save(data: Record<string, unknown>): Promise<ISaveShareResponse>;

  /**
   * @param id - Share ID
   * @returns Resolve share data
   */
  abstract resolve(id: string): Promise<Record<string, unknown>>;
}
