# Framashare pełny plan prototypu aplikacji

Zbudować lokalny, responsywny prototyp wszystkich ekranów Framashare w przeglądarce. Prototyp ma pozwolić ocenić wygląd oraz przejść pełne ścieżki autora, anonimowego publikującego, odbiorcy i administratora. Ma działać bez Figmy, z angielskimi tekstami interfejsu i stylem bardzo bliskim Cofounder.

To plan realizacji zatwierdzonego zakresu mockupów, przeniesionego z Figmy do aplikacji webowej. Nie obejmuje produkcyjnego backendu, wdrożenia ani prawdziwego systemu kontroli dostępu. Agent wykonujący plan ma przygotować cały prototyp, a nie jedynie landing page.

## 1. Ustalenia obowiązujące w nowej sesji

- Produkt: wygodne publikowanie i czytanie PDF, EPUB bez DRM oraz albumów JPEG/PNG/WebP, z niezależnymi linkami dostępu.
- Autor z kontem ma bibliotekę; odbiorca nie potrzebuje konta. Dostępny jest również upload bez konta.
- Anonimowa publikacja ma wybierany okres przechowywania: 1, 7 lub 30 dni, domyślnie 7 dni.
- Autor anonimowy zarządza dokumentem przez osobny prywatny link. Może przypisać publikację do konta.
- Przypisanie usuwa anonimowy termin przechowywania, unieważnia prywatny link zarządzania i zachowuje linki odbiorców.
- Zakres obejmuje strony publiczne, konta, bibliotekę, upload, udostępnianie, trzy czytniki i podstawową pełną administrację.
- Desktop i mobile mają równorzędną jakość. Otwarte menu, dialogi, formularze i błędy są częścią projektu.
- UI jest po angielsku. Dokumentacja i raport wykonania mogą być po polsku.
- Design Cofounder zastępuje wcześniejsze kierunki Frama Atelier, Papier i Commun. Nie używać fioletowo-pomarańczowej palety poprzednich mockupów jako podstawy.
- Poza zakresem: publiczny katalog, publiczne profile autorów, płatności, społeczny feed, komentarze, federacja, OCR, Office, historia wersji, zespoły i produkcyjna infrastruktura.

## 2. Inspiracja i materiały referencyjne

