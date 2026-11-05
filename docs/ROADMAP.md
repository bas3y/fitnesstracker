# Roadmap Fitnesstracker

Jeder Schritt wird in einem eigenen Chat mit „Schritt X starten“ umgesetzt (Ablauf siehe [CLAUDE.md](../CLAUDE.md)).
Nach Abschluss: Checkbox abhaken und Notizen ausfüllen.

## Übersicht

- [x] Schritt 0 – Projekt-Setup (lokal)
- [x] Schritt 1 – Lokale Datenbank, App-Shell & Datensicherung
- [x] Schritt 2 – Mitgelieferte Datenbanken (Übungen & Nährwerte)
- [x] Schritt 2b – *optional:* früher Testpush & Handytest
- [x] Schritt 3 – Übungsverwaltung
- [x] Schritt 4 – Workout loggen
- [x] Schritt 5 – Berechnungen & PRs
- [x] Schritt 6 – Trainingspläne
- [x] Schritt 6b – Offene Punkte aus Schritt 6 & Handytest
- [x] Schritt 7 – Statistiken & Graphen (Kraft)
- [x] Schritt 8 – Dashboard & CSV-Export (MVP 1 fertig)
- [x] Schritt 9 – Tägliches Tracking
- [x] Schritt 10 – Habit-Tracker
- [x] Schritt 10b – Anpassungen nach dem Testen & Handytest
- [x] Schritt 11 – Supplements
- [x] Schritt 12 – Ernährung (MVP 2 fertig)
- [x] Schritt 12b – Alltag übersichtlicher (Kacheln + Unterseiten)
- [x] Schritt 13 – Training-Kacheln & Ausdauer manuell
- [x] Schritt 14 – Import von Einheiten (Uhr, Strava)
- [x] Schritt 14b – Import von Gesundheitsdaten
- [x] Schritt 15 – Ausdauer-Statistiken & Teilen-Bild
- [x] Schritt 15b – Verbesserungen aus dem Gebrauch (Nachtragen, Ziehen, Protein, Weitergeben)
- [x] Schritt 15c – Strichcode-Scanner für Lebensmittel (online) + Push & Handytest 14–15c
- [ ] Schritt 16 – Ziele & Rückblicke
- [ ] Schritt 17 – Self-Improvement
- [ ] Schritt 18 – Motivation & Trainingsblöcke
- [ ] Schritt 19 – PDF-Export/Berichte
- [ ] Schritt 20 – Veröffentlichung auf GitHub Pages

> Gearbeitet wird bis Schritt 20 nur lokal (lokale Commits, kein Push). Schritt 20 kann auch früher gestartet werden, z. B. direkt nach Schritt 12, wenn die App vorher aufs Handy soll.

---

## Phase 0 – Fundament

### Schritt 0 – Projekt-Setup (lokal)
**Ziel:** Leere, installierbare PWA, die lokal läuft und nach dem ersten Laden offline startet. Noch kein GitHub.
- `git init`, `.gitignore`, Vite + React + TypeScript (strict) + Tailwind
- ESLint + Prettier, Scripts `dev`, `build`, `preview`, `test`, `test:e2e`, `lint`, `typecheck`
- Vitest + `@testing-library/react` + `fake-indexeddb`, Playwright (Mobile-Viewport, z. B. Pixel 7 und iPhone 14)
- `vite-plugin-pwa`: Manifest (Name „Fitnesstracker“, Icons 192/512 + maskable + Apple-Touch-Icon, `display: standalone`, Theme-Farbe), Precache aller Assets, `registerType: 'prompt'`
- HashRouter mit Platzhalter-Startseite
- Vite-`base` über Umgebungsvariable `BASE_PATH` (Standard `/`), damit Schritt 20 nur Konfiguration ist
- `README.md` mit Kurzbeschreibung und lokalen Befehlen (Installationsanleitung fürs Handy folgt in Schritt 20)
- `CLAUDE.md` Befehle-Abschnitt aktualisieren
- Kein GitHub-Repo, kein Push

**Fertig wenn:** `npm run preview` → im Browser laden → DevTools „Offline“ → Neu laden → App startet. Chrome zeigt „App installieren“ an. E2E-Test: Seite lädt nach erstem Besuch auch offline.

**Notizen:**
- Gebaut: Vite 8 + React 19 + TS strict + Tailwind 4 (Dark Mode per `.dark`-Klasse über `@custom-variant` in `src/index.css`), HashRouter mit Platzhalter `src/features/dashboard/HomePage.tsx`, `vite-plugin-pwa` 2 (Manifest, Precache aller Assets, `registerType: 'prompt'`, Registrierung in `src/main.tsx` per `registerSW`), Icons aus `public/favicon.svg` per `npm run icons` (sharp), ESLint 9 Flat Config + Prettier, Vitest (jsdom, fake-indexeddb in `src/test/setup.ts`), Playwright (Pixel 7 + iPhone 14) gegen Build + Preview auf Port 4173, E2E-Offline- und Manifest-Test, README.
- Abweichungen:
  - Node.js 24 LTS und git sind **portabel** unter `%LOCALAPPDATA%\Programs\nodejs` und `%LOCALAPPDATA%\Programs\MinGit` installiert (keine Admin-Rechte) und im Benutzer-PATH eingetragen. VS Code muss einmal neu gestartet werden, damit das Terminal sie findet.
  - Laufwerk D: speichert keine Besitzer-Infos → `git config --global safe.directory D:/Claude/Fitnesstraker` gesetzt.
  - iPhone-Projekt in Playwright nutzt Chromium statt WebKit (WebKit unter Windows ohne Service-Worker-Unterstützung im Test). Echter Safari-Test erst in 2b/20.
  - Icon/Farben sind ein Platzhalter (Hantel, Smaragdgrün `#10b981` auf `#0f172a`), austauschbar über `public/favicon.svg` + `npm run icons`.
- Offene Punkte:
  - Update-Hinweis „Neue Version verfügbar“ ist noch nicht sichtbar (Schritt 1: `registerSW` durch `useRegisterSW` aus `virtual:pwa-register/react` ersetzen).
  - Theme-Script in `index.html` folgt nur dem System; in Schritt 1 an die Theme-Einstellung anbinden.
  - `npm install` dauert auf diesem Laufwerk sehr lange (~20 min).
  - „App installieren“-Anzeige in Chrome manuell geprüft werden (E2E prüft nur das Manifest).

### Schritt 1 – Lokale Datenbank, App-Shell & Datensicherung
**Ziel:** Grundgerüst, in das alle Features eingehängt werden, plus Schutz vor Datenverlust.
- `src/db/`: Dexie-Datenbank v1, Basistyp `BaseEntity` (`id`, `createdAt`, `updatedAt`, `deletedAt`), generische Helfer (`create`, `update`, `softDelete`, `listActive`)
- Tabelle `settings` (Name, Einheiten kg/lb und km/mi, Körpergewicht, Theme, `lastBackupAt`)
- `navigator.storage.persist()` beim Start; Speicherstatus + genutzter Speicher in Einstellungen
- App-Shell: Layout mit Bottom-Navigation (Dashboard, Training, Alltag, Statistik, Einstellungen), Platzhalterseiten, Dark Mode (System/Hell/Dunkel)
- Backup: komplette DB als JSON (`{ app, backupVersion, dbVersion, exportedAt, tables }`) exportieren über Web Share API, Fallback Download; Import mit Zod-Validierung, Vorschau und Bestätigung („ersetzt alle Daten“)
- Banner „Letztes Backup vor X Tagen“ ab 7 Tagen
- Update-Hinweis „Neue Version verfügbar – neu laden“ (vite-plugin-pwa Prompt)

**Fertig wenn:** E2E: Einstellungen ändern → Backup exportieren → DB löschen → Import → Daten wieder da. Unit-Tests für DB-Helfer und Backup-Validierung.

**Notizen:**
- Gebaut:
  - `src/db/`: `database.ts` (Dexie 4, `AppDatabase` v1, Tabelle `settings`), `types.ts` (`BaseEntity`, `Settings`, Zeitstempel als ISO-Strings), `repository.ts` (`create`, `update`, `softDelete`, `listActive`, `nowIso`), `settings.ts` (`ensureSettings`, `getSettings`, `updateSettings`), `backup.ts` (Export aller Tabellen, Zod-Schema, `parseBackup(Text)`, `restoreBackup`, Dateiname), `testUtils.ts` (`resetDatabase`).
  - `src/domain/`: `units.ts` (kg↔lb, m↔km/mi), `format.ts` (deutsche Dezimalzahlen, Parsen mit Komma, Bytes, „vor X Tagen“), `backupReminder.ts` (Banner-Logik ab 7 Tagen).
  - `src/components/`: `Layout` (Banner, Outlet, Bottom-Navigation), `BottomNav`, `Page`/`Card`/`PlaceholderPage`, `Stepper` (±-Buttons + Direkteingabe mit Komma), `SegmentedControl`, `UpdatePrompt` (`useRegisterSW`, „Neue Version verfügbar – Neu laden“), `icons`.
  - Routen: `/` Dashboard, `/training`, `/daily`, `/stats`, `/settings`; unbekannte Routen → Dashboard.
  - Einstellungen: Name, Körpergewicht (Stepper, intern kg), kg/lb, km/mi, Theme System/Hell/Dunkel, Datensicherung, Speicherstatus (`persisted()`, `estimate()`). `navigator.storage.persist()` beim Start in `main.tsx`.
  - Backup-Export per Web Share API (Datei), Fallback Download; Abbrechen des Teilen-Dialogs zählt nicht als Backup. Import: Datei wählen → Zod-Prüfung → Vorschau (Datum, Anzahl je Tabelle) → „Ersetzt alle Daten“ → Importieren.
  - E2E `e2e/backup.spec.ts` (kompletter Ablauf offline + ungültige Datei), `e2e/offline.spec.ts` um Navigation offline erweitert, Helfer `e2e/helpers.ts` (`goOffline`).
- Abweichungen:
  - Einstellungen haben die feste ID `app-settings` statt einer UUID (genau ein Datensatz pro Gerät, verhindert Doppelanlage bei parallelem Start).
  - Theme wird zusätzlich in `localStorage` (`theme`) gespiegelt, weil das Script in `index.html` vor dem Rendern nicht asynchron auf IndexedDB zugreifen kann.
  - Ohne bisheriges Backup zählt der Banner ab Anlage der Einstellungen („Noch kein Backup erstellt“).
  - Nach einem Import wird `lastBackupAt` auf den Export-Zeitpunkt der Sicherung gesetzt (die Daten entsprechen genau diesem Stand).
  - `UpdatePrompt` wird in `main.tsx` neben `<App />` gerendert, damit `App` ohne das virtuelle PWA-Modul testbar bleibt.
- Offene Punkte:
  - Backups mit älterer `dbVersion` werden derzeit 1:1 importiert. Sobald es Version 2 gibt, braucht `restoreBackup` eine Migration der Backup-Daten (oder Import in eine DB mit alter Version und Dexie-Upgrade). Neue Tabellen im Zod-Schema `backupSchema` und in `TABLE_LABELS` ergänzen.
  - Playwright nutzt `reuseExistingServer`: Läuft noch ein alter `npm run preview` auf Port 4173, wird gegen den alten Build getestet → vorher beenden.
  - Teilen-Dialog (Web Share mit Datei) nur auf echten Geräten prüfbar (E2E testet den Download-Fallback).

### Schritt 2 – Mitgelieferte Datenbanken (Übungen & Nährwerte)
**Ziel:** Übungs- und Lebensmitteldaten sind im Download enthalten und offline durchsuchbar.
- **Übungen** `src/data/exercises.json`: ca. 150–250 Einträge, Felder: `key` (stabil), `name` (DE), `aliases`, `category` (strength/cardio/mobility), `primaryMuscles`, `secondaryMuscles`, `equipment`, `isUnilateral`. Quelle z. B. `free-exercise-db` (Public Domain), per Script in `scripts/` gefiltert und übersetzt, gängige deutsche Übungen ergänzen.
- **Lebensmittel** `src/data/foods.json`: ca. 500–2000 Grundlebensmittel, Felder: `key`, `name` (DE), `aliases`, `category`, pro 100 g `kcal`, `protein`, `carbs`, `fat`, `fiber`, `sugar`, `portions` (z. B. „1 Ei = 60 g“). Quelle: USDA FoodData Central (gemeinfrei) und/oder Open-Food-Facts-Auszug (ODbL → Quellenangabe). Aufbereitung per Script, Plausibilitätsprüfung (kcal ≈ 4·P + 4·KH + 9·F).
- Dexie-Version mit Tabellen `exercises`, `foods` (Felder `source: 'builtin' | 'user'`, `builtinKey`)
- Seed-Logik mit `seedVersion`: Erststart = alles einfügen; neue Seed-Version = builtin-Einträge aktualisieren/ergänzen, `user`-Einträge nie anfassen
- Suchfunktion (normalisiert: Umlaute/ß, Groß-/Kleinschreibung, Aliase), einfache Such-Testseiten
- Seite „Über / Lizenzen“ mit Datenquellen
- JSON-Größe prüfen (Ziel: zusammen < 2 MB)

**Fertig wenn:** Offline nach „Bankdrücken“, „bankdrucken“ und „Haferflocken“ suchen liefert Treffer. Unit-Test: Seed-Update überschreibt keine eigenen Einträge.

**Notizen:**
- Gebaut:
  - `npm run data` (`scripts/build-data.mjs`): lädt free-exercise-db und USDA SR Legacy (ZIP, ohne Zusatzpakete entpackt) nach `scripts/.cache/` (gitignored) und erzeugt `src/data/exercises.json` (294 Übungen, ~70 KB) und `src/data/foods.json` (670 Lebensmittel, ~160 KB), ein Eintrag pro Zeile. Auswahl, deutsche Namen, Aliase, Kategorien und Portionen stehen in `scripts/data/exercises.mapping.mjs` und `scripts/data/foods.mapping.mjs`. Das Script bricht ab, wenn eine Quell-ID fehlt, und meldet unplausible Brennwerte.
  - Dexie v2: Tabellen `exercises` und `foods` (`source`, `builtinKey`, Index auf `builtinKey`, `source`, `category`), `Settings.seedVersion` (Upgrade setzt 0). Typen und Enums (Muskelgruppen, Equipment, Kategorien) in `src/db/types.ts`, Zod-Schemas in `src/db/schemas.ts`.
  - Seed (`src/db/seed.ts`): `SEED_VERSION`, `ensureSeeded()` beim Start in `main.tsx` und nach jedem Backup-Import. JSONs per dynamischem Import (eigene, precachte Chunks, nur bei neuer Seed-Version geladen). `applySeed` legt neue builtin-Einträge an, aktualisiert geänderte (zusätzliche Felder bleiben erhalten), blendet entfernte per `deletedAt` aus, fasst `user`-Einträge nie an.
  - Backup: neue Tabellen im Schema, `seedVersion` mit Default 0 → Sicherungen aus DB-Version 1 werden importiert und danach automatisch mit den mitgelieferten Daten ergänzt.
  - `src/domain/search.ts` (Normalisierung ä/ae→a, ß→ss, Akzente, Satzzeichen; Ranking: exakt > Anfang > Wortanfang, Name vor Alias), `src/domain/nutrientCheck.ts` (Brennwert-Plausibilität, USDA→EU-Kohlenhydrate), `src/domain/labels.ts` (deutsche Bezeichnungen).
  - UI: `CatalogSearch`, `SearchInput`, `LinkRow`, `Page` mit `backTo`. Seiten `/training/exercises`, `/daily/foods`, `/settings/about` („Über & Lizenzen“).
  - Tests: Suche, Plausibilität, Seed (inkl. „eigene Einträge bleiben unverändert“), Dexie-Migration v1→v2, Backup alt/neu, Datenqualität der JSONs (Zod, eindeutige Schlüssel, Größe < 2 MB, Brennwerte, Suchbegriffe). E2E `e2e/catalog.spec.ts` (offline suchen, Lizenzseite).
- Abweichungen:
  - Mehr Daten als geplant: 313 statt 150–250 Übungen (inkl. Ausdauer, Dehnen, Faszienrolle), 670 Lebensmittel.
  - Nachtrag (Seed-Version 2): Calisthenics-Grundübungen ergänzt (u. a. Archer-/Einarmige/Negative Klimmzüge, Ring-Dips, Dips an der geraden Stange, Pike-/Archer-/Einarmige Liegestütze, L-Sitz, Hollow Hold, Dragon Flag, Front Lever, Handstand, Knieheben hängend, V-ups, Shrimp Squats, Dead Hang). Alle Körpergewichtsübungen haben `equipment: 'bodyweight'`. Separate „mit Zusatzgewicht“-Einträge wurden entfernt (nur Aliase), damit Verlauf und PRs nicht auf zwei Übungen verteilt werden.
  - Kohlenhydrate werden nach EU-Konvention **ohne Ballaststoffe** gespeichert (USDA zählt sie mit); Plausibilität daher `4·P + 4·KH + 9·F + 2·Ballaststoffe + 7·Alkohol`. Zusätzliches Feld `alcohol`. Ausnahmen mit korrektem, aber abweichendem USDA-Brennwert: Hafer-/Weizenkleie, Kakaopulver, Backpulver.
  - 15 in Deutschland übliche Lebensmittel fehlen bei USDA (Magerquark, Skyr, Harzer, Haferdrink, Leberkäse, Döner …) und sind mit Durchschnittswerten gängiger Handelsprodukte ergänzt (`MANUAL_FOODS`, `sourceRef: 'manual'`). Open Food Facts wurde nicht verwendet.
  - Feld `sourceRef` (z. B. `usda:171688`) an Lebensmitteln zur Nachvollziehbarkeit.
  - `seedVersion` liegt in den Einstellungen (nicht in eigener Tabelle), damit sie mit Backups zusammenpasst.
  - Equipment ergänzt um `smith` (Multipresse) und `trapBar`; Muskel „middle back“ heißt `upperBack` („Oberer Rücken“).
- Offene Punkte:
  - **Bei jeder Änderung an `src/data/*.json` `SEED_VERSION` in `src/db/seed.ts` erhöhen**, sonst bekommen bestehende Geräte die Änderung nicht.
  - Ein builtin-Eintrag, der aus dem Seed entfernt und später wieder aufgenommen wird, bleibt ausgeblendet (`deletedAt` wird beim Update nicht zurückgesetzt). Für Schritt 3: „Ausblenden“ besser als eigenes Feld (z. B. `hiddenAt`) statt `deletedAt`, damit Seed-Entfernung und Nutzer-Ausblenden unterscheidbar sind.
  - Übungsanleitungen (englisch in free-exercise-db) wurden nicht übernommen; bei Bedarf in Schritt 3 übersetzen.
  - Namen/Portionen der Lebensmittel stichprobenartig im Browser prüfen (`/#/daily/foods`); Korrekturen in `scripts/data/foods.mapping.mjs`, dann `npm run data` + `SEED_VERSION` erhöhen.

### Schritt 2b – *optional:* früher Testpush & Handytest
**Ziel:** Früh prüfen, ob Installation, Offline-Start und Speicher auf echten Geräten (v. a. iPhone/Safari) funktionieren, bevor viele Features darauf aufbauen. Kann übersprungen werden.
- Entspricht dem Inhalt von Schritt 20 (Repo, GitHub Action, Pages), nur früher ausgeführt
- Danach wieder lokal weiterarbeiten; spätere Pushes erst in Schritt 20
- Ergebnisse der Handytests hier notieren (Probleme → als offene Punkte in betroffene Schritte eintragen)

**Notizen:**
- Gebaut / übersprungen:
  - Öffentliches Repo https://github.com/niklasbesarab/fitnesstracker (Remote `origin`, Branch `main`), App unter https://niklasbesarab.github.io/fitnesstracker/.
  - `.github/workflows/deploy.yml`: bei Push auf `main` (oder manuell) `npm ci` → lint → typecheck → Unit-Tests → Build mit `BASE_PATH=/<repo-name>/` (aus dem Repo-Namen) → Deploy per `actions/deploy-pages`. Pages-Source in den Repo-Einstellungen: „GitHub Actions“. E2E läuft nicht in der Action (nur lokal).
  - README: Installationsanleitung Android/iPhone, Backup-Hinweis, Abschnitt Veröffentlichung.
- Abweichungen:
  - Commit-E-Mail für dieses Repo (lokale git-Config) ist die GitHub-noreply-Adresse; alle bisherigen Commits wurden vor dem ersten Push darauf umgeschrieben (lokale Sicherung `backup-before-email-rewrite`, nicht gepusht).
  - `gh` CLI ist nicht installiert; Repo wurde im Browser angelegt. Push ging erst mit `$env:GIT_TERMINAL_PROMPT='1'; $env:GCM_INTERACTIVE='always'` (Git Credential Manager), Anmeldung ist jetzt gespeichert.
  - Projekt liegt inzwischen auf Laufwerk **E:** → `safe.directory E:/Claude/Fitnesstraker` ergänzt.
- Ergebnis Android: nicht getestet (in Schritt 20 nachholen).
- Ergebnis iPhone: Installation über Safari → Home-Bildschirm, Offline-Start im Flugmodus, Suche, Einstellungen, Backup-Export/-Import ok, Speicher „dauerhaft“. Keine Probleme gefunden.
- Offene Punkte:
  - Ab jetzt wieder nur lokale Commits. Ein späterer Push auf `main` aktualisiert die App auf dem Handy automatisch (Update-Hinweis) – nur bewusst pushen, z. B. für weitere Handytests.

---

## Phase 1 – MVP 1: Krafttraining mit Graphen

### Schritt 3 – Übungsverwaltung
- Übungsliste mit Suche und Filter (Muskelgruppe, Equipment, Kategorie), Detailseite
- Eigene Übungen anlegen/bearbeiten, builtin-Übungen ausblenden statt löschen, Favoriten
- Wiederverwendbare Komponente `ExercisePicker` (für Schritt 4 und 6)

**Fertig wenn:** Eigene Übung anlegen → in `ExercisePicker` auswählbar. E2E-Test.

