import { prisma } from '../lib/prisma.js';
export const defaultSettings = { fileMB: 100, albumMB: 100, albumCount: 50, quotaMB: 1000, retention: [1, 7, 30], defaultRetention: 7 };
export async function instanceSettings() {
  const row = await prisma.instanceSettings.findUnique({ where: { id: 1 } });
  return row ? row.value as typeof defaultSettings : defaultSettings;
}
