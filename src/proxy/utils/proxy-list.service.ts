import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ProxyConfigService } from '../config/proxy-config.service';
import * as fs from 'fs';
import { inRange } from 'range_check';

@Injectable()
export class ProxyListService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ProxyListService.name);
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
  addressBlacklisted(address) {
    return !!inRange(address, this.blacklist);
  }

  private setBlacklist() {
    const path = this.configService.blacklistPath;
    if (!path || !fs.existsSync(path)) {
      this.logger.log('using blacklist set in config;');
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
        console.log(readFileWithoutComments(filePath));
        storage.push(...readFileWithoutComments(filePath));
        //console.log(storage);
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