Źródła: [Cofounder](https://cofounder.co/), [Resources](https://cofounder.co/resources), [Pricing](https://cofounder.co/pricing), [How to start](https://cofounder.co/how-to/start), [logowanie aplikacji](https://app.cofounder.co/login). Przejmujemy język wizualny i wzorce układu, zachowując funkcjonalności Framashare.

W katalogu `docs/design/references/` znajdują się zrzuty z analizy 6 października 2026:

| Plik | Zastosowanie |
|---|---|
| `cofounder-home.png` | Kompozycja hero, pixel art, typografia i nawigacja. |
| `cofounder-resources.png` | Karty treści, odstępy i hierarchia metadanych. |
| `cofounder-start.png` | Boczny spis treści i kolumna dłuższego tekstu. |
| `cofounder-login.png` | Układ logowania, ilustracja, przełączniki i przyciski. |
| `cofounder-app-preview.png` | Spokojne otoczenie narzędzia i podział przestrzeni roboczej. |
| `cofounder-mobile-nav.png` | Otwarta nawigacja mobilna. |

Zrzuty są referencją do oglądania, nie grafikami gotowych ekranów Framashare. Nie wklejać zrzutu całej strony jako UI. Nie kopiować logo, materiałów marketingowych ani ilustracji Cofounder do finalnej aplikacji. Prywatna aplikacja Cofounder nie była dostępna po zalogowaniu; jej publiczne podglądy wystarczają jako kierunek kompozycyjny.

Starsze dokumenty w `docs/research/` pozostają kontekstem produktu. W konflikcie zakresu, stylu lub sposobu dostarczenia obowiązuje ten plan.

## 3. Rezultat i technologia

Użyć Vue 3, TypeScript, Vite i Vue Router. Stylowanie przez własne tokeny CSS oraz wspólne komponenty. Ikony wektorowe z jednej rodziny, np. Lucide. Nie dokładać gotowego motywu dashboardu, który narzuci inną estetykę.

Przygotować:

1. Wszystkie strony i interakcje opisane poniżej, uruchamiane jedną komendą lokalną.
2. Wspólne komponenty i stronę przeglądową `/overview` z mapą ekranów oraz scenariuszami demonstracyjnymi.
3. Stronę `/design-system` z tokenami, komponentami i ich stanami.
4. Lokalne przykładowe dane i usługę mockującą operacje aplikacji.
5. Własny przykładowy PDF, bezpieczne przykładowe rozdziały EPUB i album z własnymi ilustracjami.
6. Dokumentację uruchomienia, listę symulacji, screenshoty desktop/mobile i wyniki weryfikacji.

Nie dodawać Fastify, PostgreSQL, workerów, prawdziwego logowania, wysyłki e-maili ani zewnętrznej analityki. Nie publikować aplikacji automatycznie. Zależności instalować w stabilnych wersjach i zapisać lockfile.

### Dane prototypu

Metadane dokumentów, linków, zgłoszeń i preferencje przechowywać w localStorage przez jeden adapter. Plików binarnych i wpisanych haseł konta nie zapisywać w localStorage. Wybrane lokalnie pliki i ich obiektowe URL-e przechowuje rejestr należący do całej sesji aplikacji, aby przetrwały przejście upload → szczegóły → czytnik. Zwalniać je przy wymianie pliku, usuwaniu publikacji, resecie lub zamknięciu aplikacji, nie przy zmianie strony. Tymczasowe miniatury należące tylko do komponentu mogą być zwalniane przy jego odmontowaniu.

Po przeładowaniu strony metadane własnego uploadu zostają, a brakujący plik ma akcję `Select file again`. Dołączone przykłady działają po odświeżeniu bez ponownego wybierania. Limity pamięci i odmowa dostępu do storage mają komunikat z możliwością kontynuowania demonstracji w pamięci.

Model danych obejmuje dokument, właściciela lub anonimowy token zarządzania, status przetwarzania, termin usunięcia, linki odbiorców, sesje czytania, zgłoszenia i ustawienia instancji. Link przechowuje własne ustawienia; nie zapisywać ich jako jednej globalnej konfiguracji dokumentu.

Mock service udostępnia operacje: upload, edycja metadanych, utworzenie/edycja/odwołanie linku, rozpoczęcie sesji, przypisanie do konta, usunięcie dokumentu, zgłoszenie i decyzja moderatora. Obsługuje krótkie opóźnienia, sukcesy i przewidywalne błędy. Nie ma potrzeby projektowania produkcyjnego REST API.

Na `/overview` jasno opisać, że konta, wiadomości e-mail, zabezpieczenia linków i operacje serwera są symulowane. Skopiowane linki demonstracyjne działają w tej samej lokalnej instancji i stanie przeglądarki. Nie są usługą udostępniania między urządzeniami.

## 4. System wizualny

### Kolory i powierzchnie

| Token | Wartość | Rola |
|---|---|---|
| Canvas | `#F5F5F2` | Główne tło. |
| Surface | `#FBFBF8` | Karty, dialogi i panele. |
| Border | `#DEE2DE` | Cienkie obramowania. |
| Control border | `#E3E3E0` | Pola i małe kontrolki. |
| Muted surface | `#E7E7E3` | Segmenty i wtórne powierzchnie. |
| Text | `#262323` | Tekst główny. |
| Button | `#202020` | Grafitowe główne akcje. |

Kolory stanów sukcesu, błędu i focusu dobrać do wymaganych kontrastów. Blady błękit może wskazywać aktywny element. Statusy mają ikonę lub etykietę, nie wyłącznie kolor. Nie kopiować niskokontrastowych metadanych ze screenshotów.

Przyciski grafitowe mają delikatny gradient, jasną wewnętrzną górną krawędź i krótki cień. Karty są jasne, z cienką linią i subtelną krawędzią zamiast dużych cieni. Promień typowych kontrolek 8 px, dużych kart 16 px; przyciski w formularzach konta mogą mieć kształt kapsuły jak referencja. Promienie wynikają z roli elementu.

### Typografia i układ

Bazowym fontem jest lokalnie hostowany Figtree; metadane techniczne mogą używać IBM Plex Mono. Oryginalny TT Neoris można zastosować tylko przy dostępnej, odpowiedniej licencji; bez niej pozostać przy Figtree. Nie pobierać fontu z witryny Cofounder. Zachować informacje licencyjne fontów i ikon.

Skala UI: 12/14/16/20/24/32/40 px; hero 48–64 px na desktopie i 36–40 px na mobile. Tekst główny 16 px, dłuższa pomoc około 65–75 znaków w wierszu. Nagłówki spokojne, bez ciężkiego pogrubienia i sztucznego wyróżniania pojedynczych słów.

Siatka odstępów 4/8/12/16/24/32/48/64 px. Marketing: większe odstępy i ilustracje. Biblioteka: czytelna gęstość i podziały. Czytnik: maksymalna przestrzeń dokumentu. Ustawienia i pomoc: boczna nawigacja oraz spokojna kolumna treści.

### Grafiki

Przygotować własną ilustrację pixel art: niebo, drzewa i miejsce do czytania z książkami lub dokumentami. Użyć jej w hero i panelu logowania; małe detale mogą pojawić się w pustych stanach. Można użyć dostępnego narzędzia generowania obrazu, a w razie jego braku własnego SVG z prostokątną siatką. Zachować ostre piksele i sprawdzić kadr mobile.

W codziennym UI nie rozpraszać dekoracją. Okładki, ilustracje i przykładowe dokumenty muszą być własne lub mieć odpowiednią licencję. PDF zachowuje swój oryginalny wygląd; styl aplikacji dotyczy otoczenia czytnika.

### Komponenty

Wspólne: Button, IconButton, TextField, PasswordField, TextArea, Select, Checkbox, Switch, SegmentedControl, Tabs, Badge, Progress, Toast, Alert, Tooltip, DropdownMenu, Popover, Dialog, Drawer, BottomSheet, DateTimePicker, EmptyState, PublicationCard, PublicationRow, SharingLinkRow i ReaderToolbar.

Wymagane stany: domyślny, hover, focus, aktywny, disabled, loading i error tam, gdzie mają zastosowanie. Każdy widoczny przycisk działa: wykonuje akcję, otwiera kontrolkę, prowadzi do ekranu lub pokazuje przewidziany wynik symulacji.

## 5. Nawigacja i mapa ekranów

### Publiczne strony

| Ścieżka | Ekran i zawartość |
|---|---|
| `/` | Landing: własny pixel-art hero, jasne objaśnienie publikowania, CTA `Upload a document`, `Sign in`, podgląd czytnika, kontrola dostępu, trzy formaty, prywatność, FAQ i stopka. |
| `/how-it-works` | Dodawanie, czytanie, niezależne linki i odzyskiwanie zarządzania; rozróżnienie publikowania z kontem i bez konta. |
| `/help` | Wyszukiwanie pomocy, kategorie i artykuły dotyczące formatów, linków, haseł, sesji i przechowywania. |
| `/help/:slug` | Szablon artykułu ze spisem treści, powiązanymi tematami i powrotem. Minimum pięć realnie wypełnionych artykułów zgodnych z produktem. |
| `/about` | Otwarty projekt, prywatność, samodzielny hosting i informacja o prototypie. Nie sugerować oficjalnego zatwierdzenia przez Framasoft. |
| `/privacy`, `/terms` | Czytelne szablony treści przykładowych, oznaczone jako niewiążące materiały do prototypu. Bez udawania gotowej dokumentacji prawnej. |

Nawigacja desktop: Framashare, How it works, Help, About, Sign in, Upload. Na mobile pozostają CTA i przycisk menu. Otwarty panel ma wyraźne zamknięcie i odnośniki; Escape i wybór strony go zamykają.

### Konto

| Ścieżka | Ekran i zachowanie |
|---|---|
| `/sign-in`, `/sign-up` | Dzielony układ desktop: ilustracja i formularz. E-mail, hasło, pokaż/ukryj hasło, walidacja i przełącznik trybu. Mobile upraszcza ilustrację. |
| `/forgot-password`, `/reset-password` | Formularz, potwierdzenie symulowanej wiadomości, nowe hasło i sukces. Bez rzeczywistej wysyłki. |
| `/app/settings/profile` | Nazwa, e-mail, avatar jako inicjały, zapis zmian i wynik. |
| `/app/settings/security` | Zmiana hasła, walidacja, wylogowanie i potwierdzenie usunięcia konta. |
| `/app/settings/storage` | Wykorzystanie miejsca, limit, lista największych publikacji i przejście do usuwania. |

Menu profilu otwiera ustawienia, pomoc i wylogowanie. Usuwanie konta ma dialog opisujący usunięcie jego publikacji i unieważnienie linków; operacja jest lokalną symulacją. Niedozwolony dostęp do strony konta przekierowuje do logowania z zachowaniem powrotu.

### Biblioteka i publikacje

| Ścieżka | Ekran i zachowanie |
|---|---|
| `/app/library` | Lista/siatka, wyszukiwanie, filtry typu i statusu, sortowanie, wykorzystanie miejsca, CTA uploadu i wznowienie czytania. |
| `/app/documents/:id` | Podgląd, tytuł/opis, format, rozmiar, status, ustawienia albumu oraz aktywne linki. |
| `/app/documents/:id/read` | Pełny czytnik właściciela, bez zużywania sesji linku odbiorcy. |
| `/app/documents/:id/edit` | Edycja tytułu/opisu; album ma kolejność, podpisy i alt. |
| `/app/documents/:id/links` | Lista niezależnych nazwanych linków i ich reguł, statusy, licznik sesji i akcje. |

Menu publikacji: Open, Edit details, Manage links, Preview as recipient, Delete. Menu linku: Copy link, Edit link, Preview, Revoke. Preview korzysta z tego samego widoku odbiorcy, ale w trybie podglądu nie zużywa limitu; jest wyraźnie oznaczony i ma powrót do zarządzania.

Filtry: wszystkie/PDF/EPUB/album oraz ready/processing/failed. Sortowanie: ostatnio dodane, ostatnio zmienione i tytuł. Długi tytuł nie zasłania działań. Brak publikacji i brak wyników mają różne komunikaty oraz właściwe akcje.

### Upload i zarządzanie anonimowe

| Ścieżka | Ekran i zachowanie |
|---|---|
| `/upload` | Wybór pliku lub wielu obrazów, drag-and-drop, tytuł/opis; bez konta także termin 1/7/30 dni i opcja logowania. |
| `/upload/progress` | Postęp wysyłania, anulowanie, przetwarzanie, sukces albo retry. |
| `/upload/complete/:id` | Dla konta: przejście do publikacji i utworzenia linku. Bez konta: priorytet `Save your management link`. |
| `/manage/:token` | Metadane i edycja jednej publikacji, termin usunięcia, podgląd, linki odbiorców, usunięcie i `Add to my library`. |
| `/manage/:token/read` | Pełny czytnik anonimowego właściciela, bez zużywania sesji linku odbiorcy; wymaga nadal ważnego tokenu zarządzania. |
| `/manage/:token/claim` | Logowanie/rejestracja z zachowaniem kontekstu, potwierdzenie przypisania i sukces w bibliotece. |

W uploadzie prezentować limity instancji i obsługiwane formaty przed wyborem. PDF/EPUB są pojedynczymi publikacjami; zestaw obrazów tworzy album. Mieszany zestaw typów ma czytelny błąd. Defaulty demonstracyjne: plik do 100 MB, album do 50 obrazów i łącznie 100 MB, konto do 1 GB. Limity są konfigurowalne w panelu demo, nie deklaracją produkcyjnej usługi.

Postęp i przetwarzanie symulować krótkimi etapami. Anulowanie nie tworzy gotowej publikacji. Retry działa po błędzie. Przy albumie oprócz drag-and-drop kolejności zapewnić przyciski przesuwania dla klawiatury i mobile.

Link zarządzania jest sekretem właściciela. Tekst: `Keep this link private. Anyone with it can manage or delete this document.` oraz `Without this link, you cannot manage this document.` Osobne akcje Copy management link i Create sharing link; nie mylić ich wizualnie.

Po przypisaniu publikacji zwolnić kontekst anonima, usunąć jego datę usunięcia i unieważnić token zarządzania. Jeśli limit konta nie pozwala na przejęcie, pozostawić poprzedni stan i zaoferować powrót do zarządzania. Nieważny, utracony, wygasły lub użyty już token prowadzi do neutralnego ekranu bez prywatnych metadanych.

## 6. Udostępnianie i sesje odbiorców

### Formularz linku

Dialog lub panel obejmuje nazwę linku, opcjonalne hasło, termin ważności, limit sesji oraz `Allow download`. Domyślnie brak hasła, brak wygaśnięcia, brak limitu i pobieranie włączone. Nazwa jest wymagana. Hasło demonstracyjne nie jest hasłem PDF ani hasłem konta.

Termin: No expiry, In 1 day, In 7 days, Custom date. Własna data otwiera kalendarz i pole godziny; interfejs pokazuje `Europe/Warsaw`. Data w przeszłości jest błędem. Limit jest wyłączony albo dodatnią liczbą całkowitą. Zero, wartości ujemne i ułamki są błędami. Obniżenie limitu poniżej liczby wykorzystanych sesji blokuje nowe wejścia i pozostawia istniejące sesje zgodnie z regułami poniżej.

Podsumowanie jest czytelne przed utworzeniem, np. `Password required · Expires 13 Oct 2026, 18:00 · 30 reading sessions · Downloads off`. Po sukcesie: URL, kopiowanie i edycja. Clipboard ma obsłużony brak uprawnień: zaznaczenie URL i instrukcja ręcznego kopiowania.

Pomoc przy pobieraniu: `Hides the download option. It does not prevent copying or screenshots.` Pomoc przy limicie: `Counts successful reading sessions, not unique people or page views.` Wygaśnięcie linku oraz usunięcie pliku mają osobne etykiety.

### Dostęp odbiorcy

Ścieżka `/share/:token` otwiera bramkę dostępu, a `/share/:token/read` odpowiedni czytnik. Dla chronionego linku przed poprawnym hasłem nie ujawniać tytułu, opisu i okładki. Pokazać pole hasła, jego widoczność i `Start reading`. Błędne hasło nie zużywa sesji.

Udane jawne rozpoczęcie czytania zużywa jedną sesję. Sesja trwa 60 minut, chyba że wcześniej nastąpi wygaśnięcie lub odwołanie linku. Odświeżenie i operacje czytnika wykorzystują aktywną sesję. Wyczerpanie limitu blokuje nowe sesje, ale pozwala dokończyć aktywne. Wygaśnięcie lub odwołanie zatrzymuje również aktywne czytanie; ukryć zawartość i pokazać ekran niedostępności. Bajtów już pobranych nie da się cofnąć.

Osobne stany: hasło błędne, link wygasły, link odwołany, limit wyczerpany, sesja wygasła, plik usunięty, usunięcie przez moderatora i problem sieci. Ekrany odmowy nie ujawniają prywatnego materiału. Po wygaśnięciu samej sesji, jeśli link nadal pozwala, dostępna jest akcja ponownego rozpoczęcia.

Odwołanie jednego linku nie zmienia innych linków tej publikacji. Usunięcie publikacji unieważnia wszystkie linki. Wygaśnięcie linku nie usuwa dokumentu autora.

## 7. Trzy czytniki

### PDF

Renderować dołączony własny PDF przez PDF.js, z warstwą tekstu. Dołączony przykład ma co najmniej sześć stron, spis treści i tekst do wyszukiwania. W miarę dostępności wspierać również wybrany lokalny PDF; błędny, zaszyfrowany i nieobsługiwany plik otrzymuje osobny komunikat.

Kontrolki: poprzednia/następna strona, pole numeru, liczba stron, miniatury, outline, wyszukiwarka z wynikami i przejściem, zoom −/+, wybór procentu, Fit width/Fit page, obrót, pełny ekran i pobranie według ustawienia linku. Przekroczenie zakresu strony jest obsłużone. Focus w polu nie uruchamia skrótów czytnika.

Desktop: lewy panel miniaturek/spisu, dokument w centrum, spokojny pasek narzędzi. Mobile: pasek z najczęstszymi akcjami, pozostałe w menu, miniatury i wyszukiwanie w wysuwanym panelu. Duża strona może przewijać się w obszarze czytnika, ale nie rozszerzać całego viewportu.

### EPUB

Czytnik wykorzystuje dołączone bezpieczne rozdziały własnego tekstu jako demonstrację EPUB. Pełne parsowanie dowolnego EPUB i fixed-layout nie są warunkiem ukończenia mockupów; tę granicę opisać na `/overview`. Własny upload EPUB może korzystać z przykładowego podglądu wyraźnie oznaczonego jako demo.

Spis rozdziałów, poprzedni/następny, procent postępu, wznowienie pozycji i ustawienia lektury muszą działać. Rozmiar tekstu: 16/18/20/24 px, domyślnie 18. Interlinia: 1.5/1.8/2.0, domyślnie 1.8. Szerokość: narrow/medium/wide; motyw light/dark/sepia. Zmiany rzeczywiście wpływają na tekst i zapisują preferencje. Użyć otwartego szeryfowego fontu do lektury, np. Literata, z lokalnym hostingiem i licencją.

### Album

Główny obraz, miniatury, licznik, podpis, alt, poprzedni/następny, zoom, przesuwanie i pełny ekran. Obraz zachowuje proporcje. Przesuwanie działa po powiększeniu; samo powiększenie nie tworzy poziomego overflow strony. Kolejność, podpisy i alt edytuje autor, a odbiorca widzi wynik. Obrazy wybrane lokalnie są podglądane rzeczywiście, dopóki dostępny jest plik.

Wszystkie czytniki mają powrót, loading, retry, brak pliku, utratę dostępu i `Report abuse`. Raportowanie nie wymaga konta.

## 8. Administracja

| Ścieżka | Zakres |
|---|---|
| `/admin/reports` | Lista zgłoszeń, filtry open/resolved i wybór zgłoszenia. |
| `/admin/reports/:id` | Powód, opis, data, metadane dla administratora i kontrolowany podgląd; Dismiss report lub Remove publication. |
| `/admin/publications` | Lista publikacji, filtr typu/statusu, właściciel lub anonymous, przechowywanie i usuwanie. |
| `/admin/accounts`, `/admin/accounts/:id` | Konta, wykorzystanie miejsca, szczegóły i zmiana limitu. |
| `/admin/settings` | Maksymalny rozmiar pliku/albumu, limit miejsca konta, dopuszczalne terminy anonima i termin domyślny. |

Użyć tego samego systemu wizualnego, z gęstszą tabelą desktop i kartami mobile. Role są symulowane; wybór roli do testowania jest na `/overview`. Zwykły użytkownik nie widzi administracyjnej nawigacji.

Usunięcie administracyjne wymaga potwierdzenia skutków, unieważnia linki i rozwiązuje zgłoszenie. Odrzucenie zgłoszenia nie usuwa publikacji. Zapis ustawień ma walidację, sukces i błąd. Zmiany retencji dotyczą nowych uploadów; nie skracają automatycznie istniejących terminów. Obniżenie limitu miejsca nie usuwa danych; blokuje nowe uploady do czasu zwolnienia miejsca.

Formularz `Report abuse`: reason, description, Submit report. E-mail nie jest wymagany. Po wysłaniu potwierdzenie; raport pojawia się na liście administratora. Nie dodawać dashboardu infrastruktury, backupów, płatności ani zaawansowanej analityki.

## 9. Stany i otwarte kontrolki do pokazania

Na `/overview` przygotować bezpośrednie odnośniki do stanów, bez potrzeby wykonywania całej ścieżki. Techniczne kontrolki demonstracyjne umieścić tylko tam lub na osobnym `/scenarios`.

| Rodzina | Obowiązkowe stany |
|---|---|
| Biblioteka | populated grid/list, empty, no results, loading, processing, failed, quota exceeded. |
| Upload | pliki wybrane, kolejność albumu, uploading, processing, cancelled, unsupported format, too large, failure, retry, complete. |
| Udostępnianie | kilka linków, create/edit, password toggle, expiry dropdown, custom calendar/time, session limit, copied, validation, revoke confirmation, revoked. |
| Odbiorca | password, wrong password, start, expired, revoked, exhausted, deleted, session ended, network problem, report form/success. |
| PDF | thumbnails, outline, search/results, zoom dropdown, fit, rotation, fullscreen, unavailable file. |
| EPUB | contents, reading settings, różne rozmiary, interlinia, szerokość, light/dark/sepia. |
| Album | thumbnails, caption, zoom/pan, fullscreen, missing image. |
| Konto | sign in/up, field errors, loading, forgot/reset success, settings saved, delete confirmation. |
| Anonim | retention dropdown, management link saved, claim form/success/quota failure, invalidated manage link. |
| Administracja | open/resolved reports, report details, dismissal, removal confirmation, quota form, settings validation. |
| Nawigacja | profile menu, publication menu, link menu, filters, sort, mobile menu. |

Dialogi obsługują Escape, focus trap i przywrócenie focusu. Zamknięcie bez zapisu nie zmienia danych. Akcje destrukcyjne mają Cancel i konkretną nazwę działania. Zapis i kopiowanie pokazują toast z nazwą wykonanej operacji.

## 10. Dane demonstracyjne i scenariusze

Przygotować deterministyczny seed: gotowy PDF, EPUB i album, dokument przetwarzany, nieudany upload, długi tytuł, anonimowa publikacja, kilka niezależnych linków oraz zgłoszenie oczekujące i rozpatrzone. Tytuły i zawartość dotyczą edukacji, organizacji społecznych i otwartych materiałów, np. Community workshop handbook, A guide to shared gardens, Field notes from the reading room.

Clock demonstracyjny startuje od daty zapisanej w scenariuszu; interfejs używa Europe/Warsaw. `/overview` udostępnia Reset demo, wybór autora/odbiorcy/admina, wymuszenie błędu oraz symulację upływu czasu. Reset usuwa wyłącznie dane prototypu. Nie zmieniać systemowego czasu ani używać opóźnień wielogodzinnych w testach.

Scenariusze końcowe:

1. Landing → rejestracja → upload PDF → sukces → publikacja → czytnik → biblioteka.
2. Upload bez konta → termin 7 dni → zapis linku zarządzania → utworzenie linku odbiorcy → logowanie → przypisanie → biblioteka; stary manage token nie działa, recipient link działa.
3. Autor tworzy link z hasłem, własną datą, limitem i pobieraniem off → odbiorca wpisuje błędne hasło, potem poprawne → czyta; błędna próba nie zużywa sesji.
4. Odbiorca odświeża aktywny czytnik → licznik nie rośnie → wyczerpany limit blokuje następne wejście, ale nie aktywną sesję.
5. Autor odwołuje link podczas czytania → odbiorca traci podgląd; drugi link tej publikacji nadal działa.
6. Ustawienia EPUB zmieniają rzeczywistą prezentację i zostają po powrocie; album zachowuje kolejność, podpisy i alt.
7. Odbiorca zgłasza materiał → admin widzi raport → usuwa publikację → wszystkie jej linki są niedostępne.
8. Błąd uploadu → retry → sukces; Cancel wraca bez gotowej publikacji.

## 11. Responsywność i dostępność

Projektować bazowo dla desktop 1440 px i mobile 390 px; sprawdzić również 320, 768 i 1024 px. Biblioteka przechodzi z siatki/tabeli w karty, formularze mają jedną kolumnę, boczne panele stają się drawer/bottom sheet. Dialog na małym ekranie może zajmować pełną dostępną wysokość i przewijać własną treść.

Sprawdzić 200% zoom przeglądarki, długie tytuły, długie URL-e, błędy wielowierszowe i dotyk. Główne cele dotykowe mają co najmniej 44×44 px. Nie blokować zoomu przeglądarki.

Semantyczne nagłówki, etykiety pól, nazwy dostępnościowe ikon, widoczny focus, czytelne błędy powiązane z polami, announced toasts/statuses i logiczna kolejność klawiatury. Ruch szanuje prefers-reduced-motion. Cel jakości interfejsu: WCAG 2.2 AA; nie deklarować pełnej zgodności samego dokumentu PDF.

## 12. Realizacja z subagentami

Główny agent tworzy projekt, routing, tokeny, shared components, mock service i seed. Następnie przekazuje subagentom trzy rozłączne obszary:

- Public & Account: landing, strony informacyjne, pomoc, konto i ustawienia.
- Readers: PDF, EPUB, album, dostęp odbiorcy i zgłoszenia.
- Administration: zgłoszenia, publikacje, konta i ustawienia instancji.

Główny agent równolegle realizuje Library & Sharing, upload, zarządzanie anonimowe i claim. Subagenci pracują na wspólnym zestawie tokenów i komponentów. Wspólny kontrakt mock service uzgodnić przed delegacją; zmiany współdzielonych plików koordynować. Jeśli liczba dostępnych agentów jest mniejsza, wykonać obszary kolejno bez zmniejszania zakresu.

Po połączeniu pracy główny agent kończy wszystkie przepływy, porównuje kompozycje ze screenshotami referencyjnymi, poprawia niespójne menu i mobile oraz wykonuje pełną weryfikację. Nie kończyć po pierwszym działającym ekranie.

## 13. Testy i kryteria ukończenia

Uruchomić typecheck i production build. Dodać celowane testy logiki linków: niezależność linków, zliczanie sesji, odmowa po odwołaniu/wygaśnięciu i przejęcie anonimowej publikacji. Zastosować zegar testowy, aby nie czekać na rzeczywiste wygaśnięcie.

Browser testing przez Playwright lub dostępne narzędzie browserowe: scenariusze 1–8, otwieranie i zamykanie menu/dialogów, powroty, retry i zachowanie po odświeżeniu. Dla desktop/mobile sprawdzić brak błędów konsoli, niezamierzonego poziomego overflow, nakładających się kontrolek i uciętego tekstu.

Zachować screenshoty finalnych kompozycji: landing, login, biblioteka, upload anonimowy, szczegóły, dialog linku z kalendarzem, bramka hasła, każdy czytnik, raport i administracja. Dla biblioteki, udostępniania i czytników obowiązkowo desktop oraz mobile. Załączyć otwarte kontrolki, nie tylko widoki domyślne.

Prototyp jest ukończony, gdy wszystkie opisane rodziny ekranów mają działające strony, wszystkie widoczne akcje mają rezultat, scenariusze przechodzą, dokumenty pozostają czytelne, estetyka odpowiada referencjom i zakres symulacji jest opisany. Nie zgłaszać spełnienia warunku na podstawie samego builda ani screenshotu landingu.

## 14. Przekazanie wyniku

README zawiera komendę instalacji/uruchomienia, adres `/overview`, konta/hasła demonstracyjne, zasady resetu i listę symulowanych funkcji. Raport końcowy podaje ukończone obszary, wyniki testów, odnośniki do screenshotów oraz rzeczywiste ograniczenia.

Pliki tego planu i starszego researchu pozostają w repozytorium. Nie trzeba mieć dostępu do poprzedniego czatu ani do Figmy. Prompt do rozpoczęcia nowej sesji znajduje się w `docs/design/new-session-prompt.md`.
