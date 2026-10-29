# Fitnesstracker – Projektanleitung für Claude

Offline-Fitness- & Lifestyle-Tracker als **PWA** für Android und iPhone. Einmaliger Download über **GitHub Pages**, danach läuft die App **komplett ohne Internet**. Alle Daten bleiben auf dem Gerät. Kein Server (erst viel später geplant).

- Ideensammlung: [fitnesstracker.md](fitnesstracker.md)
- Umsetzungsplan mit allen Schritten und Fortschritt: [docs/ROADMAP.md](docs/ROADMAP.md)

## Ablauf, wenn der Nutzer „Schritt X starten“ schreibt

Jeder Schritt wird in einem eigenen Chat umgesetzt. Der Projektstand steht im Repo, nicht im Chatverlauf.

1. **Lesen:** `docs/ROADMAP.md` komplett lesen, besonders Schritt X und die **Notizen der vorherigen Schritte** (Abweichungen, offene Punkte).
2. **Voraussetzungen prüfen:** Sind alle vorherigen Schritte abgehakt? Falls nicht, den Nutzer darauf hinweisen und fragen, ob trotzdem fortgefahren werden soll.
3. **Bestehenden Code ansehen:** Vorhandene Komponenten, Hooks, DB-Hilfsfunktionen und Domain-Logik wiederverwenden statt neu zu bauen.
4. **Kurz planen:** Dem Nutzer in wenigen Stichpunkten sagen, was gebaut wird. Bei echten Unklarheiten (fachliche Entscheidungen) nachfragen, sonst sinnvolle Annahmen treffen und nennen.
5. **Umsetzen:** Nur den Umfang von Schritt X. Ideen für später als Notiz in der ROADMAP festhalten statt sie einzubauen.
6. **Prüfen:** Siehe „Definition of Done“ unten.
7. **Abschließen:**
   - In `docs/ROADMAP.md` die Checkbox von Schritt X abhaken und unter „Notizen“ eintragen: *Gebaut / Abweichungen vom Plan / Offene Punkte*.
   - Diese `CLAUDE.md` aktualisieren, falls neue Befehle, Konventionen oder wichtige Dateien dazugekommen sind.
   - Lokaler git-Commit mit Nachricht `Schritt X: <Titel>`. **Kein Push** – es wird nur lokal gearbeitet. Veröffentlicht wird erst in Schritt 20 (bzw. im optionalen Zwischenschritt 2b).
   - Dem Nutzer am Ende sagen, was er ggf. selbst prüfen soll (z. B. im Browser mit Handy-Ansicht) und dass als Nächstes „Schritt X+1 starten“ folgt.

## Tech-Stack

| Bereich | Wahl |
|---|---|
| Sprache | TypeScript (strict) |
| Framework | React + Vite, React Router mit **HashRouter** (wegen GitHub Pages) |
| PWA | `vite-plugin-pwa` (Workbox), Precache **aller** Assets inkl. `src/data/*.json` |
| Styling | Tailwind CSS, Dark Mode über `class`-Strategie, mobile-first |
| Speicher | IndexedDB via **Dexie** + `dexie-react-hooks` (`useLiveQuery`) |
| Validierung | Zod (Formulare, Backup-Import) |
| Charts | Recharts |
| Tests | Vitest (+ `fake-indexeddb`), Playwright (Mobile-Viewport, Offline) |
| Hosting | GitHub Pages, Deploy per GitHub Action – **erst in Schritt 20**, bis dahin nur lokal |

## Projektstruktur (Ziel)

```
src/
  db/          Dexie-Schema, Versionen/Migrationen, Seed-Logik, Backup
  data/        exercises.json, foods.json (mitgelieferte Datenbanken)
  domain/      reine Logik ohne React/DB: 1RM, Volumen, PRs, Streaks, Nährwerte
  features/    je Bereich ein Ordner: training/, plans/, stats/, daily/, habits/,
               supplements/, nutrition/, endurance/, settings/, dashboard/
  components/  gemeinsame UI (Stepper, Timer, Chart-Wrapper, Layout)
scripts/       Aufbereitung der Seed-Daten (läuft nur beim Entwickeln)
e2e/           Playwright-Tests
```

