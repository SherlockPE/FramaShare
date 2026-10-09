# Framashare Verification

Aktualny raport trwałego MVP: [odbiór 9 października 2026](mvp-acceptance-20261009.md). Poniższe wyniki opisują historyczny prototyp i nie są dowodem bezpieczeństwa API.

## Historical prototype verification

Executed locally on October 6, 2026. The implementation uses Vue 3, TypeScript, Vite, Vue Router, and PDF.js, without Figma and backend. Work was divided among three subagents (Public & Account, Readers, Administration); the main agent integrated the library, upload, links, and anonymous assignment.

## Result

- `npm run typecheck` — no errors.
- `npm run build` — production build passes; [log](build.log).
- `npm test` — 14 tests of access rules, link independence, sessions, retention, deletion, and atomic claim; [log](unit-tests.log).
- `npm run test:browser` — 13 Playwright tests (12 flows and an additional album drag-and-drop test), covering all 8 plan scenarios, local file recovery, claim error when out of space, date validation, focus trap, and responsiveness; [flows log](browser-tests.log), [drag-and-drop](album-drag.log).
- Administration panel — 5 Playwright tests: reports, rejection, deletion, limits, settings, and save error; desktop 1440, mobile 390 and 320 px.
- Public & Account — 82 checks of navigation and dimensions, forms, return behavior, reset, settings, and account deletion. [Details](public-account.md).
- Open menus — 18 geometry and Escape checks: profile, publication, sorting, filters, document and link actions at 1440/390/320 px. Also checked fullscreen, actual PDF download, and report form on mobile.
- PDF — 6 rendered pages, text layer, 6 search results, thumbnails, actual outline, rotation, zoom, fit, page number limitation to range. No console errors and warnings during this verification.
- EPUB — actual font change to 24 px, line spacing, width, theme; preferences and chapter remain after return.
- Album — images, order, alt and captions, thumbnails, zoom/pan, and missing image screen.

Main screens were checked at 1440, 1024, 768, 390, and 320 px. The 200% zoom check was performed through equivalent browser geometry: a 720×500 CSS px viewport with a device scale factor of 2, corresponding to a 1440×1000 space at 2x zoom. This is a layout and rendering test, not an automation of a specific browser's zoom menu. No horizontal overflow was detected; the PDF document can scroll within its own area after zooming in.

## Final Scenarios

| Scenario | Result |
|---|---|
| Landing → registration → local PDF → publication → reader → library | PASS |
| Anonymous upload 7 days → save management link → recipient link → login → claim | PASS; old management token invalid, recipient link preserved |
| Password + custom date/time + limit + download off → wrong/correct password | PASS; wrong attempt does not count session |
| Refresh of active reader and exhausted limit | PASS; counter does not increase upon refresh |
| Revocation in a second tab during reading | PASS; preview disappears, second link works |
| EPUB preferences and album editing | PASS; actual appearance and data changes |
| Recipient report → moderator → deletion | PASS; all publication links unavailable |
| Upload failure → retry → success and Cancel | PASS; cancellation does not leave a ready publication |

## Screenshots

Full pages and views with open controls were preserved. Files are in [screenshots/](screenshots/).

