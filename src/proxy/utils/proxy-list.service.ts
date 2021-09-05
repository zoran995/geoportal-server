import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import * as fs from 'fs';
import { inRange } from 'range_check';
import { isDefined } from 'src/common/helpers/isDefined';
import { LoggerService } from 'src/common/logger/logger.service';
import { ProxyConfigService } from '../config/proxy-config.service';

@Injectable()
export class ProxyListService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new LoggerService(ProxyListService.name);
  #blacklist: string[] = [];
  #whitelist: string[] = [];
  private whitelistWatcher: fs.FSWatcher | undefined;
  private blacklistWatcher: fs.FSWatcher | undefined;

  constructor(private readonly configService: ProxyConfigService) {}

  get blacklist() {
    return this.#blacklist;
  }

  get whitelist() {
    return this.#whitelist;
  }

  onModuleInit() {
    this.setBlacklist();
    this.setWhitelist();
  }

  onModuleDestroy() {
    if (this.blacklistWatcher) this.blacklistWatcher.close();
    if (this.whitelistWatcher) this.whitelistWatcher.close();
  }

  /**
   * Check if address is blacklisted
   * @returns Whether address is blacklisted
   */
  addressBlacklisted(address: string) {
    const split = address.split(':');
    let hostname = address;
    if (split.length === 2) {
      hostname = split[0];
    }
    return !!inRange(hostname, this.blacklist);
  }

  private setBlacklist() {
    const path = this.configService.blacklistPath;
    if (!path || !fs.existsSync(path)) {
      this.logger.log('using blacklist set in config;');
      isDefined(this.configService.blacklist) &&
        this.#blacklist.push(...this.configService.blacklist);
      return;
    }
    this.logger.log(`reading blacklist from ${path}`);
    this.#blacklist = readFileWithoutComments(path);
    this.blacklistWatcher = this.watchFileChanges(path, this.#blacklist);
  }

  private setWhitelist() {
    const path = this.configService.whitelistPath;
    if (!path || !fs.existsSync(path)) {
      this.logger.log('using whitelist set in config;');
      isDefined(this.configService.proxyDomains) &&
        this.#whitelist.push(...this.configService.proxyDomains);
      return;
    }
    this.logger.log(`reading whitelist from ${path}`);
    this.#whitelist = readFileWithoutComments(path);
    this.whitelistWatcher = this.watchFileChanges(path, this.#whitelist);
  }

  private watchFileChanges(filePath: string, storage: string[]) {
    let fsWait: boolean | NodeJS.Timeout = false;
    return fs.watch(filePath, function (event, filename) {
      if (filename) {
        if (fsWait) return;
        fsWait = setTimeout(() => {
          fsWait = false;
        }, 1000);
        storage.push(...readFileWithoutComments(filePath));
      }
    });
  }
}

function readFileWithoutComments(filePath: string) {
  return fs
    .readFileSync(filePath)
    .toString('utf-8')
    .split(/\n|\r\n/g)
    .filter((rx) => !rx.startsWith('//'))
    .map((rx) => {
      return rx;
    });
}
