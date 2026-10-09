# FramaShare: minimalny plan używalnego MVP

## Cel i granice

Autor zakłada konto, dodaje PDF, EPUB lub album, a odbiorca otwiera link na innym urządzeniu bez konta. Pliki, konta, linki i zgłoszenia przetrwają restart. Hasła, własność, limity i wygaśnięcie egzekwuje serwer. Zachować obecny interfejs, adresy stron i zakres produktu; zmieniać tylko integrację i konieczne komunikaty błędów.

Docker wyłącznie lokalnie. Produkcja bez kontenerów, nadzorowana przez administratorów; konfiguracja Salt poza zakresem. Ta implementacja przygotowuje działającą aplikację i instrukcję operacyjną, ale nie wdraża jej na serwer. Bez S3, Redis, kolejki, dodatkowych workerów, płatności i nowych funkcji społecznościowych.

## Kolejność implementacji

1. **Zachować istniejące poprawki.** Sprawdzić dirty diff na istniejącej `codex/usable-mvp` względem `main` i zachować poprawki builda, zależności oraz dokumentacji. Przejrzeć `origin/feature/user_auth_and_account` oraz `origin/feature/storage_and_archive_gestion`; wykorzystać działające fragmenty zamiast pisać je ponownie. Nie scalać tych gałęzi bez naprawy znalezionych usterek. Pierwszy pełny etap: konto → trwały PDF → biblioteka po ponownym logowaniu → drugi niezależny klient → odmowa nieuprawnionego odczytu.

2. **Prawdziwe konta.** Rejestracja, logowanie, wylogowanie, odczyt aktualnego konta, edycja profilu, zmiana hasła i usunięcie konta. Cookies HttpOnly, Secure na produkcji, SameSite, sesje odwoływalne po wylogowaniu/resetowaniu hasła. Hasła przechowywane jako bezpieczne hashe; żadnych domyślnych sekretów produkcyjnych. Walidacja Fastify, ograniczenie prób logowania/resetu i ochrona operacji zapisu przed CSRF. Reset przez SMTP: losowy token, w bazie wyłącznie hash, jednorazowe zużycie transakcyjne i termin ważności. Rola administratora nadawana operacyjnie, nigdy z formularza lub localStorage. Dodać brakujące migracje; ustawienia bezpieczeństwa i baza z prawdziwymi danymi nie mogą zależeć od demonstracyjnego seeda.

3. **Trwałe publikacje.** PDF/EPUB i wszystkie obrazy albumu trafiają do prywatnego katalogu wskazanego przez `STORAGE_PATH`. Baza przechowuje metadane, kolejność, podpisy, alt, właściciela, retencję i status. Biblioteka, edycja, usuwanie i limity używają API. ID serwera jest jedynym ID publikacji; tytuł i opis nie mogą zniknąć po ponownym logowaniu. Walidować faktyczny format, liczbę obrazów i rozmiary; quota ma być odporna na równoległe uploady. Nie zostawiać plików po błędzie/anulowaniu ani publikacji udającej usuniętą po nieudanym DELETE. Wydawać binaria wyłącznie po autoryzacji, obsłużyć poprawne zakresy bajtów i błędne Range jako 416. Katalog storage nie jest publicznym katalogiem WWW.

4. **Anonim i udostępnianie.** Zachować osobne losowe tokeny zarządzania i odbiorcy; prywatne tokeny przechowywać jako hashe. Linki mają niezależne ustawienia: hasło, wygaśnięcie, limit sesji, download i revocation. Rozpoczęcie sesji oraz licznik są transakcyjne; błędne hasło i odświeżenie nie zużywają nowej sesji. Sesja czytania trwa 60 minut; limit blokuje nowe wejścia, wygaśnięcie/revocation/usunięcie blokują także aktywne. Sprawdzać uprawnienia na każdym odczycie pliku, nie wyłącznie przed otwarciem czytnika. Osobna kontrolowana trasa pobierania respektuje download=false; nie obiecywać ochrony przed kopiowaniem wyświetlonych treści. Claim jest atomowy: sprawdza quota, usuwa retencję i token zarządzania, zachowuje linki odbiorców. Retencja 1/7/30 dni i usuwanie konta obejmują rzeczywiste kasowanie plików; prosty, powtarzalny job czyszczenia uruchamiany w procesie API, bez osobnej infrastruktury.