| View | Desktop | Mobile |
|---|---|---|
| Landing | [1440](screenshots/landing-desktop.png) | [390](screenshots/landing-mobile.png) |
| Login | [1440](screenshots/login-desktop.png) | [390](screenshots/login-mobile.png) |
| Library — grid | [1440](screenshots/-app-library-1440.png) | [390](screenshots/-app-library-390.png) |
| Library — list | [1440](screenshots/-app-library-view-list-1440.png) | [390](screenshots/-app-library-view-list-390.png) |
| Filters | [1440](screenshots/library-filters-1440.png) | [390](screenshots/library-filters-390.png) |
| Anonymous upload | [1440](screenshots/anonymous-upload-1440.png) | [390](screenshots/anonymous-upload-390.png) |
| Details and links | [1440](screenshots/-app-documents-doc1-1440.png) | [390](screenshots/-app-documents-doc1-390.png) |
| Link with date/time | [1440](screenshots/sharing-calendar-desktop.png) | [390](screenshots/sharing-calendar-mobile.png) |
| Password gate | [1440](screenshots/-share-protected-1440.png) | [390](screenshots/-share-protected-390.png) |
| PDF | [1440](screenshots/pdf-desktop.png) | [390](screenshots/pdf-mobile.png) |
| PDF — search | [1440](screenshots/pdf-search-desktop.png) | [390](screenshots/pdf-search-mobile.png) |
| PDF — thumbnails | [1440](screenshots/pdf-thumbnails-desktop.png) | [390](screenshots/pdf-thumbnails-mobile.png) |
| EPUB | [1440](screenshots/epub-desktop.png) | [390](screenshots/epub-mobile.png) |
| EPUB — settings | [1440](screenshots/epub-settings-desktop.png) | [390](screenshots/epub-settings-mobile.png) |
| Album | [1440](screenshots/album-desktop.png) | [390](screenshots/album-mobile.png) |
| Album — thumbnails | [1440](screenshots/album-thumbnails-desktop.png) | [390](screenshots/album-thumbnails-mobile.png) |
| Report | [1440](screenshots/report-desktop.png) | [mobile](screenshots/report-mobile.png) |
| Administration | [1440](screenshots/admin-reports-desktop.png) | [390](screenshots/admin-reports-mobile.png) |
| Deletion confirmation | [1440](screenshots/admin-removal-dialog-desktop.png) | [390](screenshots/admin-removal-dialog-mobile.png) |
| Instance settings | [1440](screenshots/admin-settings-desktop.png) | [390](screenshots/admin-settings-mobile.png) |

Additional screenshots include profile/document/link menus, sorting, mobile navigation, account settings, account limits, and [layout corresponding to 200%](screenshots/sharing-200-percent-layout.png).

## Fixes resulting from verification

- Selected files are not lost when transitioning from form → progress → success → reader.
- Cancellation does not leave a ready publication or its object URL.
- Returning to an active password session works without another password prompt and without increasing the counter.
- Processing or failed publication does not consume a recipient session.
- Cross-tab synchronization invalidates the active preview upon revocation, without saving the entire state every second.
- An empty date field does not trigger a rendering error; a date in the past is rejected.
- The header with the profile fits on 320 px. The menu near the screen edge changes position and fits in the viewport.
- Escape closes the dialog/menu and restores focus. Tab remains inside the dialog.
- A long title does not obscure actions; the thumbnail cover limits the text, the full title remains with the publication.

## Actual Limitations

This is a frontend prototype. Roles, account passwords, resets, emails, and server operations are simulated. Link rules can be changed via browser tools, so they do not provide production security. Data and links are not shared between devices.

The binaries of your own upload exist in the application tab's memory. After a reload or in another tab, they must be selected again; metadata remains. Included PDF/EPUB/album do not require re-selection. The EPUB reader uses its own safe chapters; a full parser of arbitrary EPUBs is not implemented according to the plan's scope.

Anonymous retention means local unavailability, not a task of physical deletion on the server. Disabling downloads does not secure against copying and screenshots. The tests do not constitute a full WCAG audit or compliance of the PDF documents themselves.

## Reproduction

Startup and test commands can be found in the [project README](../../README.md). `/overview` contains a sitemap, scenarios, roles, resets, a one-time error, and clock control. `/design-system` shows tokens and components. Tests were run on Chromium/Playwright; we do not declare verification for Safari and Firefox.

## Verification before branch preparation

On October 6, 2026, `npm run build`, `npm test` (14/14), `npm run test:browser` (13/13), and `npx playwright test --config tests/admin.playwright.config.ts` (5/5) were run again. All finished successfully. The compliance of the lockfile with the manifest and the behavior of the `front` and `back` workspaces were checked. The original files `front/`, `back/`, `database/`, and `src/index.js` were not modified.
