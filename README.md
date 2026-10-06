# Framashare

Lokalny, responsywny prototyp publikowania i czytania PDF, EPUB oraz albumów. Vue 3, TypeScript, Vite i Vue Router. Interfejs jest po angielsku; zakres opisuje `docs/design/implementation-plan.md`.

## Uruchomienie

Wymagany Node.js 22.12+ lub 24 LTS.

```sh
npm ci
npm run dev
```

Pierwotne aplikacje pozostają w `front/` (React) i `back/`; ich wspólne uruchomienie: `npm run dev:legacy`. Konfiguracja bazy jest w `database/`.

Otwórz http://localhost:5173. Mapa ekranów, role i scenariusze: http://localhost:5173/overview. Komponenty i tokeny: http://localhost:5173/design-system.

```sh
npm run typecheck
npm test
npm run build
```

Testy przeglądarkowe wymagają uruchomionego `npm run dev` na porcie 5173 i Chromium z Playwright (`npx playwright install chromium`, jeśli nie jest jeszcze dostępny):

```sh
npm run test:browser
npx playwright test --config tests/admin.playwright.config.ts
node tests/public-account.mjs
node tests/pdf-controls.mjs
node tests/reader-controls.mjs
node tests/open-controls.mjs
```

W środowisku z pełnym systemowym `/tmp` można użyć katalogu projektu:

```sh
mkdir -p .runtime/tmp
TMPDIR="$PWD/.runtime/tmp" npm run test:browser
```

## Dane demonstracyjne

- Autor: `alex@example.com`, hasło `readingroom`.
- Administrator: `admin@example.com`, hasło `readingroom`.
- Formularze akceptują dowolne poprawne e-mail i hasło z co najmniej 8 znakami. Nowy e-mail tworzy lokalne konto. Nie jest to prawdziwa autoryzacja.
- Chroniony link: `/share/protected`, hasło `garden`.
- Otwarte przykłady: `/share/workshop`, `/share/garden`, `/share/album`.
- Anonimowe zarządzanie: `/manage/private-garden`.
- W `/overview` można wybrać rolę, przesunąć zegar, wymusić jednorazowy błąd i otworzyć stany odmowy/odzyskiwania.

`Reset demo` usuwa wyłącznie dane tego prototypu i przywraca seed. Klucz localStorage: `framashare-prototype-v1`. Zegar startuje 6 października 2026, 12:00 Europe/Warsaw; działa w czasie rzeczywistym i można go przyspieszać. Zmiany metadanych synchronizują się między kartami tego samego origin.

## Dostęp i pliki

Udane `Start reading` zużywa jedną sesję na 60 minut. Błędne hasło, odświeżenie i strony dokumentu nie zwiększają licznika. Limit blokuje nowe sesje; wygaśnięcie lub odwołanie linku zatrzymuje także aktywne czytanie. Usunięcie publikacji blokuje wszystkie jej linki.

Anonimowy upload ma 1/7/30 dni przechowywania (domyślnie 7) i osobny prywatny link zarządzania. Przypisanie do konta usuwa retencję i unieważnia token zarządzania, zachowując linki odbiorców. Przekroczony limit pozostawia własność bez zmian.

Wybrane lokalnie pliki i object URL są przechowywane w rejestrze całej sesji aplikacji. Przejścia między ekranami nie usuwają plików. Po przeładowaniu metadane pozostają, a brakujący plik można ponownie wybrać. Binaria i hasła kont nie trafiają do localStorage. Przykłady dołączone do projektu działają po odświeżeniu.

## Granice prototypu

Konta, reset i zmiana hasła, wysyłka e-maili, przetwarzanie uploadu oraz operacje serwera są symulowane. Frontendowe reguły linków służą ocenie przepływu, nie ochronie danych. Linki działają w tej samej lokalnej instancji i stanie przeglądarki, nie są usługą udostępniania między urządzeniami.

PDF.js renderuje rzeczywisty sześciostronicowy PDF z warstwą tekstu, wyszukiwaniem i spisem. Obsługuje również lokalne PDF-y; zaszyfrowane lub uszkodzone pliki pokazują błąd. EPUB demonstruje bezpieczne własne rozdziały i ustawienia czytania; nie parsuje dowolnych EPUB/fixed-layout. Albumy wyświetlają rzeczywiste obrazy z powiększaniem, przesuwaniem, podpisami i alt.

`Allow download` ukrywa opcję pobrania, ale nie zapobiega kopiowaniu ani screenshotom. Anonimowe wygaśnięcie jest symulowaną niedostępnością; frontend nie wykonuje serwerowego fizycznego usuwania. Nie ma backendu, wdrożenia ani zewnętrznej analityki.

## Materiały i weryfikacja

Własne ilustracje SVG, PDF i przykładowy EPUB są w `public/samples/`. Generatory ilustracji i PDF: `scripts/`. Figtree, IBM Plex Mono i Literata są hostowane lokalnie przez paczki Fontsource; licencje fontów i ikon zachowano w `docs/licenses/`.

Wyniki: [raport weryfikacji](docs/verification/README.md). Screenshoty: [galeria](docs/verification/screenshots/). Dokumenty projektu i wszystkie pierwotne referencje pozostawiono bez zmian.

Dodatkowe sprawdzenie otwartych kontrolek: `node tests/open-controls.mjs`. Odtworzenie własnych materiałów: `node scripts/generate-pdf.mjs`, `python3 scripts/generate-art.py`, `python3 scripts/generate-epub.py`. Własny upload w innej karcie wymaga ponownego wyboru pliku; rejestr binariów należy do karty aplikacji.