## Verbindliche Regeln

- **Offline first:** Keine Laufzeit-Aufrufe ins Internet (keine CDNs, keine APIs, keine Online-Fonts). Alles wird gebündelt.
- **Datenmodell:** Jeder Datensatz hat `id` (UUID via `crypto.randomUUID()`), `createdAt`, `updatedAt`, `deletedAt` (Soft-Delete, `null` = aktiv). So kann später ein Server-Sync ergänzt werden.
- **Schemaänderungen:** Nur über eine **neue Dexie-Version** mit Upgrade-Funktion. Bestehende Daten auf dem Handy dürfen niemals verloren gehen. Backup-Format bei Bedarf mitziehen (Version im Backup-JSON).
- **Mitgelieferte Daten:** Einträge aus `src/data/` haben `source: 'builtin'` und werden über eine Seed-Version aktualisiert. Eigene Einträge (`source: 'user'`) werden nie überschrieben.
- **Logik testbar halten:** Berechnungen gehören nach `src/domain/` und bekommen Unit-Tests.
- **UI-Sprache Deutsch**, Code (Bezeichner) Englisch, Kommentare sparsam.
- **Mobile-Bedienung:** große Touch-Ziele (min. 44 px), Bottom-Navigation, Eingaben mit Steppern.
- **Einheiten:** intern immer kg, Meter, Sekunden, Gramm; Umrechnung nur in der Anzeige.

## Definition of Done (jeder Schritt)

1. `npm run lint` und `npm run typecheck` ohne Fehler
2. `npm test` (Vitest) grün, neue Logik hat Tests
3. Playwright-E2E für den neuen Ablauf im Mobile-Viewport, wo sinnvoll mit `context.setOffline(true)`
4. `npm run build` erfolgreich
5. ROADMAP abgehakt + Notizen, Commit erstellt

## Befehle

- `npm run dev` – Entwicklungsserver
- `npm run build` / `npm run preview` – Produktions-Build lokal testen (Service Worker aktiv, Port 4173)
- `npm test` – Vitest (`src/**/*.test.{ts,tsx}`, Setup in `src/test/setup.ts`)
- `npm run test:e2e` – Playwright (`e2e/`, baut selbst und startet Preview; Projekte `android` und `iphone`)
- `npm run lint` (ESLint + Prettier-Check) / `npm run format` / `npm run typecheck`
- `npm run icons` – PWA-Icons aus `public/favicon.svg` neu erzeugen
- `npm run data` – `src/data/exercises.json` + `foods.json` aus Quelldaten neu erzeugen (Download nach `scripts/.cache/`, Auswahl/Übersetzung in `scripts/data/*.mapping.mjs`). Danach **`SEED_VERSION` in `src/db/seed.ts` erhöhen**.

**Werkzeuge (für Claude):** Node.js und git liegen portabel in `%LOCALAPPDATA%\Programs\nodejs` und `%LOCALAPPDATA%\Programs\MinGit\cmd`. Falls nicht im PATH, in PowerShell zuerst: `$env:Path = "$env:LOCALAPPDATA\Programs\nodejs;$env:LOCALAPPDATA\Programs\MinGit\cmd;$env:Path"`. `npm install` ist auf diesem Laufwerk sehr langsam → mit langem Timeout oder im Hintergrund ausführen.

**Wichtige Dateien:** `vite.config.ts` (PWA-Manifest, Workbox, `BASE_PATH`, Vitest-Konfig), `playwright.config.ts`, `src/main.tsx` (Speicher-Persistenz, `UpdatePrompt`), `src/App.tsx` (Routen), `src/index.css` (Tailwind, Dark-Mode-Variante).

