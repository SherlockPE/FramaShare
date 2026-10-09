# FramaShare operations

No production deployment or Salt configuration is performed by this repository. Node 24, pnpm 11.7 and PostgreSQL are sufficient; Docker is optional for a local database.

## Install and run

1. `pnpm install --frozen-lockfile`.
2. Copy `back/.env.example` to `back/.env`, mode 0600. Set a dedicated database, absolute private storage path and the public HTTPS `APP_ORIGIN`. Production requires `NODE_ENV=production`, explicit SMTP host and sender; authenticated SMTP should use port 465 with `SMTP_SECURE=true`, or STARTTLS on port 587. Set `SMTP_USER`/`SMTP_PASS` through the administrator's secret mechanism. Certificate verification remains enabled. No JWT secret is used.
3. From `back`: `pnpm exec prisma migrate deploy && pnpm exec prisma generate`. Back up existing data before migrations; migrations do not run on startup. Historical feature-branch databases with unrecorded schema changes require an administrator to reconcile migration history before deployment. Do not use `db push` or a demo seed on real data.
4. `pnpm run build`. Start `node --env-file=.env dist/index.js` from `back` as an unprivileged service account. The administrators supply service supervision. Default binding is loopback port 3000.
5. Serve `frontend/dist` with SPA fallback and proxy `/api` over HTTPS. [The example](../nginx/https.example.conf) is a template, not a deployed configuration. `APP_ORIGIN` must exactly match the browser origin. The API only trusts loopback proxies for forwarded IPs; replace forwarded headers at the proxy. Private storage must never be an Nginx root or alias. Do not log capability URLs.

Create storage owned by the API account, mode 0700; files use 0600. Keep at least 3 GiB free on the output filesystem and 1 GiB available RAM. Maximum publication size is 100 MB; an album has at most 50 JPEG/PNG/WebP images, each at most 20 million pixels. EPUB has at most 1000 entries, 50 MB expanded total and 10 MB per entry. Fixed layout and encrypted EPUB are rejected. EPUB styles and external resources are removed for safety.

Grant administrator access operationally with parameterized SQL against `User.role`; the registration/profile API never accepts role changes. Initial quota is 1000 MB. Administrator settings persist in the database; hard upload ceilings remain in force. Review privacy and terms with the instance owner before public release: the current text is an unapproved draft.

## Cleanup

The API runs cleanup every minute. Unreferenced files left by a crash or failed rollback are removed after one hour, beyond the 15-minute request timeout. Expired anonymous publications lose access immediately and their files are physically removed by the next successful cycle. Failed document/account deletions remain blocked and retry on subsequent cycles. Cleanup also removes expired authentication/reset tokens. Monitor cleanup errors, disk usage and SMTP delivery; a stopped API cannot run cleanup. Backups contain private information and capabilities: protect them as private storage.

## Backup and restore

Pause writes by stopping the API service, including its cleanup timer. Never stop another chat's processes. Back up the database and files as one offline snapshot:

```sh
API_STOPPED=1 DATABASE_URL=... STORAGE_PATH=/srv/framashare/private \
  node scripts/backup.mjs backup /secure/backups/framashare-YYYYMMDD
```

`pg_dump`, `pg_restore` and `psql` must be installed, with pg_dump at least the PostgreSQL server major version; `PG_DUMP`, `PG_RESTORE`, `PSQL` can override their executable paths. The backup directory must not exist; it contains a custom PostgreSQL dump, private files and a SHA-256 manifest. Only resume the API after backup completes. Store copies off-host according to the owner's retention policy.

Restore to a new, empty, isolated database whose name ends in `_test`, and an empty private storage directory. The script refuses a nonempty target and validates checksums before writing the database:

```sh
API_STOPPED=1 DATABASE_URL=postgresql://.../framashare_restore_test \
  STORAGE_PATH=/srv/framashare/restore-files \
  node scripts/backup.mjs restore /secure/backups/framashare-YYYYMMDD
```

Apply migrations, start an isolated API with those restored files, and verify owner/recipient reads and denial for an unrelated account. Only administrators should promote a verified restore to production. A file-copy failure after database restore leaves the isolated target incomplete: discard/recreate that test target and retry; do not serve it. This script never overwrites a live database.

## Acceptance tests

Use `TEST_DATABASE_URL` ending in `_test` and isolated `STORAGE_PATH`. API tests create/remove only their own records. Browser setup additionally refuses a target API that does not report a dedicated test database. `API_TARGET` configures the Vite proxy for isolated ports; `TEST_APP_URL` configures Playwright. Browser binaries and results must remain on the project disk. Playwright configuration forces temporary browser profiles under `.runtime/playwright-tmp`; set `PLAYWRIGHT_BROWSERS_PATH` on that disk before installing Chromium. The restart tests use fresh schemas inside the dedicated test database and remove only those schemas. Build frontend/backend before browser tests.

```sh
TEST_DATABASE_URL=postgresql://.../framashare_mvp_test pnpm --filter back test
pnpm --filter frontend test
TEST_DATABASE_URL=postgresql://.../framashare_mvp_test \
 TEST_APP_URL=http://localhost:5317 PLAYWRIGHT_BROWSERS_PATH=/disk/path \
 pnpm --filter frontend test:browser
```

SMTP security tests use an ephemeral local receiver, without external credentials or sending to real inboxes. Run one heavy build/browser suite at a time.
