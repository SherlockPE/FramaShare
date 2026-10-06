# Framashare — rekomendacja produktu

Research z 5 października 2026. Brief: wolna alternatywa dla SlideShare/Calaméo, należąca do Framasoft; PDF, EPUB, obrazy oraz szczegółowe zasady dostępu. To materiał do decyzji, nie implementacja aplikacji ani zatwierdzenie projektu przez Framasoft.

## Proponowany kierunek

**Wygodny czytnik i proste, precyzyjne udostępnianie.** Pierwsza wersja powinna umożliwiać dodanie pliku, wygodne czytanie i utworzenie kilku niezależnych linków z różnymi regułami. Prywatność domyślna, bez reklam, bez marketingowego profilowania odbiorców i bez obowiązkowych usług zamkniętych. Publiczny katalog jest osobną decyzją: wnosi wyszukiwanie, moderację i SEO.

Najlepsze inspiracje: czytnik Calaméo, model linków Nextcloud i prostota Lufi. Nie kopiować całego marketingowego modelu komercyjnych platform. To nasza rekomendacja wynikająca z [porównania konkurencji](competitors.md), a nie stwierdzenie, że którykolwiek konkurent realizuje całe założenie Framashare.

Wolne oprogramowanie, prywatność i samodzielny hosting są zgodne z [kartą Framasoft](https://framasoft.org/en/charte/). MIT nie jest jedyną dopuszczalną otwartą licencją.

## Pierwsza pełna wersja

| Obszar | Zakres |
|---|---|
| PDF | Numer strony, poprzednia/następna, miniatury, dopasowanie, zoom, obrót, wyszukiwanie, outline/spis treści, pełny ekran, warstwa tekstu, klawiatura |
| EPUB bez DRM | Rozdziały, spis treści, rozmiar fontu, interlinia, szerokość tekstu, motyw, postęp i zapamiętana pozycja; reflowable i jawna polityka fixed-layout |
| Obrazy | JPEG/PNG/WebP, wiele plików tworzących album, kolejność, podpisy, tekst alternatywny, miniatury, zoom i przesuwanie |
| Biblioteka autora | Upload, tytuł i opis, status przetwarzania, lista plików, wznowienie czytania, limit miejsca, usuwanie, lista aktywnych linków |
| Udostępnianie | Wiele nazwanych linków, hasło, wygaśnięcie, limit sesji, cofnięcie, kontrola endpointu pobierania oryginału, podgląd jako odbiorca |
| Stany i administracja | Przetwarzanie/błąd, hasło, wygaśnięcie, wyczerpany limit, zgłoszenie nadużycia, usunięcie przez administratora, retencja i kopie zapasowe |

Autorzy z kontami i odbiorcy bez kont to rozsądna hipoteza startowa. Upload anonimowy wymaga osobnego linku zarządzania i silniejszej kontroli nadużyć; nie należy dodawać go przypadkiem. Publiczne indeksowanie wyłącznie na świadomą decyzję autora.

Kolejna fala: start dostępu w przyszłości, zaproszenia imienne, embed czytnika, kolekcje, stałe adresy z wersjami dokumentów, prywatne zakładki/notatki, eksport danych. ODT/ODP/DOCX/PPTX przez izolowaną konwersję do PDF, potem TXT/Markdown i OCR dla skanów. Format biurowy nie gwarantuje identycznego odwzorowania po konwersji. Federacja, publiczne komentarze i społeczny feed zwiększają zakres — wymagają osobnej decyzji.

## Zasady dostępu, które trzeba zaprojektować dokładnie

Jeden dokument może mieć link „Warsztaty” z hasłem i limitem 30 sesji, „Partner” ważny do wskazanej godziny oraz osobny link publiczny. Zmiana lub cofnięcie jednego linku nie wpływa na pozostałe.

- **Otwarcie = zaakceptowana sesja czytania**, np. na 60 minut. Zmiana strony, zakresy bajtów PDF, odświeżenie aktywnej sesji i miniatury nie zużywają limitu. Limit nie oznacza liczby różnych osób.
- Dla linków limitowanych wejście następuje po jawnym kliknięciu „Otwórz dokument”. Zwykły podgląd komunikatora nie powinien tworzyć sesji. Automaty mogą nadal wykonywać interakcje; nie obiecujemy rozpoznawania ludzi.
- Limit sesji blokuje nowe sesje; istniejące mogą dokończyć czytanie. Wygaśnięcie i cofnięcie blokują przyszłe żądania także istniejących sesji. Bajtów otrzymanych wcześniej nie da się cofnąć.
- Uprawnienia obejmują oryginał, miniatury, tekst, rozdziały EPUB i obrazy. Ekran hasła przed publicznym URL-em pliku jest niewystarczający.
- „Pobieranie wyłączone” usuwa wygodną opcję i endpoint oryginału. **Nie gwarantuje braku kopiowania**, ponieważ czytnik otrzymuje treść. Hasło linku nie jest hasłem zaszyfrowanego PDF.
- Termin ważności linku i termin przechowywania pliku są osobnymi ustawieniami. Wygaśnięcie dostępu nie powinno samo usuwać pliku autora.

Szczegóły transakcji, sesji i revokacji: [architektura](architecture.md). Inspiracja dla niezależnych linków oraz ograniczeń ukrywania pobierania: [Nextcloud](https://docs.nextcloud.com/server/latest/user_manual/en/files/sharing.html).

## Design do wyboru

Przygotowane trzy interaktywne koncepcje porównują czytnik tego samego dokumentu i panel dostępu. Nie są działającymi rendererami PDF/EPUB; nawigacja i zoom pokazują zachowanie propozycji, a formularz nie tworzy prawdziwego linku.

| Styl | Co wybierasz |
|---|---|
| **Frama Atelier — polecam** | Przyjazne narzędzie w fiolecie i pomarańczu Framasoft. Miniatury z lewej, dokument pośrodku, panel dostępu z prawej. Najbliższy marce. |
| **Papier** | Spokojny charakter biblioteki, szeryfowe tytuły i niebieskie akcenty. Szerszy czytnik, poziomy pasek narzędzi, udostępnianie na żądanie. |
| **Commun** | Społeczna biblioteka w zieleni. Pliki w bocznym panelu, ustawienia linku pod czytnikiem. Dobra dla kolektywów i organizacji. |

Frama Atelier jest interpretacją [oficjalnej karty graficznej](https://framasoft.org/fr/graphics/), nie zatwierdzonym designem Framasoft. W makietach stosujemy fonty systemowe; finalne fonty, ikony i treści demonstracyjne wymagają własnych informacji licencyjnych. W produkcie fonty hostujemy lokalnie.

Po wyborze stylu zapisać `DESIGN.md`: tokeny kolorów, typografię, odstępy, promienie, kontrolki, błędy, focus, motion i reguły responsywności. Nie narzucać wizualnego stylu aplikacji na oryginalną stronę PDF. Cel dla interfejsu: WCAG 2.2 AA; jakość dostępności dokumentu zależy również od pliku źródłowego.

Skille: `frontend-design` do kierunku wizualnego → `Impeccable` do dopracowania całości → `agent-browser` do realnego sprawdzenia → opcjonalnie `avoid-ai-design` do audytu. To narzędzia pracy autora, nie zależności produktu. Dostępne skille wystarczą; dodatkowa instalacja nie jest potrzebna. [Porównanie skilli i źródła licencji](design-workflow.md).

## Proponowany stos

| Warstwa | Wybór | Dlaczego |
|---|---|---|
| Frontend | Vue 3 + TypeScript + Vite | Przejrzysty interfejs czytnika, jeden język front/backend. React też pasuje, jeśli zespół zna go lepiej. |
| PDF | PDF.js | Otwarty renderer; nie piszemy parsera PDF od zera. |
| EPUB | Adapter EPUB.js lub Readium | Wybór po krótkim prototypie: jakość renderowania, izolacja treści, różne EPUB i utrzymanie. |
| Backend | Node.js + Fastify | API uploadu, bibliotek, linków i sesji; proste wdrożenie. |
| Baza | PostgreSQL | Transakcje dla limitu otwarć, metadane, konta i zadania. |
| Pliki | Prywatny wolumen, później adapter S3-compatible | Bez obowiązkowego dostawcy chmurowego. Autoryzacja także dla zakresów PDF. |
| Przetwarzanie | Osobny izolowany worker, kolejka w PostgreSQL | Limity CPU/RAM/czasu; parsery i konwertery nie działają w procesie API. |
| Wdrożenie | Compose + HTTPS reverse proxy | Samodzielny hosting; instrukcja uruchomienia, backupu i aktualizacji. |

Architektura: modularny monolit i osobny proces przetwarzania. Redis, Kubernetes i mikroserwisy nie są potrzebne na start. Przy publicznym katalogu dodać serwerowe strony metadanych dla SEO; nie wymaga to przerabiania samego czytnika.

**Kod aplikacji: proponuję AGPL-3.0-or-later**, ostatecznie uzgodnioną z Framasoft. Biblioteki mogą pozostać MIT/Apache/BSD; fonty OFL, PostgreSQL na swojej wolnej licencji. PDF.js ma Apache-2.0, EPUB.js BSD-2-Clause, Readium BSD-3-Clause. Pełna tabela i teksty źródłowe w [audycie kandydatów](architecture.md). Zgodnie z [wyjaśnieniem GNU](https://www.gnu.org/licenses/why-affero-gpl.html), AGPL przewiduje dostęp użytkowników sieciowych do źródeł zmodyfikowanej usługi.

Przed wydaniem audytować konkretne wersje i zależności pośrednie, wygenerować SBOM oraz zachować LICENSE/NOTICE, także kontenerów, fontów i konwerterów. Dzisiaj nie istnieje lockfile aplikacji, więc nie można jeszcze potwierdzić licencji całego przyszłego produktu.

## Jak realizować

1. Uzgodnić styl, publiczny katalog versus udostępnianie, konta autorów, zakres EPUB i licencję projektu. Zapisać decyzje w `PRODUCT.md` / `DESIGN.md`.
2. Zrobić mały prototyp PDF/EPUB na rzeczywistych dużych i problematycznych plikach. Sprawdzić jakość, mobile, dostępność i izolację EPUB przed utrwaleniem adaptera.
3. Zbudować pełny przepływ PDF: konto → upload → kwarantanna → podgląd → link → odblokowanie → odwołanie. Dodać EPUB i albumy do tego samego modelu publikacji i uprawnień.
4. Domknąć administrację, limity, retencję, eksport, zgłoszenia oraz obsługę awarii przetwarzania.
5. Przed uruchomieniem sprawdzić wyścig o ostatnią sesję, retry, wszystkie zasoby prywatne, błędy dat, cofnięcie podczas czytania, złośliwe pliki, mobile, klawiaturę i odtworzenie backupu. Dopiero potem publikować wydanie do self-hostingu.

## Dokumenty źródłowe

- [Konkurencja, funkcje i uprawnienia](competitors.md)
- [Design, skille i licencje zasobów](design-workflow.md)
- [Architektura, bezpieczeństwo i licencje bibliotek](architecture.md)

Research opiera się na źródłach pierwotnych. Nie testowaliśmy płatnych kont konkurencji. Issuu nie został dostatecznie zweryfikowany — nie przypisujemy mu niepotwierdzonych funkcji. Wybory stosu, zakresu i designu są rekomendacjami, a nie wymaganiami wyprowadzonymi z dokumentacji.

## Weryfikacja mockupów

Sprawdzono w Chromium przez Playwright: trzy warianty przy szerokościach 320, 736 i 1024 px, w jasnym i ciemnym motywie (18 kombinacji). Nawigacja, zmiana skali, otwieranie panelu, zmiana limitu i przygotowanie podglądu linku działały; nie stwierdzono poziomego overflow ani błędów JavaScript. Po oględzinach poprawiono kontrast metadanych aktywnego dokumentu w Commun oraz wysokość czytnika Papier, aby panel mieścił się w całości. Dodatkowa kontrola potwierdziła dopasowanie panelu Papier. To weryfikacja koncepcji interfejsu, nie test działania aplikacji, rzeczywistego renderowania formatów, bezpieczeństwa uprawnień czy pełny audyt WCAG.
