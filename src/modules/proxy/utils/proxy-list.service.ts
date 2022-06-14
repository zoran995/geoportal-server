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
      if (isDefined(this.configService.blacklist)) {
        this.#blacklist.length = 0;
        this.#blacklist.push(...this.configService.blacklist);
      }
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
      if (isDefined(this.configService.proxyDomains)) {
        this.#whitelist.length = 0;
        this.#whitelist.push(...this.configService.proxyDomains);
      }
      return;
    }
    this.logger.log(`reading whitelist from ${path}`);
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
