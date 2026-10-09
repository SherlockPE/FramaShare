# Framashare — product recommendation

Research from October 5, 2026. Brief: a free alternative to SlideShare/Calaméo, owned by Framasoft; PDF, EPUB, images, and detailed access rules. This is material for decision-making, not an application implementation or project approval by Framasoft.

## Proposed direction

**A convenient reader and simple, precise sharing.** The first version should allow adding a file, convenient reading, and creating several independent links with different rules. Privacy by default, no ads, no marketing profiling of recipients, and no mandatory closed services. A public catalog is a separate decision: it brings search, moderation, and SEO.

Best inspirations: Calaméo reader, Nextcloud links model, and Lufi's simplicity. Do not copy the entire marketing model of commercial platforms. This is our recommendation resulting from [competitor comparison](competitors.md), not a statement that any competitor implements the entire Framashare premise.

Free software, privacy, and self-hosting comply with the [Framasoft charter](https://framasoft.org/en/charte/). MIT is not the only acceptable open license.

## First full version

| Area | Scope |
|---|---|
| PDF | Page number, previous/next, thumbnails, fit, zoom, rotation, search, outline/table of contents, full screen, text layer, keyboard |
| DRM-free EPUB | Chapters, table of contents, font size, line spacing, text width, theme, progress, and remembered position; reflowable and explicit fixed-layout policy |
| Images | JPEG/PNG/WebP, multiple files forming an album, order, captions, alt text, thumbnails, zoom, and panning |
| Author's library | Upload, title and description, processing status, file list, resume reading, storage limit, deletion, list of active links |
| Sharing | Multiple named links, password, expiration, session limit, revocation, control of original download endpoint, preview as recipient |
| States and administration | Processing/error, password, expiration, exhausted limit, abuse reporting, deletion by administrator, retention, and backups |

Authors with accounts and recipients without accounts is a reasonable starting hypothesis. Anonymous upload requires a separate management link and stronger abuse control; it should not be added by accident. Public indexing only upon conscious decision of the author.

Next wave: scheduled future access, named invitations, reader embed, collections, permanent addresses with document versions, private bookmarks/notes, data export. ODT/ODP/DOCX/PPTX via isolated conversion to PDF, then TXT/Markdown and OCR for scans. Office format does not guarantee identical reproduction after conversion. Federation, public comments, and a social feed expand the scope — they require a separate decision.

## Access rules that need to be designed precisely

One document can have a "Workshops" link with a password and a limit of 30 sessions, a "Partner" link valid until a specified time, and a separate public link. Changing or revoking one link does not affect the others.

- **Opening = accepted reading session**, e.g., for 60 minutes. Changing the page, PDF byte ranges, refreshing an active session, and thumbnails do not consume the limit. Limit does not mean the number of different people.
- For limited links, entry occurs after explicitly clicking "Open document". A standard messenger preview should not create a session. Bots can still perform interactions; we do not promise to recognize humans.
- Session limit blocks new sessions; existing ones can finish reading. Expiration and revocation block future requests, including for existing sessions. Bytes received earlier cannot be revoked.
- Permissions cover the original, thumbnails, text, EPUB chapters, and images. A password screen before the public URL of the file is insufficient.
- "Download disabled" removes the convenient option and the original's endpoint. **It does not guarantee no copying**, because the reader receives the content. The link password is not the password of an encrypted PDF.
- Link expiration date and file retention date are separate settings. Access expiration should not automatically delete the author's file.

Transaction, session, and revocation details: [architecture](architecture.md). Inspiration for independent links and download hiding restrictions: [Nextcloud](https://docs.nextcloud.com/server/latest/user_manual/en/files/sharing.html).

## Design choices

The three prepared interactive concepts compare the reader of the same document and the access panel. They are not working PDF/EPUB renderers; navigation and zoom show the behavior of the proposal, and the form does not create a real link.

| Style | Your choice |
|---|---|
| **Frama Atelier — recommended** | A friendly tool in Framasoft's purple and orange. Thumbnails on the left, document in the middle, access panel on the right. Closest to the brand. |
| **Papier** | The calm character of a library, serif titles, and blue accents. A wider reader, horizontal toolbar, sharing on demand. |
| **Commun** | A social library in green. Files in the side panel, link settings under the reader. Good for collectives and organizations. |

Frama Atelier is an interpretation of the [official graphic charter](https://framasoft.org/fr/graphics/), not an approved Framasoft design. We use system fonts in mockups; final fonts, icons, and demonstration content require their own licensing information. In the product, we host fonts locally.

After choosing a style, save `DESIGN.md`: color tokens, typography, spacing, radiuses, controls, errors, focus, motion, and responsiveness rules. Do not impose the application's visual style on the original PDF page. Goal for the interface: WCAG 2.2 AA; the document's accessibility quality also depends on the source file.

Skills: `frontend-design` for visual direction → `Impeccable` to refine the whole → `agent-browser` for real checking → optionally `avoid-ai-design` for an audit. These are the author's working tools, not product dependencies. The available skills are sufficient; no additional installation is needed. [Skills comparison and license sources](design-workflow.md).

## Proposed stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | Vue 3 + TypeScript + Vite | Clear reader interface, one front/backend language. React also fits if the team knows it better. |
| PDF | PDF.js | Open renderer; we are not writing a PDF parser from scratch. |
| EPUB | EPUB.js or Readium adapter | Choice after a short prototype: rendering quality, content isolation, different EPUBs, and maintenance. |
| Backend | Node.js + Fastify | Upload, library, link, and session API; simple deployment. |
| Database | PostgreSQL | Transactions for opening limits, metadata, accounts, and tasks. |
| Files | Private volume, later S3-compatible adapter | No mandatory cloud provider. Authorization also for PDF byte ranges. |
| Processing | Separate isolated worker, PostgreSQL queue | CPU/RAM/time limits; parsers and converters do not run in the API process. |
| Deployment | Compose + HTTPS reverse proxy | Self-hosting; instructions for launching, backup, and updates. |

Architecture: modular monolith and a separate processing process. Redis, Kubernetes, and microservices are not needed at the start. For a public catalog, add server-side metadata pages for SEO; this does not require remaking the reader itself.

**Application code is now licensed under AGPL-3.0-or-later**; see [LICENSE](../../LICENSE). Libraries retain their own MIT/Apache/BSD licenses; fonts retain OFL, PostgreSQL its own free license. PDF.js has Apache-2.0, EPUB.js BSD-2-Clause, Readium BSD-3-Clause. Full table and source texts in the [candidate audit](architecture.md). According to the [GNU explanation](https://www.gnu.org/licenses/why-affero-gpl.html), the AGPL foresees network users' access to the sources of the modified service.

Before release, audit specific versions and indirect dependencies, generate an SBOM, and keep LICENSE/NOTICE, including for containers, fonts, and converters. The repository's AGPL license does not replace third-party license obligations.

## How to implement

1. Agree on style, public catalog versus sharing, author accounts, and EPUB scope. Save decisions in `PRODUCT.md` / `DESIGN.md`.
2. Make a small PDF/EPUB prototype on real large and problematic files. Check quality, mobile, accessibility, and EPUB isolation before persisting the adapter.
3. Build the full PDF flow: account → upload → quarantine → preview → link → unlock → revoke. Add EPUB and albums to the same publication and permissions model.
4. Close administration, limits, retention, export, reporting, and processing failure handling.
5. Before launch, check the race for the last session, retries, all private resources, date errors, revocation during reading, malicious files, mobile, keyboard, and backup restoration. Only then publish a self-hosting release.

## Source documents

- [Competitors, features, and permissions](competitors.md)
- [Design, skills, and asset licenses](design-workflow.md)
- [Architecture, security, and library licenses](architecture.md)

Research is based on primary sources. We did not test paid competitor accounts. Issuu has not been sufficiently verified — we do not attribute unconfirmed features to it. Stack, scope, and design choices are recommendations, not requirements derived from documentation.

## Mockup verification

Checked in Chromium via Playwright: three variants at widths 320, 736, and 1024 px, in light and dark themes (18 combinations). Navigation, scaling, opening the panel, changing the limit, and link preview preparation worked; no horizontal overflow or JavaScript errors were found. After inspection, the contrast of the active document's metadata in Commun and the height of the Papier reader were corrected so the panel fits entirely. Additional checks confirmed the Papier panel's fit. This is a verification of the interface concept, not a test of application operation, actual format rendering, permission security, or a full WCAG audit.
