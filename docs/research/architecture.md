# Framashare — architecture, formats, permissions, and licenses

Research: October 5, 2026. Sources are vendor documentation, repositories, and license texts. The architectural proposals below are a design recommendation, not a declaration by Framasoft or a guarantee of compatibility of all future dependencies.

## Recommendation

Build a modular monolith: **Vue 3 + TypeScript + Vite** on the frontend, **Node.js + Fastify** as the API, **PostgreSQL** for metadata, permissions, and sessions, a private file catalog on the first installation, and a separate worker process for processing. Handle PDFs using **PDF.js**, EPUB through an interchangeable adapter to EPUB.js or Readium after a brief technical comparison. The installation must work on a self-hosted server without Vercel, a commercial SDK, an external cloud account, and mandatory telemetry.

Vue is a choice for a small team building a reader interface; not a licensing requirement. React is also MIT and makes sense if the team knows it better. We don't need Next.js exclusively for upload and the reader. Public publication pages can be server-rendered by the API; full SSR of the frontend should only be considered when the public library and indexing become an essential part of the product. Framework licenses: [Vue](https://github.com/vuejs/core/blob/main/LICENSE), [React](https://github.com/facebook/react/blob/main/LICENSE), [Vite](https://github.com/vitejs/vite/blob/main/LICENSE), [Fastify](https://github.com/fastify/fastify/blob/main/LICENSE).

## License: "everything open" does not mean "only MIT"

