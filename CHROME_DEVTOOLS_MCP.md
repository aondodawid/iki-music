# Chrome DevTools MCP - szybki start

Ten dokument pokazuje, jak uruchomić i używać Chrome DevTools MCP w dwóch środowiskach:

- Copilot (VS Code)
- Claude

## Co to daje

Chrome DevTools MCP pozwala agentowi:

- otwierać stronę i klikać elementy,
- czytać strukturę UI,
- wpisywać teksty w formularze,
- robić screenshoty,
- sprawdzać błędy konsoli i requesty sieciowe.

## 1) Wymagania

- Node.js 20+
- Google Chrome / Chromium
- `npx` (w pakiecie z npm)

## 2) Konfiguracja dla Copilot (VS Code)

Plik konfiguracyjny w repo:

- `./.vscode/mcp.json`

Użyta konfiguracja:

```json
{
  "servers": {
    "chrome-devtools": {
      "command": "npx",
      "args": ["-y", "chrome-devtools-mcp@latest"]
    }
  }
}
```

Po zapisaniu pliku uruchom ponownie okno VS Code, żeby serwer MCP został poprawnie podłączony.

## 3) Konfiguracja dla Claude

Plik konfiguracyjny w repo:

- `./.claude/mcp.json`

Użyta konfiguracja:

```json
{
  "mcpServers": {
    "chrome-devtools": {
      "command": "npx",
      "args": ["-y", "chrome-devtools-mcp@latest"]
    }
  }
}
```

W zależności od środowiska Claude może być potrzebne skopiowanie tej konfiguracji do globalnego pliku konfiguracyjnego Twojej instalacji Claude.

## 4) Jak używać w praktyce

Przykładowy flow:

1. Uruchom aplikację lokalnie (`npm run dev` albo `npm run preview`).
2. Poproś agenta, aby otworzył stronę i sprawdził dany scenariusz (np. formularz, instalację PWA, flow generowania).
3. Jeśli trzeba, poproś o:
   - kliknięcie elementów,
   - wpisanie danych,
   - odczyt błędów konsoli,
   - analizę requestów,
   - screenshot po wykonaniu kroków.
4. Na końcu poproś o podsumowanie znalezionych problemów.

## 5) Przykładowe prompty

```text
Otworz localhost:5173 i przejdz caly flow generowania muzyki w trybie Chat.
Sprawdz czy przycisk generate jest dostepny z klawiatury i czy sa bledy w konsoli.
```

```text
Sprawdz PWA install flow: czy pojawia sie install prompt i czy nie ma bledow service workera.
```

```text
Zrob screenshot sekcji ustawien i sprawdz, czy teksty nie wychodza poza kontener na mobile.
```

## 6) Najczęstsze problemy

- MCP nie startuje:
  sprawdź `node --version` i `npx --version`.

- Brak reakcji narzędzi browser:
  zrestartuj VS Code/Claude po dodaniu konfiguracji.

- Konflikt portu:
  uruchom aplikację na innym porcie, np. `npm run dev -- --port 5175`.
