# Weryfikacja prototypu Framashare

Wykonano lokalnie 6 października 2026. Implementacja używa Vue 3, TypeScript, Vite, Vue Router i PDF.js, bez Figmy i backendu. Pracę podzielono między trzy subagenty (Public & Account, Readers, Administration); główny agent zintegrował bibliotekę, upload, linki i anonimowe przypisanie.

## Wynik

- `npm run typecheck` — bez błędów.
- `npm run build` — produkcyjny build przechodzi; [log](build.log).
- `npm test` — 14 testów reguł dostępu, niezależności linków, sesji, retencji, usuwania i atomowego claim; [log](unit-tests.log).
- `npm run test:browser` — 13 testów Playwright (12 przepływów oraz dodatkowy test drag-and-drop albumu), obejmujących wszystkie 8 scenariuszy planu, odzyskanie lokalnego pliku, błąd claim przy braku miejsca, walidację daty, focus trap i responsywność; [log przepływów](browser-tests.log), [drag-and-drop](album-drag.log).
- Panel administracyjny — 5 testów Playwright: zgłoszenia, odrzucenie, usunięcie, limity, ustawienia i błąd zapisu; desktop 1440, mobile 390 i 320 px.
- Public & Account — 82 kontrole nawigacji i wymiarów, formularze, zachowanie powrotu, reset, ustawienia i usuwanie konta. [Szczegóły](public-account.md).
- Otwarte menu — 18 sprawdzeń geometrii i Escape: profil, publikacja, sortowanie, filtry, akcje dokumentu i linku przy 1440/390/320 px. Sprawdzono też fullscreen, rzeczywiste pobranie PDF i formularz raportu na mobile.
- PDF — 6 renderowanych stron, warstwa tekstu, 6 wyników wyszukiwania, miniatury, rzeczywisty outline, obrót, zoom, fit, ograniczenie numeru strony do zakresu. Brak błędów i ostrzeżeń konsoli podczas tej weryfikacji.
- EPUB — realna zmiana fontu na 24 px, interlinii, szerokości, motywu; preferencje i rozdział zostają po powrocie.
- Album — obrazy, kolejność, alt i podpisy, miniatury, zoom/pan oraz ekran brakującego obrazu.

Główne ekrany sprawdzono przy 1440, 1024, 768, 390 i 320 px. Sprawdzenie powiększenia 200% wykonano przez równoważną geometrię przeglądarki: viewport 720×500 CSS px przy device scale factor 2, odpowiadający przestrzeni 1440×1000 przy dwukrotnym powiększeniu. To test układu i renderowania, nie automatyzacja menu zoom konkretnej przeglądarki. Nie wykryto poziomego overflow; dokument PDF może przewijać się we własnym obszarze po powiększeniu.

## Scenariusze końcowe

| Scenariusz | Wynik |
|---|---|
| Landing → rejestracja → lokalny PDF → publikacja → czytnik → biblioteka | PASS |
| Anonimowy upload 7 dni → zapis management link → link odbiorcy → logowanie → claim | PASS; stary management token nieważny, recipient link zachowany |
| Hasło + custom date/time + limit + download off → złe/poprawne hasło | PASS; zła próba nie liczy sesji |
| Odświeżenie aktywnego czytnika i wyczerpany limit | PASS; licznik nie rośnie przy odświeżeniu |
| Odwołanie w drugiej karcie podczas czytania | PASS; podgląd znika, drugi link działa |
| EPUB preferences i edycja albumu | PASS; realne zmiany wyglądu i danych |
| Zgłoszenie odbiorcy → moderator → usunięcie | PASS; wszystkie linki publikacji niedostępne |
| Upload failure → retry → success oraz Cancel | PASS; anulowanie nie zostawia gotowej publikacji |

## Screenshoty

Zachowano pełne strony oraz widoki z otwartymi kontrolkami. Pliki są w [screenshots/](screenshots/).