**Notizen:**
- Gebaut:
  - Dexie v3: Übungen haben die Nutzerfelder `isFavorite`, `hiddenAt` (Ausblenden, getrennt von `deletedAt`) und `notes` (Upgrade setzt Standardwerte). Der Seed (`EXERCISE_USER_DEFAULTS`) fasst diese Felder nie an. Backup-Schema mit Defaults, daher bleiben Sicherungen aus v1/v2 importierbar.
  - `src/db/exercises.ts`: `createUserExercise`/`updateUserExercise` (Zod `exerciseInputSchema` + Duplikat-Check auf den Namen, auch gegen mitgelieferte Übungen), `deleteUserExercise` (Soft-Delete, nur eigene), `setExerciseFavorite`, `setExerciseHidden`, `setExerciseNotes`.
  - `src/domain/exercises.ts`: `matchesExerciseFilter` (Muskelfilter trifft Haupt- und Hilfsmuskeln), `sortExercises` (Favoriten zuerst, deutsche Sortierung), `findDuplicateName`, `ExerciseBrowserState`.
  - UI in `src/features/training/`: `ExerciseBrowser` (Suche, Chips „Favoriten“/„Eigene“, ausklappbare Filter für Muskelgruppe, Equipment, Kategorie und optional ausgeblendete Übungen), `ExerciseListPage` (Stern pro Zeile; Suche und Filter bleiben beim Wechsel zur Detailseite erhalten), `ExerciseDetailPage` (Details, eigene Notiz, Favorit; builtin: aus- und einblenden; eigene: bearbeiten und löschen mit Bestätigung), `ExerciseEditPage` (anlegen/bearbeiten), `ExerciseForm` (Name, Kategorie, Equipment, einseitig, Haupt-/Hilfsmuskeln als Chips, weitere Namen), `useActiveExercises`/`useExercise`.
  - **`ExercisePicker`** (`src/features/training/ExercisePicker.tsx`): Vollbild-Dialog mit `onSelect(exercise)`/`onClose`, ohne ausgeblendete Übungen, Favoriten oben, Escape schließt. „+ Eigene Übung anlegen“ übernimmt den Suchbegriff als Namen, legt die Übung an und wählt sie direkt aus.
  - Gemeinsame UI: `Chip`, `Select`, `buttons.ts` (Button- und Eingabe-Klassen), `StarIcon`.
  - Routen: `/training/exercises`, `/training/exercises/new`, `/training/exercises/:id`, `/training/exercises/:id/edit`.
  - Tests: Domain-Filter und Sortierung, DB-Funktionen, Migration v2→v3, Seed (Nutzerfelder bleiben, wieder aufgenommene Einträge kommen zurück), Backup aus v2, `ExercisePicker` (RTL: Auswahl, Filter, eigene Übung anlegen und danach auswählen, Duplikat, Escape). E2E `e2e/exercises.spec.ts`: offline anlegen, bearbeiten, Notiz, Favorit, Filter „Eigene“, builtin aus- und einblenden, Neuladen, Löschen.
- Abweichungen:
  - Der `ExercisePicker` ist per Komponententest (Vitest/RTL) abgedeckt, nicht per Playwright, weil es noch keine Seite gibt, die ihn verwendet (erst Schritt 4). Den E2E-Test für den Picker in Schritt 4 im Workout-Ablauf ergänzen.
  - Seed holt builtin-Einträge, die aus den Daten entfernt und später wieder aufgenommen wurden, jetzt zurück (`deletedAt` → `null`). Nutzer blenden über `hiddenAt` aus, `deletedAt` an builtin-Einträgen setzt nur noch der Seed. Damit ist der offene Punkt aus Schritt 2 erledigt.
  - Mitgelieferte Übungen sind nicht bearbeitbar, aber jede Übung (auch builtin) kann eine eigene Notiz haben (z. B. Sitzeinstellung).
  - Für Kraftübungen ist mindestens eine Hauptmuskelgruppe Pflicht (für die Muskelgruppen-Statistik in Schritt 7).
  - Übungsanleitungen wurden nicht übersetzt/übernommen (nicht nötig für die Verwaltung).
  - Prettier hat `endOfLine: "auto"` bekommen: Mit `core.autocrlf=true` liegen die Dateien im Arbeitsverzeichnis mit CRLF vor, `prettier --check` schlug sonst bei unveränderten Dateien fehl. Im Repo bleiben die Dateien LF.
- Offene Punkte:
  - Schritt 4/6: `ExercisePicker` wählt eine Übung pro Öffnen. Falls im Plan-Editor das Hinzufügen mehrerer Übungen auf einmal gewünscht ist, eine Mehrfachauswahl ergänzen. Bereits hinzugefügte Übungen werden noch nicht markiert.
  - Schritt 7: Auf der Detailseite Verlauf und PRs der Übung ergänzen.
  - „Mitgelieferte Übung als eigene kopieren“ (um sie anzupassen) wäre eine mögliche Erweiterung.

### Schritt 4 – Workout loggen
- Dexie-Version mit `workouts`, `workoutExercises`, `sets` (`weight`, `reps`, `rpe?`, `rir?`, `isWarmup`, `restSeconds?`, `completedAt`)
- Workout starten (leer), Übungen per `ExercisePicker` hinzufügen, Reihenfolge ändern
- Sätze erfassen mit Steppern (Gewicht ±2,5 kg, Wdh. ±1), Satz abhaken, Aufwärmsatz markieren, optional RPE/RIR
- Körpergewichtsübungen (`equipment: 'bodyweight'`, z. B. Klimmzüge, Dips): Gewichtsfeld als „Zusatzgewicht“ beschriften (Standard 0 kg, negativ = Unterstützung durch Band/Maschine); Halteübungen (Plank, L-Sitz, Handstand) brauchen eine Dauer statt Wiederholungen
- „Letztes Mal“-Anzeige pro Übung
- Rest-Timer nach abgehaktem Satz (Standardzeit einstellbar, Vibration/Ton, läuft über Zeitstempel weiter, auch wenn App kurz im Hintergrund war)
- Laufendes Workout wird sofort gespeichert und nach App-Neustart fortgesetzt
- Workout beenden: Dauer, Notiz; Historie (Liste + Detail, nachträglich bearbeiten/löschen)

**Fertig wenn:** E2E: im Offline-Modus komplettes Workout loggen, App neu laden, Workout ist in Historie.

**Notizen:**
- Gebaut:
  - Dexie v4: Tabellen `workouts` (`startedAt`, `endedAt` = `null` solange es läuft, `notes`, `restEndsAt`), `workoutExercises` (`workoutId`, `exerciseId`, `order`), `sets` (`workoutId`, `workoutExerciseId`, `order`, `weight` in kg, `reps`, `durationSeconds`, `rpe`, `rir`, `isWarmup`, `restSeconds`, `completedAt`). Einstellungen `restTimerSeconds` (Standard 180), `restTimerSound`, `restTimerVibrate`. Backup-Schema mit Defaults → Sicherungen aus v1–v3 bleiben importierbar.
  - Neues Übungsfeld **`isTimed`** (Dauer statt Wiederholungen): in den Daten per Option `t` (Plank, Seitstütz, L-Sitz, Hollow Hold, Handstand, Front Lever, Dead Hang, Farmer’s Walk, Stomach Vacuum) sowie automatisch für alle Ausdauer- und Beweglichkeitsübungen. Seed-Version 3. Im Formular für eigene Übungen umschaltbar („Erfassung“), auf der Detailseite angezeigt.
  - `src/db/workouts.ts`: `startWorkout` (gibt ein laufendes zurück, höchstens eins), `addWorkoutExercise` (legt direkt einen ersten Satz an), `moveWorkoutExercise`, `removeWorkoutExercise`, `addSet` (vorbefüllt), `updateSet` (Zod `setValuesSchema`), `completeSet`/`uncompleteSet`, `deleteSet`, `adjustRest`/`setRestEndsAt`, `finishWorkout`, `deleteWorkout` (auch zum Verwerfen), `updateWorkoutInfo`, `getLastPerformance`, `loadWorkoutDetail`, `listWorkoutHistory`. Alles mit Soft-Delete (kaskadierend).
  - `src/domain/workout.ts`: `suggestSetValues` (voriger Satz → passender Arbeitssatz vom letzten Mal → leer bzw. 0 kg Zusatzgewicht), `formatSetSummary`, `formatWeight`, `formatClock`, `formatWorkoutDuration`, `restRemainingSeconds`, `workoutDurationSeconds`, `moveItem` sowie Datums-/Uhrzeit-Helfer.
  - UI in `src/features/training/`: `WorkoutPage` (`/training/workout`, laufendes Workout, Beenden mit Notiz oder Verwerfen), `WorkoutEditor` + `WorkoutExerciseCard` (für live und nachträgliches Bearbeiten; Sätze als Zeilen mit Haken, ein Satz aufgeklappt mit Steppern: Gewicht ±2,5 kg/±5 lb bzw. „Zusatzgewicht“ mit negativen Werten, Wdh. ±1 bzw. Dauer ±5 s, Aufwärmsatz, RPE/RIR, Löschen; „Letztes Mal“ pro Übung), `RestTimerBar` (über der Bottom-Navigation, −15/+15/Überspringen), `RestTimerAlarm` (im Layout, Ton per Web Audio + Vibration, auch auf anderen Seiten), `ActiveWorkoutBanner` (alle Seiten außer Workout: „Workout läuft · Dauer · Pause – fortsetzen“), `WorkoutHistoryPage`/`WorkoutDetailPage`/`WorkoutEditPage` (`/training/history[/:id[/edit]]`), Trainingsseite mit Start/Fortsetzen. Einstellungen: Karte „Training“ (Pausenzeit, Ton, Vibration).
  - Tests: Domain (`workout.test.ts`), DB-Funktionen (`workouts.test.ts`), Migration v3→v4, Backup mit Workouts und aus v3. E2E `e2e/workout.spec.ts` (offline: Workout mit Langhantel-, Körpergewichts- und Halteübung, Picker, Timer, Reihenfolge, Neuladen, Banner, Beenden, Historie, Nachbearbeiten, „Letztes Mal“ + Vorbefüllung, Verwerfen, Löschen) – damit ist auch der E2E-Test für den `ExercisePicker` aus Schritt 3 nachgeholt.
- Abweichungen:
  - Beim Beenden werden nicht abgehakte Sätze und Übungen ohne abgehakten Satz verworfen (Soft-Delete). Ohne abgehakten Satz kann man das Workout nur verwerfen.
  - Nachtrag nach Nutzer-Feedback:
    - **Stufe statt Gewicht** (Maschinen ohne kg-Anzeige): Bei Maschine, Kabelzug, Multipresse, Band und Sonstigem gibt es im Satz den Umschalter „Belastung: Gewicht | Stufe“. Die Wahl wird an der Übung gemerkt (`Exercise.loadType`, Nutzerfeld, Seed fasst es nicht an), Sätze speichern `level` (dann `weight = null`). Dexie v5 + Backup-Defaults. Anzeige „Stufe 7 × 10“.
    - Standard-Pausenzeit **3 min** (180 s).
    - Reihenfolge per **Ziehen**: „⠿ Reihenfolge ändern“ zeigt die Übungsblöcke als kompakte Liste, die man am Griff ⠿ verschiebt (Pfeiltasten am Griff gehen auch). Die ↑/↓-Buttons an den Karten sind entfallen.
  - Dauer eines Workouts = `endedAt − startedAt`; nachträglich über Datum, Beginn und Dauer (Minuten) änderbar. Alle Änderungen beim Bearbeiten werden sofort gespeichert („Fertig“ führt nur zurück).
  - Neue Sätze in einem bereits beendeten Workout gelten direkt als abgehakt (`completedAt = endedAt`).
  - `restSeconds` am Satz = Pausenzeit, mit der der Timer nach diesem Satz gestartet wurde (nicht die tatsächlich gemachte Pause). Der Timer selbst steht als `restEndsAt` am Workout.
  - Seitstütz ist jetzt auch `isUnilateral` (pro Seite).
  - Halteübungen haben weiterhin ein (optionales) Gewichtsfeld, z. B. für Plank mit Scheibe.
- Offene Punkte:
  - Ton/Vibration nur bei geöffneter App; auf dem iPhone gibt es keine Vibration, und der Ton funktioniert erst nach einer Nutzeraktion (wird beim Abhaken „freigeschaltet“). Auf echten Geräten prüfen.
  - Pausenzeit ist global; Schritt 6 kann pro Plan-Übung eine eigene Pausenzeit mitgeben (`completeSet(id, restSeconds)` nimmt sie schon entgegen).
  - Schritt 5: PR-Toast beim Abhaken in `WorkoutExerciseCard` (`onComplete`) einhängen; Volumen/1RM für Körpergewichtsübungen mit Körpergewicht + Zusatzgewicht rechnen (Halteübungen gesondert, Dauer).
  - Ausdauerübungen im Krafttraining erfassen nur Dauer (+ optional Gewicht); Distanz folgt mit Schritt 13.
  - Hauptbundle liegt knapp über 500 kB (Vite-Warnung). Bei Bedarf Routen per `React.lazy` aufteilen (z. B. in Schritt 7 wegen Recharts).
  - Stufen-Sätze haben kein Gewicht in kg → in Schritt 5/7 Volumen/1RM/PRs für Stufen getrennt behandeln (z. B. PR „höchste Stufe“, Verlauf in Stufen), nicht mit kg mischen.

### Schritt 5 – Berechnungen & PRs
- `src/domain/strength.ts`: Volumen (ohne Aufwärmsätze), geschätztes 1RM (Epley, Brzycki), beste Sätze
- Körpergewichtsübungen: Volumen und 1RM mit Körpergewicht (Einstellungen) + Zusatzgewicht rechnen; PR „max. Zusatzgewicht“
- PR-Erkennung: max. Gewicht, max. 1RM, max. Volumen (Satz/Einheit), max. Wdh. bei Gewicht
- PR-Toast beim Abhaken eines Satzes, PR-Markierung in der Historie
- Progressive-Overload-Vorschlag: z. B. Zielwdh. erreicht → +2,5 kg, sonst gleiches Gewicht / +1 Wdh.
- Ausführliche Unit-Tests

**Fertig wenn:** Alle Formeln getestet, PR-Toast im E2E sichtbar.

**Notizen:**
- Gebaut:
  - `src/domain/strength.ts`: 1RM nach Epley (Standard) und Brzycki (`estimateOneRepMax`, nur 1–12 Wdh.), `effectiveLoadKg` (Gewicht bzw. Körpergewicht + Zusatzgewicht, Stufen → `null`), `setVolumeKg`/`sessionVolumeKg` (ohne Aufwärmsätze, Halteübungen und Stufen), `setOneRepMax`, `bestSet`, PR-Erkennung `detectRecords` (beim Abhaken) und `sessionRecords`/`annotateSessions` (Historie), `formatRecord`, Overload-Vorschlag `suggestProgression`.
  - Rekordarten: Gewicht (bei Körpergewicht „Zusatzgewicht“, nur > 0), geschätztes 1RM, Volumen (Satz), Volumen (Einheit), Wdh. bei gleichem oder höherem Gewicht, Dauer bei gleicher oder höherer Last (Halteübungen), Stufe und Wdh. bei Stufe (getrennt von kg), Exzentrik-Gewicht/-Stufe.
  - `src/db/records.ts`: `loadExerciseSessions` (abgehakte Sätze je Workout, chronologisch, auch das laufende), `getSetRecords` (Toast), `getWorkoutRecords` (Satz-ID → Rekorde), `countWorkoutRecords` (Historie). Hooks `useWorkoutRecords`, `useWorkoutRecordCounts`.
  - UI: **PR-Toast** beim Abhaken (`ToastHost` im Layout, `showToast` aus `src/components/toastStore.ts`, 5 s bzw. Antippen schließt), Pokal an Rekord-Sätzen im laufenden Workout, auf der Detailseite (plus Liste „Rekorde“ je Übung) und „🏆 n Rekorde“ in der Verlaufsliste. **Vorschlag** unter „Letztes Mal“ (z. B. „60 kg × 11 (+1 Wdh.)“) mit „Übernehmen“ → `applyToOpenSets` (offene Arbeitssätze).
  - **Zusatz Exzentrik** (aus dem Ideen-Parkplatz): Dexie v6, Sätze haben `eccentricWeight` (kg) bzw. `eccentricLevel` (bei Stufe); Backup-Defaults. Chip „Exzentrik“ im Satz-Editor (nicht bei Halte- und Körpergewichtsübungen) mit Stepper „Negativ-Gewicht“/„Negativ-Stufe“; Ausschalten löscht den Wert. Wird wie das Gewicht in neue Sätze übernommen (damit pro Übung „gemerkt“), Wechsel Gewicht/Stufe leert die jeweils andere Exzentrik. Anzeige „80 kg (neg. 100 kg) × 8“. Volumen/1RM rechnen mit dem positiven Gewicht, Exzentrik nur als eigener Rekord.
  - Tests: `strength.test.ts` (Formeln, Volumen, alle Rekordarten, Markierung, Vorschlag), `records.test.ts`, Exzentrik/`applyToOpenSets` in `workouts.test.ts`, Migration v5→v6, Backup aus v4. E2E `e2e/records.spec.ts` (offline: Vorschlag übernehmen, PR-Toast, Exzentrik, Rekorde in Detail und Verlauf). E2E-Helfer `addExercise`, `fillStepper`, `skipRest` liegen jetzt in `e2e/helpers.ts`.
- Abweichungen:
  - **Kein Rekord beim ersten Training** einer Übung (bzw. ohne früheren vergleichbaren Wert), sonst gäbe es bei jeder neuen Übung einen Toast. Ein Wdh.-Rekord braucht einen früheren Satz mit mindestens gleichem Gewicht (schwerer als je zuvor = Gewichtsrekord).
  - Toast: Vergleich mit früheren Einheiten **und** den vorher abgehakten Sätzen der laufenden Einheit (Satz 3 schwerer als Satz 2 → erneut Toast). In der Historie wird je Rekordart nur der beste Satz markiert; „Volumen (Einheit)“ hängt am Satz, mit dem der alte Bestwert überschritten wurde.
  - Körpergewichtsübungen rechnen mit **100 % des aktuellen Körpergewichts** aus den Einstellungen (auch für alte Workouts). Ohne Körpergewicht in den Einstellungen gibt es dort nur Wdh.-/Zusatzgewicht-Rekorde.
  - Overload ohne Plan mit Zielbereich **8–12 Wdh.** (`DEFAULT_REP_RANGE`): alle Sätze mit der höchsten Last ≥ 12 → +2,5 kg (lb: +5 lb, Stufe +1) und 8 Wdh., sonst gleiche Last und +1 Wdh. vom schwächsten Satz; Halteübungen +5 s. Der Vorschlag wird nur angezeigt/übernommen, die Vorbefüllung neuer Sätze bleibt „wie letztes Mal“.
  - Rekorde werden bei jeder Anzeige aus allen Sätzen berechnet (nicht gespeichert). Für lokale Datenmengen schnell genug; bei Bedarf später zwischenspeichern.
- Offene Punkte:
  - Schritt 6: `suggestProgression(..., { range })` mit dem Zielbereich der Plan-Übung aufrufen und beim Start aus dem Plan direkt vorbefüllen.
  - Schritt 7: Rekordliste und Verläufe (1RM, Volumen, Exzentrik) pro Übung auf der Detailseite; `annotateSessions`/`loadExerciseSessions` wiederverwenden.
  - Schritt 9: Körpergewicht zum Datum des Workouts verwenden (sobald es einen Gewichtsverlauf gibt) statt des aktuellen Werts. Ggf. Anteil des Körpergewichts je Übung (Liegestütze ≈ 65 %).
  - PR-Toast auf echten Geräten ansehen (oben eingeblendet, verdeckt kurz die Kopfzeile).

### Schritt 6 – Trainingspläne
- Dexie-Version mit `plans`, `planDays`, `planExercises` (Zielsätze, Zielwdh.-Bereich, Pausenzeit)
- Plan anlegen/bearbeiten, Tage mit Wochentagen verknüpfen, Plan duplizieren, aktiven Plan wählen
- Mitgelieferte Vorlagen: Push/Pull/Legs, 5x5, Ganzkörper 3x/Woche, Oberkörper/Unterkörper
- Workout aus Plan-Tag starten → Übungen und Sätze vorbefüllt (mit Overload-Vorschlag aus Schritt 5)
- *Nutzerwunsch:* Trainings als „Training 1, 2, 3 …“ anlegen und beim Start einfach auswählen (Übungen schon drin, kein Suchen). Neben Wochentagen auch eine **Rotation** unterstützen.
- *Nutzerwunsch:* **Vorschlag fürs heutige Training** (letztes Mal Training 1 → heute Training 2) mit „Bestätigen“, „anderes Training wählen“ oder „freies Training“.
- *Nutzerwunsch:* Gerät belegt → Übung im laufenden Workout **ersetzen** (z. B. Alternative mit gleicher Muskelgruppe vorschlagen) oder überspringen; Reihenfolge ändern gibt es schon (Ziehen, Schritt 4).
- Pausenzeit pro Plan-Übung (überschreibt den Standard von 3 min)

**Fertig wenn:** E2E: Plan aus Vorlage → Workout starten → Sätze vorbefüllt.

