import * as fs from 'fs';
import * as path from 'path';

export class Blacklist {
  static list = [];
}

const blacklistPath = path.resolve(process.cwd(), 'blacklist');
let fsWait: boolean | NodeJS.Timeout = false;
fs.watch(blacklistPath, function (event, filename) {
  if (filename) {
    if (fsWait) return;
    fsWait = setTimeout(() => {
      fsWait = false;
    }, 100);
    update_blacklist();
  }
});

function update_blacklist() {
  Blacklist.list = fs
    .readFileSync('./blacklist')
    .toString('utf-8')
    .split(/\n|\r\n/g)
    .filter((rx) => !rx.startsWith('//'))
    .map((rx) => {
      return rx;
    });
}

update_blacklist();
