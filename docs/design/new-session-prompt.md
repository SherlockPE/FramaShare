# Prompt for a new Framashare session

Copy the contents of the block below to a new Codex session opened in the `/home/codexdev/projects/42/framashare` project.

```text
Implement the entire plan for a local, responsive Framashare prototype, without Figma.

Repository: /home/codexdev/projects/42/framashare
Specification: docs/design/implementation-plan.md
Visual references: docs/design/references/
Product context: docs/research/

First, read the full specification and look at all the reference screenshots. The specification takes precedence over previous research and the Frama Atelier/Papier/Commun concepts. You do not need the previous chat or access to Figma MCP. Do not stop work to ask for a Figma connection.

Your task is IMPLEMENTATION, not another plan. Build a working browser prototype of all pages, menus, dialogs, and states. Use Vue 3 + TypeScript + Vite + Vue Router, shared components, mock service, local data, and an /overview page to show all screens and scenarios. Also build a /design-system.

The appearance should be very close to cofounder.co: creamy-gray backgrounds, graphite buttons with subtle dimensionality, thin borders, calm typography, and custom pixel art illustrations. Primarily use the saved references; you can also look at https://cofounder.co/ and its public subpages as a helpful reference. Do not copy the logo or entire screenshots as UI. Local fonts: Figtree and IBM Plex Mono; TT Neoris only if an appropriate license is available. All application text must be in English.

Implement full surfaces: landing, how it works, help and articles, about, privacy/terms as prototype content; login, registration, password reset, and settings; library list/grid with search and filters; PDF/EPUB/album upload, metadata and album editing; publication details; multiple independent links with a password, date/time, session limit, and downloading; recipient gateway and all access errors; PDF, EPUB, and album readers; reports, and an admin panel with publications, accounts, limits, and retention.

Handle anonymous upload: 1/7/30 days retention period, default 7; separate private management link; saving/copying this link; management without an account; later claiming to an account. Claiming removes the anonymous retention and invalidates the manage token, but preserves recipient links. If the account limit is exceeded, claiming does not change ownership. Losing the management link does not provide a recovery path without an account.

Maintain access rules: the limit counts successful sessions started with explicit "Start reading", not incorrect passwords, refreshes, or PDF pages. A session lasts 60 minutes; an exhausted limit blocks new sessions, and expiration/revocation also blocks active reading. Link expiration does not delete the publication. Denial screens do not reveal private titles or thumbnails. "Download off" does not mean copy protection. The author's preview mode does not consume the limit and is marked.

Show and activate all open controls: profile/document/link menus, filters, sorting, expiry dropdown/calendar/time, PDF zoom, EPUB typography/themes, mobile navigation, and destructive confirmations. Every visible action should work. Handle close, cancel, back, retry, keyboard, focus, and form errors.

PDF.js must actually render the included sample PDF. EPUB demonstrates adjustable reading on safe sample chapters; a full parser for arbitrary EPUBs is not required. The album has real images, thumbnails, captions, alt text, zoom/pan. The owner reads via /app/documents/:id/read or /manage/:token/read, without consuming recipient sessions. The registry of locally selected files belongs to the entire app session and persists across page changes; do not invalidate object URLs when unmounting the upload form. Explain simulation boundaries on /overview, without introducing technical demo panels into daily product screens.

This is a frontend prototype: no production backend, email sending, real authorization, or deployment. LocalStorage stores metadata, not binaries or account passwords. Demo links work in the same local instance/browser. Do not add a public catalog, payments, feed, comments, OCR, or Office support.

Use subagents. First, prepare the common skeleton, tokens, components, mock service, and data. Then divide Public & Account, Readers, and Administration; handle Library & Sharing, upload, and anonymous claim yourself. Coordinate shared files and finally merge everything into a cohesive product.

Work in long waves, make routine decisions independently, and do not stop at the landing page or the first screen. Do not re-ask questions that are resolved in the specification. Apply the available frontend-design and browser testing skills; a working backend is not a prerequisite for building mockups.

Before finishing, run a typecheck and build, targeted tests of link/session/claim logic, and browser verification of full paths. Check desktop 1440, mobile 390, width 320, and 200% zoom. Compare screenshots with references, fix overflow, console errors, focus, and clipped content. Save screenshots of main screens and open controls in both sizes. Document how to run it, /overview, data reset, and actual limitations. Finish only after completing the entire scope or demonstrating a specific unresolvable blocker.
```
