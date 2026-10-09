import fs from 'node:fs';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';

const storagePath = () => path.resolve(process.env.STORAGE_PATH || 'uploads');
export const storageService = {
  async saveFile(stream: NodeJS.ReadableStream, key: string) {
    await fs.promises.mkdir(storagePath(), { recursive: true, mode: 0o700 });
    await pipeline(stream, fs.createWriteStream(path.join(storagePath(), key), { flags: 'wx', mode: 0o600 }));
  },
  getFileStream(key: string, range?: { start: number; end: number }) {
    return fs.createReadStream(path.join(storagePath(), key), range);
  },
  getFileStats(key: string) { return fs.promises.stat(path.join(storagePath(), key)); },
  async deleteFile(key: string) { await fs.promises.rm(path.join(storagePath(), key), { force: true }); },
  async isPdf(key: string) {
    const handle = await fs.promises.open(path.join(storagePath(), key), 'r');
    try {
      const header = Buffer.alloc(8);
      const { bytesRead } = await handle.read(header, 0, 8, 0);
      const { size } = await handle.stat();
      const tail = Buffer.alloc(Math.min(size, 1024));
      await handle.read(tail, 0, tail.length, size - tail.length);
      return bytesRead === 8 && /^%PDF-\d\.\d/.test(header.toString('ascii')) && tail.includes(Buffer.from('%%EOF'));
    } finally { await handle.close(); }
  },
};
export function byteRange(header: string, size: number): { start: number; end: number } | null {
  const match = /^bytes=(\d*)-(\d*)$/.exec(header);
  if (!match || (!match[1] && !match[2]) || size === 0) return null;
  let start = match[1] ? Number(match[1]) : Math.max(0, size - Number(match[2]));
  let end = match[1] && match[2] ? Math.min(Number(match[2]), size - 1) : size - 1;
  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start >= size || start > end || (!match[1] && Number(match[2]) === 0) || !Number.isSafeInteger(Number(match[1] || match[2]))) return null;
  return { start, end };
}