The Framasoft charter speaks of free software, open standards, and sharing sources. It does not mandate MIT. Apache, BSD, MPL, GPL, and AGPL can also meet the goal of free software; they differ in obligations and compatibility in a specific combination. [Framasoft Charter](https://framasoft.org/en/charte/).

**For Framashare's own code, I recommend AGPL-3.0-or-later, subject to agreement with Framasoft.** It prevents a scenario where someone runs a modified service and does not give its users access to the corresponding sources. MIT is a good choice if the goal is maximally free reuse, including in closed products; it does not provide such a commitment for modified services. The precise AGPL obligation applies, among other things, to making the source code of the modified version available to users interacting with it over a network. [GNU explanation](https://www.gnu.org/licenses/why-affero-gpl.html).

| Element | License verified with author | Role / decision |
|---|---|---|
| Vue 3 | MIT | Proposed interface framework; [LICENSE](https://github.com/vuejs/core/blob/main/LICENSE) |
| React | MIT | Equivalent alternative depending on the team's competencies; [LICENSE](https://github.com/facebook/react/blob/main/LICENSE) |
| Vite | MIT | Frontend build; [LICENSE](https://github.com/vitejs/vite/blob/main/LICENSE) |
| TypeScript | Apache-2.0 | Types on frontend and backend; [LICENSE](https://github.com/microsoft/TypeScript/blob/main/LICENSE.txt) |
| Node.js | MIT for Node code + separate component licenses | Runtime; also check the distributed system image; [LICENSE](https://github.com/nodejs/node/blob/main/LICENSE) |
| Fastify | MIT | HTTP API; [LICENSE](https://github.com/fastify/fastify/blob/main/LICENSE) |
| PDF.js | Apache-2.0 | PDF renderer; [LICENSE](https://github.com/mozilla/pdf.js/blob/master/LICENSE) |
| EPUB.js | BSD-2-Clause | Simpler API handles rendering, pagination, and hooks; [package.json](https://github.com/futurepress/epub.js/blob/master/package.json), [license text](https://github.com/futurepress/epub.js/blob/master/license) |
| Readium TypeScript toolkit | BSD-3-Clause | Alternative for the publication reader; [LICENSE](https://github.com/readium/ts-toolkit/blob/develop/LICENSE) |
| PostgreSQL | PostgreSQL License | Permissive free license similar to BSD/MIT; [official license](https://www.postgresql.org/about/licence/) |
| LibreOffice | MPL-2.0 as product license + various parts licenses | Optional office document converter; do not treat the entire image as a single license; [licenses](https://www.libreoffice.org/licenses/) |

This is an **audit of candidates**, not a complete audit of the delivered application. Before the first release: lock versions in the lockfile, check transitive dependencies and LICENSE/NOTICE files, generate an SBOM, preserve author and license information, include containers, conversion tools, fonts, icons, and demonstration materials in the audit. The automatic SPDX list helps, but does not determine compatibility on its own. MIT code does not change PDF.js to MIT. Fonts on OFL are also open, although they don't have MIT. Do not use dependencies marked "source available", non-commercial, or requiring a closed server without separate verification.

## One application, several clearly separated responsibilities

```text
browser
   ├─ author panel / Vue reader
   └─ Fastify API: account, upload, access policies, reader sessions
          ├─ PostgreSQL: data and transactions
          ├─ private storage: originals + previews + EPUB assets
          └─ job queue → isolated worker: validation, thumbnails, conversion
```

Proposed repository structure: `apps/web`, `apps/api`, `apps/worker`, `packages/contracts`. The API and worker can initially use common code and image, but the worker should have separate permissions and resource limits. There is no need to build microservices.

First deployment: Compose, reverse proxy with HTTPS, API, worker, PostgreSQL, and file volume. Storage behind a `Storage` interface; local adapter to start, S3-compatible adapter only for larger deployments. Backups must include the database **and files**, and restoration must actually be tested. A PostgreSQL-based queue limits the number of services; add a dedicated broker when measurement results justify the complication. Catalog search can start with PostgreSQL; a separate engine is not an MVP requirement.

## Format is not just an extension

| Format | First version | Behavior |
|---|---|---|
| PDF | Yes | PDF.js: pages, zoom, fit, text, search, outline, rotation, full screen; rendering visible and nearby pages instead of the whole document at once |
| JPEG/PNG/WebP, image set | Yes | Carousel with thumbnails, captions, author's order, zoom, and keyboard |
| DRM-free EPUB | Yes, after trying the adapter and isolation | Chapters, table of contents, text size, width, theme, spacing; progress / location, since pages depend on screen and font |
| ODT/ODP/DOCX/PPTX | Next version | Conversion in worker to PDF; showing status and message about possible layout differences |
| TXT/Markdown | Next version | Text reader; Markdown after sanitization |
| SVG/HTML/ZIP | Not as any file in MVP | Active content and archives require a separate, well-defined policy; create an image set by uploading multiple files |
| XLSX/ODS, audio, video, CBZ | Later as needed | Separate presentation methods; do not promise quality through universal conversion |

PDF.js is a PDF rendering library; a ready-made viewer can provide many features, but a custom interface must integrate the text layer and accessibility. Do not create a "PDF reader" purely from screenshots. The API allows working with a worker and data loading, including transport of ranges. [PDF.js API](https://mozilla.github.io/pdf.js/api/draft/module-pdfjsLib.html).

EPUB.js offers rendering and pagination; Readium provides shared and navigator packages as well as a publication model. Choice after a brief trial on: reflowable EPUB, fixed-layout, publication with an extensive TOC, images, Polish characters, and problematic styles. Check current releases and dependencies at the time of implementation; the number of stars does not determine maintenance. [EPUB.js](https://github.com/futurepress/epub.js), [Readium](https://github.com/readium/ts-toolkit).

LibreOffice has documented import and export filters and a `--convert-to` CLI, so it can convert documents and slides to PDF. Our recommendation: a separate process with a one-time profile, no network, no database access, with a timeout and memory limits. This does not provide a perfect reproduction of Microsoft Office files; missing fonts must be handled explicitly, using legally distributed fonts. [LibreOffice Filters](https://help.libreoffice.org/latest/en-US/text/shared/guide/convertfilters.html).

## Permissions model

Separate **publication**, its **file version**, **link**, and **viewing session**. A single document can have a public link to the catalog, a partner link valid for a week, and a one-time link for another recipient. Revoke each separately.

Minimal entities: `users`, `documents`, `document_versions`, `assets`, `share_links`, `viewer_sessions`, `processing_jobs`; optionally `document_members` when sharing with specific accounts. A link can contain `password_hash`, `starts_at`, `expires_at`, `max_sessions`, `sessions_used`, `allow_download`, `allow_embed`, `revoked_at`, version identifier, and policy revision number. In the case of multiple images, the publication has a list of assets with order, caption, and alternative text.

The policy should be deny-by-default. Password, date, counter, and required account act together as access conditions. "Public", "unindexed link", and "private" are distinct modes. An unindexed link can be forwarded, so it does not in itself imply identity control. A named recipient requires a logged-in account or a verified invitation. Without identification, "maximum of five people" cannot be reliably ensured.

### "Maximum N openings" means N sessions

Recommended contract: **one opening = creation of a session after clicking "Open document" and meeting all conditions**. A session is valid for e.g. 60 minutes, ending no later than `expires_at`; refine this value in UX. Refreshing and subsequent pages in this session do not consume new openings. After it expires, starting again consumes a new opening. Reaching the limit blocks new sessions but does not interrupt existing ones; revoking the link and the end date also stop future requests of existing sessions.

Do not count page GETs, HEADs, thumbnails, range requests, bots generating link previews, or failed passwords. The limit is not proof of the physical reading of the document, because after the session is issued, the network or renderer may fail. UX should use the word "sessions" or explain the definition of an opening.

Algorithm: start a transaction after authorization; lock the link row, check its current policy and idempotent opening attempt; create a session and increment the counter in the same transaction. For parallel attempts of the last opening, only one can succeed. An idempotency key prevents counting a replay of the same POST after a lost response. Locks and re-checking the UPDATE condition are described in the [PostgreSQL documentation](https://www.postgresql.org/docs/current/transaction-iso.html); returning modified rows is provided by [UPDATE RETURNING](https://www.postgresql.org/docs/18/sql-update.html).

### Do not let the file out of the link's control

Every request for a PDF, byte range, thumbnail, EPUB chapter, and image passes a check of the session **and the current link**. A standalone JWT with an hour of validity does not provide immediate revocation without checking the state. Files in private storage, no public URLs to originals. The API authorizes the request; it can stream data or pass it through an internal reverse proxy mechanism. Handle Range, 206, length, and type; limit excessive ranges and traffic.

Private responses should not go to a shared CDN/cache or an offline service worker. Store sessions in secure HttpOnly/Secure cookies; account for SameSite and CSRF for state-changing operations. Links with a random strong token, its hash in the database, no tokens in analytical logs; `Referrer-Policy: no-referrer` on sharing pages. Hash link passwords, rate-limit attempts, and allow changing/revoking.

**"Disable download" means disabling the button and original endpoint, not DRM protection.** The reader in the browser receives PDF bytes or rendering assets; they can be saved or screenshotted. Revoking a link blocks future downloads, it does not delete data already received. Custom rendering to images also does not solve copying, and worsens accessibility and search.

Do not call this architecture E2EE. Server-side validation and conversion require access to the content. True client-side encryption mode is a separate product decision: it changes previews, search, moderation, and access management.

## Content security and privacy

Upload: format allowlist, content validation instead of trusting the extension and MIME header, limit on size, number of files, image in pixels, and resources after decompression. File in a quarantine state before publication; random names in storage. The worker gets only the necessary input, not application secrets. Additionally, an antimalware scanner as a layer, not a guarantee. For public services: account and instance limits, abuse reporting, administrative removal of publications, and an orphaned file deletion cycle. This is an implementation of the [OWASP File Upload](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html) guidelines.

EPUB is an archive with XHTML/CSS and can contain scripts and external resources. Reject traversal (`../`), symlinks, and ZIP bombs; XML parser without external entities. Render the publication in an isolated frame/origin with a restrictive CSP, without author scripts, event handlers, forms, and unauthorized remote resources. Do not append raw XHTML to the panel DOM. Maintain control over reader navigation. W3C clearly describes script threats and content isolation: [EPUB Reading Systems 3.3](https://www.w3.org/TR/epub-rs-33/).

Telemetry disabled by default; simple aggregated counters instead of audience profiling. Do not promise anonymity if the operator logs IPs. Passwords, links, and titles of private publications cannot appear in metrics. The sharing terms and file retention are two different functions: an expired link does not automatically delete the author's file. Clearly show both dates, retention, and the procedure for deletion and backups.

## Pre-launch verification

Most important tests: no access to assets without a session; identifier guessing attempts; incorrect passwords; boundary dates; two parallel attempts at the last opening; POST replay with the same key; PDF range requests without additional counting; link revocation while reading; private thumbnails; EPUB with active content, remote resources, and ZIP bomb; conversion timeout and file cleanup. E2E tests: upload → processing → publication → link → password → reading → revocation. Accessibility: keyboard, visible focus, screen reader, mobile layout, and browser zoom.

## Decisions that change the scope

1. Are public publications and a catalog like SlideShare dominant, or private sharing? The model can handle both, but the catalog, SEO, and moderation increase the scope.
2. Do authors require an account? An account allows recovering files and managing retention; anonymous upload needs a secure management link and more protection against abuse.
3. Must EPUB be in the first version? If so, isolation and a custom reader are an MVP element, not an optional post-launch addition.
4. Does the limit mean global sessions or access for specific people? The second option requires identification.
5. Does Framasoft approve AGPL and such an operational stack? Confirm before finalizing the repository license and production deployment.
