# Framashare — architektura, formaty, uprawnienia i licencje

Research: 5 października 2026. Źródła są dokumentacją producentów, repozytoriami i tekstami licencji. Propozycje architektoniczne poniżej są rekomendacją projektową, nie deklaracją Framasoft ani gwarancją zgodności wszystkich przyszłych zależności.

## Rekomendacja

Zbudować modularny monolit: **Vue 3 + TypeScript + Vite** na froncie, **Node.js + Fastify** jako API, **PostgreSQL** na metadane, uprawnienia i sesje, prywatny katalog plików na pierwszej instalacji, osobny proces roboczy do przetwarzania. PDF obsługiwać przez **PDF.js**, EPUB przez wymienialny adapter do EPUB.js lub Readium po krótkim porównaniu technicznym. Instalacja musi działać na własnym serwerze bez Vercel, komercyjnego SDK, zewnętrznego konta chmurowego i obowiązkowej telemetrii.

Vue to wybór dla niewielkiego zespołu budującego interfejs czytnika; nie wymóg licencyjny. React również jest MIT i ma sens, jeżeli zespół zna go lepiej. Nie potrzebujemy Next.js wyłącznie dla uploadu i czytnika. Publiczne strony publikacji mogą być renderowane serwerowo przez API; pełne SSR frontu rozważyć dopiero, gdy publiczna biblioteka i indeksowanie staną się istotną częścią produktu. Licencje frameworków: [Vue](https://github.com/vuejs/core/blob/main/LICENSE), [React](https://github.com/facebook/react/blob/main/LICENSE), [Vite](https://github.com/vitejs/vite/blob/main/LICENSE), [Fastify](https://github.com/fastify/fastify/blob/main/LICENSE).

## Licencja: „wszystko otwarte” nie oznacza „tylko MIT”

Karta Framasoft mówi o wolnym oprogramowaniu, otwartych standardach i udostępnianiu źródeł. Nie narzuca MIT. Apache, BSD, MPL, GPL i AGPL także mogą spełniać cel wolnego oprogramowania; różnią się obowiązkami i kompatybilnością w konkretnym połączeniu. [Karta Framasoft](https://framasoft.org/en/charte/).

**Dla własnego kodu Framashare rekomenduję AGPL-3.0-or-later, do uzgodnienia z Framasoft.** Zapobiega scenariuszowi, w którym ktoś uruchamia zmodyfikowaną usługę i nie daje jej użytkownikom dostępu do odpowiadających źródeł. MIT jest dobrym wyborem, jeżeli celem jest maksymalnie swobodne ponowne użycie, także w zamkniętych produktach; nie daje takiego zobowiązania dla zmienionych usług. Precyzyjny obowiązek AGPL dotyczy m.in. udostępnienia źródeł zmodyfikowanej wersji użytkownikom korzystającym z niej przez sieć. [Wyjaśnienie GNU](https://www.gnu.org/licenses/why-affero-gpl.html).

| Element | Licencja zweryfikowana u autora | Rola / decyzja |
|---|---|---|
| Vue 3 | MIT | Proponowany framework interfejsu; [LICENSE](https://github.com/vuejs/core/blob/main/LICENSE) |
| React | MIT | Równoważna alternatywa zależna od kompetencji zespołu; [LICENSE](https://github.com/facebook/react/blob/main/LICENSE) |
| Vite | MIT | Budowanie frontu; [LICENSE](https://github.com/vitejs/vite/blob/main/LICENSE) |
| TypeScript | Apache-2.0 | Typy na froncie i backendzie; [LICENSE](https://github.com/microsoft/TypeScript/blob/main/LICENSE.txt) |
| Node.js | MIT dla kodu Node + osobne licencje składników | Runtime; sprawdzić też dystrybuowany obraz systemu; [LICENSE](https://github.com/nodejs/node/blob/main/LICENSE) |
| Fastify | MIT | API HTTP; [LICENSE](https://github.com/fastify/fastify/blob/main/LICENSE) |
| PDF.js | Apache-2.0 | Renderer PDF; [LICENSE](https://github.com/mozilla/pdf.js/blob/master/LICENSE) |
| EPUB.js | BSD-2-Clause | Prostszym API obsługuje renderowanie, paginację i hooki; [package.json](https://github.com/futurepress/epub.js/blob/master/package.json), [tekst licencji](https://github.com/futurepress/epub.js/blob/master/license) |
| Readium TypeScript toolkit | BSD-3-Clause | Alternatywa dla czytnika publikacji; [LICENSE](https://github.com/readium/ts-toolkit/blob/develop/LICENSE) |
| PostgreSQL | PostgreSQL License | Permisywna wolna licencja podobna do BSD/MIT; [oficjalna licencja](https://www.postgresql.org/about/licence/) |
| LibreOffice | MPL-2.0 jako licencja produktu + różne licencje części | Opcjonalny konwerter dokumentów biurowych; nie traktować całego obrazu jako jednej licencji; [licencje](https://www.libreoffice.org/licenses/) |

To **audyt kandydatów**, nie kompletny audyt dostarczanej aplikacji. Przed pierwszym wydaniem: zablokować wersje w lockfile, sprawdzić zależności pośrednie i pliki LICENSE/NOTICE, wygenerować SBOM, zachować informacje o autorach i licencjach, objąć audytem kontenery, narzędzia konwersji, fonty, ikony i materiały demonstracyjne. Automatyczna lista SPDX pomaga, ale nie rozstrzyga sama kompatybilności. Kod MIT nie zmienia PDF.js na MIT. Fonty na OFL również są otwarte, choć nie mają MIT. Nie stosować zależności oznaczonych „source available”, non-commercial albo z obowiązkowym zamkniętym serwerem bez osobnego sprawdzenia.

## Jedna aplikacja, kilka jasno oddzielonych odpowiedzialności

```text
przeglądarka
   ├─ panel autora / czytnik Vue
   └─ API Fastify: konto, upload, polityki dostępu, sesje czytelnika
          ├─ PostgreSQL: dane i transakcje
          ├─ prywatny magazyn: oryginały + podglądy + zasoby EPUB
          └─ kolejka zadań → odizolowany worker: walidacja, miniatury, konwersja
```

Proponowana struktura repozytorium: `apps/web`, `apps/api`, `apps/worker`, `packages/contracts`. API i worker mogą początkowo korzystać ze wspólnego kodu i obrazu, ale worker powinien mieć osobne uprawnienia i limity zasobów. Nie ma potrzeby budować mikroserwisów.

Pierwsze wdrożenie: Compose, reverse proxy z HTTPS, API, worker, PostgreSQL i wolumen plików. Magazyn za interfejsem `Storage`; adapter lokalny na start, adapter S3-compatible dopiero dla większych wdrożeń. Kopia zapasowa musi obejmować bazę **i pliki**, a odtwarzanie trzeba faktycznie sprawdzić. Kolejka oparta o PostgreSQL ogranicza liczbę usług; dedykowany broker dodać, gdy wynik pomiarów uzasadni komplikację. Wyszukiwanie katalogu można rozpocząć od PostgreSQL; osobny silnik nie jest wymaganiem MVP.

## Format to nie tylko rozszerzenie

| Format | Pierwsza wersja | Zachowanie |
|---|---|---|
| PDF | Tak | PDF.js: strony, zoom, dopasowanie, tekst, wyszukiwanie, outline, obrót, pełny ekran; renderowanie stron widocznych i pobliskich zamiast całego dokumentu naraz |
| JPEG/PNG/WebP, zestaw obrazów | Tak | Karuzela z miniaturami, podpisami, kolejnością autora, zoomem i klawiaturą |
| EPUB bez DRM | Tak, po próbie adaptera i izolacji | Rozdziały, spis treści, wielkość tekstu, szerokość, motyw, odstępy; postęp / lokacja, ponieważ strony zależą od ekranu i fontu |
| ODT/ODP/DOCX/PPTX | Kolejna wersja | Konwersja w workerze do PDF; pokazanie statusu i komunikatu o możliwych różnicach układu |
| TXT/Markdown | Kolejna wersja | Czytnik tekstowy; Markdown po sanitizacji |
| SVG/HTML/ZIP | Nie jako dowolny plik w MVP | Aktywna treść i archiwa wymagają osobnej, dobrze zdefiniowanej polityki; zestaw zdjęć tworzyć uploadem wielu plików |
| XLSX/ODS, audio, wideo, CBZ | Później według potrzeb | Osobne sposoby prezentacji; nie obiecywać jakości przez uniwersalną konwersję |

PDF.js to biblioteka renderująca PDF; gotowy viewer może dostarczyć wiele funkcji, lecz własny interfejs musi integrować warstwę tekstu i dostępność. Nie tworzyć „czytnika PDF” z samych screenshotów. API pozwala pracować z workerem i ładowaniem danych, w tym transportem zakresów. [API PDF.js](https://mozilla.github.io/pdf.js/api/draft/module-pdfjsLib.html).

EPUB.js oferuje renderowanie i paginację; Readium udostępnia pakiety shared i navigator oraz model publikacji. Wybór po krótkiej próbie na: EPUB reflowable, fixed-layout, publikacji z rozbudowanym TOC, obrazami, polskimi znakami i problematycznymi stylami. Sprawdzić aktualne wydania i zależności w momencie implementacji; liczba gwiazdek nie rozstrzyga utrzymania. [EPUB.js](https://github.com/futurepress/epub.js), [Readium](https://github.com/readium/ts-toolkit).

LibreOffice ma udokumentowane filtry importu i eksportu oraz CLI `--convert-to`, więc może konwertować dokumenty i slajdy do PDF. Nasza rekomendacja: osobny proces z jednorazowym profilem, bez sieci, bez dostępu do bazy, z timeoutem i limitami pamięci. To nie zapewnia idealnego odwzorowania plików Microsoft Office; brakujące fonty trzeba obsłużyć jawnie, używając legalnie dystrybuowanych fontów. [Filtry LibreOffice](https://help.libreoffice.org/latest/en-US/text/shared/guide/convertfilters.html).

## Model uprawnień

Oddzielić **publikację**, jej **wersję pliku**, **link** i **sesję oglądania**. Jeden dokument może mieć publiczny link do katalogu, link dla partnera ważny tydzień i link jednorazowy dla innego odbiorcy. Każdy odwołać osobno.

Minimalne byty: `users`, `documents`, `document_versions`, `assets`, `share_links`, `viewer_sessions`, `processing_jobs`; ewentualnie `document_members` przy udostępnianiu konkretnym kontom. Link może zawierać `password_hash`, `starts_at`, `expires_at`, `max_sessions`, `sessions_used`, `allow_download`, `allow_embed`, `revoked_at`, identyfikator wersji oraz numer rewizji polityki. W przypadku wielu obrazów publikacja ma listę zasobów z kolejnością, podpisem i tekstem alternatywnym.

Polityka powinna być deny-by-default. Hasło, data, licznik i wymagane konto działają łącznie jako warunki dostępu. „Publiczny”, „nieindeksowany link” i „prywatny” to odrębne tryby. Link nieindeksowany może trafić dalej, więc sam w sobie nie oznacza kontroli tożsamości. Odbiorca imienny wymaga zalogowanego konta lub zweryfikowanego zaproszenia. Bez identyfikacji nie da się rzetelnie zapewnić „maksymalnie pięć osób”.

### „Maksymalnie N otwarć” oznacza N sesji

Zalecany kontrakt: **jedno otwarcie = utworzenie sesji po naciśnięciu „Otwórz dokument” i spełnieniu wszystkich warunków**. Sesja jest ważna np. 60 minut, z końcem nie późniejszym niż `expires_at`; tę wartość dopracować w UX. Odświeżenie i kolejne strony w tej sesji nie zużywają nowych otwarć. Po jej wygaśnięciu kolejne rozpoczęcie zużywa nowe otwarcie. Osiągnięcie limitu blokuje nowe sesje, ale nie przerywa istniejących; odwołanie linku i termin końcowy zatrzymują przyszłe żądania także istniejących sesji.

Nie naliczać GET strony, HEAD, miniaturek, range requests, botów generujących podgląd linku ani nieudanego hasła. Ograniczenie nie jest dowodem fizycznego przeczytania dokumentu, bo po wydaniu sesji sieć lub renderer mogą zawieść. UX powinien używać słowa „sesje” lub wyjaśniać definicję otwarcia.

Algorytm: po autoryzacji rozpocząć transakcję; zablokować wiersz linku, sprawdzić jego aktualną politykę i idempotentną próbę otwarcia; utworzyć sesję i zwiększyć licznik w tej samej transakcji. Przy równoległych próbach ostatniego otwarcia sukces może otrzymać tylko jedna. Klucz idempotencji zapobiega naliczeniu powtórki tego samego POST po utracie odpowiedzi. Blokady i ponowne sprawdzanie warunku UPDATE opisuje [dokumentacja PostgreSQL](https://www.postgresql.org/docs/current/transaction-iso.html); zwracanie zmienionych wierszy zapewnia [UPDATE RETURNING](https://www.postgresql.org/docs/18/sql-update.html).

### Nie wypuszczać pliku poza kontrolę linku

Każde żądanie PDF, zakresu bajtów, miniatury, rozdziału EPUB i obrazu przechodzi kontrolę sesji **oraz aktualnego linku**. Samodzielny JWT z godziną ważności nie zapewnia natychmiastowej revokacji bez sprawdzenia stanu. Pliki w prywatnym magazynie, brak publicznych URL-i do oryginałów. API autoryzuje request; dane może streamować lub przekazywać wewnętrznym mechanizmem reverse proxy. Obsłużyć Range, 206, długość i typ; ograniczyć nadmierną liczbę zakresów i ruch.

Prywatne odpowiedzi nie powinny trafiać do wspólnego CDN/cache ani offline service workera. Sesje przechowywać w bezpiecznych cookies HttpOnly/Secure; uwzględnić SameSite i CSRF przy operacjach zmieniających stan. Linki z losowym silnym tokenem, w bazie jego hash, bez tokenów w logach analitycznych; `Referrer-Policy: no-referrer` na stronach udostępniania. Hasła linków hashować, ograniczać próby i pozwalać na zmianę/odwołanie.

**„Wyłącz pobieranie” oznacza wyłączenie przycisku i endpointu oryginału, nie ochronę DRM.** Czytnik w przeglądarce otrzymuje bajty PDF lub zasoby do renderowania; można je zachować albo wykonać screenshot. Odwołanie linku blokuje przyszłe pobrania, nie usuwa danych już otrzymanych. Własne renderowanie do obrazów też nie rozwiązuje kopiowania, a pogarsza dostępność i wyszukiwanie.

Nie nazywać tej architektury E2EE. Walidacja i konwersja po stronie serwera wymagają dostępu do treści. Prawdziwy tryb szyfrowania po stronie klienta to osobna decyzja produktowa: zmienia podglądy, wyszukiwanie, moderację i zarządzanie dostępem.

## Bezpieczeństwo treści oraz prywatność

Upload: allowlista formatów, walidacja zawartości zamiast zaufania do rozszerzenia i nagłówka MIME, limit rozmiaru, liczby plików, obrazu w pikselach i zasobów po dekompresji. Plik przed publikacją w stanie kwarantanny; losowe nazwy w storage. Worker dostaje tylko potrzebne wejście, nie sekrety aplikacji. Dodatkowo skaner antymalware jako warstwa, nie gwarancja. Dla usług publicznych: limity konta i instancji, zgłaszanie nadużyć, administracyjne usunięcie publikacji oraz cykl usuwania osieroconych plików. To wdrożeniowe zastosowanie zaleceń [OWASP File Upload](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html).

EPUB jest archiwum z XHTML/CSS i może zawierać skrypty oraz zasoby zewnętrzne. Odrzucać traversal (`../`), symlinki i ZIP bombs; parser XML bez zewnętrznych encji. Publikację renderować w odizolowanej ramce/originie z restrykcyjną CSP, bez skryptów autora, event handlerów, formularzy i nieautoryzowanych zdalnych zasobów. Nie doklejać surowego XHTML do DOM panelu. Zachować kontrolę nad nawigacją czytnika. W3C wyraźnie opisuje zagrożenia skryptów i izolację treści: [EPUB Reading Systems 3.3](https://www.w3.org/TR/epub-rs-33/).

Telemetria wyłączona domyślnie; proste liczniki agregowane zamiast profilowania odbiorców. Nie obiecywać anonimowości, jeśli operator zapisuje IP. Hasła, linki i tytuły prywatnych publikacji nie mogą pojawiać się w metrykach. Terminy udostępnienia i przechowywania pliku to dwie różne funkcje: wygasły link nie usuwa automatycznie pliku autora. Jasno pokazać obie daty, retencję oraz procedurę usunięcia i backupów.

## Weryfikacja przed uruchomieniem

Najważniejsze testy: brak dostępu do assetów bez sesji; próby odgadnięcia identyfikatorów; niepoprawne hasła; daty graniczne; dwie równoległe próby ostatniego otwarcia; powtórka POST z tym samym kluczem; PDF range requests bez dodatkowego naliczania; odwołanie linku w trakcie czytania; prywatne miniatury; EPUB z aktywną treścią, zdalnymi zasobami i bombą ZIP; timeout konwersji i sprzątanie plików. Testy E2E: upload → przetworzenie → publikacja → link → hasło → czytanie → revokacja. Dostępność: klawiatura, widoczny fokus, screen reader, układ mobilny i zoom przeglądarki.

## Decyzje, które zmieniają zakres

1. Czy dominują publiczne publikacje i katalog jak SlideShare, czy prywatne udostępnianie? Model może obsłużyć oba, ale katalog, SEO i moderacja zwiększają zakres.
2. Czy autorzy wymagają konta? Konto pozwala odzyskać pliki i zarządzać retencją; upload anonimowy potrzebuje bezpiecznego linku zarządzania i większej ochrony przed nadużyciami.
3. Czy EPUB musi być w pierwszej wersji? Jeżeli tak, izolacja i dostosowany czytnik są elementem MVP, nie opcjonalnym dodatkiem po premierze.
4. Czy limit oznacza sesje globalnie, czy dostęp konkretnych osób? Drugi wariant wymaga identyfikacji.
5. Czy Framasoft zatwierdza AGPL i taki stos operacyjny? Potwierdzić przed ustaleniem finalnej licencji repozytorium i wdrożeniem produkcyjnym.
