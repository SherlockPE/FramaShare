# Framashare: competitors and functional recommendations

Research status: October 5, 2026. The sources below are official product websites and their documentation. Paid accounts and application behavior after logging in were not checked. "Unconfirmed" means a lack of sufficient proof, not a lack of features.

## Confirmed patterns

| Tool | What the documentation confirms | What is worth porting to Framashare |
|---|---|---|
| SlideShare | PDF, PowerPoint and Word upload; indexing, embedding on sites. Public content can have downloading and embedding disabled separately. Private means owner only, and Limited grants access via a direct link; the documentation also describes a password. | Separate document visibility from recipient rights. Reader embedding and linking to a specific page. |
| Calaméo | Zoom, search, table of contents, full screen, different views, downloading and printing. A private URL is available in every plan. Password protection requires Subscribers: individual login and password as well as assignment of the publication, in PREMIUM/PLATINUM. | A good publication reader, table of contents and a simple rights panel. Framashare can offer an easier password for a single link. |
| Nextcloud | Links with a password and expiration date, sharing revocation, note for the recipient, multiple links with different rights, users and groups. Hide download makes downloading harder by hiding UI elements. | One document → multiple independent links: "workshops", "partners", "public page". A readable list of active permissions. |
| Dropbox DocSend | Password, expiration, downloading, requiring or verifying email, allow/block lists of emails and domains. Some features depend on the plan. Watermark and agreement before entry are features of higher plans. | Rules assigned to the link, later editing and revocation. Verified invitations as an option for organizations. |
| Lufi / former Framadrop | In-browser encryption before upload, separate link for downloading and deletion, choice of storage time. Lufi's code is AGPLv3. Framadrop was closed on January 12, 2021. | The simplicity of "drop → copy link", clear retention, deletion by the owner. End-to-end encryption requires a separate project for preview support. |
| Flipsnack | Sharing as Unlisted or Password protected; further edits do not change the URL. | Keeping a stable link when updating a document, while simultaneously indicating the version. |

Sources for the table:

- SlideShare: [formats and upload](https://www.slideshare.net/upload?from_source=loggedin_newsfeed), [official privacy settings](https://support.scribd.com/hc/en-us/articles/360055663791-Your-Slideshare-content-privacy-settings).
- Calaméo: [reader features](https://www.calameo.com/en/features), [private publication](https://support.calameo.com/hc/it/articles/205481338-Non-voglio-che-la-mia-pubblicazione-sia-pubblica-Come-posso-renderla-privata), [password protection](https://support.calameo.com/hc/en-us/articles/360001325267-How-can-I-password-protect-my-document).
- Nextcloud: [official sharing documentation](https://docs.nextcloud.com/server/latest/user_manual/en/files/sharing.html). The `latest` link is moving; for a future implementation, the documentation of the selected version should be verified again.
- DocSend: [link settings](https://help.dropbox.com/share/dropbox-docsend-link-settings-in-content-library?fallback=true).
- Lufi: [operation and license of the Framasoft instance](https://asso.framasoft.org/drop/about), [Framadrop closure and retention](https://docs.framasoft.org/fr/lufi/index.html), [repository](https://framagit.org/fiat-tux/hat-softwares/lufi).
- Flipsnack: [private sharing](https://help.flipsnack.com/en/how-to-share-flipbook-without-publishing-first).

Issuu remains a significant inspiration for the magazine reader and publication distribution. The official site was inaccessible to the research tool, and the search engine did not return enough official materials. Current limits, prices, or password features should not be attributed to Issuu based on this. A current, native EPUB reader in the above products was also not confirmed.

## Proposed product scope — recommendations, not findings about competition

Framashare should combine the transfer simplicity of Lufi, the reader convenience of Calaméo, and the independent links model of Nextcloud. The differentiator will be clear, effectively enforced sharing, without ads and tracking recipients for marketing purposes.

### First usable version

- PDF: pages, thumbnails, typing page number, zoom, fit to width/page, rotation, text search, table of contents, full screen, keyboard and accessible text.
- EPUB without DRM: chapters, table of contents, text size, column width, line height, light/dark/sepia theme. Reading progress percentage and position instead of faking fixed pagination.
- JPEG/PNG/WebP images: carousel, thumbnails, zoom, panning, sequence, captions and alt text.
- Owner panel: files, titles, description, processing status, active links, deletion, storage quota, preview as recipient.
- Link: optional password, expiration date and time, maximum number of opens, downloading the original, manual revocation, ability to create multiple links for one document.
- Clear states: processing, unsupported format, incorrect password, link expired, limit exhausted, deleted document. Permission errors should not reveal the title, thumbnail or file names.
- Accessibility and mobile from the start; reader with gestures, visible focus, keyboard support, button labels and reduced motion preference.

### Next wave

Scheduled access start, individual invitations with email confirmation, document collections, embed with separate access control, stable links and version history, optional private bookmarks/notes, metadata and file export, lightweight event log for the owner. DOCX/ODT/PPTX/ODP can later be converted to PDF in an isolated worker; do not promise full layout fidelity. OCR for scans and accessibility verification can be the next stage.

Postpone for the start: public feed, social recommendations, federation, public comments, document editor, DRM, and reading time analytics per page. They increase the scope, moderation, costs, and data collection.

## Access features precision

I propose defining "Maximum 10 opens" as 10 new, accepted reader sessions. Loading a document page, thumbnail, PDF byte ranges, and refreshing an active session do not consume further entries. A session should have a specific validity time. The limit is incremented atomically after fulfilling access conditions; parallel requests and retries cannot consume multiple entries. Opening by link scanners and messenger previews should not consume the limit; for restricted links, explicitly clicking "Open document" can be required. This does not mean controlling the number of people: an anonymous recipient can change the browser, and users can share access.

The sharing password and the encrypted PDF password are two separate mechanisms. Hiding the download button limits the convenience of downloading, but the browser must receive the content to display. It cannot be promised that the recipient will not copy the visible content or take a screenshot. This limitation should be described next to the "Allow original download" setting, without marketing promises of DRM.

Expiration and revocation are meant to block future downloads of content from the server. They will not delete previous copies or content already in the recipient's memory. Permissions must cover the original, previews, thumbnails, extracted text, and EPUB assets; the password screen itself in front of the public file URL is not enough.

A non-public document should be the default. "Access via link" is access for any link holder; "Only invited people" requires identity verification. Public publication and indexing is a conscious, separate decision of the owner.