**Notizen:**
- Gebaut:
  - Dexie v7: Tabellen `plans` (`name`, `schedule: 'rotation' | 'weekdays'`), `planDays` (`name`, `order`, `weekdays` wie `Date.getDay()`), `planExercises` (`targetSets`, `repMin`, `repMax`, `targetDurationSeconds`, `restSeconds`). `Settings.activePlanId`, `Workout.planId`/`planDayId`, `WorkoutExercise.repMin`/`repMax`/`targetDurationSeconds`/`restSeconds`. Backup-Defaults, Sicherungen aus v1–v6 bleiben importierbar.
  - `src/db/plans.ts`: Pläne/Trainings/Plan-Übungen anlegen, ändern, sortieren, löschen (Soft-Delete kaskadiert), `duplicatePlan`, `createPlanFromTemplate`, `setActivePlan`, `loadActivePlanSuggestion`, `startPlanWorkout`. `src/db/workouts.ts`: `addPlannedSets`, `replaceWorkoutExercise`, `skipWorkoutExercise`.
  - `src/domain/plans.ts`: `suggestPlanDay`, Formatierung (Ziel, Wochentage). `src/domain/strength.ts`: `plannedSetValues`, `progressionWeightStepKg`. `src/domain/exercises.ts`: `suggestAlternatives`.
  - Vorlagen in `src/data/planTemplates.ts` (Push/Pull/Legs, 5×5, Ganzkörper 3×/Woche, Oberkörper/Unterkörper), Verweise auf `builtinKey` per Datentest geprüft.
  - UI in `src/features/plans/`: `PlanListPage` (`/training/plans`), `PlanDetailPage` (`/training/plans/:id`: Name, Rotation/Wochentage, aktiv wählen, Trainings sortieren, duplizieren, löschen), `PlanDayPage` (`/training/plans/:id/days/:dayId`: Name, Wochentage, Übungen mit Sätzen, Wdh.-Bereich bzw. Zieldauer, Pause), `PlanSuggestionCard` auf der Trainingsseite (Vorschlag starten, anderes Training wählen, freies Training).
  - Laufendes Workout: Titel = Name des Trainings, Zielzeile an der Karte („Ziel: 6–10 Wdh. · Pause 3:00“), Pausenzeit der Plan-Übung gilt beim Abhaken, Overload-Vorschlag nutzt den Plan-Zielbereich, „Ersetzen“ (`ExercisePicker` mit neuer Prop `suggestions`) und „Überspringen“ an jeder Übung mit offenen Sätzen.
  - `SortableList` (`src/components/`) ersetzt `ExerciseOrderList`: Griffe sind in Workout, Plan-Übungen, Trainings und Plänen direkt an der Zeile (siehe Nachtrag).
  - Tests: `src/domain/plans.test.ts`, `src/db/plans.test.ts`, `plannedSetValues`, `suggestAlternatives`, Vorlagen-Datentest, Migration v6→v7, Backup mit Plänen und aus v6. E2E `e2e/plans.spec.ts` (offline in beiden Viewports: Vorlage → Vorschlag → vorbefüllte Sätze, Ersetzen, Überspringen, Plan-Pause, Neuladen, Rotation, anderes und freies Training, eigener Plan bis Löschen).
- Abweichungen:
  - Vorlagen liegen nicht in der DB und laufen nicht über den Seed: Sie werden beim Auswählen als normaler, frei änderbarer Plan kopiert. Fehlt eine Übung, entfällt sie aus der Kopie.
  - Der erste angelegte Plan wird automatisch aktiv. Duplikate nicht.
  - Zielwerte und Pause werden beim Start **ins Workout kopiert**: Spätere Planänderungen berühren ein laufendes oder altes Workout nicht. Der Plan-Tag wird nur für den Vorschlag und den Titel gemerkt.
  - Vorschlag: Rotation = Training nach dem zuletzt beendeten dieses Plans; freie und verworfene Workouts zählen nicht. Wochenplan = heute geplantes, heute noch nicht absolviertes Training, sonst das nächste in der Reihenfolge (Nachholen). Wochenplan ohne gesetzte Wochentage verhält sich wie Rotation. Trainings ohne Übungen werden nicht vorgeschlagen, sind aber über „Anderes Training wählen“ startbar.
  - Vorbefüllung beim ersten Mal: Wdh. = Untergrenze des Zielbereichs, Gewicht leer. **Zusatz:** `completeSet` überträgt die Last des abgehakten Satzes in leere Folgesätze, sonst müsste man sie beim ersten Training in jedem Satz eintragen.
  - Ersetzen ändert nur das Workout, nicht den Plan. Offene Sätze wandern zur neuen Übung (Anzahl und Ziele bleiben), abgehakte bleiben bei der alten; die neue steht dann direkt dahinter. Aufwärmsätze zählen dabei nicht mit.
  - Überspringen hat keine Rückfrage, weil nur offene Sätze entfallen; ohne abgehakten Satz verschwindet die Übung aus dem Workout.
  - Alternativen: gleiche Kategorie und mindestens ein gemeinsamer Hauptmuskel; exakt gleiche Hauptmuskeln zuerst, bei Gleichstand Favoriten und anderes Equipment. Übungen, die schon im Workout sind, werden nicht vorgeschlagen.
  - Nachtrag nach Nutzer-Feedback:
    - **Ziehen direkt:** Der Modus „Reihenfolge ändern“ ist entfallen. Griff ⠿ an jeder Zeile (ab zwei Einträgen). Im Workout klappen beim Ziehen alle Karten auf ihre Kopfzeile zusammen, damit man nicht über lange Karten ziehen muss; beim Ablegen kommen sie unverändert zurück. Die Zeile bewegt sich um die Strecke des Fingers, damit sie beim Zusammenklappen nicht springt. Pfeiltasten am Griff funktionieren weiter.
    - **Pläne sortierbar:** Dexie v8, `Plan.order` (bestehende Pläne behalten die Anlagereihenfolge), `reorderPlans`, Backup-Default 0 (bei Gleichstand zählt `createdAt`).
    - **Bestätigung vor jedem Start** (`ConfirmDialog`): Plan-Training, anderes Training, freies Training und „Workout starten“. Beim Plan-Training zeigt die Rückfrage die Übungen.
    - **„Neuer Plan“** führt auf die eigene Seite `/training/plans/new` (`PlanNewPage`) mit „Leerer Plan“ und den Vorlagen als klar erkennbaren Buttons. Die Planliste zeigt nur noch eigene Pläne und „+ Neuer Plan“, die Vorlagen stehen immer hinter diesem Button – auch wenn schon Pläne existieren.
    - **Löschen in der Liste:** ✕ mit Rückfrage an jedem Training (Plan-Seite) und jedem Plan (Planliste); `LinkRow` hat dafür die Prop `action`. Bisherige Workouts bleiben erhalten.
    - **Neue Vorlagen:** Arnold-Split, Calisthenics (A/B) und Bauchworkout. Alle drei laufen als Rotation; das Bauchworkout hat nur ein Training. Es gibt nur einen aktiven Plan, das Bauchworkout lässt sich also nicht parallel zu einem Hauptplan vorschlagen.
- Offene Punkte:
  - Mehrfachauswahl im `ExercisePicker` (Hinweis aus Schritt 3) wurde nicht ergänzt: Jede Übung wird einzeln hinzugefügt, danach ist ihr Ziel direkt aufgeklappt.
  - Aufwärmsätze sind nicht planbar.
  - Ziehen ist per Maus in beiden Viewports getestet (Playwright), nicht per echtem Touch: auf dem Handy prüfen. Kein automatisches Scrollen am Bildschirmrand; bei sehr langen Listen ergänzen.
  - Der Vorschlag wird nur auf der Trainingsseite angezeigt. Schritt 8: `loadActivePlanSuggestion()`/`useActivePlanSuggestion()` für das Dashboard wiederverwenden.
  - Verlauf und Detailseite zeigen den Trainingsnamen noch nicht (`WorkoutDetail.planDayName` gibt es schon, `WorkoutSummary` noch nicht).
  - Trainingsblöcke (Schritt 18) können auf `plans` aufsetzen.

### Schritt 6b – Offene Punkte aus Schritt 6 & Handytest
**Ziel:** Alles Offene aus Schritt 6 erledigen und den Stand auf dem echten Handy prüfen. Danach folgt Schritt 7.

Umsetzen:
- **Verlauf:** ✕ mit Rückfrage an jedem Workout direkt in der Liste (`WorkoutHistoryPage`), wie bei Trainings und Plänen (`LinkRow` Prop `action`, `DeleteRowButton`, `ConfirmDialog`; `DeleteRowButton` dafür nach `src/components/` verschieben). Falls der Nutzer beim Start sagt, dass das nicht gemeint war, weglassen.
- **Trainingsname im Verlauf:** `planDayName` auch in `WorkoutSummary`, in Verlaufsliste und Detailseite anzeigen.
- **Mehrfachauswahl im `ExercisePicker`** für den Plan-Editor: mehrere Übungen auswählen und zusammen hinzufügen; bereits enthaltene Übungen markieren.
- **Aufwärmsätze planbar:** optionale Anzahl je Plan-Übung (neue Dexie-Version + Backup-Default), `addPlannedSets` legt sie vor den Arbeitssätzen an.
- **Automatisches Scrollen** in `SortableList`, wenn beim Ziehen der Bildschirmrand erreicht wird.

Danach veröffentlichen und testen:
- **Push:** Der Nutzer hat diesen Schritt ausdrücklich so gewünscht: Wer „Schritt 6b starten“ schreibt, gibt den Push auf `main` frei (Ausnahme von „Kein Push“, siehe Hinweise in `CLAUDE.md`). Erst pushen, wenn die Definition of Done erfüllt ist. Danach prüfen, dass die GitHub Action durchgelaufen ist, und dem Nutzer sagen, wann die Version online ist.
- **Handytest durch den Nutzer:** App öffnen, „Neue Version verfügbar“ → „Neu laden“. Prüfen: Greift der Griff ⠿ beim **Ziehen mit dem Finger** sauber, ohne dass die Seite mitscrollt (Workout, Trainings, Pläne)? Fühlt sich das Zusammenklappen im Workout gut an? Sind Bestätigung, Vorlagen und ✕ gut bedienbar? Bleiben vorhandene Daten erhalten, läuft alles im Flugmodus? Android wurde in 2b nicht getestet, falls ein Gerät da ist nachholen.
- Gefundene Probleme beheben und erneut pushen.

Hinweise:
- Dev-Server-Falle: Läuft beim Start ein `npm run preview` des Nutzers auf Port 4173, nicht beenden, sondern fragen (siehe `CLAUDE.md`, Build und E2E kollidieren sonst damit).
- WLAN-Test per `--host` ist keine Alternative: Über `http` funktionieren Service Worker und `crypto.randomUUID()` nicht.

**Fertig wenn:** Punkte umgesetzt, Definition of Done erfüllt, gepusht, Nutzer bestätigt den Handytest.

**Notizen:**
- Gebaut:
  - **Verlauf:** ✕ mit Rückfrage an jedem Workout in der Liste, `DeleteRowButton` liegt jetzt in `src/components/`. `WorkoutSummary.planDayName` wird in Verlaufsliste und Detailseite angezeigt.
  - **Mehrfachauswahl:** `ExercisePicker` mit `onSelectMany` (statt `onSelect`): Antippen wählt aus, die Nummer zeigt die spätere Reihenfolge, die Auswahl bleibt über Suchen und Filter erhalten, unten „n Übungen hinzufügen“. `addedIds` markiert enthaltene Übungen mit „Im Training“. `addPlanExercises` legt alle in einer Transaktion an. Nur der Plan-Editor nutzt das; Workout und Ersetzen wählen weiter einzeln.
  - **Aufwärmsätze planbar:** Dexie v9, `PlanExercise.warmupSets` (0–10, Standard 0, Backup-Default), Stepper im Plan-Editor, `plannedWarmupValues` in `src/domain/strength.ts`, `addPlannedSets(item, count, warmupCount)`. Vorlagen haben keine Aufwärmsätze.
  - **Automatisches Scrollen:** `SortableList` scrollt bildweise, solange der Finger in der Randzone steht (`dragScrollDelta` in `src/domain/dragScroll.ts`: 72 px, bis 14 px pro Bild). Die Unterkante bestimmen feste Leisten mit `data-bottom-bar` (Navigation, Pausenleiste).
  - Tests: `dragScroll.test.ts`, `plannedWarmupValues`, Plan- und Verlaufs-Tests, `ExercisePicker` (Mehrfachauswahl), Migration v8→v9, Backup aus v8. E2E in `e2e/plans.spec.ts`: Mehrfachauswahl → Aufwärmsätze → Trainingsname → ✕ sowie Ziehen mit Auto-Scroll per **echten Touch-Ereignissen** (Chrome DevTools Protocol), beide offline in beiden Viewports.
- Abweichungen:
  - **Zusätzlich behoben:** Beim Ziehen nach unten verschob React die gezogene Zeile im DOM. Dabei ging die Pointer-Capture verloren, Ereignisse kamen nur noch an, solange der Griff unter dem Zeiger lag. `SortableList` hält die DOM-Reihenfolge deshalb während des Ziehens fest und sortiert sichtbar per CSS `order`. Folge für Tests: `first()`/`last()` zeigen während des Ziehens die alte Reihenfolge, nach dem Ablegen die neue.
  - Beim Ersetzen wandern offene Aufwärmsätze jetzt mit zur neuen Übung (in Schritt 6 entfielen sie). Sonst gingen geplante Aufwärmsätze beim Tausch verloren.
  - Aufwärmsätze nehmen die Werte vom letzten Mal, bekommen aber keinen Overload-Vorschlag. Beim ersten Mal: Wdh. wie Untergrenze des Zielbereichs, Last leer. Die Last der Arbeitssätze wandert nicht in sie hinein.
  - Bereits enthaltene Übungen bleiben wählbar (nur markiert), weil dieselbe Übung bewusst zweimal im Training stehen darf.
  - Scrollen startet erst nach 8 px Bewegung, sonst liefe die Seite los, sobald man einen Griff am Rand nur antippt.
  - Der Trainingsname wird live aus `planDays` gelesen: Umbenennen ändert ihn auch in alten Workouts, gelöschte Trainings behalten ihren letzten Namen.
- Ergebnis Handytest: vom Nutzer bestätigt, alles in Ordnung, keine Probleme gemeldet. Gerät nicht genannt; ob Android dabei war, ist offen (sonst in Schritt 20 nachholen).
- Offene Punkte:
  - Nach einem Aufwärmsatz startet die volle Pausenzeit der Übung; eine kürzere Aufwärmpause wäre eine mögliche Erweiterung (Rückmeldung aus dem Handytest abwarten).
  - Mehrfachauswahl gibt es nicht im laufenden Workout. Bei Bedarf dort `onSelectMany` anschließen.

### Schritt 7 – Statistiken & Graphen (Kraft)
- Pro Übung: Verlauf max. Gewicht, geschätztes 1RM, Volumen (Recharts), PR-Liste
- Trainingsfrequenz-Heatmap (Jahresansicht wie GitHub)
- Muskelgruppen-Verteilung: Sätze pro Muskelgruppe und Woche, Hinweis auf vernachlässigte Gruppen
- Zeitraumfilter (4 Wochen, 3 Monate, 1 Jahr, alles)
- *Nutzerwunsch (hier oder Schritt 16):* **Auswertung der Satzpausen**: Wie hängt die Leistung im nächsten Satz (Wdh./Gewicht) von der Pausenlänge ab? Daraus Empfehlung: Pause verlängern, wenn die Leistung stark einbricht, oder härter trainieren/kürzer pausieren, wenn kaum Unterschied – mit sinnvoller Obergrenze. Dafür die tatsächliche Pause messen (Zeit zwischen `completedAt` zweier Sätze), nicht nur die Timer-Einstellung (`restSeconds`).
- Aggregationen in `src/domain/` mit Unit-Tests
- *Nutzerwunsch (Ergänzung, gehört nicht zu den Statistiken):* **Favorit direkt in der Übungssuche:** Beim Erstellen eines Plans soll man eine Übung in der Suche (`ExercisePicker`) per Stern-Symbol als Favorit markieren können, ohne die Auswahl zu verlassen. Vorhanden sind `setExerciseFavorite` und der Stern in `ExerciseListPage`; im Picker ist der Stern bisher nur Anzeige. Er muss als eigener Button neben der Auswahl-Schaltfläche stehen (keine Buttons ineinander), und ein Tipp darauf darf die Übung nicht auswählen.
- *Nutzerwunsch (bei der Planung ergänzt):* Filter nach **Muskelgruppe**, **Fortschritt je Muskelgruppe in %** mit Hinweis, wo der Fokus liegen sollte. **Pausen-Timer in den Einstellungen abschaltbar**, Pausen-Auswertung zusätzlich als **erweiterter Modus** einschaltbar.

**Fertig wenn:** Graphen mit Testdaten korrekt, Unit-Tests für Aggregationen.

**Notizen:**
- Gebaut:
  - Dexie v10: `Settings.restTimerEnabled` (Standard an) und `restAnalysisEnabled` (Standard aus), Backup-Defaults.
  - `src/domain/stats.ts` (Zeitraum, Verlauf je Kennzahl, Heatmap, Sätze je Muskelgruppe, Fortschritt, Fokus, Satzpausen), `src/db/stats.ts` (`loadStatsSessions`), `currentBests` in `src/domain/strength.ts`, `loadFinishedExerciseSessions` in `src/db/records.ts`. `exerciseKind` liegt jetzt in `strength.ts`.
  - UI: `StatsPage` (Zeitraum, Muskelgruppe, Fokus, Trainingstage, Sätze pro Woche, Fortschritt, Übungen, Satzpausen), `ExerciseStats` auf der Übungs-Detailseite (Verlauf, Bestwerte, letzte Rekorde, Pausen), `src/components/charts.tsx` (Recharts-Wrapper), `src/components/Heatmap.tsx` (ohne Recharts, Prop `weekCount`, wiederverwendbar für Schritt 8/15), Filter in der URL über `src/features/stats/statsFilter.ts`.
  - Recharts 3 liegt in einem eigenen Chunk: `StatsPage` und `ExerciseStats` werden per `React.lazy` geladen und sind precacht.
  - `FavoriteButton` als eigener Button in Übungsliste und `ExercisePicker` (Einfach- und Mehrfachauswahl, auch Vorschläge).
  - Einstellungen: Schalter „Pausen-Timer“ (`setRestTimerEnabled` beendet auch eine laufende Pause), „Erweitert: Pausen-Auswertung“.
  - Tests: `stats.test.ts` (Domain und DB), `currentBests`, Timer-Schalter, Migration v9→v10, Backup aus v9, Picker-Stern. E2E `e2e/stats.spec.ts` offline in beiden Viewports, Testdaten über den normalen Backup-Import.
- Abweichungen:
  - Fortschritt: Bestwert der ersten gegen den der letzten zwei Einheiten im Zeitraum (mind. 4 Einheiten), je Gruppe Median der Übungen mit diesem Hauptmuskel. Kennzahl: 1RM, sonst Stufe mit Wdh., bei Körpergewicht ohne 1RM die Wdh., bei Halteübungen die Dauer. Prozentwerte verschiedener Kennzahlen werden im Median zusammengeführt, kg und Stufen aber nie miteinander verrechnet.
  - Hinweis auf vernachlässigte Gruppen steht in der Karte „Fokus“ (höchstens 3) plus orange Balken, nicht als zweiter Text. „Große Gruppen“ = `MAJOR_MUSCLES`, Waden und Unterarme zählen nicht dazu. Vernachlässigt erst ab 2 Wochen seit dem ersten Training.
  - Bestwerte und Heatmap ignorieren den Zeitraum. Die Heatmap folgt aber dem Muskelfilter. Hat eine Übung den Muskel nur als Hilfsmuskel, zählen ihre Sätze dort voll, in „Sätze pro Woche“ halb.
  - Pausen werden nur je Übung ausgewertet, weil eine Mischung über Übungen verzerrt. Ab 15 Satzpaaren und mindestens einer Pausenlänge mit 5 Paaren, Empfehlung höchstens 5 min.
  - Die Kennzahl auf der Übungsseite wird über Chips statt `SegmentedControl` gewählt: Bei Übungen mit kg und Stufen sind es bis zu 7 Kennzahlen.
  - Der bisherige Hinweis „0 s = kein Pausen-Timer“ entfällt, 0 s funktioniert weiterhin für die Standardzeit. Der Stern im Picker zeigt jetzt immer auch Nicht-Favoriten als leeren Stern.
- Offene Punkte:
  - Körpergewichtsübungen rechnen weiter mit dem aktuellen Körpergewicht, auch in alten Einheiten (siehe Schritt 5/9). Eine Änderung des Körpergewichts verschiebt also ganze Kurven, nicht nur neue Punkte.
  - Die Schwellen für Fokus und Pausen sind Faustwerte (`STALLED_PERCENT`, `NEGLECTED_SETS_PER_WEEK`, `HIGH_VOLUME_SETS_PER_WEEK`, Konstanten bei den Satzpausen in `stats.ts`) und sollten mit echten Daten geprüft werden.
  - Ein neuer Favorit rutscht im Picker sofort nach oben, die Zeile springt also unter dem Finger weg (wie in der Übungsliste). Auf dem Handy prüfen.
  - Tooltip der Graphen per Touch nur auf dem echten Handy prüfbar.
  - Schritt 8: `Heatmap` mit kleinerem `weekCount`, `summarizeDays` und `loadStatsSessions` für die Dashboard-Kacheln wiederverwenden.
  - Hauptbundle liegt weiter über 500 kB (Vite-Warnung), Recharts ist nicht der Grund.

### Schritt 8 – Dashboard & CSV-Export (MVP 1 fertig)
- Dashboard: heutiger/nächster Plantag (Startbutton), letztes Workout, Wochenvolumen, neueste PRs, Mini-Heatmap
- CSV-Export der Workouts/Sätze (Web Share / Download)
- Lighthouse-PWA- und Performance-Check (lokal mit `npm run preview`), Fehler beheben
- Playwright-E2E über den kompletten MVP-1-Ablauf im Android- und iPhone-Viewport, offline

**Fertig wenn:** MVP 1 lokal im Browser (Handy-Ansicht, offline) vollständig nutzbar, Lighthouse-PWA-Check bestanden.

**Notizen:**
- Gebaut:
  - **Dashboard** (`src/features/dashboard/HomePage.tsx`): „Diese Woche“ (Workouts, Sätze, Volumen), „Letztes Workout“, „Erfolge“ (höchstens 3 Zeilen, je Zeile 2 Rekorde + „(+n)“), Mini-Heatmap (14 Wochen), siehe Nachtrag. Ohne beendetes Workout nur ein Hinweis.
  - `TrainingStartCard` (`src/features/training/`) aus der Trainingsseite herausgelöst (Fortsetzen, Plan-Vorschlag oder leeres Workout). `compact` = als Widget: Start plus Link „Anderes Training“ zur Trainingsseite.
  - `ActivityCard` (`src/features/stats/`) aus `StatsPage` herausgelöst, Prop `span` (`'3m'` | `'1y'`).
  - `weekSummary`, `recentRecords` in `src/domain/stats.ts` (Kalenderwoche ab Montag; Rekorde rückwärts berechnet, damit nur die nötige Historie läuft).
  - **CSV-Export** (Einstellungen → Export): `workoutsToCsv` in `src/domain/csv.ts`, `createWorkoutsCsvFile` in `src/db/workoutExport.ts`, `ExportSection`, Teilen/Download über `shareOrDownload`.
  - **Lazy Routes:** Alle Seiten außer dem Dashboard laden per `lazyPage` in `src/App.tsx`, `Suspense` sitzt im `Layout`. Hauptbundle 585 → 257 KB, Vite-Warnung weg.
  - **Kontrast:** Weiße Schrift steht jetzt auf `emerald-700` statt `emerald-600` (Buttons, Chips, Satz-Haken, Picker), Einheit im Stepper dunkler.
  - Tests: `csv.test.ts`, `workoutExport.test.ts`, `weekSummary`/`recentRecords` in `stats.test.ts`. E2E `e2e/mvp1.spec.ts` (offline in beiden Viewports): leeres Dashboard, Plan aus Vorlage, Training vom Dashboard, Fortsetzen, Rekord, Woche, Heatmap, Statistik, CSV, Backup, DB löschen, Import.
