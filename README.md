# Hello Guys! Framashare is here :D
A local, responsive prototype for publishing and reading PDFs, EPUBs, and albums. Vue 3, TypeScript, Vite, and Vue Router. The interface is in English; the scope is described in `docs/design/implementation-plan.md`.
## Getting Started
Requires Node.js 22.12+ or 24 LTS.
```sh
npm ci
npm run dev
```
The legacy applications are located in `front/` (React) and `back/`; to run them together: `npm run dev:legacy`. The database configuration is in `database/`.
Open http://localhost:5173. Screen map, roles, and scenarios: http://localhost:5173/overview. Components and tokens: http://localhost:5173/design-system.
```sh
npm run typecheck
npm test
npm run build
```
Browser tests require `npm run dev` to be running on port 5173 and Chromium with Playwright (`npx playwright install chromium` if it’s not already available):
```sh
npm run test:browser
npx playwright test --config tests/admin.playwright.config.ts
node tests/public-account.mjs
node tests/pdf-controls.mjs
node tests/reader-controls.mjs
node tests/open-controls.mjs
```
In an environment with a full system `/tmp` directory, you can use the project directory:
```sh
mkdir -p .runtime/tmp
TMPDIR="$PWD/.runtime/tmp" npm run test:browser
```

## Demo Data
- Author: `alex@example.com`, password `readingroom`.
- Administrator: `admin@example.com`, password `readingroom`.
- The forms accept any valid email address and a password of at least 8 characters. A new email address creates a local account. This is not real authentication.
- Protected link: `/share/protected`, password `garden`.
- Public examples: `/share/workshop`, `/share/garden`, `/share/album`.
- Anonymous management: `/manage/private-garden`.
- In `/overview`, you can select a role, adjust the timer, force a one-time error, and trigger denial/recovery states.
`Reset demo` deletes only the data for this prototype and restores the seed. localStorage key: `framashare-prototype-v1`. The timer starts on October 6, 2026, at 12:00 Europe/Warsaw; it runs in real time and can be sped up. Metadata changes are synchronized across tabs of the same origin.


## Access and Files
A successful `Start reading` action consumes one 60-minute session. Incorrect passwords, page refreshes, and navigating within the document do not increase the session count. Reaching the limit blocks new sessions; the expiration or revocation of a link also stops active reading. Deleting a publication blocks all its links.
Anonymous uploads have a retention period of 1/7/30 days (default: 7) and a separate private management link. Assigning the upload to an account removes the retention period and invalidates the management token, while preserving the recipients’ links. Exceeding the limit leaves ownership unchanged.
Locally selected files and object URLs are stored in the application’s session-wide registry. Navigating between screens does not delete files. After reloading, the metadata remains, and a missing file can be reselected. Binaries and account passwords are not stored in localStorage. The examples included with the project work after refreshing the page.


## Limitations of the Prototype !!!!!!!!!!!!
Accounts, resets, and password changes, email sending, upload processing, and server operations are simulated. Front-end link rules are used to evaluate the workflow, not to protect data. Links work within the same local instance and browser state; they are not a cross-device sharing service.

PDF.js renders an actual six-page PDF with a text layer, search, and table of contents. It also supports local PDFs; encrypted or corrupted files display an error. EPUB demonstrates secure custom chapters and reading settings; it does not parse arbitrary EPUB or fixed-layout files. 


Albums display actual images with zoom, panning, captions, and alt text.
`Allow download` hides the download option but does not prevent copying or screenshots. Anonymous expiration is simulated unavailability; the frontend does not perform physical deletion on the server. There is no backend, no deployment, and no external analytics.


## Materials and Verification
Custom SVG illustrations, PDFs, and a sample EPUB are in `public/samples/`. Illustration and PDF generators: `scripts/`. Figtree, IBM Plex Mono, and Literata are hosted locally via Fontsource packages; font and icon licenses are stored in `docs/licenses/`.
Results: [verification report](docs/verification/README.md). Screenshots: [gallery](docs/verification/screenshots/). Project documentation and all original references have been left unchanged.
Additional check of open controls: `node tests/open-controls.mjs`. Regenerating custom content: `node scripts/generate-pdf.mjs`, `python3 scripts/generate-art.py`, `python3 scripts/generate-epub.py`. Uploading a file in a different tab requires reselecting the file; the binary registry belongs to the application tab.
Instructions for using this project:`