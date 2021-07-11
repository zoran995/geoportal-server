import { Injectable } from '@nestjs/common';
import { ShareDto } from '../dto/share.dto';

@Injectable()
export abstract class AbstractShareService<T extends ShareDto> {
  readonly id: string;

  constructor(protected readonly config: T) {
    this.id = config.prefix;
  }

  abstract save(data: any): Promise<string>;

  abstract resolve(id: string): Promise<any>;
}