- **Lighthouse-Ergebnis** (Lighthouse 11.7.1 im mobilen Profil, Build per gzip ausgeliefert wie auf GitHub Pages, leere Datenbank):

  | Messung | PWA | Barrierefreiheit | Best Practices | Performance | FCP | LCP | TBT |
  |---|---|---|---|---|---|---|---|
  | Dashboard, Erstbesuch | 100 | 100 | 100 | 75 | 3,1 s | 3,8 s | 340 ms |
  | Training, Erstbesuch | 100 | 100 | 100 | 86 | 3,0 s | 3,4 s | 0 ms |
  | Einstellungen, Erstbesuch | 100 | 100 | 100 | 84 | 3,2 s | 3,6 s | 80 ms |
  | Statistik, Erstbesuch | 100 | 100 | 100 | 77 | 3,6 s | 4,5 s | 10 ms |
  | Dashboard, Wiederholung (Service Worker) | 100 | 100 | 100 | 94 | 0,3 s | 0,4 s | 280 ms |

  Vorher (Dashboard, Erstbesuch über `vite preview`): Barrierefreiheit 95, Performance 76, TBT 700 ms. Der letzte Lauf war vor der Umstellung von `recentRecords`, die bei leerer Datenbank nichts ändert.
- Abweichungen:
  - Lazy Routes haben den Erstbesuch nicht schneller gemacht: FCP blieb bei rund 3 s (Performance-Wert unverändert), nur die Blockierzeit sank. Das betrifft aber nur den einmaligen Download, im Alltag kommt alles aus dem Service Worker. Daher kein weiterer Umbau.
  - Lighthouse **11** statt aktueller Version, weil die PWA-Kategorie ab Version 12 entfernt wurde. Kein Projekt-Paket, Aufruf per `npx` (siehe `CLAUDE.md`).
  - CSV: eine Datei mit einer Zeile je Satz, Semikolon, Dezimalkomma und UTF-8-BOM (für deutsches Excel). Gewichte in der eingestellten Einheit, nur beendete Workouts und abgehakte Sätze. Text, den Excel als Formel ausführen würde, bekommt ein `'` davor.
  - CSV zählt nicht als Backup: `lastBackupAt` bleibt unverändert, ein Import ist nicht vorgesehen.
  - Volumen auf dem Dashboard wie überall ohne Stufen und Halteübungen, Körpergewichtsübungen mit aktuellem Körpergewicht.
  - **Zusatz:** `useActivePlanSuggestion` rechnet beim Tageswechsel neu, weil die installierte App oft über Nacht geöffnet bleibt.
  - `App.test.tsx` lädt die Lazy-Routen vorab. Der Test schlug vorher zweimal sporadisch fehl (Ursache nicht nachgestellt, auch nicht ohne Vitest-Cache).
  - Nachtrag nach Nutzer-Feedback:
    - **Zurück zur Herkunft:** Links in einen anderen Bereich geben `state={ from }` mit (`src/components/backNavigation.ts`: `useFromHere`, `useBackTo`). Betrifft Workout-Detail, Bearbeiten (reicht die Herkunft weiter über `Page`-Prop `backState`) und laufendes Workout, jeweils vom Dashboard, vom Hinweis „Workout läuft“ und von der Heatmap (auch in der Statistik). Ohne Herkunft gilt weiter die feste übergeordnete Seite. Nach dem Beenden eines Workouts, das über den Hinweis geöffnet wurde, führt „Zurück“ deshalb zur Herkunft statt zum Verlauf; beim Start über die Trainingsseite bleibt es beim Verlauf.
    - **Widgets statt Trainingsstart:** Das Dashboard zeigt nur noch die Zusammenfassung. „Anpassen“ öffnet eine Vorschau der Widgets: am Griff ziehen (klappt dabei auf die Kopfzeile zusammen), ✕ entfernt, „Weitere Widgets“ fügt hinzu. Dexie v11, `Settings.dashboardWidgets` (geordnet, nur sichtbare), Backup-Default. Widgets: Diese Woche, Letztes Workout, Erfolge, Trainingstage, plus „Nächstes Training“ (`TrainingStartCard compact`), standardmäßig aus. „Neueste Rekorde“ heißt jetzt „Erfolge“.
    - Widgets haben nur eine Größe. iPhone-artige kleine/große Kacheln und Nebeneinander sind nicht umgesetzt, nur die Reihenfolge untereinander.
- Offene Punkte:
  - Schritt 9: Alltag als neues Widget ergänzen (`DASHBOARD_WIDGETS`, `DASHBOARD_WIDGET_LABELS`, `renderWidget` in `HomePage.tsx`). Bei bestehenden Nutzern erscheint es unter „Weitere Widgets“, nicht automatisch auf dem Dashboard.
  - Ziehen auf der Vorschau auf dem echten Handy prüfen: Die Griffe sitzen links in der Kopfzeile, Widgets können hoch sein.
  - Lighthouse wurde nach dem Nachtrag nicht erneut ausgeführt.
  - Schritt 15: `ActivityCard` und `weekSummary` um Ausdauer erweitern.
  - Dashboard-TBT von rund 300 ms beim Start bleibt (React, Dexie, Zod). Zod lässt sich nicht verzögern, weil `src/db/schemas.ts` beim Speichern gebraucht wird.
  - Teilen-Dialog für die CSV-Datei und das Öffnen in Excel nur auf echten Geräten prüfbar (E2E testet den Download-Fallback).
  - Lighthouse lief im Chromium von Playwright, nicht in Safari. Echter Handytest in Schritt 20 (oder früher per Push).

---

## Phase 2 – MVP 2: Alltag, Habits, Ernährung

### Schritt 9 – Tägliches Tracking
- `dailyLogs` (ein Eintrag pro Datum): Schritte (manuell), Wasser (ml), Schlaf (Stunden + Qualität), Gewicht, Stimmung/Energie (1–5)
- `bodyMeasurements`: Brust, Taille, Hüfte, Arme, Oberschenkel …
- Tagesseite „Alltag“ mit Schnell-Eingabe (Wasser +250 ml, Schritte), Tagesziele in Einstellungen
- Verlaufsgraphen, Dashboard-Kacheln

**Notizen:**
- Gebaut:
  - Dexie v12: Tabellen `dailyLogs` (`date`, `steps`, `waterMl`, `sleepSeconds`, `sleepQuality`, `weightKg`, `mood`, `energy`) und `bodyMeasurements` (`date`, `values`: gemessene Stellen in Metern), je ein aktiver Eintrag pro Tag. Tagesziele `Settings.stepsGoal`/`waterGoalMl`/`sleepGoalSeconds` (10.000 Schritte, 2,5 l, 8 h). Backup-Defaults, Sicherungen aus v1–v11 bleiben importierbar.
  - `src/db/daily.ts`: `updateDailyLog`, `addWater` (addiert im selben Schreibvorgang), `setCurrentBodyWeight`, `loadBodyWeights`, `setBodyMeasure`, `deleteBodyMeasurement`. `src/domain/daily.ts`: Tage (`dayKey`, `shiftDay`, `formatDayLabel`), `bodyWeightOn`, Kennzahlen (`dailyPoints`, `goalDays`, `goalPercent`), Körpermaße. `src/domain/units.ts`: `bodyLengthToDisplay` u. a.
  - UI in `src/features/daily/`: `DailyPage` (`/daily`, Tag in der URL als `?date=`, Wasser mit +250/+500 ml, Schritte, Schlaf + Qualität, Gewicht, Stimmung, Energie; alles sofort gespeichert), `DailyHistoryPage` (`/daily/history`, Zeitraum, Kennzahl, Durchschnitt, Tage mit erreichtem Ziel), `BodyMeasurementsPage` (`/daily/measurements`, Maße je Tag, Verlauf, Liste mit ✕), `TodayCard` (Dashboard-Widget „Heute“ mit Schnelleingabe +250 ml), `DayNavigator`, `RatingPicker`, `GoalBar`. Einstellungen: Karte „Tagesziele“.
  - **Offener Punkt aus Schritt 5/7 erledigt:** Körpergewichtsübungen rechnen mit dem Gewicht vom Tag des Workouts. `loadExerciseSessions`, `countWorkoutRecords` und `loadStatsSessions` geben jedem Satz `bodyWeightKg` mit (`withBodyWeight`), `effectiveLoadKg` bevorzugt diesen Wert vor `ExerciseKind.bodyWeightKg`.
  - Tests: `src/domain/daily.test.ts`, `src/db/daily.test.ts`, Gewicht zum Workout-Tag (`records`, `stats`, `strength`), Migration v11→v12, Backup. E2E `e2e/daily.spec.ts` offline in beiden Viewports (Tag erfassen, Nachtrag, Neuladen, Ziel ändern, Verlauf, Widget, Körpermaße).
- Abweichungen:
  - **Gewicht an einer Stelle:** Das neueste eingetragene Gewicht wird automatisch `Settings.bodyWeightKg`. Das Gewicht in den Einstellungen zu ändern trägt es als Gewicht von heute ein. Leeren in den Einstellungen löscht nur den heutigen Wert, ältere Einträge bleiben; beim nächsten Eintrag gilt wieder das neueste Gewicht.
  - Vor dem ersten Gewichtseintrag zählt für alte Workouts dieser erste Eintrag, ohne jeden Eintrag wie bisher das Gewicht aus den Einstellungen. Bestehende Kurven ändern sich beim Umstieg daher kaum.
  - Wert 0 gilt in Auswertungen als nicht erfasst (Wasser steht z. B. nach +250 und −250 wieder auf 0), sonst zögen solche Tage den Durchschnitt nach unten.
  - Schlaf zählt zu dem Tag, an dem man aufwacht („Die Nacht vor diesem Tag“).
  - Wasser in ml wie in der Roadmap, nicht in Gramm. Körpermaße intern in Metern, Anzeige in cm bzw. Zoll, wenn die Distanzeinheit Meilen ist. Zusätzlich zu Brust, Taille, Hüfte, Arm und Oberschenkel gibt es Hals und Wade. Arm und Oberschenkel werden nicht nach links/rechts getrennt.
  - Es gibt ein Widget „Heute“ mit vier Kacheln statt mehrerer einzelner Widgets. Nicht in den Standard-Widgets: Wie in Schritt 8 notiert, steht es unter „Anpassen → Weitere Widgets“.
  - Der Verlauf zeigt je Kennzahl einen Graphen mit Auswahl statt aller Graphen untereinander. `ProgressChart` zeigt ab 60 Punkten keine Einzelpunkte mehr.
  - `useStatsFilter` wird auch im Alltag-Verlauf für den Zeitraum verwendet.
- Offene Punkte:
  - `input type="date"` und die Stepper auf dem echten Handy prüfen (auf dem iPhone sieht der Datumsdialog anders aus als am PC).
  - CSV-Export enthält die Alltagsdaten nicht (nur Workouts). Bei Bedarf ergänzen.
  - Anteil des Körpergewichts je Übung (Liegestütze ≈ 65 %) bleibt offen, gerechnet wird weiter mit 100 %.
  - Lighthouse wurde nicht erneut ausgeführt. Das Hauptbundle ist um rund 5 KB gewachsen (262 KB), Recharts bleibt im eigenen Chunk.
  - Schritt 10: Habits auf `DailyPage` einhängen, `DayNavigator`/`useDayParam` wiederverwenden. Schritt 12: Tagesziele für Kalorien/Protein in `Settings` analog ergänzen, Trainingstag aus den Workouts ableiten.

### Schritt 10 – Habit-Tracker
- `habits` (Name, Icon, Frequenz: täglich / x-mal pro Woche / bestimmte Wochentage, Gruppe Morgen/Abend/Sonstiges), `habitChecks`
- Abhaken auf Tagesseite, Morgen-/Abendroutine als Checkliste
- Streak-Berechnung in `src/domain/` (mit Tests), Kalenderansicht pro Habit

**Notizen:**
- Gebaut:
  - Dexie v13: Tabellen `habits` (`name`, `icon`, `frequency: 'daily' | 'weekly' | 'weekdays'`, `timesPerWeek`, `weekdays`, `group: 'morning' | 'evening' | 'other'`, `order`) und `habitChecks` (`habitId`, `date`, je Gewohnheit und Tag ein aktiver Eintrag). Backup-Defaults, Sicherungen aus v1–v12 bleiben importierbar.
  - `src/db/habits.ts`: `createHabit`, `updateHabit`, `reorderHabits`, `deleteHabit` (Soft-Delete kaskadiert), `setHabitChecked` (setzt den Zielzustand, doppeltes Tippen legt nichts doppelt an), `loadHabits`, `loadHabit`. `src/domain/habits.ts`: `isHabitDue`, `habitStreak`, `checksInWeek`, `weekStart`, Kalender (`monthWeeks`, `shiftMonth`), Formatierung.
  - UI in `src/features/daily/`: `HabitChecklist` auf der Alltag-Seite (eine Karte je Gruppe: Morgenroutine, Abendroutine, Gewohnheiten; mit Fortschritt, folgt dem gewählten Tag, ohne Gewohnheiten unsichtbar), `HabitListPage` (`/daily/habits`: sortieren, ✕), `HabitDetailPage` (`/daily/habits/:id`: Aktuell, Bestwert, Gesamt, Kalender), `HabitCalendar`, `HabitForm`/`HabitEditPage` (`/daily/habits/new`, `/daily/habits/:id/edit`).
  - Tests: `src/domain/habits.test.ts`, `src/db/habits.test.ts`, Migration v12→v13, Backup. E2E `e2e/habits.spec.ts` offline in beiden Viewports (anlegen, sortieren, abhaken, Nachtrag, Neuladen, Kalender, bearbeiten, löschen).
- Abweichungen:
  - Streak-Regeln: Heute noch offen unterbricht keine Serie. `weekdays` zählt nur fällige Tage, ein verpasster Termin beendet die Serie auch an einem freien Tag. `weekly` zählt Wochen (Mo–So) mit erreichtem Ziel, die laufende Woche zählt erst ab erreichtem Ziel und bricht nichts.
  - Gewertet wird immer nach dem **aktuellen** Rhythmus: Eine Änderung der Häufigkeit bewertet die ganze Vergangenheit neu, es gibt keine Historie des Rhythmus. Tage außerhalb des Rhythmus zählen nicht, bleiben aber im Kalender sichtbar und abwählbar.
  - `timesPerWeek` höchstens 6, sonst ist es „Täglich“. Die Checkliste zeigt `weekly` an jedem Tag, auch wenn das Wochenziel schon erreicht ist. „Gesamt“ zählt alle erledigten Tage, auch die außerhalb des Rhythmus.
  - Symbole sind eine feste Emoji-Auswahl (20 Stück, Darstellung je nach Gerät), keine freie Eingabe. Standard ⭐ statt ✅, weil ✅ neben dem leeren Kreis wie erledigt aussah.
  - Der Kalender wird von der Alltag-Seite aus mit `useFromHere` geöffnet, „Zurück“ führt also zum gewählten Tag. Nach „Bearbeiten“ führt es zur Gewohnheiten-Liste.
  - **Testkorrektur:** `e2e/daily.spec.ts` lud direkt nach der Gewichtseingabe neu und brach so gelegentlich den Schreibvorgang ab (rund 1 von 20 Läufen, beide Viewports). Der Test wartet jetzt auf den gespeicherten Wert (danach 60 von 60 Läufen grün). In der App betrifft das nur ein Neuladen im selben Moment wie die Eingabe.
- Offene Punkte:
  - Kein Dashboard-Widget, weil es nicht zum Umfang gehört. Die Ideensammlung nennt Habits in der Tagesübersicht: als neues Widget nach dem Muster von `TodayCard` ergänzbar (`HabitChecklist` wiederverwenden), dabei auf das Hauptbundle achten.
  - Erledigte Gewohnheiten rutschen nicht nach unten, Pausieren und Archivieren gibt es nicht. Schritt 18 (Streak-Übersicht) kann `habitStreak` verwenden. Erinnerungen gibt es ohne Server nicht, CSV-Export enthält Gewohnheiten nicht.
  - Emojis und `aria`-Rollen der Checkliste auf dem echten Handy ansehen. Lighthouse wurde nicht erneut ausgeführt.

### Schritt 10b – Anpassungen nach dem Testen & Handytest
**Ziel:** Die Wünsche des Nutzers aus dem eigenen Testen umsetzen und den Stand auf dem echten Handy prüfen. Danach folgt Schritt 11.

**Beginn, wenn der Nutzer „Schritt 10b starten“ schreibt – wichtig:** Noch nichts bauen. Zuerst den Nutzer auffordern, alle gewünschten Anpassungen aufzuzählen, und die Liste dann gemeinsam abstimmen: fehlende Punkte oder sinnvolle Ergänzungen vorschlagen, Unklarheiten nachfragen. Erst nach der Abstimmung umsetzen und die endgültige Liste hier eintragen.

Abgestimmte Liste (mit dem Nutzer beim Start von 10b):
- **Gewohnheiten – neue Arten:** *Abhaken* (wie bisher), *Zählen* (Ziel + Einheit + Schrittweite, z. B. „10 Seiten lesen“, +1/+Schritt wie beim Wasser), *Mit Unterpunkten* (z. B. „Supplements“ mit „Kreatin 5 g“, „Omega-3 2 Kapseln“; jeder Unterpunkt abhakbar oder zählbar, erledigt wenn alle erledigt), *Aufhören/Reduzieren* (z. B. Snus, Zigaretten: nur Rückfälle mit Menge eintragen, Tag ohne Eintrag = geschafft, „seit X Tagen frei“ + Bestwert, optional Tageslimit zum Reduzieren, Menge im Verlauf; keine Ersparnis in €).
- **Abgrenzung Schritt 11:** Supplements jetzt als Unterpunkte mit Menge. Bestand, Packungsgröße, Uhrzeiten und Warnungen kommen in Schritt 11 als eigener, ausführlicher Bereich.
- **Gewohnheiten allgemein:** Erledigte rutschen in der Checkliste nach unten und sind einklappbar; **Pausieren** (nicht in der Checkliste, unterbricht keine Serie); **Archivieren** (aus der Liste, Verlauf bleibt, wiederherstellbar).
- **To-dos (neu):** Aufgaben mit Datum und **Priorität** (hoch/mittel/niedrig); nicht erledigte Aufgaben wandern in den nächsten Tag.
- **Startseite aufgeräumt, aus Widgets:** neue Widgets *Schnellzugriff* (wählbare Buttons, z. B. Training, Wasser, Gewicht, To-do; spätere Bereiche ergänzen eigene Buttons), *Gewohnheiten heute* (direkt abhaken/zählen), *To-dos*, *Trainingsfortschritt* (Kraftsteigerung gesamt in % der letzten 3 Monate, Workouts diesen Monat vs. Vormonat, neue Rekorde). Bestehende Startseite wird einmalig auf den neuen Standardaufbau umgestellt.
- **Alltag:** Verlauf als große Karte direkt auf der Alltag-Seite (Zeitraum + Kennzahl filtern, wie in der Statistik), inkl. Gewohnheiten-Erfüllung und Aufhören-Mengen.
- Nicht in 10b: CSV-Export für Alltagsdaten (irgendwann später). Kürzere Aufwärmpause und Körpergewichtsanteil je Übung werden laut Nutzer nicht gebraucht.

Danach veröffentlichen und testen:
- **Push:** Der Nutzer hat ausdrücklich einen Push für den Handytest gewünscht: Wer „Schritt 10b starten“ schreibt, gibt den Push auf `main` frei (Ausnahme von „Kein Push“, siehe Hinweise in `CLAUDE.md`). Erst pushen, wenn die Definition of Done erfüllt ist. Danach prüfen, dass die GitHub Action durchgelaufen ist, und dem Nutzer sagen, wann die Version online ist.
- **Handytest durch den Nutzer:** App öffnen, „Neue Version verfügbar“ → „Neu laden“. Gewohnheiten (Abhaken, Kalender, Emojis) und alle Anpassungen aus 10b prüfen, dazu die offenen Handy-Punkte aus Schritt 9 (`input type="date"`, Stepper). Bleiben vorhandene Daten erhalten, läuft alles im Flugmodus?
- Gefundene Probleme beheben und erneut pushen.

**Fertig wenn:** Abgestimmte Punkte umgesetzt, Definition of Done erfüllt, gepusht, Nutzer bestätigt den Handytest.

