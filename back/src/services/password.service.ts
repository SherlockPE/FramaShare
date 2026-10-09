import { randomBytes, scrypt, timingSafeEqual, createHash } from 'node:crypto';
const cost = { N: 131072, r: 8, p: 1, maxmem: 192 * 1024 * 1024 };
const derive = (password: string, salt: string) => new Promise<Buffer>((resolve, reject) => {
  scrypt(password, salt, 64, cost, (error, key) => error ? reject(error) : resolve(key));
});
export const tokenHash = (token: string) => createHash('sha256').update(token).digest('hex');
export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const key = await derive(password, salt);
  return `scrypt:131072:${salt}:${key.toString('hex')}`;
}
export async function verifyPassword(password: string, hash: string) {
  const [algorithm, work, salt, encoded] = hash.split(':');
  if (algorithm !== 'scrypt' || work !== '131072' || !salt || !encoded) return false;
  const key = await derive(password, salt);
  const stored = Buffer.from(encoded, 'hex');
  return stored.length === key.length && timingSafeEqual(key, stored);
}
