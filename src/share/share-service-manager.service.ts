import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ShareGistDto } from './dto/share-gist.dto';
import { ShareS3Dto } from './dto/share-s3.dto';
import { AbstractShareService } from './providers/abstract-share.service';
import { GistShareService } from './providers/gist-share.service';
import { S3ShareService } from './providers/s3-share.service';
import { ShareServiceDtoType } from './types/share-service-dto.type';

@Injectable()
export class ShareServiceManager {
  readonly shareServices: any[] = [];

  constructor(private readonly httpService: HttpService) {}

  /**
   * Check if share service with given id exists in manager
   * @param id ID of the share service
   */
  has(id: string): boolean {
    return !!this.shareServices.find((share) => share.id === id);
  }

  /**
   * Gets registered share service with given id.
   * @param id ID of the share service.
   * @returns instance of the share service.
   * @throws { Error} if share service with given name was not found.
   */
  get(id: string): AbstractShareService<ShareServiceDtoType> {
    const shareService = this.shareServices.find((share) => share.id === id);
    if (!shareService)
      throw new Error(`Share service with id "${id}" was not found`);
    return shareService;
  }

  /**
   * Remove share service from share service manager
   * @param id - id of the service to be removed
   * @returns whether share service is removed
   */
  remove(id: string): boolean {
    const share = this.shareServices.find((service) => service.id === id);
    if (share) {
      this.shareServices.splice(this.shareServices.indexOf(share), 1);
      return true;
    }
    return false;
  }

  /**
   * Creates new instance of share service and registers it in manager.
   * @param options share configuration
   * @returns instance of share service
   * @throws {Error} Unknown share service specified.
   */
  create(
    options: ShareServiceDtoType,
  ): AbstractShareService<ShareServiceDtoType> | never {
    const existingShare = this.shareServices.find(
      (option) => option.id === (options.prefix || 'default'),
    );
    if (existingShare) {
      this.shareServices.splice(this.shareServices.indexOf(existingShare), 1);
    }
    if (options.service === 'gist') {
      const share = new GistShareService(
        <ShareGistDto>options,
        this.httpService,
      );
      this.shareServices.push(share);
      return share;
    } else if (options.service === 's3') {
      const share = new S3ShareService(<ShareS3Dto>options);
      this.shareServices.push(share);
      return share;
    } else {
      throw new Error(
        `Unknown feedback service "${options.service}" specified`,
      );
    }
  }
}
