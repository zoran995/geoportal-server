import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ShareGistDto } from '../dto/share-gist.dto';
import { ShareS3Dto } from '../dto/share-s3.dto';
import { ShareConfigDto } from '../dto/share.config.dto';

@Injectable()
export class ShareConfigService {
  constructor(private readonly configService: ConfigService) {}

  get availablePrefixes(): (ShareGistDto | ShareS3Dto)[] {
    return this.shareConfig.availablePrefixes;
  }

  get newPrefix(): string {
    return this.shareConfig.newPrefix;
  }

  get maxRequestSize(): number {
    return this.shareConfig.maxRequestSize;
  }

  private get shareConfig(): ShareConfigDto {
    return this.configService.get('share');
  }
}
