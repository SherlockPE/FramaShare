# FramaShare: minimalny plan używalnego MVP

## Cel i granice

Autor zakłada konto, dodaje PDF, EPUB lub album, a odbiorca otwiera link na innym urządzeniu bez konta. Pliki, konta, linki i zgłoszenia przetrwają restart. Hasła, własność, limity i wygaśnięcie egzekwuje serwer. Zachować obecny interfejs, adresy stron i zakres produktu; zmieniać tylko integrację i konieczne komunikaty błędów.

Docker wyłącznie lokalnie. Produkcja bez kontenerów, zarządzana przez Salt przez administratorów. Ta implementacja przygotowuje działającą aplikację i instrukcję operacyjną, ale nie wdraża jej na serwer. Bez S3, Redis, kolejki, dodatkowych workerów, płatności i nowych funkcji społecznościowych.

## Kolejność implementacji

1. **Zachować istniejące poprawki.** Sprawdzić dirty diff na `main`, utworzyć `codex/usable-mvp` i zachować poprawki builda, zależności oraz dokumentacji. Przejrzeć `origin/feature/user_auth_and_account` oraz `origin/feature/storage_and_archive_gestion`; wykorzystać działające fragmenty zamiast pisać je ponownie. Nie scalać tych gałęzi bez naprawy znalezionych usterek. Pierwszy pełny etap: konto → trwały PDF → biblioteka po ponownym logowaniu → drugi niezależny klient → odmowa nieuprawnionego odczytu.

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