**Notizen:**
- Gebaut:
  - Dexie v14: `Habit.kind` (`check`/`count`/`items`/`quit`), `target`, `unit`, `step` („Pro Tipp“), `items` (Unterpunkte mit eigener Menge/Einheit/Schrittweite), `startDate` (nur `quit`), `pauses` (`{ from, to }`), `archivedAt`; `HabitCheck.amount` und `itemId` (ein aktiver Eintrag je Gewohnheit, Unterpunkt und Tag, Menge 0 wird nicht gespeichert). Neue Tabelle `todos` (`title`, `priority`, `date`, `completedAt`). `Settings.quickActions`. Upgrade setzt bestehende Gewohnheiten auf „Abhaken“ und Einträge auf Menge 1; Backup-Defaults, Sicherungen aus v1–v13 bleiben importierbar.
  - `src/db/habits.ts`: `addHabitAmount`/`setHabitAmount` (atomar, nie unter 0), `setHabitDone` (Kalender: Ziel bzw. alle Unterpunkte voll/leer), `pauseHabit`/`resumeHabit`, `setHabitArchived`; `setHabitChecked` bleibt. `HabitWithChecks` hat jetzt `entries` (Mengen) und `dates` (erledigte Tage). `src/domain/habits.ts`: `isHabitDoneOn`, `dayAmount`, `doneDates`, `isSingleTap`, `isHabitShownOn`, Pausen (`isPausedOn`, `startPause`, `endPause`, `habitStreak` überspringt Pausen), `quitStreak`, `amountInWeek`, Verlauf (`habitCompletion`, `quitAmounts`), Formatierung.
  - `src/db/todos.ts` + `src/domain/todos.ts` (`todayTodos`, `upcomingTodos`, `doneOn`, `formatTodoDate`). UI: `TodoCard` (Alltag-Seite nur für heute, Startseite mit `limit`), `TodoParts` (`TodoAddForm`, `TodoRow`, Bearbeiten-Dialog), `TodoPage` (`/daily/todos`: Heute, Geplant, Erledigt, „Erledigte entfernen“).
  - Gewohnheiten-UI: `HabitForm` mit Art-Auswahl und Feldern je Art; `HabitChecklist` (offene zuerst, dann Aufhören, erledigte eingeklappt „n erledigt“; Variante `widget` für die Startseite); Zeilen mit −/+Schritt, Unterpunkte aufklappbar; `HabitDetailPage` mit Pausieren/Fortsetzen, Archivieren/Wiederherstellen und Kacheln je Art; `HabitCalendar` zeigt bei Aufhören grün/orange (nur Anzeige); `HabitListPage` mit „Pausiert“ und Archiv.
  - **Startseite:** neue Widgets `quickActions` (`QuickActions`, Buttons Training/Fortsetzen, +250 ml Wasser mit Hinweis, Gewicht, Schritte, To-do, Körpermaße; Auswahl per Chips unter „Anpassen“), `habits`, `todos`, `progress` (`trainingProgress` in `src/domain/stats.ts`). Standard jetzt Schnellzugriff → Gewohnheiten → To-dos → Diese Woche → Trainingsfortschritt.
  - **Alltag:** `DailyHistoryCard` (lazy, Recharts) ersetzt `DailyHistoryPage`; Kennzahlen zusätzlich „Gewohnheiten“ (Erfüllung in %) und je Aufhören-Gewohnheit die Menge. `/daily/history` leitet auf `/daily` um. `useDayParam` behält beim Tageswechsel andere URL-Parameter (Zeitraum).
  - Gemeinsam: `Dialog` (`src/components/`), `showToast({ variant: 'info' })` ohne Pokal.
  - Tests: Domain (Arten, Pausen, `quitStreak`, Verlauf, To-dos, `trainingProgress`), DB (Mengen, Unterpunkte, Pausen, Archiv, To-dos), Migration v13→v14, Backup aus v13. E2E angepasst (`habits`, `daily`, `mvp1`) und neu: Zählen/Unterpunkte/Aufhören/Verlauf/Pausieren/Archivieren in `e2e/habits.spec.ts`, `e2e/todos.spec.ts` (To-dos, Schnellzugriff, Gewohnheiten-Widget), alles offline in beiden Viewports.
- Abweichungen:
  - Die Startseite wurde bei bestehenden Nutzern **einmalig** auf den neuen Standard umgestellt (Upgrade v14 überschreibt `dashboardWidgets`). Sicherungen aus v11–v13 bringen beim Import ihre alte Auswahl mit.
  - Aufhören: Häufigkeit entfällt (immer täglich). „Ganz aufhören“ = Limit 0. Ein Rückfall über dem Limit bricht die Serie **sofort** (anders als bei Gewohnheiten, wo „heute offen“ nichts bricht). Gezählt wird ab „Gezählt ab“ (`startDate`). Aufhören zählt nicht in „n von m erledigt“ und nicht in die Gewohnheiten-Erfüllung im Verlauf.
  - „Pro Tipp“ gleich Ziel → Anzeige als Haken (z. B. „Kreatin 5 g“), sonst −/+. Mengen mit bis zu 2 Nachkommastellen.
  - Pause beginnt am gewählten Tag (heute) und endet beim Fortsetzen; am selben Tag fortgesetzt verschwindet sie ganz. Pausierte Tage zählen weder für noch gegen eine Serie; eine Woche mit Pause bricht „x-mal pro Woche“ nicht.
  - Gelöschte Unterpunkte: Ihre Mengen bleiben gespeichert, zählen aber nicht mehr.
  - To-dos haben immer ein Datum (Standard heute), offene von früheren Tagen erscheinen heute mit „seit gestern“/„seit n Tagen“. Neue Aufgaben nur ab heute; beim Bearbeiten ist jedes Datum möglich. Die To-do-Karte steht auf der Alltag-Seite nur beim heutigen Tag.
  - Trainingsfortschritt: „Kraft (3 Monate)“ = Median von `exerciseProgress` aller Kraftübungen (wie in der Statistik, ab 4 Einheiten), Workouts im Kalendermonat vs. Vormonat, Anzahl Rekorde im Monat.
  - Verlauf-Karte steht unten auf der Alltag-Seite (vom Nutzer so bestätigt).
  - Hauptbundle 262 → 290 KB (Gewohnheiten/To-dos auf der Startseite), Recharts bleibt im eigenen Chunk.
  - Zusätzlich behoben: Schnelles Tippen auf zwei Schnellzugriff-Chips konnte die Auswahl überschreiben; der Wasser-Hinweis zeigte einen Pokal (jetzt `variant: 'info'`).
  - Gepusht als `0339e70`, GitHub Action erfolgreich.
- Ergebnis Handytest: vom Nutzer bestätigt („passt alles“), keine Probleme gemeldet. Gerät nicht genannt; ob Android dabei war, bleibt offen (sonst in Schritt 20 nachholen).
- Offene Punkte:
  - CSV-Export für Alltagsdaten (Nutzerwunsch „irgendwann“), dann auch Gewohnheiten und To-dos.
  - Schritte 11–13/17: eigene Buttons im Schnellzugriff ergänzen (`QUICK_ACTIONS`, `QUICK_ACTION_LABELS`, Fall in `QuickActions`), z. B. Mahlzeit, Supplement genommen, Ausdauer, Journal. Bei bestehenden Nutzern erscheinen sie nur in der Auswahl unter „Anpassen“.
  - Wiederkehrende To-dos gibt es nicht (dafür Gewohnheiten). Aufhören hat keine Ersparnis in € (Nutzer: nicht gewünscht).

### Schritt 11 – Supplements
> **Aus 10b:** Supplements lassen sich schon als Gewohnheit mit Unterpunkten und Menge abhaken. Schritt 11 baut einen **eigenen, ausführlicheren Bereich** (Bestand, Packungsgröße, Uhrzeiten, Warnung bei niedrigem Bestand). Vorher klären, ob bestehende Supplement-Gewohnheiten übernommen werden sollen.

- `supplements` (Name, Dosierung, Einheit, Uhrzeiten, Bestand, Packungsgröße), `supplementIntakes`
- Abhaken pro Tag/Uhrzeit, Bestand automatisch reduzieren, Warnung bei niedrigem Bestand
- Erinnerung nur bei geöffneter App (Notification API, falls erlaubt) – Einschränkung in der UI erklären

Mit dem Nutzer beim Start abgestimmt: Bestehende Supplement-Gewohnheiten **per Button übernehmen** (nichts automatisch). Zeitpunkt je Einnahme: **Uhrzeit, Tageszeit oder vor/nach dem Training**. Rhythmus: täglich, Wochentage oder **Trainingstage (jedes Training, Kraft oder Ausdauer)**. Warnung, wenn der Bestand **nur noch X Tage reicht** (Standard 7).

**Notizen:**
- Gebaut:
  - Dexie v15: Tabellen `supplements` (`name`, `unit`, `doses` mit `amount`/`timing`/`time`/`period`, `schedule: 'daily' | 'weekdays' | 'training'`, `weekdays`, `trainingKind: 'any' | 'strength' | 'endurance'`, `stock`, `packageSize`, `notes`, `order`, `archivedAt`) und `supplementIntakes` (`supplementId`, `doseId`, `date`, `amount`, `takenAt`, `stockDeducted`; ein aktiver Eintrag je Dosis und Tag). Einstellungen `supplementLowStockDays` (7), `supplementRemindersEnabled` (an), `supplementNotificationsEnabled` (aus). Backup-Defaults, Sicherungen aus v1–v14 bleiben importierbar.
  - `src/db/supplements.ts`: anlegen/ändern/sortieren/archivieren/löschen (Soft-Delete kaskadiert), `setSupplementTaken` (Zielzustand, zieht vom Bestand ab, nie unter 0; Zurücknehmen bucht genau `stockDeducted` zurück), `refillSupplement` („Neue Packung“), `setSupplementStock`, `loadTrainingDays`, `loadSupplementOverview`, `listSupplementHabitCandidates`/`importSupplementsFromHabit`. `src/domain/supplements.ts`: Fälligkeit (`isSupplementDueOn`, `supplementDayStatus`), Tagesliste nach Zeitpunkt (`supplementDay`, `doseDueAt`, `isDoseOverdue`), Bestand (`trainingRate`, `dailyUse`, `stockDaysLeft`, `isLowStock`), Verlauf (`supplementAdherence`, `intakePercentByDay`), Übernahme (`supplementsFromHabit`), Formatierung.
  - UI in `src/features/supplements/`: `SupplementChecklist` (Varianten `card` auf der Alltag-Seite, `widget` auf der Startseite, `page`; „n von m genommen“, „fällig“ in Orange, Abschnitt „Nur an Trainingstagen“, Bestandswarnungen mit Link), `SupplementsPage` (`/daily/supplements`: Tag wählen, Einnahmen, Liste sortieren, ✕, Archiv, „Aus Gewohnheit übernehmen“), `SupplementDetailPage` (Einnahmen, Bestand mit „Reicht noch n Tage“, Verbrauch, „Neue Packung“, Korrigieren, Verlauf als Heatmap + Quote der letzten 30 Tage, Archivieren, Löschen), `SupplementForm`/`SupplementEditPage`, `SupplementReminder` (im Layout), `notifications.ts`. Einstellungen: Karte „Supplements“ (Warnschwelle, Erinnerungen, Mitteilungen mit Berechtigungsabfrage, Erklärung der Grenzen). Startseite: Widget „Supplements“ und Schnellzugriff-Button „💊 Supplements“.
  - Gemeinsam: `CheckButton`/`StatusCircle` aus der Gewohnheiten-Checkliste nach `src/components/CheckButton.tsx` verschoben (Klassen in `checkStyles.ts`), `Heatmap` hat die optionale Prop `level`.
  - Tests: `src/domain/supplements.test.ts`, `src/db/supplements.test.ts`, Migration v14→v15, Backup (Wiederherstellung, aus v14, ungültiger Zeitpunkt). E2E `e2e/supplements.spec.ts` offline in beiden Viewports (anlegen, Bestand, Abhaken + Neuladen, Neue Packung, Erinnerung beim Workout-Start, Trainingstage, Vortag, Widget, Schnellzugriff, Einstellung, Übernahme aus Gewohnheit). `e2e/mvp1.spec.ts`: ein Widget mehr unter „Weitere Widgets“.
- Abweichungen:
  - **Trainingstage** = Tag mit laufendem oder beendetem Workout. Kraft = Workout mit Kraftübung oder noch ohne Übung, Ausdauer = Workout mit Ausdauerübung, reine Beweglichkeit zählt nur für „Jedes Training“. Ausdauer-Einheiten aus Schritt 13 kommen dort dazu (`loadTrainingDays` erweitern).
  - Supplements mit Rhythmus „Trainingstage“ stehen **heute** schon vor dem Training unter „Nur an Trainingstagen“ und sind abhakbar (sonst ließe sich ein Pre-Workout erst nach dem Start eintragen). An früheren Tagen ohne Training erscheinen sie nur, wenn sie genommen wurden.
  - „Vor dem Training“ wird mit dem Start des ersten Workouts des Tages fällig, „Nach dem Training“ mit dem Ende des letzten beendeten. Bei täglichem Rhythmus ohne Training an dem Tag steht die Einnahme ohne Uhrzeit am Ende der Liste und erinnert nicht.
  - Tageszeiten haben feste Startzeiten für Sortierung und Erinnerung: morgens 7:00, mittags 12:00, abends 18:00, vor dem Schlafen 22:00.
  - Reichweite = Bestand / Durchschnittsverbrauch pro Kalendertag (abgerundet). Trainingstage: Anteil der Trainingstage der letzten 4 Wochen, ohne Training 3 pro Woche. Warnung bis **einschließlich** der Schwelle.
  - Eine Einnahme hat immer die volle Dosis (kein Teilmengen-Zählen wie bei Gewohnheiten). Die Menge wird beim Abhaken in die Einnahme kopiert, spätere Dosisänderungen ändern alte Einnahmen nicht. Einnahmen gelöschter Dosen bleiben gespeichert, zählen aber nicht.
  - Bestand im Formular überschreibt beim Speichern den aktuellen Bestand. Wird der Bestand erst später erfasst, bucht das Zurücknehmen älterer Einnahmen nichts zurück (`stockDeducted = 0`).
  - **Erinnerungen:** einmal je fälliger Einnahme und Tag (gemerkt in `localStorage`, `supplementReminders`), gesammelt in einem Hinweis. Keine Erinnerung an Zeiten, die vor dem Anlegen des Supplements lagen. Ist die App beim Fälligwerden zu, kommt der Hinweis beim nächsten Öffnen. Systemmitteilung nur, wenn eingeschaltet, erlaubt und die App im Hintergrund ist (über die Service-Worker-Registrierung), sonst Hinweis in der App.
  - **Übernahme:** Gewohnheiten der Art „Unterpunkte“ (je Unterpunkt ein Supplement) oder „Zählen“ (ein Supplement). Zeitpunkt aus der Gruppe (Abend → abends, sonst morgens), „x-mal pro Woche“ wird täglich, Bestand wird nicht erfasst. Alle bisherigen Mengen werden zu Einnahmen (auch Teilmengen), die Gewohnheit wird archiviert.
  - Verlauf: Quote ohne heute (bis gestern, ab Anlage), Heatmap 17 Wochen mit Anteil genommener Einnahmen je Tag. Kein Kalender wie bei Gewohnheiten.
  - Kein Pausieren (Archivieren reicht), kein Symbol je Supplement (immer 💊). Widget und Schnellzugriff-Button sind nicht in den Standards, bei allen Nutzern unter „Anpassen“ wählbar.
- Offene Punkte:
  - Auf dem echten Handy prüfen: `input type="time"`, Hinweis beim Öffnen, Mitteilungen auf Android (Berechtigung, Anzeige im Hintergrund). Auf dem iPhone sind lokale Mitteilungen ohne Push nicht zuverlässig, die Einstellung erklärt das.
  - Schritt 13: Ausdauer-Einheiten in `loadTrainingDays` als `endurance` ergänzen.
  - Supplements fehlen im Alltag-Verlauf (`DailyHistoryCard`) und im CSV-Export. Bei Bedarf eine Kennzahl „Supplements (Einnahmequote)“ ergänzen.
  - Lighthouse wurde nicht erneut ausgeführt.

### Schritt 12 – Ernährung (MVP 2 fertig)
- `meals` / `mealEntries` (Lebensmittel aus `foods` + Menge in g oder Portion), Mahlzeiten-Typen (Frühstück, Mittag, Abend, Snack)
- Tagesübersicht: Kalorien, Protein (Fokus), optional KH/Fett
- Eigene Lebensmittel anlegen, Rezepte (Zutatenliste → Nährwerte pro Portion), Lieblingsmahlzeiten mit einem Tipp erneut eintragen
- Rezepte/selbst gekochte Gerichte speichern und wie ein Lebensmittel auswählbar machen (z. B. Gesamtgewicht nach dem Kochen erfassen → Nährwerte pro 100 g bzw. pro Portion)
- Schnellauswahl beim Eintragen: Favoriten (Stern an Lebensmitteln und Rezepten), „Zuletzt verwendet“, „Häufig verwendet“
- Favoriten/Ausblenden als eigene Felder (nicht `deletedAt`), damit der Seed sie nicht überschreibt (vgl. Notizen Schritt 2)
- Tagesziele unterschiedlich für Trainings- und Ruhetage (Trainingstag = Workout an dem Tag)
- Nährwertberechnung in `src/domain/nutrition.ts` mit Tests

**Fertig wenn:** Tag mit 3 Mahlzeiten offline erfassen, Summen korrekt.

Mit dem Nutzer beim Start abgestimmt: Ernährung liegt **unter Alltag** (keine sechste Navigation), Ziele sind **feste Werte** je Trainings-/Ruhetag (Protein mit g/kg-Hinweis), schnelles Wiederholen über **Lieblingsmahlzeiten und „Wie gestern“**.

**Notizen:**
- Gebaut:
  - Dexie v16: Lebensmittel bekommen die Nutzerfelder `isFavorite`, `hiddenAt` und `recipe` (`ingredients` mit `foodId`/`grams`, `cookedWeightGrams`, `servings`); neue Tabellen `mealEntries` (`date`, `meal: breakfast|lunch|dinner|snack`, `foodId`, `name`, `grams`, `portion`, `nutrients` pro 100 g) und `savedMeals` (`name`, `items`); `Settings.nutritionGoals` (`training`/`rest` je `kcal`, `protein`, `carbs|null`, `fat|null`; Standard 2500/2200 kcal, 150 g Protein). Backup-Defaults, Sicherungen aus v1–v15 bleiben importierbar.
  - `src/domain/nutrition.ts`: Nährwerte skalieren/summieren, `nutritionDay` (Summen je Mahlzeit und Tag), `goalForDay`, `proteinPerKg`, `recipeNutrition`/`recipeFoodValues`, Mengen (`portionAmount`, `defaultMealAmount`, Formatierung), Schnellauswahl (`recentFoodIds`, `frequentFoodIds`, 90 Tage).
  - `src/db/foods.ts` (eigene Lebensmittel, Favorit, Ausblenden, Rezepte, `refreshRecipes`), `src/db/nutrition.ts` (Einträge, `loadNutritionDay` mit Trainingstag über `loadTrainingDays`, `copyMeal`, `loadFoodUsage`, Lieblingsmahlzeiten).
  - UI in `src/features/nutrition/`: `NutritionPage` (`/daily/nutrition`: Tag wählen, Übersicht, 4 Mahlzeiten), `MealCard` (Einträge antippen = Menge/Mahlzeit ändern, ✕, „+ Hinzufügen“, „Wie gestern“, ★ Lieblingsmahlzeiten speichern/eintragen), `FoodPicker` (Vollbild, Favoriten/Zuletzt/Häufig ohne Suche, Stern, Menge in Gramm oder Portion mit Vorschau, bleibt nach dem Hinzufügen offen, eigenes Lebensmittel direkt anlegen), `NutritionSummary`/`NutritionDayCard` (Karte auf der Alltag-Seite, Widget „Ernährung“), `FoodListPage` (`/daily/foods`, ersetzt `FoodSearchPage`: Suche + Filter Favoriten/Eigene/Rezepte/Ausgeblendete in der URL), `FoodDetailPage` (Nährwerte pro 100 g und Portion, Zutaten, Favorit, Ausblenden bzw. Bearbeiten/Löschen), `FoodForm`, `RecipeForm` (Zutaten über den Picker, Gewicht nach dem Kochen, Portionen, Live-Ergebnis), `FoodEditPage` (`/daily/foods/new`, `/daily/foods/new-recipe`, `/daily/foods/:id/edit`). Einstellungen: Karte „Ernährung“. Startseite: Widget „Ernährung“, Schnellzugriff „🍽️ Mahlzeit“.
  - Gemeinsam: `FavoriteToggle` (`src/components/`), `FavoriteButton` der Übungen nutzt ihn.
  - Tests: `src/domain/nutrition.test.ts`, `src/db/nutrition.test.ts` (Lebensmittel, Rezepte inkl. Seed-Neuberechnung, Mahlzeiten, „Wie gestern“, Schnellauswahl, Lieblingsmahlzeiten), Migration v15→v16, Backup (Wiederherstellung, aus v15, ungültige Mahlzeit). E2E `e2e/nutrition.spec.ts` offline in beiden Viewports: 3 Mahlzeiten mit Summen und Neuladen, eigenes Lebensmittel im Picker, Lieblingsmahlzeit, „Wie gestern“, Menge ändern, Entfernen, Ziel ändern, Alltag-Karte, Widget, Schnellzugriff, Trainingstag; Lebensmittel/Rezept anlegen, Favorit, Ausblenden. `e2e/mvp1.spec.ts`: ein Widget mehr.
- Abweichungen:
  - Keine Tabelle `meals`: Eine Mahlzeit ist Tag + Typ an den Einträgen (`mealEntries`).
  - **Name und Nährwerte werden beim Eintragen kopiert** (wie die Dosis bei Supplements): Spätere Änderungen an Lebensmitteln, Rezepten oder am Seed ändern vergangene Tage nicht. „Wie gestern“ kopiert die Einträge unverändert, Lieblingsmahlzeiten tragen mit den **aktuellen** Werten ein.
  - Rezepte sind eigene Lebensmittel (`category: 'dishes'`, Feld `recipe`) und damit wie Lebensmittel such-, favorisier- und auswählbar. Nährwerte pro 100 g und die Portion „1 Portion“ werden gespeichert und bei Änderung einer Zutat und nach jedem Seed neu berechnet. Keine Rezepte in Rezepten. Gelöschte Zutaten zählen weiter.
  - Trainingstag = an dem Tag gibt es ein (auch laufendes) Workout; vor dem Training gelten die Ruhetag-Ziele.
  - Einträge werden ohne Rückfrage entfernt (✕ in der Zeile oder „Entfernen“ im Dialog), ebenso Lieblingsmahlzeiten im Dialog. „Wie gestern“ erscheint nur bei leerer Mahlzeit, wenn der Vortag dort Einträge hat.
  - Doppelte Namen sind bei eigenen Lebensmitteln/Rezepten nicht erlaubt (auch nicht gegenüber mitgelieferten). Eigene Lebensmittel: Zucker ≤ Kohlenhydrate, Nährstoffe zusammen ≤ 100 g; Hinweis mit berechneten kcal und „Übernehmen“.
  - Hauptbundle 290 → 296 KB (Widget auf der Startseite).
- Offene Punkte:
  - Trainingstag manuell festlegen (z. B. abends geplantes Training) gibt es nicht.
  - Kein Ernährungs-Verlauf (Graph über Tage) im Alltag-Verlauf, kein CSV-Export der Ernährung. Barcode-Scanner erst mit Server (Phase 6).
  - Seed-Lebensmittel mit Portionen prüfen; Zahlenfelder und Picker auf dem echten Handy ansehen. Lighthouse wurde nicht erneut ausgeführt.
  - Schritt 13: Ausdauer-Einheiten in `loadTrainingDays` ergänzen, dann zählen sie auch für die Ernährungsziele.