| Widok | Desktop | Mobile |
|---|---|---|
| Landing | [1440](screenshots/landing-desktop.png) | [390](screenshots/landing-mobile.png) |
| Logowanie | [1440](screenshots/login-desktop.png) | [390](screenshots/login-mobile.png) |
| Biblioteka — siatka | [1440](screenshots/-app-library-1440.png) | [390](screenshots/-app-library-390.png) |
| Biblioteka — lista | [1440](screenshots/-app-library-view-list-1440.png) | [390](screenshots/-app-library-view-list-390.png) |
| Filtry | [1440](screenshots/library-filters-1440.png) | [390](screenshots/library-filters-390.png) |
| Upload anonimowy | [1440](screenshots/anonymous-upload-1440.png) | [390](screenshots/anonymous-upload-390.png) |
| Szczegóły i linki | [1440](screenshots/-app-documents-doc1-1440.png) | [390](screenshots/-app-documents-doc1-390.png) |
| Link z datą/godziną | [1440](screenshots/sharing-calendar-desktop.png) | [390](screenshots/sharing-calendar-mobile.png) |
| Bramka hasła | [1440](screenshots/-share-protected-1440.png) | [390](screenshots/-share-protected-390.png) |
| PDF | [1440](screenshots/pdf-desktop.png) | [390](screenshots/pdf-mobile.png) |
| PDF — wyszukiwanie | [1440](screenshots/pdf-search-desktop.png) | [390](screenshots/pdf-search-mobile.png) |
| PDF — miniatury | [1440](screenshots/pdf-thumbnails-desktop.png) | [390](screenshots/pdf-thumbnails-mobile.png) |
| EPUB | [1440](screenshots/epub-desktop.png) | [390](screenshots/epub-mobile.png) |
| EPUB — ustawienia | [1440](screenshots/epub-settings-desktop.png) | [390](screenshots/epub-settings-mobile.png) |
| Album | [1440](screenshots/album-desktop.png) | [390](screenshots/album-mobile.png) |
| Album — miniatury | [1440](screenshots/album-thumbnails-desktop.png) | [390](screenshots/album-thumbnails-mobile.png) |
| Zgłoszenie | [1440](screenshots/report-desktop.png) | [mobile](screenshots/report-mobile.png) |
| Administracja | [1440](screenshots/admin-reports-desktop.png) | [390](screenshots/admin-reports-mobile.png) |
| Potwierdzenie usunięcia | [1440](screenshots/admin-removal-dialog-desktop.png) | [390](screenshots/admin-removal-dialog-mobile.png) |
| Ustawienia instancji | [1440](screenshots/admin-settings-desktop.png) | [390](screenshots/admin-settings-mobile.png) |

Dodatkowe screenshoty obejmują menu profilu/dokumentu/linku, sortowanie, nawigację mobilną, ustawienia konta, limity konta i [układ odpowiadający 200%](screenshots/sharing-200-percent-layout.png).

## Naprawy wynikające z weryfikacji

- Wybrane pliki nie giną przy przejściu formularz → postęp → sukces → czytnik.
- Anulowanie nie pozostawia gotowej publikacji ani jej object URL.
- Powrót do aktywnej sesji z hasłem działa bez kolejnej prośby o hasło i bez zwiększenia licznika.
- Przetwarzana lub nieudana publikacja nie zużywa sesji odbiorcy.
- Synchronizacja między kartami unieważnia aktywny podgląd po odwołaniu, bez zapisywania całego stanu co sekundę.
- Puste pole daty nie wywołuje błędu renderowania; data w przeszłości jest odrzucana.
- Nagłówek z profilem mieści się na 320 px. Menu przy krawędzi ekranu zmienia położenie i mieści się w viewport.
- Escape zamyka dialog/menu i przywraca focus. Tab pozostaje wewnątrz dialogu.
- Długi tytuł nie zasłania działań; miniaturowa okładka ogranicza tekst, pełny tytuł pozostaje przy publikacji.

## Faktyczne ograniczenia

To prototyp frontendowy. Role, hasła kont, reset, e-maile i serwerowe operacje są symulowane. Reguły linków można zmienić przez narzędzia przeglądarki, więc nie zapewniają bezpieczeństwa produkcyjnego. Dane i linki nie są współdzielone między urządzeniami.

Binaria własnego uploadu istnieją w pamięci karty aplikacji. Po reloadzie lub w innej karcie trzeba wybrać je ponownie; metadane pozostają. Dołączone PDF/EPUB/album nie wymagają ponownego wyboru. Czytnik EPUB używa własnych bezpiecznych rozdziałów; pełny parser dowolnych EPUB nie jest zaimplementowany zgodnie z zakresem planu.

Retencja anonima oznacza lokalną niedostępność, nie zadanie fizycznego kasowania na serwerze. Wyłączenie downloadu nie zabezpiecza przed kopiowaniem i screenshotami. Testy nie stanowią pełnego audytu WCAG ani zgodności samych dokumentów PDF.

## Odtworzenie

Komendy uruchomienia i testów znajdują się w [README projektu](../../README.md). `/overview` zawiera mapę stron, scenariusze, role, reset, jednorazowy błąd i kontrolę zegara. `/design-system` pokazuje tokeny i komponenty. Testy uruchomiono na Chromium/Playwright; nie deklarujemy weryfikacji Safari i Firefox.

## Weryfikacja przed przygotowaniem branchu

6 października 2026 ponownie uruchomiono `npm run build`, `npm test` (14/14), `npm run test:browser` (13/13) oraz `npx playwright test --config tests/admin.playwright.config.ts` (5/5). Wszystkie zakończyły się powodzeniem. Sprawdzono zgodność lockfile z manifestem i zachowanie workspace’ów `front` oraz `back`. Pierwotne pliki `front/`, `back/`, `database/` i `src/index.js` nie zostały zmienione.
