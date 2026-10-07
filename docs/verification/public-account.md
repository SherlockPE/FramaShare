# Public & Account verification

Verified through Chromium/Playwright against the local Vite server.

- Public routes `/`, `/sign-in`, `/sign-up`, `/forgot-password`, `/reset-password`, `/help`, `/help/anonymous-publishing`, `/how-it-works`, `/about`, `/privacy`, `/terms` opened at 1440, 1024, 768, 390 and 320 px without horizontal overflow.
- Profile, security and storage settings opened while signed in at the same five widths without horizontal overflow after the mobile header correction.
- Sign-in validation, password visibility, preserved return route, profile save, password change, delete confirmation and Escape, simulated forgot/reset success all passed.
- Sign-up preserved its settings return route and showed an empty new library.
- Confirmed account deletion removed the author account and publications; its sharing link returned the neutral `Publication deleted` screen.
- Help search returned matching content, showed the distinct empty-results state, and cleared back to six articles.
- Completed browser flows produced no page errors.

Screenshots in `docs/verification/screenshots/`: landing, login, help and each settings section on desktop/mobile; mobile account deletion confirmation.

Prototype boundaries: auth and password updates are simulated. No passwords are persisted. The reset message explicitly states that no email was sent. Public privacy/terms are clearly labelled non-binding sample content.
