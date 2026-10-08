import fs from 'node:fs';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import crypto from 'node:crypto';

// Use environment variable or default to 'uploads' in the root of the project
const STORAGE_PATH = process.env.STORAGE_PATH || path.join(__dirname, '../../uploads');

// Ensure storage directory exists
if (!fs.existsSync(STORAGE_PATH)) {
  fs.mkdirSync(STORAGE_PATH, { recursive: true });
}

export interface FileMetadata {
  filename: string;
  mimeType: string;
}

export const storageService = {
  /**
   * Saves a stream to the local disk and returns the unique storage key (filename).
   */
  async saveFile(fileStream: NodeJS.ReadableStream, metadata: FileMetadata): Promise<string> {
    // Generate a unique filename to avoid collisions
    const ext = path.extname(metadata.filename) || '';
    const uniqueId = crypto.randomUUID();
    const storageKey = `${uniqueId}${ext}`;
    
    const filePath = path.join(STORAGE_PATH, storageKey);
    const writeStream = fs.createWriteStream(filePath);
    
    await pipeline(fileStream, writeStream);
    
    return storageKey;
  },

  /**
   * Returns a readable stream of the file, optionally for a specific byte range.
   */
  getFileStream(storageKey: string, range?: { start: number; end: number }): fs.ReadStream {
    const filePath = path.join(STORAGE_PATH, storageKey);
    
    if (range) {
      return fs.createReadStream(filePath, { start: range.start, end: range.end });
    }
    
    return fs.createReadStream(filePath);
  },

  /**
   * Gets the file stats (like size).
   */
  async getFileStats(storageKey: string): Promise<fs.Stats> {
    const filePath = path.join(STORAGE_PATH, storageKey);
    return fs.promises.stat(filePath);
  },

  /**
   * Deletes the file physically from the disk.
   */
  async deleteFile(storageKey: string): Promise<void> {
    const filePath = path.join(STORAGE_PATH, storageKey);
    
    try {
      await fs.promises.unlink(filePath);
    } catch (error: any) {
      // Ignore if file doesn't exist anymore
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
  }
};