### Schritt 12b – Alltag übersichtlicher (Kacheln + Unterseiten)
**Ziel:** Die Alltag-Seite ist mit To-dos, Gewohnheiten, Supplements, Ernährung, Tageswerten, Verlauf und Links zu voll und wächst mit Schritt 17 weiter. Sie wird eine Übersicht aus Kacheln, die Details liegen auf Unterseiten. Keine neuen Daten, keine Dexie-Version.

Mit dem Nutzer abgestimmt (nach Schritt 12):
- **Alltag = Übersicht:** oben die Tagauswahl (`DayNavigator`/`useDayParam`), der gewählte Tag gilt auch auf allen Unterseiten (`?date=` mitgeben). Darunter **Kacheln im 2er-Raster**, jede mit Symbol, Name und kurzem Tagesstand; Antippen öffnet die Unterseite.
- **Kacheln und Unterseiten:**
  - **Gewohnheiten:** Stand „3 von 5“; Unterseite = Checkliste des Tages + bisherige Gewohnheiten-Liste/Kalender (`HabitChecklist`, `HabitListPage`).
  - **To-dos:** Stand „2 offen“; Unterseite = bestehende `TodoPage`.
  - **Ernährung:** Stand kcal + Balken zum Ziel; Unterseite = bestehende `NutritionPage` (mit Lebensmitteln & Rezepten).
  - **Supplements:** Stand „1 von 3“ + Hinweis bei niedrigem Bestand; Unterseite = bestehende `SupplementsPage`.
  - **Körper & Befinden:** Stand z. B. Wasser/Schlaf; **neue** Unterseite mit Wasser, Schritten, Schlaf, Gewicht, Stimmung/Energie (bisher `DayForm` auf `DailyPage`) und Körpermaßen.
  - **Verlauf:** **eine zentrale Verlauf-Seite** (bisherige `DailyHistoryCard` als eigene Seite, Recharts weiter lazy).
- **Kein direktes Abhaken auf der Übersicht:** Schnelles Eintragen bleibt Aufgabe der Startseite (Widgets, Schnellzugriff).
- Zurück-Links: Unterseiten führen zur Alltag-Übersicht mit demselben Tag; Links von der Startseite behalten ihre Herkunft (`useFromHere`/`useBackTo`).
- Schritt 17 (Journal, Lesen, Meditation, Fotos) ergänzt später eigene Kacheln. Ausdauer (13–15) gehört zu Training, Ziele/Rückblicke (16) zur Statistik.
- E2E anpassen (`daily`, `habits`, `supplements`, `todos`, `nutrition`, `mvp1`), neuer E2E für Übersicht → Unterseite → zurück mit gewähltem Tag, offline in beiden Viewports.

**Fertig wenn:** Alltag zeigt nur noch Tagauswahl und Kacheln, alle bisherigen Funktionen sind über die Unterseiten erreichbar, Definition of Done erfüllt.

**Notizen:**
- Gebaut:
  - `DailyPage` (`/daily`) = Tagauswahl + 6 Kacheln im 2er-Raster (Liste „Bereiche“): Gewohnheiten („3 von 5“ + Balken), To-dos („2 offen“, an früheren Tagen „n erledigt“), Ernährung („1366 von 2000 kcal“ + Balken), Supplements („1 von 3“ + „⚠️ Bestand niedrig“), Körper & Befinden (Wasser/Schlaf/Schritte, höchstens zwei Zeilen), Verlauf.
  - Neue Unterseiten: `BodyPage` (`/daily/body`, bisheriges Tagesformular + Link „Körpermaße“) und `DailyHistoryPage` (`/daily/history`, lazy, ersetzt die Umleitung). `HabitListPage` zeigt Tagauswahl + Checkliste je Gruppe über „Alle Gewohnheiten“.
  - Tag auf allen Unterseiten: `src/features/daily/paths.ts` (`withDate`, Pfadkonstanten), `useDayBackTo(date, today, parent?)` in `useDaily.ts` (Herkunft aus `state`, sonst Übersicht bzw. `parent` mit dem gewählten Tag). Wechselt man auf der Unterseite den Tag, führt „Zurück“ zu diesem Tag.
  - Domain: `habitDayProgress` (`src/domain/habits.ts`), `lowStockSupplements` (`src/domain/supplements.ts`, auch in `SupplementChecklist` genutzt), je mit Unit-Test.
  - Aufgeräumt: `SupplementChecklist` nur noch `widget`/`page`, `NutritionDayCard` ohne `variant` (nur Startseite). Widget „Heute“ → „Eintragen“ öffnet Körper & Befinden, „Zurück“ führt zur Startseite.
  - E2E: neuer Test „Übersicht → Unterseite → zurück mit gewähltem Tag“ (alle 6 Kacheln, Tageswechsel auf der Unterseite, Körpermaße) in `e2e/daily.spec.ts`; `daily`, `habits`, `todos`, `supplements`, `nutrition`, `catalog` angepasst, Helfer `dailyTile`. 66/66 grün in beiden Viewports, offline.
- Abweichungen:
  - Körpermaße liegen nicht direkt auf „Körper & Befinden“, sondern als Link darunter (eigene Seite mit Graph und Liste bleibt, „Zurück“ führt zu Körper & Befinden).
  - To-dos-Seite zeigt weiterhin „ab heute“ (Aufgaben wandern); der gewählte Tag zählt dort nur für den Rückweg. Die To-do-Kachel zeigt an früheren Tagen die an dem Tag erledigten.
  - `mvp1.spec.ts` musste nicht geändert werden. Die Liste auf der Gewohnheiten-Seite heißt jetzt „Alle Gewohnheiten“ (Verwechslung mit der Checkliste vermeiden).
  - Hauptbundle unverändert (~297 KB); neue Seiten je eigener Chunk.
  - **Nachtrag (Nutzerwunsch):** Beim Anpassen der Startseite werden Widgets jetzt **samt Inhalt** gezogen (vorher klappten alle auf die Überschrift zusammen). Hohe Widgets: an den Rand ziehen und halten, die Seite scrollt mit. Dabei behoben: Schnelles Tippen auf mehrere ✕/„hinzufügen“ konnte eine Änderung verlieren; Widgets und Schnellzugriff schreiben jetzt atomar über `updateSettingsFrom` (`src/db/settings.ts`).
- Offene Punkte:
  - Tiefere Seiten (Lebensmittel, Gewohnheit-Detail/-Bearbeiten, Supplement-Detail) führen zur jeweiligen Liste ohne den gewählten Tag zurück.
  - Links „Alle Gewohnheiten“/„Alle Supplements“ in den Startseiten-Widgets geben keine Herkunft mit („Zurück“ führt zur Alltag-Übersicht statt zur Startseite).
  - Kachel-Layout auf dem echten Handy ansehen (Emoji-Darstellung, Höhe bei langen Texten). Schritt 17 ergänzt eigene Kacheln in `DailyPage`.

---

## Phase 3 – Ausdauer & Import

Mit dem Nutzer abgestimmt (nach Schritt 12b):
- **Kein GPS-Tracking und keine Karten in der App.** Strecken kommen ausschließlich per Import (Sportuhr, Strava). Grund: Eine PWA kann im Hintergrund kein GPS aufzeichnen (iPhone stoppt bei gesperrtem Bildschirm sofort), Karten und Routing bräuchten Internet. Beides steht im Ideen-Parkplatz.
- **Geräte:** Nutzer hat iPhone + Garmin, es soll aber geräteunabhängig funktionieren (Standardformate FIT/GPX/TCX, Strava-Export, Apple-Health-Export).
- **Konflikte:** Manuell eingetragene Werte bleiben, der Import füllt nur leere Felder. **Doppelte Einheiten** (z. B. dieselbe Einheit aus Garmin und Strava) werden über Startzeit + Dauer erkannt und übersprungen.
- Gespeichert werden nur Tageswerte und Einheiten (mit Puls-/Streckenverlauf), keine minutengenauen Ganztages-Kurven. Parser werden lazy geladen, das Hauptbundle bleibt gleich.

### Schritt 13 – Training-Kacheln & Ausdauer manuell
**Ziel:** Die Trainingsseite wird wie Alltag eine Kachel-Übersicht (anpassbar), Ausdauer-Einheiten lassen sich manuell erfassen.
- **Training-Übersicht:** oben eine **große Kachel „Krafttraining“** (laufendes Workout bzw. nächster Plantag, Start-Button, vgl. `TrainingStartCard`), darunter **Kacheln im 2er-Raster** je Aktivität: Laufen, Rad, Schwimmen, Wandern, Mobility/Yoga, Sonstiges, mit Wochenstand (z. B. „12,4 km diese Woche“). Pläne, Übungen, Verlauf als Links darunter.
- **Anpassbar** wie die Startseiten-Widgets (`SortableList`, `updateSettingsFrom`): Aktivitäts-Kacheln ausblenden und sortieren; sind alle ausgeblendet, steht nur Krafttraining da. Neue Einstellung mit Standard „alle sichtbar“.
- **Aktivitäts-Unterseite:** manuell erfassen, Liste der Einheiten, Detail/Bearbeiten/Löschen.
- **Felder:** Datum/Start, Dauer, Distanz, Pace bzw. Geschwindigkeit (berechnet, je nach Sportart), Ø-/Max-HF, Höhenmeter, Kalorien (optional), Notiz, Bewertung. Schwimmen: Bahnlänge, Bahnen, Stil, SWOLF.
- **Schuhe** (bzw. Ausrüstung) mit Kilometerstand und Warnschwelle, einer Einheit zuordenbar, ausmustern über Archiv.
- Neue Tabellen per Dexie-Version (Einheiten mit Feld `source: 'manual' | 'import'` und Platz für Import-Daten aus Schritt 14), Backup ergänzen.
- `loadTrainingDays` um Ausdauer-Einheiten ergänzen (zählt für Supplements und Ernährungsziele, siehe offene Punkte Schritt 11/12).
- Ausdauerübungen im Krafttraining (nur Dauer, siehe Schritt 4) bleiben, wie sie sind; ggf. Hinweis auf die neue Erfassung.

**Notizen:**
- Gebaut:
  - Dexie v17: Tabellen `enduranceSessions` (`sport`, `title`, `startedAt`, `durationSeconds`, `distanceMeters`, `avgHeartRate`/`maxHeartRate`, `elevationGainMeters`, `calories`, `rating`, `notes`, `gearId`, Schwimmen `poolLengthMeters`/`laps`/`swimStroke`/`swolf`, `source: 'manual' | 'import'`, `importInfo` für Schritt 14) und `gear` (`name`, `sports`, `initialDistanceMeters`, `warnDistanceMeters`, `notes`, `archivedAt`). `Settings.trainingTiles` (Standard alle 6). Backup-Defaults, Sicherungen aus v1–v16 bleiben importierbar.
  - `src/db/schemas.ts`: `enduranceSessionInputSchema` (leert Felder, die zur Sportart nicht passen; Schwimmen: Distanz = Bahnen × Bahnlänge), `gearFieldsSchema`, `DISTANCE_SPORTS`. `src/db/endurance.ts`: Einheiten anlegen/ändern/löschen (`createEnduranceSession(input, origin)` nimmt für Schritt 14 schon `source`/`importInfo`), Ausrüstung anlegen/ändern/ausmustern/löschen (Löschen entfernt die Zuordnung in den Einheiten).
  - `src/domain/endurance.ts`: Pace/Geschwindigkeit je Sportart (`PACE_KINDS`, `formatPace`), `formatDistance`, Zeiträume (`weekRange`, `monthRange`, `sessionsInRange`, `sportWeekTotals`), Dauer-Eingabe (`splitDuration`/`joinDuration`), Ausrüstung (`gearUsage`, `isGearWorn`, `gearOptions`, `suggestGearId`, `wornGear`). Labels `ENDURANCE_SPORT_LABELS`, `SWIM_STROKE_LABELS`.
  - **Trainingsseite als Übersicht:** „🏋️ Krafttraining“ (n Workouts diese Woche + `TrainingStartCard`), darunter Kacheln im 2er-Raster (Liste „Aktivitäten“) für Laufen, Radfahren, Schwimmen, Wandern, Mobility & Yoga, Sonstiges mit Wochenstand, darunter Pläne/Verlauf/Übungen/Ausrüstung. „Anpassen“: Kacheln ziehen, ✕ ausblenden, „Weitere Kacheln“ (atomar über `updateSettingsFrom`). `Tile` liegt jetzt in `src/components/` (auch Alltag), `Page` hat die Prop `action`.
  - UI in `src/features/endurance/`: `ActivityPage` (`/training/activity/:sport`: Woche/Monat, Warnung bei abgelaufener Ausrüstung, Liste), `SessionForm` + `SessionEditPage` (`/training/activity/:sport/new`, `/training/sessions/:id/edit`; Dauer als h/min/s, Distanz in km/mi, Pace live, Schwimmen mit Bahnlänge/Bahnen/Stil/SWOLF, Puls, Höhenmeter, Kalorien, Bewertung, Ausrüstung, Notiz), `SessionDetailPage` (`/training/sessions/:id`), `GearListPage`/`GearDetailPage`/`GearEditPage`/`GearForm` (`/training/gear[...]`, Kilometerstand mit Balken bis zur Warnung, letzte Einheiten, Ausmustern, Löschen).
  - `loadTrainingDays` zählt Ausdauer-Einheiten mit (offene Punkte aus Schritt 11/12 erledigt): für Supplements („Ausdauer“, „Vor/Nach dem Training“) und als Trainingstag für die Ernährungsziele.
  - Schnellzugriff „🏃 Ausdauer“ (Dialog mit den Sportarten, danach zurück zur Startseite mit Hinweis). Hinweis an Ausdauerübungen im Krafttraining auf die neue Erfassung.
  - Tests: `src/domain/endurance.test.ts`, `src/db/endurance.test.ts` (inkl. Trainingstage und Ernährung), Migration v16→v17, Backup (Wiederherstellung, aus v16, unbekannte Sportart). E2E `e2e/endurance.spec.ts` offline in beiden Viewports (Kacheln, Schuh mit Warnschwelle, Lauf erfassen/bearbeiten/löschen, Neuladen, Schwimmen, Wochenstand, Anpassen mit Ziehen, Schnellzugriff, Trainingstag in der Ernährung). 70/70 E2E grün.
- Abweichungen:
  - Pace: Laufen/Wandern Zeit pro km bzw. Meile, Radfahren/Sonstiges km/h bzw. mph, Schwimmen Zeit pro 100 m. Mobility & Yoga hat nur Dauer (keine Strecke, Höhenmeter, Ausrüstung).
  - Schwimmen immer in Metern (auch bei Meilen als Einheit), Höhenmeter immer in m. SWOLF wird von der Uhr abgelesen und eingetragen (Züge pro Bahn werden nicht erfasst).
  - Trainingstag: Ende einer Einheit = Beginn + Dauer. Mobility & Yoga zählt nur für „Jedes Training“, nicht als Ausdauer (wie reine Beweglichkeit im Workout).
  - Neue Einheit: Beginn vor 30 min (auf 5 min abgerundet), Dauer 30 min. Vorausgewählt ist die zuletzt bei der Sportart genutzte aktive Ausrüstung, sonst die einzige passende. Neue Ausrüstung: Warnung 700 km für Laufschuhe vorbelegt.
  - Titel ist optional (leer = Name der Sportart), damit importierte Einheiten in Schritt 14 ihren Namen behalten können.
  - Ausrüstung hat keine Art (Schuh/Rad), sondern Sportarten, bei denen sie zur Auswahl steht. Ausmustern statt Archiv-Wort, weil es bei Ausrüstung üblich ist; ausgemusterte bleibt an alten Einheiten sichtbar.
  - Krafttraining ist keine verschiebbare Kachel, sondern steht immer oben. Das Hauptbundle bleibt bei ~293 KB (Ausdauer-Seiten je eigener Chunk).
- Offene Punkte:
  - Dashboard-Widget, Heatmap und `weekSummary` kennen Ausdauer noch nicht (Schritt 15). CSV-Export enthält keine Ausdauer-Einheiten.
  - Einheiten lassen sich nur einzeln öffnen, die Liste auf der Aktivitätsseite hat keinen Filter/keine Monatsgruppen (bei vielen Einheiten nach Schritt 14 ergänzen).
  - Kalorien der Einheit fließen noch nicht in die Ernährung (Schritt 15).
  - Dauer-Felder (`inputMode="numeric"`), Datums-/Zeitfelder und Kacheln auf dem echten Handy prüfen.
- **Zwischenpush nach Schritt 13 (Nutzerwunsch):** Stand gepusht, damit der Nutzer auf dem Handy schon echte Trainings- und Tageswerte sammelt und die Übersichten mit Daten bewerten kann. Ab jetzt liegen **echte Daten auf dem Handy**: Schemaänderungen nur per Dexie-Version mit Upgrade (wie bisher), vor größeren Updates an ein Backup erinnern. Rückmeldungen aus dem Gebrauch ggf. als eigener Zwischenschritt (z. B. 13b) einplanen.

### Schritt 14 – Import von Einheiten (Uhr, Strava)
**Ziel:** Einheiten aller Sportarten aus Sportuhr oder Strava übernehmen, komplett lokal geparst.
- **Formate:** FIT (z. B. `fit-file-parser`), GPX, TCX, ZIP mit mehreren Dateien (Strava-Konto-Export, Garmin-Datenexport). Sportart aus der Datei auf die Aktivitäten aus Schritt 13 abbilden, Unbekanntes → Sonstiges.
- **Wege dorthin:** Datei auswählen (überall); auf Android zusätzlich **Teilen-Ziel** im Manifest (Web Share Target, z. B. aus Garmin Connect „Exportieren → Teilen“). Kurze Anleitung in der App je Quelle (Garmin Connect Web „Original exportieren“, Strava „GPX exportieren“/Konto-Export).
- **Inhalt:** Kennzahlen wie bei manueller Erfassung, Runden/Intervalle, Puls- und Höhenverlauf, Strecke als **Linienzeichnung ohne Karte** (SVG, kompakt gespeichert).
- **HF-Zonen:** max. HF (und ggf. Ruhepuls) in den Einstellungen, Zeit in Zonen je Einheit.
- **Duplikate** über Startzeit + Dauer erkennen und überspringen; Import-Zusammenfassung („5 neu, 2 übersprungen“).
- Speicherbedarf beachten (ca. 50–100 KB je Einheit mit Verlauf); Backup enthält die Verläufe.
- **Nebenbei (Nutzerwunsch): Info „Wo liegen meine Daten?“ im Backup-Bereich der Einstellungen** (`BackupSection`), z. B. aufklappbar, kurz und verständlich:
  - Daten liegen nur im Browser-Speicher dieses Geräts, kein automatisches Backup, keine Synchronisierung.
  - Browserdaten löschen: nur Verlauf oder Cache ist unbedenklich, aber „Cookies und Websitedaten“ (Chrome) bzw. „Verlauf und Websitedaten“ (Safari, *ein* Knopf) löscht alles. Android: Die installierte App teilt sich den Speicher mit Chrome. iPhone: Die Startbildschirm-App hat einen eigenen Speicher, App vom Startbildschirm entfernen löscht die Daten, iOS kann Daten länger nicht genutzter Web-Apps entfernen.
  - Privatmodus/Inkognito: Alles ist beim Schließen des Fensters weg → nicht verwenden.
  - Empfehlung: zum Startbildschirm hinzufügen, regelmäßig exportieren und die Datei außerhalb des Handys ablegen (Cloud/PC), bei Verlust in der App importieren. Was nach dem letzten Export eingetragen wurde, fehlt dann.
  - Status „dauerhafter Speicher“ (`navigator.storage.persisted()`) dort mit anzeigen, falls noch nicht sichtbar.

