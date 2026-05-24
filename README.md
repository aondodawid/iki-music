# IKI Music Studio

Prosta instrukcja dla każdego: jak pobrać projekt z Git, jak go uruchomić po instalacji i kiedy używać konkretnych skilli zespołowych.

## Co to jest

IKI Music Studio to aplikacja webowa do generowania muzyki z promptu tekstowego.
Działa lokalnie w przeglądarce (model MusicGen), ma tryb live/chat, wsparcie PL/EN oraz PWA (można dodać na ekran telefonu).

## 1) Instalacja projektu z Git (pierwsze uruchomienie)

### Wymagania

- Git
- Node.js 20+ (zalecane LTS)
- npm (instaluje się razem z Node.js)

Sprawdzenie, czy narzędzia są dostępne:

```bash
git --version
node --version
npm --version
```

### Pobranie kodu

```bash
git clone https://github.com/aondodawid/iki-music.git
cd iki-music/app
npm install
```

To robisz tylko przy pierwszej instalacji na danym komputerze.

## 2) Jak odpalić aplikację po instalacji

Za każdym kolejnym razem wystarczy:

```bash
cd iki-music/app
npm run dev
```

Po starcie zobaczysz adres lokalny (zwykle `http://127.0.0.1:5173` albo `http://localhost:5173`).
Otwórz go w przeglądarce.

### Jak zatrzymać aplikację

W terminalu użyj skrótu `Ctrl + C`.

## 3) Aktualizacja projektu z Git

Jeśli projekt był już wcześniej pobrany:

```bash
cd iki-music
git pull
cd app
npm install
```

`npm install` po `git pull` warto uruchomić zawsze, bo mogły dojść nowe paczki.

## 4) Najczęstsze problemy (wersja nietechniczna)

- Problem: `npm` albo `node` nie działa.
  Rozwiązanie: doinstaluj Node.js LTS i otwórz nowy terminal.

- Problem: port zajęty (`EADDRINUSE`).
  Rozwiązanie: zamknij poprzedni proces (`Ctrl + C`) albo uruchom na innym porcie:

  ```bash
  npm run dev -- --port 5175
  ```

- Problem: po zmianach coś nie działa jak wcześniej.
  Rozwiązanie: w katalogu `app` wykonaj:

  ```bash
  rm -rf node_modules package-lock.json
  npm install
  npm run dev
  ```

## 5) Jak używać aplikacji (szybko)

1. Wejdź w tryb `Chat`.
2. Opisz klimat utworu w polu prompt (np. styl, emocje, instrumenty).
3. Ustaw długość, BPM i opcje instrumental/perkusja.
4. Kliknij generowanie i poczekaj na wynik.
5. Dla słabszych urządzeń używaj krótszych długości (smart cap pomaga dobrać limit).

## 6) Skille: kiedy używać którego

Poniżej praktyczna ściąga dla współtwórców (AI/agent workflow):

- `react-best-practices`
  Użyj, gdy modyfikujesz komponenty React i chcesz poprawić wydajność, renderowanie, podział kodu i praktyki Vercel.

- `project-kickoff`
  Użyj na starcie funkcji, gdy potrzebujesz planu wdrożenia krok po kroku (zakres, kolejność prac, kryteria akceptacji).

- `code-review-playbook`
  Użyj przed mergem albo podczas review, gdy chcesz znaleźć błędy i ryzyka w priorytecie od najważniejszych.

- `bug-triage`
  Użyj przy zgłoszonym błędzie: pomaga szybko odtworzyć problem, zawęzić przyczynę i zrobić minimalną, bezpieczną poprawkę.

- `release-readiness`
  Użyj przed wydaniem/produkcyjnym wdrożeniem: checklista jakości, ryzyk i planu rollbacku.

- `openspec-propose`
  Użyj, gdy masz nowy pomysł i chcesz od razu wygenerować kompletną propozycję zmiany (spec + design + taski).

- `openspec-explore`
  Użyj, gdy trzeba najpierw przemyśleć warianty rozwiązania i doprecyzować wymagania.

- `openspec-apply-change`
  Użyj, gdy spec jest gotowy i przechodzisz do implementacji konkretnych zadań.

- `openspec-archive-change`
  Użyj po zakończeniu prac, gdy zmiana ma zostać zamknięta i zarchiwizowana.

## 7) Komendy jakości (dla osób technicznych)

W katalogu `app`:

```bash
npm test
npm run build
```

## 8) Struktura repo (skrót)

- `app/` - aplikacja React (tu uruchamiasz `npm run dev`)
- `openspec/` - specyfikacje zmian i workflow
- `.github/skills/` - skille używane przez agenta/Copilota
