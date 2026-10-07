# Framashare: design and AI workflow

Research: October 5, 2026. These are proposals to choose from, not an approved product identity. I have read the instructions for locally available skills and checked the primary sources indicated below. I haven't installed anything additional.

## Recommendation

I would choose **Frama Atelier**: a calm user interface based on Framasoft colors, with a more expressive character for the library and landing page. The reader should yield to the document. The distinct needs of the three surfaces — library, reader, sharing panel — must be recorded in a single system of tokens, not designed as three independent applications.

Framasoft publishes its own [graphic charter](https://framasoft.org/fr/graphics/). It includes purple `#725794`, orange CTA `#cc4e13`, dark indigo `#0b1c54`, secondary color `#4a5268`, and light background `#f7fafc`. The brand uses rounded corners, spacing, and a more illustrative character for headers. The variants proposed below are interpretations for a document tool; they are not official Framasoft designs. It is worth confirming the scope of brand usage with the organization before publication.

## Three directions to choose from and a complementary variant

In each mockup, we compare the reader of the same document and the same access panel. Commun additionally shows a side library. Thanks to this, the choice concerns real aesthetics and convenience, not the attractiveness of an example cover. Mockups use system fonts (system-ui/Georgia); the families listed below are proposals for the final product.

| Direction | Tokens and typography | Character and distinctive element | Advantages / cost |
|---|---|---|---|
| **A. Frama Atelier — recommended** | Background `#f7fafc`, surface `#ffffff`, text `#0b1c54`, secondary `#4a5268`, primary `#725794`, CTA `#cc4e13`. Source Sans 3 for UI; distinct headers of the same family. Scale 14/16/20/28/40 px, radius 8–12 px. | Friendly public tool. Purple thin line of active document, orange "Share" button. Covers and titles build the character of the library. | Easiest to link with Framasoft; decoration and color in the reader must be limited. |
| **B. Paper — editorial** | Background `#eef3f6`, surface `#ffffff`, text `#183344`, secondary `#4a5268`, accent `#225a86`, light accent `#eaf2f8`. Literata in headers and EPUB mode, Source Sans 3 in controls. Radius 3–6 px. | Digital library: larger titles, horizontal navigation, calm dividing lines, sharing settings opened on demand. EPUB reader has the rhythm of a book. | Best for long reading; less obvious visual bond with the brand. We do not apply serifs or a "paper" filter to PDF content. |
| **C. Commun — civic** | Background `#f0f5f1`, surface `#ffffff`, text `#213b2d`, secondary `#4a5268`, accent `#29573b`, light accent `#e3eee6`. Source Sans 3, distinct labels, radius 8–12 px. | Social public tool: library in the side panel, clear privacy states and bottom sharing panel. Calm greens and direct language give character. | Good for education and social organizations; the bottom panel needs to be checked for focus. Refers less directly to the brand. |
| **D. Gallery — optional dark mode, outside the three mockups** | Background `#18222c`, surface `#233240`, text `#f1f5f7`, secondary `#b2c0cb`, accent `#c6b1ec`, highlight `#f3a566`. Source Sans 3; minimal shadow, radius 10 px. | Large document on dark background, toolbar close to content, subtle borders instead of extensive decoration. | Good for presentations and photos; light PDF still remains light. Dark mode of the interface does not guarantee dark mode of the document or accessibility. |

Colors are starting proposals. All text/background combinations and component states must be calculated, not assumed that the entire palette meets WCAG. Sizes are a scale, not a ban on user text scaling.

## Which skills to use

A skill is a work instruction for an agent. It is not a library run at the Framashare recipient's end. Verification of a skill's license does not replace verification of application dependencies, fonts, icons, or generated code.

| Skill / tool | Availability in this session | What it brings | License / source | Proposed usage |
|---|---|---|---|---|
| **frontend-design** | Installed; instruction read | Plan for palette, typography, layout, and recognizable detail; critique of the plan before coding | Local LICENSE.txt: Apache-2.0; [license of the source Anthropic skill](https://raw.githubusercontent.com/anthropics/skills/main/skills/frontend-design/LICENSE.txt). The local instruction may differ from upstream. | At the stage of choosing a direction; particularly good for a set of variants. |
| **Impeccable** | Installed; instruction 4.3.1 read | Persistent product and design context, separate rules for tool work and reading; commands shape, audit, clarify, harden, adapt, polish | [Repository](https://github.com/pbakaus/impeccable), [Apache-2.0](https://github.com/pbakaus/impeccable/blob/main/LICENSE) | Main workflow for the entire product. One batch of desktop + mobile control, corrections, maximum one round of confirmation. |
| **avoid-ai-design** | Installed; instruction read | Audit of stereotypes, including mindless gradients, identical cards, random typography. Distinguishes certain code observations and screenshot conclusions. | Local skill declares MIT; [public SKILL.md](https://github.com/funboy322/avoid-ai-design/blob/main/SKILL.md), [MIT](https://github.com/funboy322/avoid-ai-design/blob/main/LICENSE). This is a compliant public source; the origin of a specific local copy has not been independently verified. | Optional final detect audit, not a second designer fighting the chosen aesthetics. |
| **agent-browser / agent-browser-verify** | Vercel plugin instructions available; verify read. Availability of the executable itself was not tested here. | Opens a real application, screenshots, interactions, error review and UI element control | [agent-browser engine](https://github.com/vercel-labs/agent-browser), [Apache-2.0](https://github.com/vercel-labs/agent-browser/blob/main/LICENSE). The engine license is not a confirmation of the license of every plugin instruction. | Verification after implementation. Does not require hosting the product on Vercel. |
| **UI UX Pro Max** | External; not installed | Searchable catalog of aesthetics, palettes, font pairs, and UI patterns; system proposal generator | [Repository and MIT](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) | Optionally to expand inspiration. The skills available in this application are sufficient; an automatic style suggestion should not replace a design decision. |

There is no basis to claim that any skill guarantees a better result. Authors' declarations and catalogs describe features, they do not constitute an independent quality comparison. The biggest difference is made by a specific brief, a common system, and control over the working interface.

It is worth remembering that "avoid purple" in some checklists is a shortcut regarding mindless templates. Framasoft's purple has justification in the brand, so it should be kept if we choose this direction.

## Proposed workflow

1. Save `PRODUCT.md`: who Framashare is for, most important tasks, openness, privacy, self-hosting, language requirements. Separate decisions from hypotheses.
2. Show 3–4 comparable mockups: library, PDF reader, and "Share" panel. Add a mobile view of the finalist. Do not base the choice on the landing page alone.
3. After choosing, save `DESIGN.md`: tokens, typography, spacing, density, radii, iconography, focus, error states, and motion rules. Every subsequent AI prompt should refer to this file.
4. Build basic components and their states: button, field, dialog, switch, segmented reader modes, document list, link status. Data and text must match the product, even in the absence of files.
5. Design the full flow: upload → processing → reading → link creation → access unlocking → expiration or revocation. Separate messages for unauthorized format, incorrect password, entry limit, and network problem.
6. Check real browser: desktop and mobile in one batch. Also check keyboard, long titles, different languages, browser zoom, slow upload, and empty library.
7. Perform accessibility audit and functional test, fix the whole batch of found issues, confirm the result. An automatic accessibility scan does not replace manual control with a screen reader.

Example of a specific implementation prompt:

> Build the Framashare library screen according to DESIGN.md, Frama Atelier direction. Main tasks: add file, resume reading, create and revoke link. Use existing tokens and components. Prepare empty state, upload, processing, error, and long title. Do not reveal backend names or infrastructure in the UI. Check keyboard, mobile, and 200% zoom.

## Sharing UX: the most important panel

The basic state should fit in one dialog: link name, password, expiration date, open limit, permission to download. Less frequent functions can go to the "More settings" section. Show an unambiguous preview, e.g., "Password access until October 12, 2026, 18:00 (Europe/Warsaw). 10 opens remaining."

Restrictions at the link level and the validity of the file itself must be distinguished. "Link expired" cannot suggest "file deleted". The "Revoke link" button should quickly invalidate access, and the panel should explain whether it also affects already started sessions. A warning about the lack of guarantee against copying should be placed near the download setting, concisely: "Hides downloading in the reader. Does not prevent copying or screenshots."

The "opens" limit requires a product definition visible in help. Practical proposal: count successful unlocking of a reading session, not downloading PDF pages and not every refresh. After choosing a definition, the text, counter, and implementation must speak about the same thing.

## Accessibility and resources

Goal: WCAG 2.2 AA for the interface. Regular text should have a contrast of at least 4.5:1; large text can have 3:1. The AA minimum touch target requirement is 24×24 CSS px with exceptions described in the standard; in this product I propose a more comfortable 44×44 px target for the most important reader controls. Focus must be visible, and the meaning of statuses cannot rely solely on color. [WCAG 2.2](https://www.w3.org/TR/WCAG22/), [contrast explanation](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html).

PDF has a fixed layout; EPUB should allow changing letter size, line spacing, and text width. Canvas PDF needs a text layer and keyboard support. The accessibility of the document itself also depends on the source file; the reader will not automatically fix an untagged scan.

Host fonts locally, with attached licenses. Proposals: [Source Sans — OFL](https://github.com/adobe-fonts/source-sans/blob/release/LICENSE.md), [Literata — OFL](https://github.com/googlefonts/literata/blob/main/OFL.txt), optionally [Atkinson Hyperlegible — OFL](https://github.com/googlefonts/atkinson-hyperlegible/blob/main/README.md). Check Polish and French characters and weight variants in the exact package used. OFL is an appropriate open font license, although it is not MIT; it should not be changed to MIT. The accessibility name of a font does not mean the compliance of the entire interface with WCAG.

Generated illustrations or an external font CDN are not needed in the product. The character is created by document covers, typography, and polished controls. This reduces the number of resources requiring verification and allows keeping the look consistent.