**Datenbank & Konventionen:**
- `src/db/database.ts`: Dexie-Schema (`AppDatabase`, Singleton `db`). Neue Tabelle = neue `version(n)`, Tabelle in `src/db/backup.ts` (`backupSchema` + `TABLE_LABELS`) ergänzen.
- `src/db/repository.ts`: `create`/`update`/`softDelete`/`listActive` für alle Tabellen verwenden (setzen `id`, Zeitstempel, `deletedAt`).
- Einstellungen: `useSettings()` (`src/features/settings/useSettings.ts`) zum Lesen, `updateSettings()` zum Schreiben.
- Mitgelieferte Daten: Tabellen `exercises`/`foods` (`source: 'builtin' | 'user'`, `builtinKey`), Seed über `ensureSeeded()` (`src/db/seed.ts`, läuft beim Start und nach Backup-Import). Typen/Enums in `src/db/types.ts`, Zod-Schemas in `src/db/schemas.ts`, deutsche Bezeichnungen in `src/domain/labels.ts`. Lebensmittel: Nährwerte pro 100 g, Kohlenhydrate **ohne** Ballaststoffe (EU).
- Suche: `createSearch(items)` aus `src/domain/search.ts` (normalisiert Umlaute/ß, Aliase); UI-Baustein `CatalogSearch`.
- Übungen: Nutzerfelder `isFavorite`, `hiddenAt` (Ausblenden – **nicht** `deletedAt`, das setzt bei builtin nur der Seed), `notes`. Schreiben über `src/db/exercises.ts` (`createUserExercise`, `updateUserExercise`, `deleteUserExercise`, `setExerciseFavorite/Hidden/Notes`). Filter/Sortierung in `src/domain/exercises.ts`.
- **Übung auswählen** (Workout, Pläne): `<ExercisePicker onSelect onClose />` aus `src/features/training/ExercisePicker.tsx` (nur rendern, solange offen). Liste/Suche/Filter: `ExerciseBrowser`; Daten: `useActiveExercises()`/`useExercise(id)`.
- Gemeinsame UI: `Page` (optional `backTo` für Unterseiten)/`Card`/`LinkRow` (`src/components/Page.tsx`), `Stepper`, `SegmentedControl`, `SearchInput`, `Chip`, `Select`, Button-/Eingabe-Klassen in `src/components/buttons.ts`; neue Bereiche als Route unter `Layout` in `src/App.tsx`.
- Tests mit DB: `beforeEach(resetDatabase)` aus `src/db/testUtils.ts`. E2E offline: `goOffline()` aus `e2e/helpers.ts`.
- Vor `npm run test:e2e` keinen alten `npm run preview` auf Port 4173 laufen lassen (wird sonst wiederverwendet).

## Hinweise

- Plattform des Nutzers: Windows, PowerShell.
- **Veröffentlichung (seit Schritt 2b):** Repo `https://github.com/niklasbesarab/fitnesstracker` (Remote `origin`), App unter `https://niklasbesarab.github.io/fitnesstracker/`. Jeder Push auf `main` deployt per `.github/workflows/deploy.yml`. Trotzdem nur pushen, wenn der Nutzer es ausdrücklich will. Push aus Claudes Terminal: vorher `$env:GIT_TERMINAL_PROMPT='1'; $env:GCM_INTERACTIVE='always'`. Commit-E-Mail ist repo-lokal die GitHub-noreply-Adresse (nicht ändern).
- **Lokale Entwicklung:** Bis auf den Testpush in 2b gibt es keine Pushes bis Schritt 20. Getestet wird am PC: Browser-DevTools (Handy-Ansicht, „Offline“), `npm run preview` für den Service Worker, Playwright mit Android- und iPhone-Viewport. Echte Handy-Installation erst nach Veröffentlichung (Ausnahme: Android per USB + Chrome-Portweiterleitung auf `localhost`).
- Code so schreiben, dass die Veröffentlichung später nur Konfiguration ist: Vite-`base` über Umgebungsvariable (`BASE_PATH`, Standard `/`), keine absoluten Pfade.
- iOS kann Daten von Web-Apps löschen → `navigator.storage.persist()` und Backup-Erinnerung sind wichtig.
- Ohne Server keine Push-Benachrichtigungen; Erinnerungen nur bei geöffneter App.
- GitHub Pages braucht bei kostenlosem Account ein öffentliches Repo; Vite-`base` = `/<repo-name>/`.
