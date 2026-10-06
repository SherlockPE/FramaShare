# Prompt do nowej sesji Framashare

Skopiuj treść poniższego bloku do nowej sesji Codex otwartej w projekcie `/home/codexdev/projects/42/framashare`.

```text
Zrealizuj cały plan lokalnego, responsywnego prototypu Framashare, bez Figmy.

Repozytorium: /home/codexdev/projects/42/framashare
Specyfikacja: docs/design/implementation-plan.md
Referencje wizualne: docs/design/references/
Kontekst produktu: docs/research/

Najpierw przeczytaj pełną specyfikację i obejrzyj wszystkie screenshoty referencyjne. Specyfikacja ma pierwszeństwo przed wcześniejszym researchem i koncepcjami Frama Atelier/Papier/Commun. Nie potrzebujesz poprzedniego czatu ani dostępu do Figma MCP. Nie zatrzymuj pracy, aby prosić o połączenie z Figmą.

Twoim zadaniem jest IMPLEMENTACJA, nie kolejny plan. Zbuduj działający w przeglądarce prototyp wszystkich stron, menu, dialogów i stanów. Użyj Vue 3 + TypeScript + Vite + Vue Router, wspólnych komponentów, mock service, lokalnych danych i strony /overview umożliwiającej pokazanie wszystkich ekranów oraz scenariuszy. Zbuduj także /design-system.

Wygląd ma być bardzo bliski cofounder.co: kremowo-szare tła, grafitowe przyciski z subtelną przestrzennością, cienkie obramowania, spokojna typografia i własne ilustracje pixel art. Korzystaj przede wszystkim z zachowanych referencji, a stronę https://cofounder.co/ i jej publiczne podstrony możesz obejrzeć pomocniczo. Nie kopiuj logo ani całych screenshotów jako UI. Fonty lokalne: Figtree i IBM Plex Mono; TT Neoris tylko przy odpowiedniej dostępnej licencji. Wszystkie teksty aplikacji po angielsku.

Wykonaj pełne powierzchnie: landing, how it works, help i artykuły, about, privacy/terms jako treści prototypowe; logowanie, rejestrację, reset hasła i ustawienia; bibliotekę lista/siatka z wyszukiwaniem i filtrami; upload PDF/EPUB/albumów, edycję metadanych i albumu; szczegóły publikacji; wiele niezależnych linków z hasłem, datą/godziną, limitem sesji i pobieraniem; bramkę odbiorcy i wszystkie błędy dostępu; czytniki PDF, EPUB i albumu; zgłoszenia oraz panel admina z publikacjami, kontami, limitami i retencją.

Obsłuż anonimowy upload: okres 1/7/30 dni, domyślnie 7; osobny prywatny link zarządzania; zapis/kopiowanie tego linku; zarządzanie bez konta; późniejsze przypisanie do konta. Claim usuwa anonimową retencję i unieważnia manage token, ale zachowuje linki odbiorców. Przy przekroczonym limicie konta claim nie zmienia własności. Utrata linku zarządzania nie daje ścieżki odzyskiwania bez konta.

Zachowaj reguły dostępu: limit liczy udane sesje rozpoczęte jawnym Start reading, nie błędne hasła, odświeżenia ani strony PDF. Sesja trwa 60 minut; limit wyczerpany blokuje nowe sesje, wygaśnięcie/odwołanie blokuje także aktywne czytanie. Wygaśnięcie linku nie usuwa publikacji. Ekrany odmowy nie ujawniają prywatnych tytułów ani miniaturek. Download off nie oznacza ochrony przed kopiowaniem. Tryb podglądu autora nie zużywa limitu i jest oznaczony.

Pokaż i uruchom wszystkie otwarte kontrolki: profile/document/link menus, filters, sorting, expiry dropdown/calendar/time, PDF zoom, EPUB typography/themes, mobile navigation oraz destructive confirmations. Każda widoczna akcja ma działać. Obsłuż close, cancel, back, retry, keyboard, focus i błędy formularzy.

PDF.js ma rzeczywiście renderować dołączony własny PDF. EPUB demonstruje regulowaną lekturę na bezpiecznych przykładowych rozdziałach; pełny parser dowolnych EPUB nie jest wymagany. Album ma realne obrazy, miniatury, podpisy, alt, zoom/pan. Właściciel czyta przez /app/documents/:id/read lub /manage/:token/read, bez zużywania sesji odbiorców. Rejestr lokalnie wybranych plików należy do całej sesji aplikacji i przetrzymuje zmiany stron; nie unieważniaj object URL przy odmontowaniu formularza uploadu. Granice symulacji wyjaśnij na /overview, bez wprowadzania technicznych paneli demo do codziennych ekranów produktu.

To prototyp frontendowy: bez produkcyjnego backendu, wysyłki e-maili, prawdziwej autoryzacji i wdrożenia. LocalStorage przechowuje metadane, nie binaria i hasła konta. Demo links działają w tej samej lokalnej instancji/przeglądarce. Nie dodawaj publicznego katalogu, płatności, feedu, komentarzy, OCR ani Office.

Używaj subagentów. Najpierw przygotuj wspólny szkielet, tokeny, komponenty, mock service i dane. Potem rozdziel Public & Account, Readers i Administration; sam zajmij się Library & Sharing, uploadem i anonimowym claim. Koordynuj współdzielone pliki i na końcu scal wszystko w spójny produkt.

Pracuj w długich falach, podejmuj rutynowe decyzje samodzielnie i nie kończ na landingu lub pierwszym ekranie. Nie zadawaj ponownie pytań rozstrzygniętych w specyfikacji. Stosuj dostępne skille frontend-design i browser testing; działający backend nie jest warunkiem wykonania mockupów.

Przed zakończeniem uruchom typecheck i build, celowane testy logiki linków/sesji/claim oraz weryfikację przeglądarkową pełnych ścieżek. Sprawdź desktop 1440, mobile 390, szerokość 320 i 200% zoom. Porównaj screenshoty z referencjami, popraw overflow, błędy konsoli, focus i ucięte treści. Zachowaj screenshoty głównych ekranów i otwartych kontrolek w obu rozmiarach. Udokumentuj uruchomienie, /overview, reset danych i faktyczne ograniczenia. Zakończ dopiero po wykonaniu całego zakresu albo po wykazaniu konkretnego nierozwiązywalnego blokera.
```