5. **Czytniki i moderacja.** Zachować działający PDF.js i album. EPUB ma czytać rzeczywiste rozdziały i spis treści przesłanego pliku; MVP obejmuje reflowable EPUB bez DRM. Fixed-layout, szyfrowane i uszkodzone pliki odrzucać jasno. Użyć utrzymywanego parsera ZIP/EPUB i sanitizacji HTML zamiast własnego parsera archiwum. Limitować rozpakowanie, blokować path traversal, skrypty, zdarzenia HTML i zewnętrzne zasoby. Zgłoszenia, decyzje moderatora, ustawienia i quota przechowywać w bazie; usunięcie moderacyjne zatrzymuje wszystkie linki. Nieautoryzowany użytkownik nie może odczytać panelu/API administratora.

6. **Domknięcie frontendu i operacji.** Przenieść serwerowy stan z localStorage do API w istniejącym store i widokach; localStorage zostaje tylko dla niesensytywnych preferencji czytania. Przy starcie odczytać sesję przed decyzją routera. Błąd sieci pokazuje retry, nigdy fallback do lokalnego logowania/uploadu. `/overview` nie pozwala zmienić roli ani zegara produkcji; demo może istnieć wyłącznie w odrębnym środowisku testowym. Uzupełnić `.env.example` o SMTP, storage i sekrety; walidować wymagane ustawienia przy starcie. Opisać build, migrate deploy, uruchomienie Node, proxy HTTPS, prawa katalogu, cykl czyszczenia oraz backup i restore bazy wraz z plikami. Nie pisać konfiguracji Salt/systemd ani nie wdrażać bez danych administratorów. Treści privacy/terms nadal wymagają zatwierdzenia przez właściciela przed publicznym wydaniem.

## Kryteria odbioru

- Świeża instalacja z lockfile, migracje pustej bazy oraz istniejącej bazy bez utraty danych, build i start bez Docker/Salt; `/api/health` działa.
- Dwa odrębne konteksty przeglądarki: konto → każdy format → link → odbiorca → refresh/restart serwera → treść nadal działa. Nowy klient nie potrzebuje lokalnego stanu autora.
- Testy API dowodzą odmowy dla obcego właściciela, anonimowego odczytu po ID, sfałszowanej roli/tokena, revocation, wygaśnięcia i usunięcia. Test równoległych wejść dowodzi nieprzekroczenia limitu sesji; równoległe uploady/claim nie przekraczają quota.
- Reset tokena tylko raz, stare sesje unieważnione, SMTP przetestowane na lokalnym odbiorniku testowym. Błędy zapisu/kasowania nie pozostawiają pozornego sukcesu ani osieroconych plików.
- EPUB: rzeczywista treść, błędny ZIP, zip bomb, traversal, HTML ze skryptem, zasoby zewnętrzne; PDF: Range i brak dostępu po revocation; album: kolejność/alt i odczyt po restarcie.
- Istniejące scenariusze Playwright dostosowane do rzeczywistego API i oddzielnej bazy testowej; desktop/mobile/320 px i klawiatura. Build i ciężkie testy kolejno, audit bez znanych podatności.
- Fizyczne usuwanie po retencji oraz próbne odtworzenie bazy i plików z backupu. Dane użytkowników i istniejące środowiska pozostają nietknięte przez testy.

## Zasady wykonania

Minimalne diffy, reuse istniejących tras/usług/widoków, bez frameworka wokół frameworka. Dodatkowa biblioteka tylko do rzeczywistej potrzeby bezpieczeństwa lub parsowania. Testować bezpieczeństwo i pełny przepływ, nie samą implementację. Raportować wykonane kontrole i pozostałe ograniczenia; nie nazywać lokalnego MVP wdrożoną produkcją.

Host ma 4 vCPU i 8 GiB RAM, współdzielone z Beeper/Hermes. Przed ciężkimi pracami `free -h` i `df -h / /home/codexdev/projects`; minimum 1 GiB available RAM i 3 GiB wolnego na dysku wyjściowym. Store, binaria przeglądarki i artefakty pod projektem lub `/home/codexdev/projects/.vps-runtime/`, nigdy `/dev/shm`. Nie zatrzymywać procesów innych czatów ani usuwać ich danych.

