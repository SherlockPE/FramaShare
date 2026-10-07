# Framashare full application prototype plan

Build a local, responsive prototype of all Framashare screens in the browser. The prototype must allow evaluating the appearance and completing the full paths of the author, anonymous publisher, recipient, and administrator. It must work without Figma, with English UI texts and a style very close to Cofounder.

This is the implementation plan for the approved scope of mockups, transferred from Figma to a web application. It does not include a production backend, deployment, or a real access control system. The agent executing the plan should prepare the entire prototype, not just a landing page.

## 1. Rules applying in the new session

- Product: convenient publishing and reading of DRM-free PDF, EPUB, and JPEG/PNG/WebP albums, with independent access links.
- An author with an account has a library; a recipient does not need an account. Upload without an account is also available.
- Anonymous publication has a selectable retention period: 1, 7, or 30 days, defaulting to 7 days.
- An anonymous author manages the document through a separate private link. They can claim the publication to an account.
- Claiming removes the anonymous retention period, invalidates the private management link, and preserves recipient links.
- The scope covers public pages, accounts, library, upload, sharing, three readers, and basic full administration.
- Desktop and mobile have equal quality. Open menus, dialogs, forms, and errors are part of the design.
- The UI is in English. Documentation and execution reports can be in Polish.
- The Cofounder design replaces the previous directions of Frama Atelier, Papier, and Commun. Do not use the purple-orange palette of the previous mockups as a baseline.
- Out of scope: public directory, public author profiles, payments, social feed, comments, federation, OCR, Office, version history, teams, and production infrastructure.

## 2. Inspiration and reference materials