**Notizen:**
- Gebaut:
  - **Parser ohne neue Pakete** in `src/domain/import/` (per dynamischem Import nur auf der Import-Seite geladen, eigener Chunk ~11 KB): `fit.ts` (FIT-Binärformat: Definitions-/Datennachrichten, Little/Big Endian, komprimierte Zeitstempel, Entwicklerfelder übersprungen, ungültige Werte → `null`; liest `file_id`, `session`, `lap`, `record`; Multisport = je `session` eine Einheit), `xml.ts` (GPX/TCX über `DOMParser`, Namensräume egal; Sportart aus Text `sportFromText`), `zip.ts` (Inhaltsverzeichnis am Ende, Zip64, Einträge einzeln per `Blob.slice`, Entpacken über `DecompressionStream`), `readFiles.ts` (`readImportFiles`: Format am Inhalt erkannt, verschachtelte ZIPs bis Tiefe 3, `.gz`, nur `.fit/.gpx/.tcx/.zip/.gz`-Einträge, Probleme je Datei statt Abbruch). Gegen echte Garmin-FIT-Beispieldateien (python-fitparse) geprüft, Tests nutzen selbst erzeugte Dateien (`src/test/importFiles.ts`: `encodeFit`, `sampleFitRun`, `sampleGpx`, `createZip`, `gzip`).
  - `src/domain/import/activity.ts`: `buildCandidate` (fehlende Kennzahlen aus dem Verlauf: Strecke per Haversine, Bewegungszeit ohne Lücken > 30 s, zeitgewichteter Ø-Puls, Höhenmeter mit 3-m-Schwelle; Grenzwerte wie im Formular), Verlauf auf ≤ 1500 Punkte ausgedünnt, Strecke per Douglas-Peucker auf ≤ 500 Punkte (5 Nachkommastellen) → ca. 30–50 KB je Einheit. Duplikate `isSameActivity` (Start ±2 min, Dauer ±10 %/mind. 2 min, Bewegungs- **oder** Gesamtzeit), `planImport` (neu / ergänzen / schon vorhanden; bei Duplikaten in derselben Auswahl gewinnt FIT vor TCX vor GPX), `mergeSessionValues`.
  - Dexie v18: Tabelle `enduranceTracks` (`sessionId`, spaltenweise `time`/`distance`/`heartRate`/`altitude`, `route`, `laps`) getrennt von `enduranceSessions`, damit Listen leicht bleiben; Löschen einer Einheit löscht den Verlauf mit. `Settings.maxHeartRate`/`restingHeartRate`. Backup-Schema + Defaults (Sicherungen aus v1–v17 importierbar).
  - `src/db/enduranceImport.ts`: `planEnduranceImport`, `applyEnduranceImport` (eine Transaktion; Rückgabe `created/merged/skipped/sessionIds`). `loadEnduranceTrack` in `src/db/endurance.ts`.
  - **Import-Seite** `/training/import` (`ImportPage`, Einstieg: Trainingsseite „Importieren“ und Button auf jeder Aktivitätsseite): Dateien wählen (ohne `accept`, sonst graut iOS `.fit` aus) → Fortschritt → Vorschau („1 neu · 1 ergänzt · 1 schon vorhanden“, je Einheit Haken und Sportart wählbar, Duplikate und nicht lesbare Dateien aufklappbar) → Zusammenfassung („✓ Import abgeschlossen: 5 neu, 1 ergänzt, 2 übersprungen“, bei einer Einheit „Einheit ansehen“). Anleitung je Quelle (Garmin Connect, Strava einzeln, Strava-Konto-Export, Garmin-Datenexport, Teilen).
  - **Teilen-Ziel (Android):** `share_target` im Manifest (POST, `files`), `public/share-target.js` per `workbox.importScripts` legt die Dateien in den Cache `shared-files` und leitet auf `#/training/import?shared=1`, die Seite holt sie über `takeSharedFiles()` ab.
  - **Detailseite:** Herkunft („importiert · Garmin · FIT“ bzw. „ergänzt aus …“), Strecke als SVG-Linie ohne Karte (`projectRoute`/`svgPath`), Puls- und Höhenverlauf (`SessionCharts`, lazy, `SeriesChart` in `charts.tsx`), Zeit in 5 Pulszonen (`src/domain/track.ts`: `heartRateZoneBounds` – mit Ruhepuls nach Karvonen –, `zoneSeconds`), Runden der Uhr bzw. km-/Meilen-Splits (`distanceSplits`), lange Tabellen mit „Alle n anzeigen“.
  - Einstellungen → Training: „Max. Puls“ und „Ruhepuls“. Backup-Bereich: aufklappbare Info **„Wo liegen meine Daten?“** inkl. Status „dauerhafter Speicher“.
  - Tests: `fit`/`xml`/`readFiles`/`activity`-Tests, `src/domain/track.test.ts`, `src/db/enduranceImport.test.ts` (Speichern, Sportart, Duplikate, Ergänzen, Ausrüstung, Backup), Migration v17→v18, Backup aus v17. E2E `e2e/import.spec.ts` (offline in beiden Viewports: FIT + GPX + ZIP + kaputte Datei, Vorschau, Sportart ändern, Ergänzen einer manuellen Einheit, Detailseite mit Strecke/Diagrammen/Zonen/Splits, zweiter Import = alles vorhanden; Teilen-Ziel per POST an den Service Worker; Daten-Info). 76/76 E2E grün.
- Abweichungen:
  - Statt `fit-file-parser` ein eigener FIT-Leser (kein `npm install`, kein Node-`Buffer`, nur die benötigten Felder).
  - **Ergänzen statt überspringen:** Passt eine Datei zu einer *manuell* erfassten Einheit ohne bisherigen Import, werden nur leere Felder (Distanz, Puls, Höhenmeter, Kalorien, Bahnen, Titel) gefüllt und der Verlauf angehängt; Sportart, Zeiten, Bewertung und Notiz bleiben. Danach (oder bei importierten Einheiten) gilt sie als „schon vorhanden“.
  - Dauer = Bewegungszeit (Timer der Uhr bzw. Verlauf ohne Pausen), deshalb vergleicht die Duplikat-Erkennung auch die Gesamtzeit.
  - Ausrüstung wird importierten Einheiten nur zugeordnet (wie beim manuellen Erfassen vorgeschlagen), wenn sie vor der Einheit angelegt wurde: alte Strava-Läufe landen nicht auf dem aktuellen Schuh.
  - Pulszonen werden nicht gespeichert, sondern bei der Anzeige aus Verlauf und Einstellungen berechnet (ändern sich mit dem max. Puls). Zonen: 50/60/70/80/90 % von max. Puls bzw. Herzfrequenzreserve.
  - Aus FIT werden Schwimmstil und SWOLF nicht übernommen (nur Bahnlänge + Anzahl Bahnen). Rundentabelle zeigt Pausen beim Schwimmen als „Pause“.
  - Strava-GPX mit Zahlen als Typ: 1 = Rad, 9 = Laufen, 4/10 = Wandern (Annahme); in der Vorschau korrigierbar.
- Offene Punkte:
  - **Auf echten Geräten prüfen:** Garmin-/Strava-Dateien des Nutzers, Strava-Konto-Export (Größe, Dauer), Dateiauswahl auf dem iPhone, Teilen-Ziel auf Android (nur bei installierter App, Manifest-Änderung braucht ggf. Neuinstallation).
  - FIT-Dateien aus dem Strava-Konto-Export haben keinen Namen (Strava speichert ihn in `activities.csv`, wird nicht gelesen) → Titel = Sportart. Ggf. später `activities.csv` auswerten.
  - Sportart einer Einheit ist nachträglich nicht änderbar (auch vorher nicht); bei Bedarf im Formular ergänzen.
  - Große Exporte: Alle Einheiten werden vor der Vorschau gelesen und im Speicher gehalten; bei Hunderten Einheiten auf dem Handy testen. Liste auf der Aktivitätsseite hat weiterhin keine Monatsgruppen/Filter (offener Punkt aus 13).
  - Schritt 15: Bestleistungen aus `enduranceTracks` (`time`/`distance`), Rekord-Toast nach `applyEnduranceImport`, Teilen-Bild aus `route`.
- **Zwischenstand (Nutzer konnte noch nicht testen):** Schritt 14 ist fertig, getestet (Unit + E2E) und lokal committet, aber **nicht gepusht** und **nicht vom Nutzer geprüft**. Zu Beginn des nächsten Chats (vor oder zusammen mit Schritt 14b) nachfragen:
  1. Testen am PC (`npm run dev`) oder erst pushen fürs Handy? Vor dem Push an ein Backup auf dem Handy erinnern (DB-Version 18).
  2. Testliste: Garmin-ZIP („Original exportieren“) und Strava-GPX importieren; optional kompletter Strava-Konto-Export (Dauer, Speicher); iPhone-Dateiauswahl (`.fit` antippbar?); max. Puls eintragen → Pulszonen; Android-Teilen-Ziel (ggf. App neu installieren).
  3. Rückmeldungen als Korrekturen einarbeiten (ggf. als Schritt 14a/Nachtrag hier notieren).
  - **Erledigt (Chat zu 14b):** Nutzer hat am PC (`npm run dev`) getestet → „klappt“. Die Garmin-Connect-*App* exportiert keine Dateien (nur über connect.garmin.com im Browser, auch am Handy per Desktop-Ansicht); Hinweis „Teilen (Android)“ auf der Import-Seite entsprechend korrigiert. iPhone-Dateiauswahl und Android-Teilen-Ziel weiterhin erst nach einem Push prüfbar.

### Schritt 14b – Import von Gesundheitsdaten
**Ziel:** Schlaf, Schritte, Ruhepuls, HRV usw. aus Uhr/Handy in den Alltag übernehmen.

- **Quellen:** Apple-Health-Export (`export.zip` mit `export.xml`, groß → streamend parsen; enthält auch Garmin-Daten, wenn Garmin Connect mit Apple Health synchronisiert), Garmin-Datenexport (ZIP mit JSON: Schlaf, Tageswerte, HRV). Strava liefert keine Gesundheitsdaten.
- **Nur Tageswerte:** Schritte, Schlafdauer + Phasen, Ruhepuls, HRV (Nacht-Ø), ggf. Stress. Schritte/Schlaf füllen die bestehenden `dailyLogs`-Felder (manuelle Werte bleiben), Ruhepuls/HRV/Schlafphasen als neue Felder (Dexie-Version, Backup).
- Anzeige auf „Körper & Befinden“ und im Verlauf (`DailyHistoryPage`, Recharts lazy). Optional: Einheiten aus dem Apple-Health-Export mit übernehmen (Duplikat-Erkennung aus Schritt 14).
- Import gedacht für „ab und zu“ (z. B. monatlich), mehrfacher Import desselben Zeitraums ist unschädlich.

Mit dem Nutzer abgestimmt: Quellen Apple Health **und** Garmin-Datenexport; Werte Schritte, Schlaf (mit Phasen), Körpergewicht, Ruhepuls, HRV; **keine** Einheiten aus Apple Health (kommen weiter per FIT/GPX).

**Notizen:**
- Gebaut:
  - Dexie v19: `DailyLog.restingHeartRate`, `hrvMs`, `sleepPhases` (`{ deep, light, rem, awake }` in Sekunden) und `importedFields` (`DAILY_IMPORT_FIELDS`: `steps`, `sleep`, `weight`, `restingHeartRate`, `hrv`). Backup-Defaults (Sicherungen bis v18 importierbar), Migration füllt `null`/`[]`.
  - **Herkunft je Wert:** Import füllt leere Werte und aktualisiert früher importierte; eigene Einträge bleiben. Eine eigene Eingabe (`updateDailyLog`) nimmt das Feld aus `importedFields`; eine neue Schlafdauer verwirft die importierten Phasen. Import schreibt über `writeImportedDailyLog`, Gewicht gleicht `Settings.bodyWeightKg` ab (`syncBodyWeight`).
  - Parser ohne Pakete in `src/domain/import/` (lazy, eigener Chunk): `appleHealth.ts` (`HealthXmlScanner` liest `export.xml` stückweise, nur `<Record>`-Start-Tags der 5 Typen; `AppleHealthCollector`: Schritte = Quelle mit den meisten Schritten am Tag, Schlaf zählt zum Tag des Aufwachens – endet er nach 18 Uhr, zur nächsten Nacht –, Quelle mit Phasen bzw. längstem Schlaf, Überlappungen per Vereinigung; nur „Im Bett“ gilt als Schlaf, wenn sonst nichts da ist; Gewicht = letzte Messung, kg/lb/g; Ruhepuls/HRV = Tagesmittel), `garminHealth.ts` (`*_sleepData.json`, `UDSFile_*.json`, tolerant auch HRV `lastNightAvg`/`hrvSummary` und Gewicht in Gramm aus `*bioMetrics*`), `readHealthFiles.ts` (ZIP/XML/JSON am Inhalt erkannt, `openZipEntry` entpackt als Stream mit Fortschritt in %), `health.ts` (`healthDay` verwirft unplausible Werte, `mergeHealthDays` – Garmin vor Apple –, `planHealthImport` mit Zählung je Wert: neu/aktualisiert/unverändert/eigener Eintrag bleibt; Tage nach heute ignoriert). Speichern: `applyHealthImport` (`src/db/healthImport.ts`, eine Transaktion).
  - UI: `HealthImportPage` (`/daily/import`, `HEALTH_IMPORT_PATH`, Einstieg „Gesundheitsdaten importieren“ auf Körper & Befinden): Export wählen → Fortschritt → Vorschau (Zeitraum, Quellen, je Wert Haken + Zählung, nicht lesbare Dateien) → „n Tage übernehmen“ → Zusammenfassung mit Links. Anleitung für Apple Health und Garmin-Datenexport.
  - Körper & Befinden: Schlafphasen-Balken (`SleepPhasesBar`), Karte „Erholung“ (Ruhepuls, HRV, auch manuell), Hinweis „Aus dem Import: …“. Verlauf: Kennzahlen „Ruhepuls“ und „HRV“, bei Schlaf zusätzlich Ø-Schlafphasen (`averageSleepPhases`).
  - `Details` (aufklappbare Karte) liegt jetzt in `src/components/`.
  - Tests: `health`/`appleHealth`/`garminHealth`/`readHealthFiles`-Tests (Stückgrenzen, Quellen, Nachtzuordnung, Plan inkl. zweitem Import), `src/db/healthImport.test.ts`, Migration v18→v19, Backup aus v18, `daily.test.ts` erweitert. Testdateien: `sampleAppleHealthXml`/`healthDate` in `src/test/importFiles.ts`, `dailyLogOf` in `src/test/dailyLog.ts`. E2E `e2e/health.spec.ts` offline in beiden Viewports (Apple-ZIP + Garmin-ZIP + kaputte Datei, eigener Wert bleibt, Wert abwählen, Zurück zum Tag, Phasen, eigene Änderung, zweiter Import, Verlauf). 597 Unit-Tests, 78/78 E2E grün. Hauptbundle unverändert (~294 KB), Import-Seite und Parser je eigener Chunk (10 bzw. 7 KB).
- Abweichungen:
  - HRV: Apple Watch misst **SDNN** (mehrmals täglich, Tagesmittel), Garmin **RMSSD** (Nacht-Ø). Beides landet in einem Feld `hrvMs`; Garmin hat Vorrang, wenn beide denselben Tag liefern. Werte beider Quellen sind nicht direkt vergleichbar.
  - Ruhepuls/HRV sind auch manuell eintragbar (Karte „Erholung“), damit die Werte ohne Uhr nutzbar sind. Stress/Body Battery nicht übernommen (nicht gewählt).
  - Keine Auswahl des Zeitraums: Ein Import vergleicht alles, schreibt aber nur geänderte Tage („unverändert“ zählt mit, `updatedAt` bleibt). Kachel „Körper & Befinden“ auf der Übersicht unverändert.
- Offene Punkte:
  - **Garmin-Format ungeprüft:** Schlaf (`sleepData`) und Tageswerte (`UDSFile`: `totalSteps`, `restingHeartRate`) laut öffentlichen Beispielen; HRV- und Gewichtsdateien sind geraten. Mit einem echten Garmin-Export des Nutzers prüfen.
  - Großer Apple-Export auf dem echten iPhone testen (Dauer, Speicher; mehrere GB `export.xml`). Die Datei bleibt dabei gepackt, gelesen wird stückweise.
  - Ruhepuls aus dem Import könnte `Settings.restingHeartRate` (Pulszonen) vorschlagen – bisher nicht verknüpft.
  - Kein Graph der Schlafphasen über die Zeit, nur Ø im Verlauf.
- **Zwischenstand (Nutzertest offen):** Nutzer hat kurz geprüft, dass sich etwas importieren lässt; der eigentliche Test (echter Apple-Health-Export auf dem iPhone, Garmin-Export) folgt **beim nächsten Push**. Dann mit abfragen: Werte plausibel (Schritte ohne Doppelzählung, Schlaf am richtigen Tag, Phasen), Dauer bei großem Export, Garmin-HRV/Gewicht erkannt? Vor dem Push an ein Backup erinnern (DB-Version 19).

### Schritt 15 – Ausdauer-Statistiken & Teilen-Bild
- Wochenkilometer, Pace-Entwicklung, Zeit in HF-Zonen, Integration in Dashboard (Widget) und Heatmap.
- **Bestleistungen innerhalb von Einheiten** (schnellster 1 km/5 km/10 km/Halbmarathon aus dem Verlauf), Rekord-Toast beim Import.
- **Teilen-Bild** (wie bei Strava): lokal per Canvas erzeugt, Strecke als Linie + Distanz/Zeit/Pace/Höhenmeter, auch als transparenter Sticker für Instagram-Stories; Teilen über Web Share API, sonst Download. Optional auch für Kraft-Workouts (Volumen, Rekorde).
- Kalorien der Einheit für die Ernährung berücksichtigen (falls vorhanden).

Mit dem Nutzer beim Start abgestimmt: Statistik-Seite mit Umschalter **„Kraft | Ausdauer“** plus Kurzfassung (Bestzeiten) auf jeder Aktivitätsseite; Kalorien **immer anzeigen, Addieren zum Ziel per Schalter (Standard aus)**; Teilen-Bild **auch für Kraft-Workouts**.

**Notizen:**
- Gebaut:
  - Dexie v20: `EnduranceSession.trackSummary` (`bestEfforts` = schnellste Zeit je Strecke, `heartRateSeconds` = Sekunden je bpm) wird beim Import/Ergänzen aus dem Verlauf berechnet, damit Statistiken keine Verläufe laden müssen. Das Upgrade berechnet sie für vorhandene Verläufe, nach einem Backup-Import füllt `ensureTrackSummaries()` fehlende nach (`summaryFor` in `database.ts`). `Settings.addBurnedCalories` (Standard aus). Backup-Defaults, Sicherungen bis v19 importierbar.
  - `src/domain/track.ts`: `fastestSeconds` (gleitendes Fenster, Anfang interpoliert, Rücksprünge übersprungen), `bestEfforts`/`BEST_EFFORT_METERS` (Laufen 1/5/10 km, Halbmarathon, Marathon; Rad 10/20/50/100 km; unrealistisch schnelle Abschnitte verworfen), `heartRateSeconds`, `zoneSecondsOf`, `trackSummary`. `MAX_SAMPLE_GAP_SECONDS` liegt jetzt hier (sonst zöge `database.ts` den Import-Code ins Hauptbundle).
  - `src/domain/enduranceStats.ts`: `bestEffortsOf`, `newEffortRecords` (Rekord nur gegenüber früheren Zeiten), `sessionEfforts`, `periodTotals`, `weeklyTotals`, `pacePoints`/`formatPaceValue`, `sumHeartRateSeconds`, `enduranceDays`/`enduranceHeatLevel`, `weekBySport`.
  - **Statistik:** Umschalter „Kraft | Ausdauer“ (`view`, `sport` in der URL, `ENDURANCE_STATS_PATH`). Ausdauer: Zeitraum + Sportart, „Im Zeitraum“ (Einheiten, Dauer, Strecke, Höhenmeter), Trainingstage, „Pro Woche“ (Strecke oder Dauer), Pace-Entwicklung (`ProgressChart` mit `formatTick`/`reversed`, schneller = oben), Pulszonen über den Zeitraum, Bestzeiten.
  - Aktivitätsseite: Karte „Bestzeiten“ (`BestEffortsCard`) + Link „Statistik“. Detailseite einer Einheit: „Bestzeiten in dieser Einheit“ mit 🏆 bei Allzeit-Bestzeit. Pulszonen-Karte als `HeartRateZonesCard` (Einheit und Zeitraum).
  - **Rekord-Toast** nach dem Import („Neue Bestzeiten: 🏃 5 km: 26:03“), `ImportSummary.records`.
  - **Heatmap/Dashboard:** `ActivityCard` nimmt `endurance` (Farbe = Maximum aus Sätzen und Ausdauer-Dauer, Tag antippen öffnet Workout oder Einheit), `Heatmap` reicht `key` an `describe`/`level`. Neues Widget „Ausdauer“ (`EnduranceWidget`: Woche je Sportart, letzte Einheit), „Diese Woche“ zeigt eine Zeile Ausdauer; beide Trainings-Widgets erscheinen auch ohne Krafttraining.
  - **Teilen-Bild:** Inhalt in `src/domain/shareCard.ts` (`enduranceShareContent`, `workoutShareContent`, `shareFileName`), gezeichnet per Canvas in `src/features/share/renderShareImage.ts`; `ShareImageDialog` mit „Bild“ (1080 × 1920, dunkler Verlauf) und „Sticker“ (1080 breit, transparent, Höhe nach Inhalt, Schrift mit Schatten), Teilen über `shareOrDownload`. Button „Teilen-Bild“ auf der Detailseite einer Einheit und eines Workouts.
  - **Kalorien:** `loadNutritionDay` liefert `burnedKcal`, `dayGoal` (`src/domain/nutrition.ts`) erhöht das kcal-Ziel nur mit `addBurnedCalories`. Ernährung zeigt „🔥 Beim Training verbrannt: … (im Ziel enthalten)“, Kachel auf der Alltag-Übersicht rechnet mit. Schalter in Einstellungen → Ernährung.
  - Tests: `enduranceStats.test.ts`, `shareCard.test.ts`, Bestzeiten/Puls in `track.test.ts`, `dayGoal`, Import (Zusammenfassung, Rekorde, Ergänzen, Backup aus v19), verbrannte Kalorien, Migration v19→v20. E2E `e2e/enduranceStats.spec.ts` offline in beiden Viewports (Import → Toast → Bestzeiten → Teilen-Bild als PNG mit Größe prüfen → Statistik → Widgets/Heatmap → Ernährung; Kraft-Workout teilen). 624 Unit-Tests, 82/82 E2E grün.
- Abweichungen:
  - Bestzeiten nur aus **importierten Verläufen** (manuelle Einheiten haben keinen Abschnitt). Rad über Strecken statt Leistung/Zeit, Schwimmen/Wandern ohne Bestzeiten. Rennstrecken heißen auch bei Meilen „5 km“ usw.
  - Bestzeit-Rekorde wie beim Krafttraining erst, wenn es schon eine frühere Zeit über die Strecke gab. Ein Import alter Läufe kann eine „neue“ Bestzeit von früher melden (Datum steht auf der Detailseite).
  - Statistik-Bestzeiten ignorieren den Zeitraum (wie die Bestwerte bei Kraft). „Alle Sportarten“ zählt Strecken zusammen, Schwimmen dabei in km; Pace erst mit gewählter Sportart. Pulszonen werden aus der gespeicherten Verteilung bei jeder Anzeige mit den aktuellen Einstellungen berechnet.
  - Teilen-Bild ohne Karte (nur Linie), Schrift = Systemschrift des Geräts (offline), Emojis je nach Gerät. Kraft-Bild: bester Satz je Übung (höchstens 7 Zeilen), Volumen mit dem aktuellen Körpergewicht aus den Einstellungen.
  - Kraft-Statistik und Kraft-Heatmap bleiben ohne Ausdauer; die gemeinsame Heatmap gibt es auf der Startseite (Widget „Trainingstage“).
  - Hauptbundle 294 → 310 KB (Ausdauer-Widget und Heatmap auf der Startseite).
- Offene Punkte:
  - Teilen-Dialog (Web Share mit Bild) und Einfügen des Stickers in Instagram nur auf echten Geräten prüfbar (E2E testet den Download). Emoji-Darstellung im Bild auf iPhone/Android ansehen.
  - Keine Bestzeiten für manuell erfasste Einheiten, keine Monatsgruppen/Filter in der Einheitenliste (offen aus 13/14). CSV-Export enthält weiterhin keine Ausdauer-Einheiten.
  - Ruhepuls aus dem Gesundheitsimport schlägt weiterhin nicht `Settings.restingHeartRate` vor (offen aus 14b).
  - Schritt 16 (Ziele & Rückblicke) kann `weeklyTotals`, `periodTotals` und `bestEffortsOf` für Ausdauer-Ziele („10 km unter 50 min“) nutzen.

