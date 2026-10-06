# Framashare: konkurencja i rekomendacje funkcjonalne

Stan researchu: 5 października 2026. Źródła poniżej to oficjalne strony produktów i ich dokumentacja. Nie sprawdzano płatnych kont ani zachowania aplikacji po zalogowaniu. „Niepotwierdzone” oznacza brak wystarczającego dowodu, a nie brak funkcji.

## Potwierdzone wzorce

| Narzędzie | Co potwierdza dokumentacja | Co warto przenieść do Framashare |
|---|---|---|
| SlideShare | Upload PDF, PowerPoint i Word; indeksowanie, osadzanie na stronach. Publiczne treści mogą mieć osobno wyłączone pobieranie i embed. Private oznacza tylko właściciela, a Limited daje dostęp przez bezpośredni link; dokumentacja opisuje także hasło. | Rozdzielić widoczność dokumentu od praw odbiorcy. Osadzanie czytnika i link do konkretnej strony. |
| Calaméo | Zoom, wyszukiwanie, spis treści, pełny ekran, różne widoki, pobieranie i druk. Prywatny URL jest dostępny w każdym planie. Zabezpieczenie hasłem wymaga Subscribers: indywidualnego loginu i hasła oraz przydzielenia publikacji, w PREMIUM/PLATINUM. | Dobry czytnik publikacji, spis treści i prosty panel praw. Framashare może zaoferować łatwiejsze hasło dla pojedynczego linku. |
| Nextcloud | Linki z hasłem i datą wygaśnięcia, cofnięcie udostępnienia, notatka dla odbiorcy, wiele linków o różnych prawach, użytkownicy i grupy. Hide download utrudnia pobranie przez ukrycie elementów UI. | Jeden dokument → wiele niezależnych linków: „warsztaty”, „partnerzy”, „strona publiczna”. Czytelna lista aktywnych uprawnień. |
| Dropbox DocSend | Hasło, wygaśnięcie, pobieranie, wymaganie lub weryfikacja e-maila, listy dozwolonych/zablokowanych e-maili i domen. Część funkcji zależy od planu. Watermark oraz umowa przed wejściem są funkcjami wyższych planów. | Reguły przypisane do linku, późniejsza edycja i cofnięcie. Weryfikowane zaproszenia jako opcja dla organizacji. |
| Lufi / dawny Framadrop | Szyfrowanie w przeglądarce przed uploadem, osobny link pobrania i usunięcia, możliwość wyboru czasu przechowywania. Kod Lufi ma AGPLv3. Framadrop zamknięto 12 stycznia 2021. | Prostota „wrzuć → skopiuj link”, jasna retencja, usunięcie przez właściciela. Szyfrowanie end-to-end wymaga osobnego projektu obsługi podglądu. |
| Flipsnack | Udostępnianie jako Unlisted lub Password protected; dalsze edycje nie zmieniają URL. | Zachowanie stabilnego linku przy aktualizacji dokumentu, przy jednoczesnym wskazaniu wersji. |

Źródła dla tabeli:

- SlideShare: [formaty i upload](https://www.slideshare.net/upload?from_source=loggedin_newsfeed), [oficjalne ustawienia prywatności](https://support.scribd.com/hc/en-us/articles/360055663791-Your-Slideshare-content-privacy-settings).
- Calaméo: [funkcje czytnika](https://www.calameo.com/en/features), [prywatna publikacja](https://support.calameo.com/hc/it/articles/205481338-Non-voglio-che-la-mia-pubblicazione-sia-pubblica-Come-posso-renderla-privata), [ochrona hasłem](https://support.calameo.com/hc/en-us/articles/360001325267-How-can-I-password-protect-my-document).
- Nextcloud: [oficjalna dokumentacja udostępniania](https://docs.nextcloud.com/server/latest/user_manual/en/files/sharing.html). Odnośnik `latest` jest ruchomy; przy przyszłym wdrożeniu należy ponownie zweryfikować dokumentację wybranej wersji.
- DocSend: [ustawienia linków](https://help.dropbox.com/share/dropbox-docsend-link-settings-in-content-library?fallback=true).
- Lufi: [działanie i licencja instancji Framasoft](https://asso.framasoft.org/drop/about), [zamknięcie Framadrop i retencja](https://docs.framasoft.org/fr/lufi/index.html), [repozytorium](https://framagit.org/fiat-tux/hat-softwares/lufi).
- Flipsnack: [prywatne udostępnianie](https://help.flipsnack.com/en/how-to-share-flipbook-without-publishing-first).

Issuu pozostaje istotną inspiracją dla magazynowego czytnika i dystrybucji publikacji. Oficjalna strona była niedostępna dla narzędzia badawczego, a wyszukiwarka nie zwróciła wystarczających oficjalnych materiałów. Nie należy na tej podstawie przypisywać Issuu aktualnych limitów, cen ani funkcji hasła. Nie potwierdzono również aktualnego, natywnego czytnika EPUB w powyższych produktach.

## Proponowany zakres produktu — rekomendacje, nie ustalenia o konkurencji

Framashare powinien łączyć prostotę transferu Lufi, wygodę czytnika Calaméo i model niezależnych linków Nextcloud. Wyróżnikiem będzie czytelne, skutecznie egzekwowane udostępnianie, bez reklam i śledzenia odbiorców dla celów marketingowych.

### Pierwsza użyteczna wersja

- PDF: strony, miniatury, wpisanie numeru strony, powiększenie, dopasowanie do szerokości/strony, obrót, wyszukiwanie tekstu, spis treści, pełny ekran, klawiatura i dostępny tekst.
- EPUB bez DRM: rozdziały, spis treści, rozmiar tekstu, szerokość kolumny, interlinia, motyw jasny/ciemny/sepia. Procent postępu i pozycja czytania zamiast udawania stałej paginacji.
- Obrazy JPEG/PNG/WebP: karuzela, miniatury, zoom, przesuwanie, kolejność, podpisy i tekst alternatywny.
- Panel właściciela: pliki, tytuły, opis, stan przetwarzania, aktywne linki, usuwanie, kwota miejsca, podgląd jako odbiorca.
- Link: opcjonalne hasło, data i godzina wygaśnięcia, maksymalna liczba otwarć, pobieranie oryginału, ręczne cofnięcie, możliwość utworzenia kilku linków dla jednego dokumentu.
- Jasne stany: przetwarzanie, nieobsługiwany format, błędne hasło, wygasł link, wyczerpany limit, usunięty dokument. Błędy uprawnień nie powinny ujawniać tytułu, miniatury ani nazw plików.
- Dostępność i mobile od początku; czytnik z gestami, widocznym fokusem, obsługą klawiatury, etykietami przycisków i preferencją ograniczenia ruchu.

### Kolejna fala

Zaplanowany start dostępu, indywidualne zaproszenia z potwierdzeniem adresu, kolekcje dokumentów, embed z osobną kontrolą dostępu, stabilne linki i historia wersji, opcjonalne zakładki/notatki prywatne, eksport plików i metadanych, lekki dziennik zdarzeń dla właściciela. DOCX/ODT/PPTX/ODP można później konwertować do PDF w izolowanym workerze; nie obiecywać pełnej zgodności układu. OCR dla skanów i weryfikacja dostępności mogą być kolejnym etapem.

Na start odłożyć: publiczny feed, rekomendacje społeczne, federację, komentarze publiczne, edytor dokumentów, DRM i analitykę czasu czytania każdej strony. Zwiększają zakres, moderację, koszty i zbieranie danych.

## Precyzja funkcji dostępu

„Maksymalnie 10 otwarć” proponuję definiować jako 10 nowych, zaakceptowanych sesji czytelnika. Ładowanie strony dokumentu, miniatury, zakresy bajtów PDF i odświeżanie aktywnej sesji nie zużywają kolejnych wejść. Sesja powinna mieć określony czas ważności. Limit zwiększany atomowo po spełnieniu warunków dostępu; równoległe żądania i retry nie mogą zużywać wielu wejść. Otwieranie przez skanery linków i podglądy komunikatorów nie powinno konsumować limitu; dla ograniczonych linków można wymagać jawnego kliknięcia „Otwórz dokument”. Nie oznacza to kontroli liczby osób: anonimowy odbiorca może zmienić przeglądarkę, a użytkownicy mogą dzielić się dostępem.

Hasło udostępnienia i hasło zaszyfrowanego PDF to dwa odrębne mechanizmy. Ukrycie przycisku pobierania ogranicza wygodę pobrania, ale przeglądarka musi otrzymać treść do wyświetlenia. Nie da się obiecać, że odbiorca nie skopiuje widocznej treści albo nie zrobi zrzutu. To ograniczenie należy opisać przy ustawieniu „Zezwól na pobieranie oryginału”, bez marketingowej obietnicy DRM.

Wygaśnięcie i cofnięcie mają blokować przyszłe pobrania treści z serwera. Nie usuną wcześniejszych kopii ani treści znajdującej się już w pamięci odbiorcy. Uprawnienia muszą obejmować oryginał, podglądy, miniatury, wyodrębniony tekst i zasoby EPUB; sam ekran z hasłem przed publicznym adresem pliku nie wystarcza.

Dokument niepubliczny powinien być domyślny. „Dostęp przez link” to dostęp dla każdego posiadacza linku; „Tylko zaproszone osoby” wymaga sprawdzenia tożsamości. Publiczna publikacja i indeksowanie to świadoma, osobna decyzja właściciela.
