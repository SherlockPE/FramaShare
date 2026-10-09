import { mkdir, readdir, cp, stat, readFile, writeFile, chmod } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const [action, target] = process.argv.slice(2);
if (!['backup', 'restore'].includes(action) || !target || !process.env.DATABASE_URL || !process.env.STORAGE_PATH || process.env.API_STOPPED !== '1') throw Error('Usage: API_STOPPED=1 DATABASE_URL=... STORAGE_PATH=... node scripts/backup.mjs backup|restore DIRECTORY. Stop the API first.');
const directory = path.resolve(target), storage = path.resolve(process.env.STORAGE_PATH);
if (directory === storage || directory.startsWith(storage + path.sep) || storage.startsWith(directory + path.sep)) throw Error('Backup and storage must be separate directories.');
const database = new URL(process.env.DATABASE_URL);
const connection = { PGHOST: database.hostname, PGPORT: database.port || '5432', PGUSER: decodeURIComponent(database.username), PGPASSWORD: decodeURIComponent(database.password), PGDATABASE: decodeURIComponent(database.pathname.slice(1)), ...(database.searchParams.has('sslmode') ? { PGSSLMODE: database.searchParams.get('sslmode') } : {}) };
const run = (command, args) => {
  const result = spawnSync(command, args, { env: { ...process.env, ...connection }, encoding: 'utf8' });
  if (result.error || result.status !== 0) throw Error(result.error?.message || result.stderr || `${command} failed`);
  return result.stdout;
};
const digest = async file => {
  const hash = createHash('sha256'); for await (const chunk of createReadStream(file)) hash.update(chunk); return hash.digest('hex');
};
if (action === 'backup') {
  await mkdir(directory, { mode: 0o700 });
  await mkdir(path.join(directory, 'files'), { mode: 0o700 });
  const manifest = { version: 1, createdAt: new Date().toISOString(), database: '', files: {} };
  for (const entry of await readdir(storage, { withFileTypes: true })) {
    if (!entry.isFile() || !/^[a-zA-Z0-9.-]+$/.test(entry.name)) throw Error('Storage must contain only regular publication files.');
    await cp(path.join(storage, entry.name), path.join(directory, 'files', entry.name));
    await chmod(path.join(directory, 'files', entry.name), 0o600);
    manifest.files[entry.name] = await digest(path.join(directory, 'files', entry.name));
  }
  run(process.env.PG_DUMP || 'pg_dump', ['--format=custom', '--no-owner', '--no-acl', '--file=' + path.join(directory, 'database.dump')]);
  await chmod(path.join(directory, 'database.dump'), 0o600);
  manifest.database = await digest(path.join(directory, 'database.dump'));
  await writeFile(path.join(directory, 'manifest.json'), JSON.stringify(manifest, null, 2), { mode: 0o600 });
  console.log('Database and publication files backed up with SHA-256 manifest.');
} else {
  if (!new URL(process.env.DATABASE_URL).pathname.endsWith('_test')) throw Error('Restore into a dedicated empty _test database; promote only after verification.');
  const tables = run(process.env.PSQL || 'psql', ['-At', '-c', "SELECT count(*) FROM pg_tables WHERE schemaname='public'"]).trim();
  if (tables !== '0') throw Error('Restore database must be empty.');
  await mkdir(storage, { recursive: true, mode: 0o700 });
  if ((await readdir(storage)).length) throw Error('Restore storage must be empty.');
  const manifest = JSON.parse(await readFile(path.join(directory, 'manifest.json'), 'utf8'));
  if (manifest.version !== 1 || await digest(path.join(directory, 'database.dump')) !== manifest.database) throw Error('Invalid backup database checksum.');
  for (const [name, hash] of Object.entries(manifest.files)) {
    if (!/^[a-zA-Z0-9.-]+$/.test(name) || name === '.' || name === '..' || !(await stat(path.join(directory, 'files', name))).isFile() || await digest(path.join(directory, 'files', name)) !== hash) throw Error('Invalid publication backup checksum.');
  }
  run(process.env.PG_RESTORE || 'pg_restore', ['--dbname=' + new URL(process.env.DATABASE_URL).pathname.slice(1), '--no-owner', '--no-acl', '--exit-on-error', '--single-transaction', path.join(directory, 'database.dump')]);
  for (const name of Object.keys(manifest.files)) { await cp(path.join(directory, 'files', name), path.join(storage, name)); await chmod(path.join(storage, name), 0o600); }
  console.log('Database and files restored. Apply migrations and verify authorized reads before starting public traffic.');
}
