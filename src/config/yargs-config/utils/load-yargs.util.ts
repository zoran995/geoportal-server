import * as yargs from 'yargs';
import { YargsConfigModuleSettings } from '../interfaces/yargs-config-module-settings.interface';

export function loadYargs(
  options: YargsConfigModuleSettings = { returnLastValue: true },
): Record<string, any> {
  yargs
    .usage('$0 [options] [path/to/wwwroot]')
    .strict()
    .option('port', {
      type: 'number',
      description: 'Port to listen on. [default: 3001]',
      number: true,
    })
    .option('public', {})
    .option('public', {
      type: 'boolean',
      description: 'Run a public server that listens on all interfaces.',
    })
    .option('config-file', {
      description:
        'File containing settings such as allowed domains to proxy. See serverconfig.json.example',
    })
    .option('proxy-auth', {
      description:
        'File containing auth information for proxied domains. See proxyauth.json.example',
    })
    .option('verbose', {
      description: 'Produce more output and logging.',
      type: 'boolean',
    })
    .help('h')
    .alias('h', 'help')
    .alias('v', 'version');

  if (options.returnLastValue) {
    // Yargs unhelpfully turns "--option foo --option bar" into { option: ["foo", "bar"] }.
    // Hence replace arrays with the rightmost value. This matters when `npm run` has options
    // built into it, and the user wants to override them with `npm run -- --port 3005` or something.
    yargs.coerce(Object.keys(yargs.argv), (opt) => {
      if (Array.isArray(opt) && opt.length > 0) {
        return opt[opt.length - 1];
      } else {
        return opt;
      }
    });
  }
  return yargs.argv;
}