## Postęp implementacji — 8 października 2026

Pierwszy etap realizowany na `codex/usable-mvp`, bez resetowania wcześniejszego dirty diffu. Po analizie gałęzi auth/storage wykorzystano ich podział tras, Prisma singleton i przepływ storage; zastąpiono nieodwoływalne JWT sesjami bazodanowymi oraz naprawiono odczyt plików i sprzątanie uploadu.

Gotowe: rejestracja/logowanie/wylogowanie, profil, zmiana hasła unieważniająca sesje, prywatny PDF, trwałe metadane i biblioteka, odczyt Range, edycja/usuwanie, quota odporna na równoległe uploady, odrzucanie obcego Origin, limity żądań. Frontend odczytuje sesję przed routerem i nie przywraca lokalnych kont/publikacji. Operacje demo niedostępne w uruchomionej aplikacji; historyczne reguły demo pozostają w testach.

Następny etap: domknięcie kont (SMTP reset i usunięcie konta), następnie EPUB/album oraz anonim, linki i ich sesje zgodnie z punktami 2–5. Pełne kryteria odbioru MVP nadal obowiązują; pierwszy etap nie oznacza gotowości do publicznego wdrożenia.

## Postęp wykonania — 9 października 2026

- Zabezpieczono wcześniejsze zmiany MVP w `847e657`. Zachowano `video/` i `session-logs/` poza commitami MVP. Fetch potwierdził wspólny punkt bazowy `main` i `codex/usable-mvp`: `1629e5b`. Gałęzie auth/storage przejrzano bez scalania; z SMTP wykorzystano wzorzec Nodemailer. JWT z domyślnym sekretem i nieautoryzowany odczyt storage nie zostały przeniesione.
- Konta: reset SMTP, token hash w bazie, atomowe zużycie pod blokadą użytkownika, unieważnienie wszystkich resetów/sesji; trwałe usuwanie konta z ponawianym kasowaniem plików. Usunięto wyścig logowania ze zmianą hasła. Cookies HttpOnly/SameSite, Secure w produkcji; CSRF przez ścisłą kontrolę Origin; limity żądań i odrzucanie dodatkowych pól formularzy.
- Publikacje: PDF, reflowable EPUB (ZIP/XML/sanitizacja, wewnętrzne obrazy rastrowe i TOC), albumy z kolejnością/caption/alt. Quota i claim korzystają z blokad bazodanowych. Rollback uploadu usuwa pliki; job usuwa pozostawione po awarii pliki po godzinie. Równoczesne przetwarzanie ograniczono do dwóch uploadów, a obrazy do 20 mln pikseli.
- Udostępnianie: losowe niezależne tokeny zarządzania/odbiorcy, hash tokena zarządzania, hasła scrypt, transakcyjne sesje 60 min i limit wejść. Cookies odbiorcy mają hashe w bazie. Wygaszenie/revocation/deletion sprawdzane przy każdym odczycie; osobny download respektuje flagę. Anonim 1/7/30 dni, atomowy claim i fizyczne czyszczenie.
- Moderacja: trwałe zgłoszenia/decyzje, serwerowa kontrola roli, podłączony panel, trwała quota/ustawienia i blokada odczytu przed fizycznym kasowaniem.
- Frontend: istniejące adresy/wygląd zachowane. Konta, biblioteka, wszystkie formaty, linki, claim i moderacja używają API. Demo nie przywraca danych serwerowych; `/overview` pozostaje zablokowany. Privacy/terms oznaczono jako niezatwierdzone i poprawiono fakty o przechowywaniu danych.
- Domknięcie integracji: hasło dosłownie `protected` nie jest już mylone ze znacznikiem metadanych; podgląd właściciela/zarządcy nie zużywa limitu odbiorców, a metadane za hasłem są ukryte przed sesją. Anulowanie uploadu czeka na DELETE; Vite blokuje odczyt backendu/storage przez `/@fs`; profile Chromium trafiają na dysk projektu.
- Operacje: instrukcja Node/PostgreSQL bez kontenerów aplikacji, przykład proxy HTTPS, wymagane SMTP w produkcji, uprawnienia storage, okresowe czyszczenie, offline backup/restore z checksumami i odmową nadpisania istniejącej bazy.

