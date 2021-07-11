import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { isDefined } from 'class-validator';
import { ShareConfigService } from './config/share-config.service';
import { AbstractShareService } from './providers/abstract-share.service';
import { ShareServiceManager } from './share-service-manager.service';
import { ShareServiceDtoType } from './types/share-service-dto.type';

@Injectable()
export class ShareService {
  private readonly logger = new Logger(ShareService.name);

  constructor(
    private readonly configService: ShareConfigService,
    private readonly shareServiceManager: ShareServiceManager,
  ) {}

  /**
   * Save the share data
   * @param body Share data
   * @returns Share id
   */
  async save(body: any): Promise<string> {
    const newSharePrefix = this.configService.newPrefix;
    if (!isDefined(newSharePrefix)) {
      this.logger.error(
        'Share url could not be created. NewSharePrefix is not defined',
      );
      throw new NotFoundException(
        'This server has not been configured to generate new share URLs.',
      );
    }
    if (this.configService.availablePrefixes === undefined) {
      this.logger.warn(
        'This server has not been configured to generate new share URLs.',
      );
      throw new NotFoundException(
        'This server has not been configured to generate new share URLs.',
      );
    }

    const shareService: AbstractShareService<ShareServiceDtoType> =
      this.createOrGetShareService(newSharePrefix);

    return shareService.save(body);
  }

  /**
   * Resolves the share data using id
   * @param id Share id
   * @returns Share data
   */
  async resolve(id: string): Promise<string> {
    const prefix = id.match(splitPrefixRe)[2];
    const shareId = id.match(splitPrefixRe)[3];
    if (!isDefined(prefix) || !isDefined(shareId)) {
      throw new BadRequestException(
        'Share id is not properly formatted (prefix-id)',
      );
    }

    const shareService: AbstractShareService<ShareServiceDtoType> =
      this.createOrGetShareService(prefix);

    return shareService.resolve(shareId);
  }

  private createOrGetShareService(prefix: string) {
    if (!this.shareServiceManager.has(prefix)) {
      const availableConfigs = this.configService.availablePrefixes;
      const shareConfig: ShareServiceDtoType = availableConfigs.find(
        (config) => prefix === config.prefix,
      );

      if (!shareConfig) {
        throw new NotFoundException(
          'This server has not been configured to generate new share URLs.',
        );
      }
      try {
        return this.shareServiceManager.create(shareConfig);
      } catch (err) {
        this.logger.error(
          `An error occurred while getting share configuration`,
          JSON.stringify(err),
        );
        throw new InternalServerErrorException();
      }
    } else {
      return this.shareServiceManager.get(prefix);
    }
  }
}

const splitPrefixRe = /^(([^-]+)-)?(.*)$/;
