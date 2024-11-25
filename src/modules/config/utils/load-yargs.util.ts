import * as yargs from 'yargs';

const DEFAULT_CONFIG_LOCATION = './serverconfig.json';

type RemoveIndex<T> = {
  [K in keyof T as string extends K
    ? never
    : number extends K
      ? never
      : K]: T[K];
};
export type PromiseResolvedType<T> = T extends Promise<infer R> ? R : never;

export type YargsConfigType = RemoveIndex<ReturnType<typeof loadYargs>>;

interface YargsConfigModuleSettings {
  /**
   * When multiple values for the same key are supplied yargs converts them into an array.
   * When true replace arrays with the rightmost value. This matters when `npm run` has options
   *  built into it, and the user wants to override them with `npm run -- --port 3005` or something.
   * "npm run -- --option foo --option bar" will return `{ option: bar }` instead of `{ option: ["foo", "bar"] }`.
   * @defaultValue true
   */
  returnLastValue: boolean;
}

export function loadYargs(
  options: YargsConfigModuleSettings = { returnLastValue: true },
) {
  const argv = yargs
    .usage('$0 [wwwroot]', true, (y) => {
      return y.positional('wwwroot', {
        describe: 'path/to/wwwroot',
        type: 'string',
      });
    })
    .strict()
    .option('port', {
      type: 'number',
      description: 'Port to listen on. [default: 3001]',
      number: true,
    })
    .option('public', {
      type: 'boolean',
      description: 'Run a public server that listens on all interfaces.',
      boolean: true,
    })
    .option('ignore-env-file', {
      type: 'boolean',
      description: 'If "true", environment files (`.env`) will be ignored.',
      default: false,
    })
    .option('env-file-path', {
      type: 'string',
      array: true,
      description:
        'Path to .env file to be load. Not used if ignore-env-file=true',
      default: undefined,
    })
    .option('config-file', {
      type: 'string',
      description:
        'File containing settings such as allowed domains to proxy. See serverconfig.json.example',
      default: DEFAULT_CONFIG_LOCATION,
    })
    .option('verbose', {
      type: 'boolean',
      description: 'Produce more output and logging.',
      default: false,
      boolean: true,
    })
    .help('h')
    .alias('h', 'help')
    .alias('v', 'version');

  if (options.returnLastValue) {
    // Yargs unhelpfully turns "--option foo --option bar" into { option: ["foo", "bar"] }.
    // Hence replace arrays with the rightmost value. This matters when `npm run` has options
    // built into it, and the user wants to override them with `npm run -- --port 3005` or something.
    Object.keys(yargs.argv).forEach((key: string) => {
      if (key !== '_') {
        yargs.coerce(key, (opt) => {
          if (Array.isArray(opt) && opt.length > 0) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-return
            return opt[opt.length - 1];
          } else {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-return
            return opt;
          }
        });
      }
    });
  }

  return argv.parseSync();
}
