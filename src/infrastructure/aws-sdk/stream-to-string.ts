import { Readable } from 'stream';

// from https://docs.microsoft.com/en-gb/azure/storage/blobs/storage-quickstart-blobs-nodejs#download-blobs

export async function streamToString(stream: Readable): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Uint8Array[] = [];
    stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    stream.on('error', (err) => reject(err));
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
  });
}