### Dowody odbioru — końcowa weryfikacja

- API: 9/9 testów bez skipów na nowej `framashare_execution_test`; testy obejmują równoległy reset/quota/claim/sesje, nieuprawnione odczyty, restart wszystkich formatów, hostile ZIP/HTML, retencję, błędy zapisu/DB/usuwania i sprzątanie osieroconego pliku.
- Frontend unit: 20/20. Playwright: 21/21 scenariuszy (desktop/mobile/320 px) przeszło; obejmuje dwa konteksty, każdy format, odświeżenie, rzeczywisty restart procesu, zarządzanie anonimem/claim, moderatora, anulowanie uploadu, klawiaturę EPUB i brak poziomego overflow.
- Świeży install lockfile: 220 pakietów w izolowanej kopii projektu, bez istniejącego node_modules. Migracje pustej bazy przeszły; aktualizacja historycznego schematu w osobnej bazie zachowała wcześniejsze konto i PDF.
- Backup/restore: snapshot bazy z plikami i manifestem SHA-256 odtworzony do pustej `framashare_restore_test`. Właściciel czyta odtworzony PDF; anonim i obce konto dostają odmowę. Klient pg_dump 16 odrzucił serwer 17; próba została wykonana narzędziami 17.
- Końcowy build frontend/backend i typecheck przeszły; pełny pnpm audit: 0 znanych podatności. Playwright: 21/21 bez skipów.

### Przed publicznym wydaniem

Dane SMTP produkcji i weryfikacja dostarczenia do prawdziwej skrzynki, domena/TLS i nadzór procesu od administratorów, właściciel/administrator instancji, zatwierdzenie privacy/terms oraz polityka backupów. Nie wdrożono produkcji i nie utworzono Salt. Testowa baza działa na lokalnym PostgreSQL 17; aplikacja uruchomiona jako procesy Node bez kontenerów. Nie ma deklaracji gotowości produkcyjnej.


## Integracja gałęzi i review — 9 października 2026

Na żądanie właściciela wykonano merge `origin/feature/storage_and_archive_gestion` po ponownym fetch do `17e5f27`. Gałąź auth (`aa8bafe`) jest jej przodkiem; `origin/develop` wskazuje ten sam commit storage. Dawny frontend React i gałąź presentation nie zawierają zmian użytecznych dla obecnego MVP.

Przejęto logo w nagłówku/stopce/logowaniu/odmowie dostępu, favicon, ilustracje i rzeczywiste okładki PDF. Okładki korzystają z istniejącego PDF.js: widoczność uruchamia odczyt, worker jest współdzielony, raster ograniczony do 400×600, błędy pozostawiają tytuł. Zachowano wyszukiwanie i warstwę tekstową czytnika. Nie przeniesiono MuPDF/epubjs ani ich zależności: zastępowały działające funkcje i omijały sanitizowany odczyt EPUB. Backend, migracje, konfiguracja bezpieczeństwa i lockfile MVP pozostały bez zmian. Nie przeniesiono wygenerowanych plików Prisma, starego middleware JWT ani nieaktualnych list TODO.

Review wykryło martwe publiczne linki `/share/workshop` i `/share/garden`; zastąpiono je wyborem prawdziwego przykładowego PDF-u do uploadu, bez polegania na demo w bazie. Poprawiono favicon wskazujący nieistniejącą ścieżkę, podpisy ilustracji, kontrast hero i kolizję marki z akcjami w nagłówku mobilnym. Wszystkie wcześniejsze materiały pozostały zachowane.

Build/API 9/9/unit 20/20/audit 0 przeszły po integracji. Test designu 3/3 sprawdza piksel okładki, wyszukiwanie, odmowę odczytu, logo i działający upload przykładu. Końcowy Playwright: 24/24 bez skipów; dodatkowy przebieg designu po poprawce nagłówka mobilnego: 3/3. Odbiór integracji zakończony. Merge `e3efe3c` jest na lokalnym main i obejmuje historię storage/auth oraz wszystkie commity MVP. Publikacja remote jest ostatnim krokiem sesji.
