// eslint-disable-next-line @typescript-eslint/no-var-requires
const yargs = require('yargs');
import { loadYargs } from './load-yargs.util';

describe('load yargs', () => {
  it('properly load yargs', async () => {
    yargs('--port 3005');

    const loadedYargs = await loadYargs();
    expect(loadedYargs.port).toBe(3005);
    expect(loadedYargs['config-file']).toBe('./serverconfig.json');
    expect(loadedYargs['proxy-auth']).toBe('./proxyauth.json');
    expect(loadedYargs.verbose).toBe(false);
  });

  it('returns only last value when returnLastValue is true', async () => {
    yargs('--port 3005 --port 3006');

    const loadedYargs = await loadYargs({ returnLastValue: true });
    expect(loadedYargs.port).toBe(3006);
  });

  it('returns all values when returnLastValue is false', async () => {
    yargs('--port 3005 --port 3006');

    const loadedYargs = await loadYargs({ returnLastValue: false });
    expect(Array.isArray(loadedYargs.port)).toBe(true);
    expect((<any>loadedYargs.port).length).toBe(2);
    expect(loadedYargs.port).toStrictEqual([3005, 3006]);
  });
});
