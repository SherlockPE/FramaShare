# Odbiór lokalnego MVP — 9 października 2026

Gałąź `codex/usable-mvp`. Kryteria [planu](../design/usable-mvp-plan.md) sprawdzono na izolowanych danych; aplikacja działała jako procesy Node/Vite. PostgreSQL 17 był lokalnym serwerem testowym. Nie wdrożono produkcji ani konfiguracji Salt.

| Kontrola | Wynik i zakres |
|---|---|
| Świeża instalacja | Frozen lockfile, 220 pakietów bez istniejącego node_modules, Prisma generate i build w osobnej kopii na dysku projektu. |
| Migracje | Wszystkie 7 migracji na pustej bazie; osobna baza historycznego schematu zachowała konto i PDF po aktualizacji. Odczyt właściciela działał, anonim i obce konto otrzymały odmowę. |
| Build | Frontend vue-tsc/Vite oraz backend TypeScript: PASS. |
| Testy API | 9/9, bez skipów. Konta, CSRF, walidacja, limity prób, lokalny odbiornik SMTP, równoległe jednorazowe zużycie resetu, unieważnienie sesji, usuwanie konta i retry po błędzie dysku. |
| Publikacje i dostęp | PDF Range/416, EPUB TOC/obrazy/sanitizacja, hostile ZIP/DRM/fixed-layout/traversal/bomb, dekodowane albumy; obcy właściciel/anonim/fałszywy token, wygaśnięcie, revocation, moderacyjne usunięcie i download=false. |
| Równoległość i awarie | Quota uploadów/claim oraz limit sesji pod blokadami bazodanowymi; błędy zapisu/DB/usuwania, rollback, ponawiane kasowanie, fizyczna retencja i osierocony plik. |
| Frontend unit | 20/20. Historyczne testy demo są izolowane; testy integracji store sprawdzają prawdziwe API, retry, brak lokalnej tożsamości i hasło dosłownie `protected`. |
| Playwright | 24/24, jeden worker, desktop 1280 px / mobile 390 px / narrow 320 px. Dwa niezależne konteksty, upload każdego formatu, formularz linku, podgląd bez zużycia sesji, odbiorca, refresh, revocation, zarządzanie anonimem/claim, cancel z DELETE, panel administratora i odmowa sfałszowanej roli. |
| Restart | Rzeczywiste zatrzymanie/ponowne uruchomienie własnego procesu API dla każdego formatu i istniejących cookies odbiorcy; osobny schemat testowy. |
| Klawiatura i layout | Nawigacja EPUB strzałką, brak poziomego overflow biblioteki w trzech rozmiarach. Nie jest to pełny audyt dostępności. |
| Konfiguracja produkcyjna | Odmowa nieprywatnego storage i wymagane środowisko; cookies Secure/HttpOnly/SameSite sprawdzone przy NODE_ENV=production. Vite odmawia prywatnego pliku backendu przez /@fs. |
| Audit | Pełne `pnpm audit`: 0 znanych podatności. |
| Backup/restore | Offline snapshot DB + pliki + SHA-256 odtworzony do pustej `framashare_restore_test`; zachowane konto/PDF, właściciel czyta, anonim/obcy nie. Skrypt wymaga potwierdzenia zatrzymania API i odmawia istniejących danych i bazy bez suffixu `_test`. pg_dump 16 odrzucił serwer 17; udana próba użyła narzędzi 17. |

Testy używały wyłącznie dedykowanych baz `_test`, osobnych katalogów storage i własnych procesów. Artefakty, profile Chromium, binaria i dependency store pozostały na dysku projektu lub `.vps-runtime`; nie używano `/dev/shm`. Historyczne materiały `video/` i `session-logs/` zachowano poza commitami MVP. Gałęzie remote auth/storage przejrzano bez scalania; nie przeniesiono domyślnego JWT ani nieautoryzowanego odczytu pliku.

## Przed publicznym wydaniem

Administratorzy muszą skonfigurować rzeczywiste SMTP i sprawdzić dostarczenie wiadomości, domenę/TLS/proxy, nadzór procesu, konto administratora oraz politykę kopii poza hostem. Właściciel musi zatwierdzić privacy/terms. Procedury znajdują się w [instrukcji operacyjnej](../operations.md). Lokalny odbiór techniczny nie stanowi wdrożenia ani zatwierdzenia tych treści.


## Review i merge designu z gałęzi storage

Ponowny fetch: storage/develop `17e5f27`, auth `aa8bafe` zawarty w ich historii. Integracja jest zwykłym merge z rozstrzygniętymi konfliktami; nie użyto force-push ani resetu. Przejęto logo/favicon, ilustracje i okładki PDF, zachowując backend, migracje i zależności zweryfikowanego MVP. PDF.js pozostaje czytnikiem z wyszukiwaniem i warstwą tekstową, EPUB korzysta z sanitizowanej treści API. Nieaktywny React oraz materiały prezentacyjne pozostały na swoich gałęziach.

Okładki mają odczyt dopiero po wejściu w viewport, wspólny worker, raster do 400×600 i fallback tytułu po odmowie lub błędzie pliku. Test sprawdza faktyczny czerwony piksel okładki, odczyt i wyszukiwanie PDF, HTTP 401, poprawnie załadowane logo i upload przykładu ze strony głównej w trzech rozmiarach. Review naprawił martwe linki dawnych przykładów, błędny favicon oraz kontrast tekstu na nowej ilustracji hero. Zrzuty landing/library obejrzano lokalnie; nie są dodane do commitów.

Końcowy build po integracji: PASS. API 9/9, unit 20/20, audit 0; Playwright: 24/24 bez skipów. Po poprawce nagłówka mobilnego dodatkowy przebieg designu: 3/3; marka i akcje nie nachodzą na siebie, brak błędów JavaScript. Odbiór integracji zakończony. Merge `e3efe3c` jest na lokalnym main i obejmuje historię storage/auth oraz wszystkie commity MVP. Publikacja remote jest ostatnim krokiem sesji.