### Schritt 15b – Verbesserungen aus dem Gebrauch
**Ziel:** Rückmeldungen des Nutzers nach Schritt 15 umsetzen (alles offline).
- **Krafttraining nachtragen:** Eigener Einstieg „Training nachtragen“ (z. B. auf der Trainingsseite/Verlauf): Datum, Beginn und Dauer wählen, Übungen und Sätze eintragen (Modus `edit` des `WorkoutEditor`, alle Sätze direkt als erledigt), speichern als beendetes Workout. Zählt normal für Statistik, Rekorde, Heatmap und Trainingstage. Gedacht für Trainings, die auf Papier notiert wurden. Läuft gerade ein Workout, bleibt es davon unberührt. Bisher ging das nur über den Umweg Starten → Beenden → Datum ändern (`updateWorkoutInfo`).
- **Ziehen mit Inhalt überall:** `SortableList` klappt beim Ziehen alle Zeilen zusammen (`compact`). Umstellen, sodass der Inhalt beim Ziehen sichtbar bleibt und mitgeht – überall, wo es Ziehgriffe gibt (Training-Kacheln, Startseiten-Widgets, Workout-Übungen, Plan-Übungen usw.). `compact` ggf. ganz entfernen; auf lange Workout-Karten und das automatische Scrollen achten.
- **Nur Protein erfassen:** Einstellung „Nur Protein erfassen“ (Einstellungen → Ernährung, Standard aus). Dann zeigt die Ernährung nur ein Protein-Feld wie beim Wasser (Buttons z. B. „+10 g“, „+x“, Rückgängig/Korrigieren) mit Tagesziel aus `Settings.nutritionGoals`. Die Menge zählt zum Protein des Tages (auch im normalen Modus neben Lebensmitteln, z. B. als eigener Eintrag ohne Lebensmittel). Kachel auf der Alltag-Übersicht und Startseiten-Widget im Modus nur mit Protein. Dexie-Version + Backup falls neue Felder.
- **App an andere weitergeben:** Jeder, der den Link öffnet, bekommt eine leere App mit eigenen Daten auf seinem Gerät (funktioniert schon). Ergänzen: Button „App weitergeben“ (Web Share mit Link, sonst Kopieren) z. B. in den Einstellungen; kurze Installationsanleitung in der App (Android: Chrome → „App installieren“; iPhone: Safari → Teilen → „Zum Home-Bildschirm“) samt Backup-Hinweis; kurzer Willkommens-Hinweis beim ersten Öffnen (leere App, Daten nur auf dem Gerät). Dieselbe Anleitung in `README.md`.

**Notizen:**
- Gebaut:
  - **Training nachtragen:** `createPastWorkout({ startedAt, durationSeconds })` (`src/db/workouts.ts`) legt ein bereits beendetes, leeres Workout an (lehnt Zukunft/Dauer 0 ab). Seite `WorkoutLogPage` (`/training/history/new`, `LOG_WORKOUT_PATH`): Datum, Beginn, Dauer (Vorschlag: gerade zu Ende, 60 min, `pastWorkoutStart`/`pastWorkoutError` in `src/domain/workout.ts`) → weiter in die bestehende Bearbeiten-Ansicht (`WorkoutEditor` Modus `edit`, Sätze sind über `addSet` direkt erledigt, kein Pausen-Timer). Einstieg: Trainingsseite „Training nachtragen“ und Button „Nachtragen“ im Verlauf. „Fertig“ ohne Übungen verwirft das Workout. Vorbefüllung kommt aus dem letzten Training **vor** dem nachgetragenen Datum. Ein laufendes Workout bleibt unberührt.
  - **Ziehen mit Inhalt überall:** `compact` aus `SortableList` entfernt (Workout-Karten, Plan-Übungen behalten Sätze/Einstellungen beim Ziehen). Tausch jetzt über Kanten statt Mitten (nach oben: Oberkante über die Mitte des Vorgängers, nach unten: Unterkante), damit hohe Karten nicht übers halbe Display gezogen werden müssen. Behoben: Chrome-„Scroll Anchoring“ verschob nach dem Tausch hoher Zeilen die Seite, die Zeile sprang zurück (`overflow-anchor: none` an der Liste). E2E-Helfer `dragTo` rechnet mit der Zeile statt dem Griff.
  - **Nur Protein erfassen:** Dexie v21: `DailyLog.proteinGrams` (Protein ohne Lebensmittel, wie Wasser: `addProtein` addiert/zieht ab, 0–1000 g) und `Settings.proteinOnly`. Zählt immer zum Protein des Tages, nie zu den Kalorien (`dayNutrients(entries, quickProteinGrams)`, `NutritionDayData.quickProteinGrams`). UI `ProteinQuickAdd` (+10/+20/+30 g, „Rückgängig“, Summe korrigieren). Modus an: Ernährung zeigt nur Protein (keine Mahlzeiten/Lebensmittel), Alltag-Kachel „45 von 120 g Protein“, Startseiten-Widget mit Buttons, Einstellungen nur Protein-Ziele. Modus aus: Karte „Protein schnell eintragen“ unter den Mahlzeiten, Übersicht nennt „davon … g Protein ohne Lebensmittel“. Neuer Schnellzugriff „🥤 +20 g Protein“.
  - **Weitergeben:** Seite `ShareAppPage` (`/settings/app`, `SHARE_APP_PATH`, Link „App weitergeben & installieren“ in den Einstellungen): Link anzeigen, „App weitergeben“ (Web Share, sonst Zwischenablage, `src/features/settings/shareApp.ts`), Anleitung Android/iPhone, Backup-Hinweis, Hinweis bei installierter App. Willkommens-Karte auf der Startseite (`Settings.welcomeDismissed`, „Los geht’s“ / „Installieren“); bestehende Nutzer (Upgrade, ältere Backups) sehen sie nicht. README mit fester Adresse und Abschnitt „An andere weitergeben“.
  - Tests: Migration v20→v21, Backup aus v20 + Wiederherstellung, `createPastWorkout` (beendet, Sätze erledigt, laufendes bleibt, Vorbefüllung vor dem Datum, Fehler), `addProtein`, `quickProteinGrams`, `dayNutrients`, `pastWorkoutStart`/`pastWorkoutError`. E2E `e2e/usage.spec.ts` offline in beiden Viewports (Nachtragen mit Zukunft-Fehler, Ziehen mit sichtbarem Inhalt + Umsortieren, Verlauf, leeres verworfen; Protein-Modus in Ernährung/Kachel/Widget und zurück; Willkommen → Weitergeben mit gestubbtem `navigator.share`). `mvp1` schließt den Willkommens-Hinweis zuerst. 635 Unit-Tests, 88/88 E2E grün. Hauptbundle ~306 KB, neue Seiten je eigener Chunk (2–3 KB).
- Abweichungen:
  - Protein ohne Lebensmittel liegt am Tageseintrag (`dailyLogs`) statt als Mahlzeiten-Eintrag ohne Lebensmittel: so bleiben „Wie gestern“, Lieblingsmahlzeiten und die Lebensmittel-Statistik unberührt. Ein Wert je Tag (Summe), Rückgängig nur für den letzten Button.
  - Nachtragen ohne Plan-Auswahl (Übungen einzeln hinzufügen). Keine Rekord-Toasts beim Nachtragen (wie beim Bearbeiten); Rekorde erscheinen im Verlauf/Statistik.
  - Willkommens-Hinweis ist eine Karte über den Widgets, kein Dialog (blockiert nichts).
- Offene Punkte:
  - Nachtragen „aus Plan“ (Plantag wählen, Übungen vorbefüllt) wäre ein naheliegender Ausbau.
  - Protein ohne Lebensmittel erscheint nicht im Ernährungs-Verlauf (es gibt noch keinen, offen aus 12).
  - Web Share mit Link und Kopieren auf echten Geräten prüfen (E2E stubbt `navigator.share`); bei `npm run dev` zeigt der Link `localhost`.
  - Ziehen hoher Workout-Karten auf dem echten Handy ausprobieren (Touch, automatisches Scrollen).
- **Nutzertest am PC:** „klappt alles bisher“. Handytest (Teilen-Menü, Touch-Ziehen, Weitergeben an eine zweite Person) folgt mit dem Push in 15c.

### Schritt 15c – Strichcode-Scanner für Lebensmittel (online) + Push & Handytest
**Ziel:** Lebensmittel per Strichcode (EAN auf der Verpackung) scannen und als eigenes Lebensmittel speichern. **Erste mit dem Nutzer abgestimmte Ausnahme vom Offline-Prinzip** (siehe CLAUDE.md).
- Kamera über `getUserMedia`; Erkennung per `BarcodeDetector` (Android Chrome), sonst eine gebündelte Bibliothek (z. B. ZXing, iOS Safari hat keinen `BarcodeDetector`) – nur per dynamischem `import()` laden, nicht ins Hauptbundle. Strichcode auch manuell eintippbar.
- Nährwerte von **Open Food Facts** (`world.openfoodfacts.org/api/v2/product/<ean>`), gesendet wird nur die Nummer. Vorschau mit Werten pro 100 g (Kohlenhydrate ohne Ballaststoffe), vor dem Speichern bearbeitbar → `createUserFood` mit `source: 'user'` und gespeichertem Strichcode. Danach offline nutzbar; schon gespeicherter Strichcode wird ohne Internet gefunden.
- **Offline:** Scan-Button ausgegraut mit Hinweis „Nur mit Internet“ (`navigator.onLine` + Fehlerbehandlung bei Abbruch). Service Worker darf die API-Aufrufe nicht cachen.
- Einstieg im `FoodPicker` und auf der Lebensmittelseite.
- **Danach Push** (Schritte 14–15c zusammen, vorher Nutzer an ein Backup auf dem Handy erinnern, DB-Version seit dem letzten Push 17 → ≥ 21) und Handytest: offene Punkte aus 14, 14b, 15 (iPhone-Dateiauswahl, Android-Teilen-Ziel, echter Apple-Health- und Garmin-Export, Teilen-Bild/Sticker in Instagram, Emojis), dazu 15b (Weitergeben an eine zweite Person, Nachtragen, Protein) und 15c (Kamera auf iPhone und Android).

**Notizen:**
- Gebaut:
  - Dexie v22: `Food.barcode` (Nutzerfeld in `FOOD_USER_DEFAULTS`, Index `barcode`, Seed fasst es nicht an), Backup-Default `null` (Sicherungen bis v21 importierbar). `foodInputSchema.barcode` normalisiert (Leerzeichen weg, UPC-A → EAN-13 mit führender 0) und prüft die Prüfziffer; doppelte Strichcodes unter aktiven Lebensmitteln werden abgelehnt. `createUserFood(input, { sourceRef })`, `findFoodByBarcode(code)` (`src/db/foods.ts`).
  - `src/domain/barcode.ts` (`normalizeBarcode`, `gtinCheckDigit`, `isValidBarcode`, `parseBarcode`, `findByBarcode`, `formatBarcode`), `src/domain/openFoodFacts.ts` (`offProductUrl` mit Feldliste, `parseOffResponse`: Name + Marke, Werte pro 100 g, kJ → kcal, Alkohol % vol × 0,789 → g, Zucker ≤ KH, Portion aus `serving_quantity` in g/ml, Kategorie aus `categories_tags`; `OFF_SOURCE_PREFIX` = `off:`).
  - Scanner in `src/features/nutrition/barcode/`: `BarcodeScanner` (Kamera per `getUserMedia`, Rückkamera, Rahmen, alle 200 ms ein Bild; Fehlertexte für verweigerte/fehlende Kamera; Nummer eintippen mit Prüfung), `detector.ts` (`BarcodeDetector` mit `ean_13/ean_8/upc_a`, sonst ZXing per `import()`), `zxingDecoder.ts` (`@zxing/library` 0.21.3, Bild auf 720 px verkleinert, Graustufen → `MultiFormatReader`; eigener Chunk 410 KB / 109 KB gzip, nur beim Scannen ohne `BarcodeDetector` geladen, im Precache), `openFoodFacts.ts` (`fetchOffProduct`: `credentials: 'omit'`, `no-referrer`, `no-store`, 10 s Timeout, 404 = nicht gefunden), `BarcodeFoodFlow` (gespeichert → sofort auswählen; sonst online Open Food Facts → `FoodForm` vorbefüllt mit Hinweis „bitte mit der Verpackung vergleichen“; nicht gefunden → leeres Formular mit Strichcode; Fehler → „Erneut versuchen“/„Selbst eintragen“; offline → „Nur mit Internet“ ausgegraut + „Selbst eintragen“), `ScanButton`, `ScanFoodPage` (`/daily/foods/scan`, `SCAN_FOOD_PATH`).
  - Einstieg: `FoodPicker` (Button „Strichcode scannen“ unter „+ Eigenes Lebensmittel anlegen“, danach Menge wählen) und Lebensmittelseite. Suche in beiden findet Lebensmittel auch über die Strichcode-Nummer. `FoodForm` hat ein optionales Feld „Strichcode“ (auch beim Bearbeiten). Detailseite: „Strichcode 4 006381 333931“, Quelle „Werte von Open Food Facts“.
  - `useOnline()` (`src/components/useOnline.ts`) für Online-Funktionen.
  - Tests: `barcode.test.ts`, `openFoodFacts.test.ts`, `zxingDecoder.test.ts` (selbst gezeichnete EAN-13 als Graustufenbild), Strichcodes in `nutrition.test.ts`, Migration v21→v22, Backup. E2E `e2e/barcode.spec.ts` (Open Food Facts per `page.route` gemockt: Prüfziffer-Fehler, Vorschau bearbeiten, Speichern, nur eine Anfrage ohne Cookies; offline im Picker: gespeicherter Strichcode, unbekannter → „Nur mit Internet“ + selbst eintragen, Suche über die Nummer; wieder online; 503 + Wiederholen + nicht gefunden). 652 Unit-Tests, 92/92 E2E grün.
- Abweichungen:
  - **Scan-Button offline nicht ausgegraut:** Erkennung und Bibliothek sind lokal, also findet der Scan ohne Internet schon gespeicherte Strichcodes. Ausgegraut („Nur mit Internet“) ist nur die Abfrage bei Open Food Facts; unter dem Button steht offline „Ohne Internet nur gespeicherte Strichcodes“.
  - Strichcode als eigenes Feld `barcode` statt in `sourceRef`; `sourceRef = off:<Nummer>` markiert nur die Herkunft der Werte. Strichcodes auch ohne Open Food Facts (selbst eingetragen) möglich.
  - Kein UPC-E (8-stellige US-Kurzform), nur EAN-13/EAN-8/UPC-A. Portion heißt immer „1 Portion“ (Bezeichnung aus Open Food Facts ist zu uneinheitlich).
  - Hauptbundle 313 → 320 KB: Der gemeinsame Chunk `foods-*.js` (7 KB, wurde schon vorher beim Start geladen) liegt jetzt im Hauptbundle; der Scanner selbst nicht.
- Offene Punkte:
  - **Kamera auf echten Geräten prüfen** (iPhone Safari mit ZXing, Android mit `BarcodeDetector`): Erkennungsgeschwindigkeit, Fokus, Licht; Kamera braucht HTTPS (am PC nur `localhost`).
  - Werte aus Open Food Facts sind Nutzerdaten und teils lückenhaft; US-Produkte zählen Ballaststoffe zu den KH (nicht korrigiert).
  - Mitgelieferte Lebensmittel haben keinen Strichcode; ein Scan legt immer ein eigenes Lebensmittel an.
  - Kein Taschenlampen-Schalter, kein Zoom.
- **Zwischenstand Push & Handytest:** Code lokal committet. Push (Schritte 14–15c, DB-Version 17 → 22) erst, nachdem der Nutzer bestätigt hat, dass er ein **Backup auf dem Handy** gemacht hat (Nutzerwunsch: vor dem Push ausdrücklich nachfragen). Danach Handytest laut Liste oben.

### Schritt 16 – Ziele & Rückblicke
Ziele (z. B. „Bankdrücken 100 kg bis Dezember“) mit Fortschrittsbalken, Wochen-/Monats-/Jahresrückblick, Vergleich von Zeiträumen.

**Notizen:**
- Gebaut:
- Abweichungen:
- Offene Punkte:

### Schritt 17 – Self-Improvement
Journal/Dankbarkeit, Wochenreflexion, Lesen (Bücher, Seiten, Notizen), Pomodoro/Meditation-Timer, Fortschrittsfotos (lokal gespeichert, komprimiert, Speicherhinweis, im Backup optional).

**Notizen:**
- Gebaut:
- Abweichungen:
- Offene Punkte:

### Schritt 18 – Motivation & Trainingsblöcke
Badges, Streak-Übersicht über alle Bereiche, Trainingsblöcke (Aufbau/Deload/Peak) in Plänen.

**Notizen:**
- Gebaut:
- Abweichungen:
- Offene Punkte:

### Schritt 19 – PDF-Export/Berichte
Monats-/Jahresbericht als PDF (lokal erzeugt), Export einzelner Statistiken.

**Notizen:**
- Gebaut:
- Abweichungen:
- Offene Punkte:

---

## Phase 5 – Veröffentlichung

### Schritt 20 – Veröffentlichung auf GitHub Pages
**Ziel:** Die fertige App einmalig über GitHub aufs Handy bringen.
- Mit dem Nutzer klären: GitHub-Benutzername, Repo-Name, öffentliches Repo (nötig für kostenloses GitHub Pages)
- Repo anlegen (via `gh` CLI, falls vorhanden, sonst Schritt-für-Schritt-Anleitung), Remote setzen
- GitHub Action `.github/workflows/deploy.yml`: install → lint → test → build (`BASE_PATH=/<repo-name>/`) → Deploy auf GitHub Pages
- Pages in den Repo-Einstellungen aktivieren (Source: GitHub Actions)
- `README.md`: Installationsanleitung Android (Chrome → „App installieren“) und iPhone (Safari → Teilen → „Zum Home-Bildschirm“), Hinweis auf regelmäßige Backups
- Push erst nach ausdrücklicher Bestätigung durch den Nutzer
- Gemeinsamer Handytest: installieren → Flugmodus → alle Hauptbereiche durchklicken → Backup exportieren/importieren
- Gefundene Fehler beheben, erneut pushen

**Fertig wenn:** App auf Android und iPhone installiert und im Flugmodus voll nutzbar (vom Nutzer bestätigt).

**Notizen:**
- Gebaut:
- URL:
- Ergebnis Android:
- Ergebnis iPhone:
- Offene Punkte:

---

## Phase 6 – Später mit Internet/Server (nur Ausblick, keine Schritte)
- Server + Sync (nutzt vorbereitete UUIDs/Timestamps/Soft-Delete), Mehrbenutzer mit Admin-Rolle, Privatsphäre
- **„Multiplayer“-Modus** (Nutzerwunsch nach Schritt 15): Bis dahin nutzt jede Person die App über denselben Link mit eigenen Daten auf ihrem Gerät (Schritt 15b). Später überlegen, wie Geräte verbunden werden (Konto, Freunde, gemeinsame Pläne/Challenges) und ob dafür eine eigene, gehostete Version mit Server nötig ist.
- Freunde, Pläne teilen, Ranglisten, Challenges
- Garmin-Connect-/Strava-API, Schlaf/Ruhepuls/HRV-Übernahme, Online-Karten
- ~~Barcode-Scanner mit Open Food Facts online~~ → vorgezogen als Schritt 15c
- Push-Benachrichtigungen
- KI-Funktionen (Trainingsanalyse, Planvorschläge über Claude API)

## Ideen-Parkplatz
Ideen, die während der Umsetzung entstehen und keinem Schritt zugeordnet sind:
- ~~**Exzentrik (Negativ mit mehr Gewicht)**~~ – umgesetzt in Schritt 5 (siehe Notizen dort). Ursprüngliche Idee: Manche Maschinen geben in der negativen Phase mehr Gewicht als in der positiven. Umsetzungsidee: optionaler Wert pro Satz „Negativ“ (`eccentricWeight` in kg bzw. `eccentricLevel` bei Stufe), im Satz-Editor hinter einem Chip „Exzentrik“ wie RPE/RIR; wird wie das normale Gewicht in neue Sätze übernommen und an der Übung gemerkt. Anzeige z. B. „80 kg (neg. 100 kg) × 8“. Volumen/1RM/PRs (Schritt 5/7) rechnen mit dem positiven Gewicht, Exzentrik-Gewicht nur als eigener Verlauf/PR. Dexie-Version + Backup-Defaults nötig. Passt als kleiner Zusatz zu Schritt 5 oder 6. Sonstige Geräteeinstellungen (Sitz, Polster) bleiben in der Übungsnotiz.
- **Haptisches Feedback auf dem iPhone** (Nutzerwunsch, beim Feinschliff des Designs): iOS-Safari kann nicht vibrieren (`navigator.vibrate` fehlt). Ab iOS 18 gibt es einen Trick über einen versteckten `<input type="checkbox" switch>`, der beim Antippen ein haptisches Tick auslöst – **nur direkt bei einem Tipp** (z. B. Satz abhaken, Stepper), nicht automatisch am Ende der Pause. Eine **Mitteilung** am Pausenende wäre auf dem iPhone nur per Web-Push möglich (installierte PWA + Server), weil iOS die App im Hintergrund anhält → erst mit Server (Phase 6). Bis dahin: Ton + gut sichtbare Pausenleiste bei geöffneter App.
- **GPS-Tracking mit dem Handy** (beim Planen von Phase 3 verworfen): Eine PWA zeichnet nur bei eingeschaltetem Bildschirm auf (Wake Lock, Tastensperre, Lücken erkennen wären möglich). Echtes Hintergrund-Tracking nur als native App (z. B. Capacitor, App Store 99 €/Jahr). Bis dahin per Import (Schritt 14).
- **Karten, Routenplaner, Rennsimulation** (beim Planen von Phase 3 verworfen): Karte über MapLibre + OpenFreeMap (nur online), Routing über BRouter, GPX der Rennstrecke importieren, Pace-Plan mit Steigungsanpassung, Pace-Band, GPX-Export für die Uhr, Heatmap aller Strecken. Bräuchte eine Ausnahme vom Offline-Prinzip.
- **Intervalltraining mit Ansagen** (z. B. 6 × 400 m), nur sinnvoll zusammen mit GPS-Tracking.
