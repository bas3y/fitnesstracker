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
- [ ] Schritt 9 – Tägliches Tracking
- [ ] Schritt 10 – Habit-Tracker
- [ ] Schritt 11 – Supplements
- [ ] Schritt 12 – Ernährung (MVP 2 fertig)
- [ ] Schritt 13 – Ausdauer manuell
- [ ] Schritt 14 – FIT/GPX/TCX-Import
- [ ] Schritt 15 – Ausdauer-Statistiken
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
- Abweichungen:
- Offene Punkte:

### Schritt 10 – Habit-Tracker
- `habits` (Name, Icon, Frequenz: täglich / x-mal pro Woche / bestimmte Wochentage, Gruppe Morgen/Abend/Sonstiges), `habitChecks`
- Abhaken auf Tagesseite, Morgen-/Abendroutine als Checkliste
- Streak-Berechnung in `src/domain/` (mit Tests), Kalenderansicht pro Habit

**Notizen:**
- Gebaut:
- Abweichungen:
- Offene Punkte:

### Schritt 11 – Supplements
- `supplements` (Name, Dosierung, Einheit, Uhrzeiten, Bestand, Packungsgröße), `supplementIntakes`
- Abhaken pro Tag/Uhrzeit, Bestand automatisch reduzieren, Warnung bei niedrigem Bestand
- Erinnerung nur bei geöffneter App (Notification API, falls erlaubt) – Einschränkung in der UI erklären

**Notizen:**
- Gebaut:
- Abweichungen:
- Offene Punkte:

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

**Notizen:**
- Gebaut:
- Abweichungen:
- Offene Punkte:

---

## Phase 3 – Ausdauer (grob, wird zu Beginn des Schritts detailliert)

### Schritt 13 – Ausdauer manuell
Aktivitäten Laufen, Rad, Schwimmen, Wandern, Mobility/Yoga, Sonstiges: Distanz, Zeit, Pace/Geschwindigkeit, Ø-/Max-HF, Höhenmeter. Schwimmen: Bahnlänge, Bahnen, Stil, SWOLF. Schuhe mit Kilometerstand.

**Notizen:**
- Gebaut:
- Abweichungen:
- Offene Punkte:

### Schritt 14 – FIT/GPX/TCX-Import
Dateien vom Handy auswählen (Garmin-Export), lokal parsen (z. B. `fit-file-parser`, eigener GPX/TCX-Parser), Laps/Intervalle, HF-Zonen (max. HF in Einstellungen), Strecke als Linienzeichnung ohne Online-Karte.

**Notizen:**
- Gebaut:
- Abweichungen:
- Offene Punkte:

### Schritt 15 – Ausdauer-Statistiken
Wochenkilometer, Pace-Entwicklung, Zeit in HF-Zonen, Integration in Dashboard und Heatmap.

**Notizen:**
- Gebaut:
- Abweichungen:
- Offene Punkte:

---

## Phase 4 – Erweiterungen offline (grob)

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
- Freunde, Pläne teilen, Ranglisten, Challenges
- Garmin-Connect-/Strava-API, Schlaf/Ruhepuls/HRV-Übernahme, Online-Karten
- Barcode-Scanner mit Open Food Facts online
- Push-Benachrichtigungen
- KI-Funktionen (Trainingsanalyse, Planvorschläge über Claude API)

## Ideen-Parkplatz
Ideen, die während der Umsetzung entstehen und keinem Schritt zugeordnet sind:
- ~~**Exzentrik (Negativ mit mehr Gewicht)**~~ – umgesetzt in Schritt 5 (siehe Notizen dort). Ursprüngliche Idee: Manche Maschinen geben in der negativen Phase mehr Gewicht als in der positiven. Umsetzungsidee: optionaler Wert pro Satz „Negativ“ (`eccentricWeight` in kg bzw. `eccentricLevel` bei Stufe), im Satz-Editor hinter einem Chip „Exzentrik“ wie RPE/RIR; wird wie das normale Gewicht in neue Sätze übernommen und an der Übung gemerkt. Anzeige z. B. „80 kg (neg. 100 kg) × 8“. Volumen/1RM/PRs (Schritt 5/7) rechnen mit dem positiven Gewicht, Exzentrik-Gewicht nur als eigener Verlauf/PR. Dexie-Version + Backup-Defaults nötig. Passt als kleiner Zusatz zu Schritt 5 oder 6. Sonstige Geräteeinstellungen (Sitz, Polster) bleiben in der Übungsnotiz.
- **Haptisches Feedback auf dem iPhone** (Nutzerwunsch, beim Feinschliff des Designs): iOS-Safari kann nicht vibrieren (`navigator.vibrate` fehlt). Ab iOS 18 gibt es einen Trick über einen versteckten `<input type="checkbox" switch>`, der beim Antippen ein haptisches Tick auslöst – **nur direkt bei einem Tipp** (z. B. Satz abhaken, Stepper), nicht automatisch am Ende der Pause. Eine **Mitteilung** am Pausenende wäre auf dem iPhone nur per Web-Push möglich (installierte PWA + Server), weil iOS die App im Hintergrund anhält → erst mit Server (Phase 6). Bis dahin: Ton + gut sichtbare Pausenleiste bei geöffneter App.
