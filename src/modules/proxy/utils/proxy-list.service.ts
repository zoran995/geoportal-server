import {
  Inject,
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';

import * as fs from 'fs';
import { inRange } from 'range_check';

import { isDefined } from 'src/common/helpers/index.js';
import { LoggerService } from 'src/infrastructure/logger/index.js';
import { PROXY_OPTIONS } from '../proxy.constants.js';
import type { ProxyConfigType } from '../config/schema/proxy-config.dto.js';

@Injectable()
export class ProxyListService implements OnModuleInit, OnModuleDestroy {
  #blacklist: string[] = [];
  #whitelist: string[] = [];
  private whitelistWatcher: fs.FSWatcher | undefined;
  private blacklistWatcher: fs.FSWatcher | undefined;

  constructor(
    @Inject(PROXY_OPTIONS) private readonly proxyOptions: ProxyConfigType,
    private readonly logger: LoggerService,
  ) {}

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

  isWhitelisted(host: string) {
    for (const domain of this.#whitelist) {
      if (host.indexOf(domain, host.length - domain.length) !== -1) {
        return true;
      }
    }
    return false;
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
    const path = this.proxyOptions.blacklistPath;
    if (!path || !fs.existsSync(path)) {
      this.logger.log('using blacklist set in config;', ProxyListService.name);
      if (isDefined(this.proxyOptions.blacklistedAddresses)) {
        this.#blacklist.length = 0;
        this.#blacklist.push(...this.proxyOptions.blacklistedAddresses);
      }
      return;
    }
    this.logger.log(`reading blacklist from ${path}`, ProxyListService.name);
    this.#blacklist = readFileWithoutComments(path);
    this.blacklistWatcher = this.watchFileChanges(path, this.#blacklist);
  }

  private setWhitelist() {
    const path = this.proxyOptions.whitelistPath;
    if (!path || !fs.existsSync(path)) {
      this.logger.log('using whitelist set in config;', ProxyListService.name);
      if (isDefined(this.proxyOptions.allowProxyFor)) {
        this.#whitelist.length = 0;
        this.#whitelist.push(...this.proxyOptions.allowProxyFor);
      }
      return;
    }
    this.logger.log(`reading whitelist from ${path}`, ProxyListService.name);
    this.#whitelist = readFileWithoutComments(path);
    this.whitelistWatcher = this.watchFileChanges(path, this.#whitelist);
  }

  private watchFileChanges(filePath: string, storage: string[]) {
    let fsWait: boolean | NodeJS.Timeout = false;
    return fs.watch(filePath, (event, filename) => {
      if (event === 'change') {
        if (filename) {
          if (fsWait) return;
          fsWait = setTimeout(() => {
            fsWait = false;
            const content = [...readFileWithoutComments(filePath)];
            storage.length = 0;
            storage.push(...content);
          }, 1000);
        }
      } else if (event === 'rename') {
        this.onModuleDestroy();
        this.onModuleInit();
      }
    });
  }
}

function readFileWithoutComments(filePath: string) {
  return fs
    .readFileSync(filePath, 'utf-8')
    .toString()
    .split(/\n|\r\n/g)
    .map((rx) => {
      return rx.trim();
    })
    .filter((rx) => !rx.startsWith('//') && rx !== '');
}