Sources: [Cofounder](https://cofounder.co/), [Resources](https://cofounder.co/resources), [Pricing](https://cofounder.co/pricing), [How to start](https://cofounder.co/how-to/start), [app login](https://app.cofounder.co/login). We adopt the visual language and layout patterns, preserving Framashare's functionalities.

The `docs/design/references/` directory contains screenshots from the analysis on October 6, 2026:

| File | Application |
|---|---|
| `cofounder-home.png` | Hero composition, pixel art, typography, and navigation. |
| `cofounder-resources.png` | Content cards, spacing, and metadata hierarchy. |
| `cofounder-start.png` | Side table of contents and long text column. |
| `cofounder-login.png` | Login layout, illustration, toggles, and buttons. |
| `cofounder-app-preview.png` | Calm tool environment and workspace division. |
| `cofounder-mobile-nav.png` | Open mobile navigation. |

The screenshots are visual references, not graphics of ready Framashare screens. Do not paste a whole page screenshot as UI. Do not copy the Cofounder logo, marketing materials, or illustrations into the final application. The private Cofounder application was not accessible after login; its public previews are sufficient as a compositional direction.

Older documents in `docs/research/` remain product context. In case of conflict in scope, style, or delivery method, this plan prevails.

## 3. Result and technology

Use Vue 3, TypeScript, Vite, and Vue Router. Styling via custom CSS tokens and shared components. Vector icons from a single family, e.g., Lucide. Do not add an off-the-shelf dashboard theme that will impose a different aesthetic.

Prepare:

1. All pages and interactions described below, launched with a single local command.
2. Shared components and an `/overview` overview page with a screen map and demonstration scenarios.
3. A `/design-system` page with tokens, components, and their states.
4. Local sample data and a service mocking application operations.
5. A custom sample PDF, safe sample EPUB chapters, and an album with custom illustrations.
6. Launch documentation, a list of simulations, desktop/mobile screenshots, and verification results.

Do not add Fastify, PostgreSQL, workers, real login, email sending, or external analytics. Do not publish the application automatically. Install dependencies in stable versions and commit the lockfile.

### Prototype data

Store document, link, report metadata, and preferences in localStorage through a single adapter. Do not save binary files and entered account passwords in localStorage. Locally selected files and their object URLs are stored in a registry belonging to the entire application session, so they survive the transition from upload → details → reader. Release them upon file replacement, publication deletion, reset, or closing the app, not upon page change. Temporary thumbnails belonging only to a component can be released upon its unmounting.

After page reload, the metadata of the custom upload remains, and the missing file has a `Select file again` action. Included examples work after refresh without re-selecting. Memory limits and storage access denial have a message with the option to continue the demonstration in memory.

The data model includes the document, owner or anonymous management token, processing status, deletion date, recipient links, reading sessions, reports, and instance settings. A link stores its own settings; do not save them as a single global document configuration.

The mock service provides operations: upload, metadata edit, create/edit/revoke link, start session, claim to account, delete document, report, and moderator decision. It supports short delays, successes, and predictable errors. There is no need to design a production REST API.

On `/overview`, clearly describe that accounts, emails, link protections, and server operations are simulated. Copied demonstration links work in the same local instance and browser state. They are not a cross-device sharing service.

## 4. Visual system

### Colors and surfaces

| Token | Value | Role |
|---|---|---|
| Canvas | `#F5F5F2` | Main background. |
| Surface | `#FBFBF8` | Cards, dialogs, and panels. |
| Border | `#DEE2DE` | Thin borders. |
| Control border | `#E3E3E0` | Fields and small controls. |
| Muted surface | `#E7E7E3` | Segments and secondary surfaces. |
| Text | `#262323` | Main text. |
| Button | `#202020` | Graphite primary actions. |

Select success, error, and focus state colors for the required contrasts. Pale blue can indicate an active element. Statuses have an icon or label, not just color. Do not copy low-contrast metadata from screenshots.

Graphite buttons have a subtle gradient, a light inner top edge, and a short drop shadow. Cards are light, with a thin line and a subtle edge instead of large shadows. Typical control radius is 8 px, large cards 16 px; buttons in account forms can be pill-shaped like the reference. Radii stem from the element's role.

### Typography and layout

The base font is locally hosted Figtree; technical metadata can use IBM Plex Mono. The original TT Neoris can only be used with an available, appropriate license; otherwise, stick to Figtree. Do not download the font from the Cofounder website. Preserve font and icon license information.

UI scale: 12/14/16/20/24/32/40 px; hero 48–64 px on desktop and 36–40 px on mobile. Main text 16 px, longer help text around 65–75 characters per line. Calm headings, without heavy bolding and artificial highlighting of single words.

Spacing grid: 4/8/12/16/24/32/48/64 px. Marketing: larger spacing and illustrations. Library: legible density and divisions. Reader: maximum document space. Settings and help: side navigation and a calm content column.

### Graphics

Prepare a custom pixel art illustration: sky, trees, and a reading spot with books or documents. Use it in the hero and login panel; small details can appear in empty states. You can use an available image generation tool, or if unavailable, a custom SVG with a rectangular grid. Maintain sharp pixels and check the mobile crop.

In the daily UI, do not distract with decoration. Covers, illustrations, and sample documents must be your own or have an appropriate license. PDF preserves its original appearance; the application style applies to the reader's surroundings.

### Components

Shared: Button, IconButton, TextField, PasswordField, TextArea, Select, Checkbox, Switch, SegmentedControl, Tabs, Badge, Progress, Toast, Alert, Tooltip, DropdownMenu, Popover, Dialog, Drawer, BottomSheet, DateTimePicker, EmptyState, PublicationCard, PublicationRow, SharingLinkRow, and ReaderToolbar.

Required states: default, hover, focus, active, disabled, loading, and error where applicable. Every visible button works: it performs an action, opens a control, leads to a screen, or shows the expected simulation result.

## 5. Navigation and screen map

### Public pages

| Path | Screen and content |
|---|---|
| `/` | Landing: custom pixel-art hero, clear explanation of publishing, CTA `Upload a document`, `Sign in`, reader preview, access control, three formats, privacy, FAQ, and footer. |
| `/how-it-works` | Adding, reading, independent links, and recovering management; distinguishing between publishing with and without an account. |
| `/help` | Help search, categories, and articles regarding formats, links, passwords, sessions, and storage. |
| `/help/:slug` | Article template with table of contents, related topics, and return. Minimum of five realistically filled articles matching the product. |
| `/about` | Open project, privacy, self-hosting, and prototype information. Do not suggest official endorsement by Framasoft. |
| `/privacy`, `/terms` | Legible templates of sample content, marked as non-binding prototype materials. Without pretending to be ready legal documentation. |

Desktop navigation: Framashare, How it works, Help, About, Sign in, Upload. On mobile, the CTAs and menu button remain. The open panel has a clear close button and links; Escape and selecting a page close it.

### Account

| Path | Screen and behavior |
|---|---|
| `/sign-in`, `/sign-up` | Split desktop layout: illustration and form. Email, password, show/hide password, validation, and mode toggle. Mobile simplifies the illustration. |
| `/forgot-password`, `/reset-password` | Form, simulated email confirmation, new password, and success. No actual sending. |
| `/app/settings/profile` | Name, email, avatar as initials, saving changes, and result. |
| `/app/settings/security` | Password change, validation, logout, and account deletion confirmation. |
| `/app/settings/storage` | Space usage, quota, list of largest publications, and link to deletion. |

The profile menu opens settings, help, and logout. Account deletion has a dialog describing the deletion of its publications and invalidation of links; the operation is a local simulation. Unauthorized access to the account page redirects to login while preserving the return path.

### Library and publications

| Path | Screen and behavior |
|---|---|
| `/app/library` | List/grid, search, type and status filters, sort, space usage, upload CTA, and resume reading. |
| `/app/documents/:id` | Preview, title/description, format, size, status, album settings, and active links. |
| `/app/documents/:id/read` | Full owner reader, without consuming a recipient link session. |
| `/app/documents/:id/edit` | Title/description edit; album has order, captions, and alt text. |
| `/app/documents/:id/links` | List of independent named links and their rules, statuses, session counter, and actions. |

Publication menu: Open, Edit details, Manage links, Preview as recipient, Delete. Link menu: Copy link, Edit link, Preview, Revoke. Preview uses the same recipient view, but in preview mode, it does not consume the limit; it is clearly marked and has a return to management.

Filters: all/PDF/EPUB/album and ready/processing/failed. Sorting: recently added, recently changed, and title. A long title does not obscure actions. Missing publications and no results have different messages and appropriate actions.

### Upload and anonymous management

| Path | Screen and behavior |
|---|---|
| `/upload` | File or multi-image selection, drag-and-drop, title/description; without an account also 1/7/30 days retention and login option. |
| `/upload/progress` | Upload progress, cancellation, processing, success, or retry. |
| `/upload/complete/:id` | For account: proceed to publication and create link. Without account: priority `Save your management link`. |
| `/manage/:token` | Metadata and edit of a single publication, deletion date, preview, recipient links, delete, and `Add to my library`. |
| `/manage/:token/read` | Full anonymous owner reader, without consuming a recipient link session; requires a still-valid management token. |
| `/manage/:token/claim` | Login/registration preserving context, claim confirmation, and success in the library. |

In upload, present instance limits and supported formats before selection. PDF/EPUB are single publications; a set of images creates an album. A mixed set of types has a legible error. Demonstration defaults: file up to 100 MB, album up to 50 images and total 100 MB, account up to 1 GB. Limits are configurable in the demo panel, not a declaration of the production service.

Simulate progress and processing in short stages. Cancellation does not create a ready publication. Retry works after an error. For an album, besides drag-and-drop ordering, provide move buttons for keyboard and mobile.

The management link is the owner's secret. Text: `Keep this link private. Anyone with it can manage or delete this document.` and `Without this link, you cannot manage this document.` Separate Copy management link and Create sharing link actions; do not confuse them visually.

After claiming a publication, release the anonymous context, remove its deletion date, and invalidate the management token. If the account limit does not allow claiming, keep the previous state and offer a return to management. An invalid, lost, expired, or already used token leads to a neutral screen without private metadata.

## 6. Sharing and recipient sessions

### Link form

A dialog or panel includes link name, optional password, expiration date, session limit, and `Allow download`. Default is no password, no expiry, no limit, and downloads enabled. Name is required. The demonstration password is not the PDF password nor the account password.

Expiry: No expiry, In 1 day, In 7 days, Custom date. Custom date opens a calendar and time field; the interface shows `Europe/Warsaw`. A date in the past is an error. Limit is either disabled or a positive integer. Zero, negative values, and fractions are errors. Lowering the limit below the number of used sessions blocks new entries and leaves existing sessions according to the rules below.

The summary is readable before creation, e.g., `Password required · Expires 13 Oct 2026, 18:00 · 30 reading sessions · Downloads off`. After success: URL, copy, and edit. The clipboard handles missing permissions: URL selection and manual copy instruction.

Download help: `Hides the download option. It does not prevent copying or screenshots.` Limit help: `Counts successful reading sessions, not unique people or page views.` Link expiration and file deletion have separate labels.

### Recipient access

The `/share/:token` path opens the access gate, and `/share/:token/read` the appropriate reader. For a protected link, before the correct password, do not reveal the title, description, and cover. Show the password field, its visibility, and `Start reading`. A wrong password does not consume a session.

A successful explicit start of reading consumes one session. A session lasts 60 minutes unless expiration or link revocation occurs earlier. Refresh and reader operations use the active session. Exhausting the limit blocks new sessions but allows finishing active ones. Expiration or revocation also stops active reading; hide the content and show an unavailability screen. Bytes already downloaded cannot be retracted.

Separate states: wrong password, link expired, link revoked, limit exhausted, session expired, file deleted, deletion by moderator, and network problem. Denial screens do not reveal private material. After the session itself expires, if the link still allows, a restart action is available.

Revoking one link does not change other links of this publication. Deleting the publication invalidates all links. Link expiration does not delete the author's document.

## 7. Three readers

### PDF

Render the included custom PDF via PDF.js, with a text layer. The included example has at least six pages, a table of contents, and searchable text. As available, also support a selected local PDF; an invalid, encrypted, and unsupported file receives a separate message.

Controls: previous/next page, number field, page count, thumbnails, outline, search with results and transition, zoom -/+, percentage selection, Fit width/Fit page, rotation, fullscreen, and download according to the link setting. Page range exceeding is handled. Focus in the field does not trigger reader shortcuts.

Desktop: left thumbnails/outline panel, document in the center, calm toolbar. Mobile: bar with the most frequent actions, the rest in a menu, thumbnails and search in a sliding panel. A large page can scroll within the reader area but not expand the entire viewport.

### EPUB

The reader uses the included safe chapters of custom text as an EPUB demonstration. Full parsing of any EPUB and fixed-layout are not a condition for completing the mockups; describe this boundary on `/overview`. Custom EPUB upload can use a sample preview clearly marked as a demo.

Chapter list, previous/next, progress percentage, position resume, and reading settings must work. Text size: 16/18/20/24 px, default 18. Line height: 1.5/1.8/2.0, default 1.8. Width: narrow/medium/wide; theme light/dark/sepia. Changes actually affect the text and save preferences. Use an open serif font for reading, e.g., Literata, with local hosting and license.

### Album

Main image, thumbnails, counter, caption, alt, previous/next, zoom, pan, and fullscreen. The image preserves proportions. Panning works after zooming; zooming itself does not create horizontal page overflow. Order, captions, and alt are edited by the author, and the recipient sees the result. Locally selected images are actually previewed as long as the file is available.

All readers have return, loading, retry, missing file, access loss, and `Report abuse`. Reporting does not require an account.

## 8. Administration

| Path | Scope |
|---|---|
| `/admin/reports` | List of reports, open/resolved filters, and report selection. |
| `/admin/reports/:id` | Reason, description, date, metadata for the administrator, and controlled preview; Dismiss report or Remove publication. |
| `/admin/publications` | List of publications, type/status filter, owner or anonymous, storage, and deletion. |
| `/admin/accounts`, `/admin/accounts/:id` | Accounts, space usage, details, and limit change. |
| `/admin/settings` | Maximum file/album size, account space limit, allowed anonymous retentions, and default retention. |

Use the same visual system, with a denser desktop table and mobile cards. Roles are simulated; role selection for testing is on `/overview`. A regular user does not see the administration navigation.

Administrative deletion requires confirming the consequences, invalidates links, and resolves the report. Dismissing a report does not delete the publication. Settings saving has validation, success, and error. Retention changes apply to new uploads; they do not automatically shorten existing terms. Lowering the space limit does not delete data; it blocks new uploads until space is freed.

`Report abuse` form: reason, description, Submit report. Email is not required. After submission, a confirmation; the report appears on the administrator's list. Do not add an infrastructure dashboard, backups, payments, or advanced analytics.

## 9. States and open controls to show

On `/overview`, prepare direct links to states, without needing to perform the entire path. Place technical demonstration controls only there or on a separate `/scenarios`.

| Family | Mandatory states |
|---|---|
| Library | populated grid/list, empty, no results, loading, processing, failed, quota exceeded. |
| Upload | files selected, album order, uploading, processing, cancelled, unsupported format, too large, failure, retry, complete. |
| Sharing | multiple links, create/edit, password toggle, expiry dropdown, custom calendar/time, session limit, copied, validation, revoke confirmation, revoked. |
| Recipient | password, wrong password, start, expired, revoked, exhausted, deleted, session ended, network problem, report form/success. |
| PDF | thumbnails, outline, search/results, zoom dropdown, fit, rotation, fullscreen, unavailable file. |
| EPUB | contents, reading settings, various sizes, line height, width, light/dark/sepia. |
| Album | thumbnails, caption, zoom/pan, fullscreen, missing image. |
| Account | sign in/up, field errors, loading, forgot/reset success, settings saved, delete confirmation. |
| Anonymous | retention dropdown, management link saved, claim form/success/quota failure, invalidated manage link. |
| Administration | open/resolved reports, report details, dismissal, removal confirmation, quota form, settings validation. |
| Navigation | profile menu, publication menu, link menu, filters, sort, mobile menu. |

Dialogs support Escape, focus trap, and focus restoration. Closing without saving does not change data. Destructive actions have Cancel and a specific name for the action. Saving and copying show a toast with the name of the performed operation.

## 10. Demonstration data and scenarios

Prepare a deterministic seed: ready PDF, EPUB, and album, document processing, failed upload, long title, anonymous publication, several independent links, and a pending and resolved report. Titles and content relate to education, social organizations, and open materials, e.g., Community workshop handbook, A guide to shared gardens, Field notes from the reading room.

The demonstration clock starts from the date saved in the scenario; the interface uses Europe/Warsaw. `/overview` provides Reset demo, author/recipient/admin selection, error forcing, and time passage simulation. Reset removes only prototype data. Do not change the system time or use multi-hour delays in tests.

Final scenarios:

1. Landing → registration → PDF upload → success → publication → reader → library.
2. Upload without account → 7 days term → save management link → create recipient link → login → claim → library; old manage token does not work, recipient link works.
3. Author creates link with password, custom date, limit, and downloads off → recipient enters wrong password, then correct → reads; wrong attempt does not consume a session.
4. Recipient refreshes active reader → counter does not increase → exhausted limit blocks next entry, but not the active session.
5. Author revokes link during reading → recipient loses preview; second link of this publication still works.
6. EPUB settings change actual presentation and remain after return; album preserves order, captions, and alt.
7. Recipient reports material → admin sees report → deletes publication → all its links are unavailable.
8. Upload error → retry → success; Cancel returns without a ready publication.

## 11. Responsiveness and accessibility

Design baseline for desktop 1440 px and mobile 390 px; also check 320, 768, and 1024 px. The library transitions from grid/table to cards, forms have one column, side panels become drawer/bottom sheet. A dialog on a small screen can occupy the full available height and scroll its own content.

Check 200% browser zoom, long titles, long URLs, multi-line errors, and touch. Main touch targets have at least 44×44 px. Do not block browser zoom.

Semantic headings, field labels, accessible icon names, visible focus, clear errors linked to fields, announced toasts/statuses, and logical keyboard order. Motion respects prefers-reduced-motion. Interface quality goal: WCAG 2.2 AA; do not declare full compliance for the PDF document itself.

## 12. Implementation with subagents

The main agent creates the project, routing, tokens, shared components, mock service, and seed. Then it delegates three disjoint areas to subagents:

- Public & Account: landing, info pages, help, account, and settings.
- Readers: PDF, EPUB, album, recipient access, and reports.
- Administration: reports, publications, accounts, and instance settings.

The main agent concurrently implements Library & Sharing, upload, anonymous management, and claim. Subagents work on a common set of tokens and components. Agree on the shared mock service contract before delegation; coordinate changes to shared files. If the number of available agents is smaller, execute the areas sequentially without reducing the scope.

After merging the work, the main agent finishes all flows, compares compositions with reference screenshots, fixes inconsistent menus and mobile, and performs full verification. Do not finish after the first working screen.

## 13. Tests and completion criteria

Run typecheck and production build. Add targeted link logic tests: link independence, session counting, denial after revocation/expiration, and claiming anonymous publication. Use a test clock to avoid waiting for actual expiration.

Browser testing via Playwright or available browser tool: scenarios 1–8, opening and closing menus/dialogs, returns, retries, and behavior after refresh. For desktop/mobile, check for lack of console errors, unintentional horizontal overflow, overlapping controls, and cut text.

Keep screenshots of final compositions: landing, login, library, anonymous upload, details, link dialog with calendar, password gate, each reader, report, and administration. For library, sharing, and readers, desktop and mobile are mandatory. Include open controls, not just default views.

The prototype is complete when all described screen families have working pages, all visible actions have a result, scenarios pass, documents remain readable, aesthetics match references, and the simulation scope is described. Do not report meeting the condition based on just the build or a landing screenshot.

## 14. Handover of result

README contains the install/run command, `/overview` address, demonstration accounts/passwords, reset rules, and list of simulated features. The final report lists completed areas, test results, screenshot links, and actual limitations.

The files of this plan and older research remain in the repository. No access to the previous chat or Figma is required. The prompt to start a new session is in `docs/design/new-session-prompt.md`.
