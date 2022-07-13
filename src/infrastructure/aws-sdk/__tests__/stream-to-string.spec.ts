import { Readable } from 'stream';

import { streamToString } from '../stream-to-string';

describe('streamToString', () => {
  it('streamToString(stream)', async () => {
    const buf = Buffer.from('test-stream-to-string');
    const stream = Readable.from(buf);

    await expect(streamToString(stream)).resolves.toBe('test-stream-to-string');
  });
});
