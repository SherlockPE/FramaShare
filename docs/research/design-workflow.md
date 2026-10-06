# Framashare: design i praca z AI

Research: 5 października 2026. To propozycje do wyboru, nie zatwierdzona identyfikacja produktu. Przeczytałem instrukcje dostępnych lokalnie skilli i sprawdziłem wskazane poniżej źródła pierwotne. Niczego dodatkowo nie instalowałem.

## Rekomendacja

Wybrałbym **Frama Atelier**: spokojny interfejs użytkowy oparty na kolorach Framasoft, z bardziej ekspresyjnym charakterem biblioteki i strony wejściowej. Czytnik powinien ustępować dokumentowi. Odrębne potrzeby trzech powierzchni — biblioteki, czytnika, panelu udostępniania — trzeba zapisać w jednym systemie tokenów, nie projektować ich jako trzech niezależnych aplikacji.

Framasoft publikuje własną [kartę graficzną](https://framasoft.org/fr/graphics/). Zawiera fiolet `#725794`, pomarańczowe CTA `#cc4e13`, ciemny indygo `#0b1c54`, kolor pomocniczy `#4a5268` i jasne tło `#f7fafc`. Marka wykorzystuje zaokrąglenia, przestrzeń i bardziej ilustracyjny charakter nagłówków. Proponowane poniżej warianty to interpretacje dla narzędzia do dokumentów; nie są oficjalnymi projektami Framasoft. Warto potwierdzić zakres użycia marki z organizacją przed publikacją.

## Trzy kierunki do wyboru i wariant uzupełniający

W każdym mockupie porównujemy czytnik tego samego dokumentu i ten sam panel dostępu. Commun pokazuje dodatkowo boczną bibliotekę. Dzięki temu wybór dotyczy rzeczywistej estetyki i wygody, a nie atrakcyjności przykładowej okładki. Mockupy używają fontów systemowych (system-ui/Georgia); wymienione niżej rodziny to propozycje do finalnego produktu.

| Kierunek | Tokeny i typografia | Charakter i element rozpoznawczy | Zalety / koszt |
|---|---|---|---|
| **A. Frama Atelier — rekomendowany** | Tło `#f7fafc`, powierzchnia `#ffffff`, tekst `#0b1c54`, drugorzędny `#4a5268`, główny `#725794`, CTA `#cc4e13`. Source Sans 3 dla UI; wyraźne nagłówki tej samej rodziny. Skala 14/16/20/28/40 px, promienie 8–12 px. | Przyjazne narzędzie publiczne. Fioletowa wąska linia aktywnego dokumentu, pomarańczowy przycisk „Udostępnij”. Okładki i tytuły budują charakter biblioteki. | Najłatwiej powiązać z Framasoft; trzeba ograniczyć dekorację i kolor w czytniku. |
| **B. Papier — editorial** | Tło `#eef3f6`, powierzchnia `#ffffff`, tekst `#183344`, drugorzędny `#4a5268`, akcent `#225a86`, jasny akcent `#eaf2f8`. Literata w nagłówkach i trybie EPUB, Source Sans 3 w kontrolkach. Promienie 3–6 px. | Biblioteka cyfrowa: większe tytuły, pozioma nawigacja, spokojne linie podziału, ustawienia udostępniania otwierane na żądanie. Czytnik EPUB ma rytm książki. | Najlepsza dla długiej lektury; mniej oczywista więź wizualna z marką. Nie nakładamy szeryfów ani „papierowego” filtra na zawartość PDF. |
| **C. Commun — civic** | Tło `#f0f5f1`, powierzchnia `#ffffff`, tekst `#213b2d`, drugorzędny `#4a5268`, akcent `#29573b`, jasny akcent `#e3eee6`. Source Sans 3, wyraźne etykiety, promienie 8–12 px. | Społeczne narzędzie publiczne: biblioteka w bocznym panelu, czytelne stany prywatności i dolny panel udostępniania. Charakter nadają spokojne zielenie i bezpośredni język. | Dobra dla edukacji i organizacji społecznych; dolny panel trzeba sprawdzić pod kątem focusu. Mniej bezpośrednio nawiązuje do marki. |
| **D. Galeria — opcjonalny tryb ciemny, poza trzema mockupami** | Tło `#18222c`, powierzchnia `#233240`, tekst `#f1f5f7`, drugorzędny `#b2c0cb`, akcent `#c6b1ec`, wyróżnienie `#f3a566`. Source Sans 3; minimalny cień, promienie 10 px. | Duży dokument na ciemnym tle, pasek narzędzi blisko zawartości, subtelne obramowania zamiast rozbudowanej dekoracji. | Dobra dla prezentacji i zdjęć; jasny PDF nadal pozostaje jasny. Tryb ciemny interfejsu nie gwarantuje trybu ciemnego dokumentu ani dostępności. |

Kolory to propozycje startowe. Wszystkie kombinacje tekst/tło i stanów komponentów należy przeliczyć, a nie zakładać, że cała paleta spełnia WCAG. Rozmiary to skala, nie zakaz skalowania tekstu przez użytkownika.

## Jakich skilli używać

Skill to instrukcja pracy dla agenta. Nie jest biblioteką uruchamianą u odbiorcy Framashare. Weryfikacja licencji skilla nie zastępuje weryfikacji zależności aplikacji, fontów, ikon ani wygenerowanego kodu.

| Skill / narzędzie | Dostępność w tej sesji | Co wnosi | Licencja / źródło | Proponowane użycie |
|---|---|---|---|---|
| **frontend-design** | Zainstalowany; instrukcja przeczytana | Plan palety, typografii, układu i rozpoznawalnego detalu; krytyka planu przed kodowaniem | Lokalny LICENSE.txt: Apache-2.0; [licencja źródłowego skilla Anthropic](https://raw.githubusercontent.com/anthropics/skills/main/skills/frontend-design/LICENSE.txt). Lokalna instrukcja może różnić się od upstream. | Na etapie wyboru kierunku; szczególnie dobra do zestawu wariantów. |
| **Impeccable** | Zainstalowany; instrukcja 4.3.1 przeczytana | Trwały kontekst produktu i designu, osobne zasady dla pracy z narzędziem i czytania; komendy shape, audit, clarify, harden, adapt, polish | [Repozytorium](https://github.com/pbakaus/impeccable), [Apache-2.0](https://github.com/pbakaus/impeccable/blob/main/LICENSE) | Główny workflow dla całego produktu. Jedna partia kontroli desktop + mobile, poprawki, maksymalnie jedna runda potwierdzenia. |
| **avoid-ai-design** | Zainstalowany; instrukcja przeczytana | Audyt stereotypów, m.in. bezmyślnych gradientów, identycznych kart, przypadkowej typografii. Rozróżnia pewne obserwacje kodu i wnioski ze screenshotu. | Lokalny skill deklaruje MIT; [publiczny SKILL.md](https://github.com/funboy322/avoid-ai-design/blob/main/SKILL.md), [MIT](https://github.com/funboy322/avoid-ai-design/blob/main/LICENSE). To zgodne publiczne źródło; pochodzenie konkretnej lokalnej kopii nie zostało niezależnie potwierdzone. | Opcjonalny końcowy audyt detect, nie drugi projektant walczący z wybraną estetyką. |
| **agent-browser / agent-browser-verify** | Instrukcje wtyczki Vercel dostępne; verify przeczytany. Dostępność samego executable nie była tu testowana. | Otwiera prawdziwą aplikację, zrzuty ekranu, interakcje, przegląd błędów i kontrola elementów UI | [Silnik agent-browser](https://github.com/vercel-labs/agent-browser), [Apache-2.0](https://github.com/vercel-labs/agent-browser/blob/main/LICENSE). Licencja silnika nie jest potwierdzeniem licencji każdej instrukcji wtyczki. | Weryfikacja po implementacji. Nie wymaga hostowania produktu na Vercel. |
| **UI UX Pro Max** | Zewnętrzny; niezainstalowany | Wyszukiwany katalog estetyk, palet, par fontów i wzorców UI; generator propozycji systemu | [Repozytorium i MIT](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) | Opcjonalnie do rozszerzenia inspiracji. W tej aplikacji dostępne skille są wystarczające; automatyczna sugestia stylu nie powinna zastępować decyzji projektowej. |

Nie ma podstaw, by twierdzić, że któryś skill gwarantuje lepszy wynik. Deklaracje i katalogi autorów opisują funkcje, nie stanowią niezależnego porównania jakości. Największą różnicę robią konkretny brief, wspólny system i kontrola działającego interfejsu.

Warto pamiętać, że „unikaj fioletu” w niektórych checklistach jest skrótem dotyczącym bezmyślnych szablonów. Fiolet Framasoft ma uzasadnienie w marce, więc należy go zachować, jeśli wybierzemy ten kierunek.

## Proponowany workflow

1. Zapisać `PRODUCT.md`: dla kogo jest Framashare, najważniejsze zadania, otwartość, prywatność, samodzielny hosting, wymagania językowe. Oddzielić decyzje od hipotez.
2. Pokazać 3–4 porównywalne mockupy: biblioteka, czytnik PDF i panel „Udostępnij”. Dodać widok mobilny finalisty. Nie opierać wyboru na samym landing page.
3. Po wyborze zapisać `DESIGN.md`: tokeny, typografia, odstępy, gęstość, promienie, ikonografia, focus, stany błędu i zasady ruchu. Każdy kolejny prompt AI powinien odwoływać się do tego pliku.
4. Zbudować podstawowe komponenty i ich stany: przycisk, pole, dialog, przełącznik, segmentowane tryby czytnika, lista dokumentów, status linku. Dane i tekst mają odpowiadać produktowi, także przy braku plików.
5. Zaprojektować pełny przepływ: upload → przetwarzanie → czytanie → utworzenie linku → odblokowanie dostępu → wygaśnięcie lub odwołanie. Osobne komunikaty dla niedozwolonego formatu, błędnego hasła, limitu wejść i problemu sieci.
6. Sprawdzić realny browser: desktop i mobile w jednej partii. Zbadać też klawiaturę, długie tytuły, różne języki, zoom przeglądarki, wolny upload i pustą bibliotekę.
7. Wykonać audit dostępności oraz test funkcjonalny, poprawić całą partię znalezionych problemów, potwierdzić wynik. Automatyczny skan dostępności nie zastępuje ręcznej kontroli czytnikiem ekranu.

Przykład konkretnego promptu implementacyjnego:

> Zbuduj ekran biblioteki Framashare zgodny z DESIGN.md, kierunek Frama Atelier. Główne zadania: dodać plik, wznowić czytanie, utworzyć i odwołać link. Użyj istniejących tokenów i komponentów. Przygotuj stan pusty, upload, przetwarzanie, błąd i długi tytuł. W UI nie ujawniaj nazw backendu ani infrastruktury. Sprawdź klawiaturę, mobile oraz zoom 200%.

## UX udostępniania: najważniejszy panel

Podstawowy stan powinien mieścić się w jednym dialogu: nazwa linku, hasło, data wygaśnięcia, limit otwarć, pozwolenie na pobranie. Funkcje rzadsze mogą trafić do sekcji „Więcej ustawień”. Pokaż jednoznaczny podgląd, np. „Dostęp z hasłem do 12 października 2026, 18:00 (Europe/Warsaw). Pozostało 10 otwarć.”

Ograniczenia na poziomie linku i ważność samego pliku trzeba rozróżnić. „Link wygasł” nie może sugerować „plik usunięty”. Przycisk „Odwołaj link” powinien szybko unieważniać dostęp, a panel ma wyjaśniać, czy dotyczy też już rozpoczętych sesji. Ostrzeżenie o braku gwarancji zakazu kopiowania należy umieścić przy ustawieniu pobierania, zwięźle: „Ukrywa pobieranie w czytniku. Nie zapobiega kopiowaniu ani zrzutom ekranu.”

Limit „otwarć” wymaga definicji produktu widocznej w pomocy. Praktyczna propozycja: liczyć udane odblokowanie sesji czytania, nie pobrania stron PDF i nie każde odświeżenie. Po wybraniu definicji tekst, licznik i implementacja muszą mówić o tej samej rzeczy.

## Dostępność i zasoby

Cel: WCAG 2.2 AA dla interfejsu. Zwykły tekst powinien mieć kontrast co najmniej 4,5:1; duży tekst może mieć 3:1. Wymóg minimalnego celu dotykowego AA to 24×24 CSS px z wyjątkami opisanymi w standardzie; w tym produkcie proponuję wygodniejszy cel 44×44 px dla najważniejszych kontrolek czytnika. Focus musi być widoczny, a znaczenie statusów nie może opierać się wyłącznie na kolorze. [WCAG 2.2](https://www.w3.org/TR/WCAG22/), [wyjaśnienie kontrastu](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html).

PDF ma stały układ; EPUB powinien pozwalać zmieniać rozmiar liter, interlinię i szerokość tekstu. Canvas PDF potrzebuje warstwy tekstowej i obsługi klawiatury. Dostępność samego dokumentu zależy również od pliku źródłowego; czytnik nie naprawi automatycznie nieotagowanego skanu.

Fonty hostować lokalnie, z dołączonymi licencjami. Propozycje: [Source Sans — OFL](https://github.com/adobe-fonts/source-sans/blob/release/LICENSE.md), [Literata — OFL](https://github.com/googlefonts/literata/blob/main/OFL.txt), opcjonalnie [Atkinson Hyperlegible — OFL](https://github.com/googlefonts/atkinson-hyperlegible/blob/main/README.md). Sprawdzić polskie i francuskie znaki oraz warianty wag w dokładnej użytej paczce. OFL jest odpowiednią otwartą licencją fontu, choć nie jest MIT; nie należy zmieniać jej na MIT. Nazwa dostępnościowa fontu nie oznacza zgodności całego interfejsu z WCAG.

W produkcie nie są potrzebne generowane ilustracje ani zewnętrzny CDN fontów. Charakter tworzą okładki dokumentów, typografia i dopracowane kontrolki. To zmniejsza liczbę zasobów wymagających weryfikacji i pozwala trzymać wygląd konsekwentnie.
