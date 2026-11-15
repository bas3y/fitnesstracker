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
- [x] Schritt 16 – Ziele & Rückblicke
- [x] Schritt 16b – Ziele für Gewohnheiten, Alltag & eigene Ziele, eigene Emojis
- [x] Schritt 17 – Self-Improvement (Journal, Wochenreflexion, Lesen)
- [x] Schritt 17b – Fokus-/Meditations-Timer & Fortschrittsfotos
- [x] Schritt 18 – Motivation (Serien, Abzeichen, Erfolgs-Hinweise)
- [x] Schritt 18b – Trainingsblöcke (Aufbau/Deload/Peak) in Plänen
- [x] Schritt 18c – Push & Handytest 16–18b
- [x] Schritt 18d – Design-Grundlage & Farbpaletten
- [x] Schritt 18e – Seiten aufräumen & übersichtlicher machen
- [x] Schritt 18f – Neues Logo, Animationen & Ladebildschirm
- [x] Schritt 19 – PDF-Export/Berichte
- [x] Schritt 20 – Veröffentlichung auf GitHub Pages
- [x] Schritt 21 – Standards übernehmen (Regeln, Skills, SECURITY.md)
- [x] Schritt 22 – Fotos zuverlässig & Alltag in der Statistik
- [x] Schritt 22b – Bedienung: Anpassen-Stift, interaktive Widgets, Navigation
- [x] Schritt 22c – Desktop, Tablet & Querformat
- [x] Schritt 22d – Animationen für Kacheln & Inhalte
- [x] Schritt 22e – Texte aufräumen, Erklärungen hinter Info-Button
- [x] Schritt 22f – Hauptversionen: TypeScript 7, jsdom 31 (+ iPhone-Leiste, Wackeln entfernt)
- [ ] Schritt 23 – Server-Grundlage, Anmeldung & Umzug
- [ ] Schritt 24 – Admin-Bereich & Nutzerverwaltung
- [ ] Schritt 24b – Gym-Bereich (LocalGym): eigene Oberfläche & Verwaltung
- [ ] Schritt 24c – Uhren & Smartgeräte live anbinden (Whoop, Garmin, Apple Health …)
- [ ] Schritt 24d – Push-Benachrichtigungen
- [ ] Schritt 25 – Körpermodell im Training
- [ ] Schritt 26 – Kalorienziel über Gewichtsverlauf (adaptiv)
- [ ] Schritt 27 – Belastung, Form & Regeneration (Laufcoach)
- [ ] Schritt 27b – Ausdauer-Analyse & Plan-Vorlagen (VO2max, Prognosen, Strecken)
- [ ] Schritt 28 – Körperanalyse (BIA: InBody, seca)
- [ ] Schritt 29 – Diagnostik-Berichte (Ovida u. a.) → Training & Ernährung
- [ ] Schritt 30 – Geräte-Codes an Maschinen (QR + NFC)
- [ ] Schritt 31 – KI-Grundlage: Fragen beantworten
- [ ] Schritt 32 – KI: Eintragen, Foto-Kalorien, Anpassungsvorschläge
- [ ] Schritt 32b – Kacheln öffnen als Fenster (Schnellansicht statt neuer Seite)
- [ ] Schritt 33 – Sync & Trainer-Freigabe
- [ ] Schritt 34 – Gym: Rollen & Rechte fein einstellbar
- [ ] Schritt 35 – Gym: Trainer kontaktieren (Nachrichten) & Mitteilungen
- [ ] Schritt 36 – Gym: Termine & Kurse buchen
- [ ] Schritt 37 – Gym: Wer ist gerade da?
- [ ] Schritt 38 – Freunde, Vergleiche & Challenges (+ Push & Handytest 21–38)

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
- **Push (05.11.2026):** Nutzer hat das Backup auf dem Handy bestätigt (Nutzerwunsch: vor jedem Push ausdrücklich nachfragen), Schritte 14–15c gepusht (DB-Version 17 → 22). Der erste Deploy scheiterte an `npm test` in der CI: Zwei Tests aus Schritt 12 (`nutrition.test.ts`) sortierten Einträge aus derselben Millisekunde nach `createdAt` – auf dem schnellen Server zufällig. Auch in der App betroffen (Reihenfolge nach „Wie gestern“/Lieblingsmahlzeit). Behoben: `nowIso()` (`src/db/repository.ts`) zählt in derselben Millisekunde um 1 ms weiter (bei Rücksprüngen der Uhr > 50 ms echte Zeit). Handytest laut Liste oben steht noch aus.
- **Handytest (06.11.2026):** Nutzer meldet „klappt alles“ (Punkte aus 14, 14b, 15, 15b und 15c laut Liste oben). Damit sind die offenen Handytest-Punkte dieser Schritte erledigt.
- **Deploy (erledigt 06.11.2026, Commit `527d828`, Run 42221880549 grün, Stand 14–15c live):** Vorher hing er: Zweiter Lauf (Commit `fd2b379`, Run 42055918379): Build + Tests grün, aber `actions/deploy-pages@v4` bricht mit „Timeout reached, aborting!“ ab; auch „Re-run failed jobs“ durch den Nutzer schlug fehl. Live ist noch der alte Stand (kein `ScanFoodPage` in `sw.js`). Ursache prüfen: Pages-Einstellungen/Status von GitHub Pages, ggf. `deploy-pages` auf neuere Version (Hinweis: Node-20-Actions veraltet), `timeout`-Parameter, Größe des Artefakts (Precache ~2 MB, sollte unkritisch sein). Vor einem erneuten Push wieder nach dem Backup fragen (Nutzer hat es am 05.11. bestätigt).
  - 06.11.: Build-Job war grün, nur `deploy-pages` scheiterte (Wiederholung nach 4 s). Am 04./05.11. meldete githubstatus.com mehrere Störungen bei Actions/Pages, also vermutlich GitHub-seitig. Pages-Actions auf Node 24 angehoben (`configure-pages@v6`, `upload-pages-artifact@v5`, `deploy-pages@v5`).
  - Der Push danach scheiterte an `plans.test.ts` (Aufwärmsätze „wie letztes Mal“ leer): `nowIso()` zählte bei vielen Schreibvorgängen der Uhr um > 50 ms voraus und sprang dann auf die echte Zeit zurück, wodurch das zweite Workout früher begann als das erste. Grenzwert für den Rücksprung auf 10 min angehoben, Test dafür ergänzt.
- **Beobachtung „App leer beim Teilen“ (06./07.11.2026, offen, Nutzer beobachtet weiter):** Am 06.11. (erster Tag mit 15c live) wurde der Link an ein Android-Handy geteilt. Solange die andere Person die App offen hatte (Willkommens-Schritte), war die App des Nutzers leer, danach waren alle Daten wieder da. Am 07.11. mit einem iPhone geteilt: Die Daten blieben erhalten. Laut Code gibt es keine Verbindung zwischen Geräten (kein Server, kein Sync; einzige Netzabfrage ist Open Food Facts), der Teilen-Link ist nur die nackte Adresse. Vermutung: zeitgleiches erstes Öffnen nach dem Update auf DB-Version 22 (Upgrade blockiert oder läuft noch, z. B. durch ein zweites offenes Fenster), alternativ ein anderer Speicher (Browser statt Icon). Offen: eigenes Gerät des Nutzers, ob dabei die Willkommens-Karte zu sehen war. Test zum Nachstellen: eigene App über das Icon offen lassen → andere Person öffnet den Link → leer, mit oder ohne Willkommens-Karte? → kommen die Daten ohne Neuladen zurück? Dabei **kein Backup einspielen**. Gegenmaßnahmen auf Nutzerwunsch erst am Ende (siehe Schritt 20, „Datensicherheit“).

### Schritt 16 – Ziele & Rückblicke
Ziele (z. B. „Bankdrücken 100 kg bis Dezember“) mit Fortschrittsbalken, Wochen-/Monats-/Jahresrückblick, Vergleich von Zeiträumen.

Mit dem Nutzer beim Start abgestimmt: Zielarten **Kraft, Bestzeit, Körpergewicht, Menge im Zeitraum**; Ziele und Rückblick **in der Statistik** (Umschalter „Kraft | Ausdauer | Rückblick“, Seite „Ziele“, Startseiten-Widget); Rückblick über **alle Bereiche**, immer mit dem Vorzeitraum verglichen.

**Notizen:**
- Gebaut:
  - Dexie v23: Tabelle `goals` (`Goal`: `kind`, `title`, `target` intern in kg/Wdh./s/m/Anzahl, `startDate`, `deadline`, je Art `exerciseId`/`strengthMetric`/`minReps`, `sport`/`effortMeters`, `startValue`, `totalMetric`/`period`). Backup (`goalFieldsSchema`, Sicherungen bis v22 importierbar), `goalInputSchema` prüft je Art die Pflichtfelder (Zielwert zuletzt) und leert unpassende Felder, `emptyGoalInput(kind, today)`. Schreiben über `src/db/goals.ts` (`createGoal`, `updateGoal`, `deleteGoal` weich), Daten über `loadGoalData()`.
  - **Fortschritt wird nie gespeichert**, sondern aus den Daten berechnet: `src/domain/goals.ts` (`goalProgress` → Status aktiv/erreicht/verpasst, aktueller Wert, Ausgangswert, Prozent, „erreicht am“, Tage bis Zieldatum, bei Mengen Soll bis heute, beim Gewicht nötiges Tempo pro Woche, bei wiederkehrenden Zielen „in x von y Wochen geschafft“). Kraft: bester Arbeitssatz (Gewicht optional ab x Wdh., 1RM, Wdh., Dauer; Stufen zählen nie), Ausgangswert = Bestwert vor dem Anlegen. Bestzeit: aus dem Verlauf, sonst ganze Einheit mit Ø-Pace hochgerechnet (`effortSeconds`). Gewicht: Richtung aus Start- vs. Zielgewicht. Menge: Krafttrainings, Trainings (Kraft + Ausdauer), Strecke, Ausdauer-Zeit je Woche/Monat/Jahr oder eigener Zeitraum. Automatische Namen (`goalTitle`, z. B. „Bankdrücken (Langhantel): 100 kg × 5“, „500 km Laufen pro Jahr“).
  - Gemeinsame Zeiträume `src/domain/periods.ts` (`periodRange`, `shiftPeriod`, `comparisonRange`: laufender Zeitraum nur bis zum gleichen Tag des Vorzeitraums, `formatPeriod` mit ISO-KW).
  - UI `src/features/goals/`: `GoalsPage` (`/stats/goals`, `GOALS_PATH`, aktiv nach Zieldatum, „Abgeschlossen“), `GoalCreatePage`/`GoalEditPage` mit `GoalForm` (Art, Übung per `ExercisePicker`, Strecke als Chips, Zielzeit per `DurationInput`, „Bisher bester Wert …“ bzw. „Ziel schon am … erreicht“, Löschen mit Rückfrage), `GoalCard` (Balken mit Soll-Marke, Statuszeile), Widget `goals` (`GoalsWidget`, bis zu 3 offene Ziele). Link „🎯 Ziele“ oben in der Statistik.
  - **Rückblick:** `view=review` + `period`/`date` in der URL (`useStatsFilter`, `REVIEW_STATS_PATH`), `ReviewStats` mit Woche/Monat/Jahr, Vor/Zurück. Karten Training (Trainingstage, Krafttrainings, Arbeitssätze, Volumen, Kraft-Rekorde, Ausdauer-Einheiten/-Zeit/Strecke/Höhenmeter, neue Bestzeiten, je Sportart), Alltag (Ø Schritte/Schlaf/Wasser/Stimmung/Energie/Ruhepuls, letztes Gewicht, Gewohnheiten erledigt), Ernährung (Tage, Ø kcal, Ø Protein; nur Protein im Protein-Modus), im Zeitraum erreichte Ziele. Unterschied zum Vorzeitraum grün/rot (Gewicht und kcal neutral). Logik `src/domain/review.ts` (`reviewSummary`), Laden `loadReviewInput` (`src/db/review.ts`). Rekordzählung als `countRecordsBetween` aus `trainingProgress` herausgezogen.
  - `DurationInput` aus `SessionForm` nach `src/components/` verschoben.
  - Tests: `goals.test.ts`, `periods.test.ts`, `review.test.ts`, `db/goals.test.ts`, Migration v22→v23, Backup. E2E `e2e/goals.spec.ts` offline in beiden Viewports (Kraftziel mit Fehler ohne Übung, Vorschlag/Bisher, Mengen-Ziel pro Woche, Widget, Ziel vom Widget aus ändern → erreicht, Löschen, Neuladen; Rückblick Monat/Woche/Jahr mit Vergleich, Blättern, leerer Zeitraum, URL übersteht Neuladen). `mvp1` zählt ein Widget mehr. 694 Unit-Tests, 96/96 E2E grün. Hauptbundle 320 → 325 KB (Widget „Ziele“), Seiten als eigene Chunks.
- Abweichungen:
  - Kraft- und Bestzeit-Ziele zählen den Allzeit-Bestwert: Wer das Ziel schon früher geschafft hat, sieht es sofort als erreicht (das Formular weist darauf hin). Gewicht und Mengen zählen erst ab dem Beginn.
  - Bestzeit-Ziele werten anders als die Statistik-Bestzeiten auch Einheiten ohne Verlauf aus (Ø-Pace über die ganze Einheit), damit Ziele ohne Uhr erreichbar sind. Nur Laufen und Rad (Strecken wie bei den Bestzeiten).
  - Kein Rekord-Toast beim Erreichen eines Ziels (passt zu Schritt 18 „Motivation“). Ziele ohne Archiv: abgeschlossene stehen unten, löschen ist möglich.
  - Rückblick ohne Diagramme (nur Kennzahlen mit Unterschied); Krafttraining-Dauer fehlt (die Statistik lädt kein Workout-Ende). Erreichte wiederkehrende Ziele erscheinen nicht unter „Ziele“ im Rückblick.
- Offene Punkte:
  - Rückblick als Teilen-Bild oder PDF → Schritt 19 (Berichte) kann `reviewSummary` direkt nutzen.
  - Ziele für Gewohnheiten, Schritte oder Körpermaße wären naheliegende weitere Arten.
  - Hinweis/Toast „Ziel erreicht“ und Ziel-Badges → Schritt 18.
  - Handytest: Formular (Datumsfelder, ExercisePicker) und Lesbarkeit der Rückblick-Zeilen auf kleinen Displays.

### Schritt 16b – Ziele für Gewohnheiten, Alltag & eigene Ziele, eigene Emojis
**Ziel:** Nutzerwunsch nach Schritt 16 (alles offline). Mit dem Nutzer abgestimmt: als eigener Schritt vor 17, weil die Ziel-Logik aus 16 erweitert wird; Schritt 17 nutzt die Ziele dann nur (z. B. Bücher-Log als Quelle für Lese-Ziele).
- **Zielart „Gewohnheit“** (Gewohnheit wählen, Fortschritt aus `habitChecks`, keine neue Tabelle):
  - Menge (`count`, z. B. Lesen): Summe im Zeitraum – „1000 Seiten bis 31.12.“, „300 Seiten pro Monat“.
  - Tage (`check`/`items`): erledigte Tage – „Meditieren an 100 Tagen im Jahr“.
  - Aufhören (`quit`, z. B. Rauchen): **Serie** „30 Tage am Stück rauchfrei“ (Rückfall setzt zurück, beste Serie mit anzeigen) **und Reduzieren** „höchstens 20 Zigaretten pro Woche/Monat“ (Obergrenze, weniger ist besser; laufender Zeitraum zeigt, wie viel noch übrig ist, Überschreiten = verfehlt).
- **Alltagswerte** in der Zielart „Menge“: Schritte gesamt („300.000 Schritte im Monat“) und Tage mit erreichtem Tagesziel bei Schritten, Wasser, Schlaf.
- **Eigenes Ziel:** freier Name, optional eigenes Emoji, zwei Formen:
  - mit Zahl (Zielwert + Einheit, z. B. „Spanisch: 50 Lektionen“), Fortschritt selbst eintragen (+1/+x, Rückgängig) auf der Ziele-Seite und im Widget;
  - Ja/Nein (z. B. „Führerschein machen“), wird abgehakt.
  - Einträge einzeln gespeichert (neue Tabelle `goalEntries` mit Datum und Menge, Dexie v24 + Backup), damit „erreicht am“ und der Rückblick funktionieren.
- **Eigene Emojis:** Gewohnheiten (und eigene Ziele) bekommen neben den Vorschlägen ein Feld „Eigenes Emoji“ (Emoji-Tastatur des Handys, genau ein Emoji, per `Intl.Segmenter` geprüft). Schema erlaubt schon jedes Zeichen, also keine Migration für Gewohnheiten.
- **Rückblick:** Summen der Gewohnheiten mit Menge („Lesen: 420 Seiten (+80)“), Rückfälle bei Aufhören-Gewohnheiten (weniger = grün), erreichte neue Ziele.
- Vor dem nächsten Push an ein Backup erinnern (DB-Version 22 → 24).

**Notizen:**
- Gebaut:
  - Dexie v24: `Goal` um `habitId`, `habitMetric` (`amount`/`days`/`streak`/`limit`), `customType` (`number`/`check`), `unit`, `icon` erweitert (Upgrade setzt `null`/`''`), neue Tabelle `goalEntries` (`goalId`, `date`, `amount`). Backup: Defaults für Ziele aus v23, `goalEntries` als leere Tabelle für ältere Sicherungen. `GOAL_KINDS` + `habit`, `custom`; `TOTAL_GOAL_METRICS` + `steps`, `stepsGoalDays`, `waterGoalDays`, `sleepGoalDays`. `goalInputSchema`: Zeitraum Pflicht für Menge und Gewohnheit außer Serie (`usesPeriod`), Zielwert 0 nur bei Obergrenze, Ja/Nein immer Zielwert 1, eigenes Ziel braucht Namen, `icon` muss genau ein Emoji sein; unpassende Felder werden geleert.
  - `src/domain/goals.ts`: `GoalData` + `logs`, `dailyGoals`, `habits`, `entries`. Gewohnheit: Menge = Summe (nur die Gewohnheit selbst, keine Unterpunkte), Tage = `doneDates`, **Serie** über `quitStreakDays` (neu in `habits.ts`, `quitStreak` nutzt sie; aktuelle + beste Serie, erreicht sobald eine Serie den Zielwert erreicht), **Obergrenze** (`limitProgress`: Balken = verbrauchter Anteil, `remaining`, wiederkehrend immer aktiv mit Verlauf „in x von y Wochen geschafft“ = unter der Grenze, eigener Zeitraum: überschritten = verpasst, sonst am Ende erreicht). Alltag: Schritte gesamt, Tage mit erreichtem Tagesziel (aktuelle Einstellungen). Eigenes Ziel: Summe der Einträge, mit Zieldatum Soll-Marke. `habitMetricsFor`, `isCountGoal`, `hasPeriod`, `goalIcon`, `goalSubject` (Übung bzw. Gewohnheit → `GoalSubject`, ersetzt den `exercise`-Parameter von `goalTitle`/`goalName`/`formatGoalValue`). Namen z. B. „Lesen: 300 Seiten pro Monat“, „Meditieren: an 100 Tagen pro Jahr“, „Rauchen: 30 Tage am Stück“, „Rauchen: höchstens 20 Zigaretten pro Woche“, „300.000 Schritte pro Monat“, „20 Tage mit Schrittziel pro Monat“.
  - `src/db/goals.ts`: `addGoalEntry`, `undoGoalEntry` (letzter Eintrag), `setGoalChecked`, `deleteGoal` löscht Einträge mit, `loadGoalExtras()` (alles außer Training; das Startseiten-Widget nutzt die schon geladenen Trainings).
  - UI: Zielart als 3×2-Raster (6 Arten passen nicht in einen Umschalter). Karte „Gewohnheit“ (Auswahl ohne archivierte, Kennzahl je Art, Hinweis, Zeitraum außer bei Serie, Zielwert mit Vorschlag aus dem Tagesziel; ohne Gewohnheiten Link „Gewohnheit anlegen“). Karte „Eigenes Ziel“ (Name, Emoji, „Mit Zahl“ mit Zielwert + Einheit oder „Ja/Nein“). Menge zeigt bei Tagesziel-Kennzahlen, welches Ziel zählt. `GoalCard`: Symbol der Gewohnheit/eigenes Emoji, Obergrenze mit „2 / 20“, „Noch 18 übrig“ bzw. „um 3 überschritten“ (rot, gelb wenn über dem Soll), Serie mit „Beste Serie“, eigene Ziele mit Buttons **+1**, **+x** (Dialog mit Menge), **Rückgängig** bzw. **✓ Erledigt/Zurücknehmen** – auf der Ziele-Seite und im Widget (Buttons unter dem Link, nicht darin).
  - **Eigenes Emoji:** `EmojiPicker` (`src/components/`): Vorschläge + Feld „Eigenes Emoji“, Prüfung `isSingleEmoji`/`parseEmoji` (`src/domain/emoji.ts`, `Intl.Segmenter`, Rückfall für alte Browser). In `HabitForm` und für eigene Ziele (dort optional, leer = 🎯). Keine Migration für Gewohnheiten.
  - **Rückblick:** Karte „Gewohnheiten“ mit Summen der Zähl-Gewohnheiten und Rückfällen bei Aufhören (weniger = grün), `ReviewSummary.habitTotals`, `ReviewInput.habits` braucht jetzt `id`/`name`/`icon`/`unit`. Erreichte Ziele lädt der Rückblick jetzt über `useGoalData()` (zählt damit alle neuen Arten).
  - Tests: Schema, alle neuen Kennzahlen, Namen/Symbole in `goals.test.ts`, `emoji.test.ts`, `habitTotals` in `review.test.ts`, Einträge/Abhaken/Löschen/`loadGoalData` in `db/goals.test.ts`, Migration v23→v24, Backup (eigene Ziele + Einträge, Sicherung aus v23). E2E `e2e/habitGoals.spec.ts` offline in beiden Viewports (eigenes Emoji mit Fehler, Menge/Serie/Obergrenze, Rückblick mit roter Differenz, Neuladen; eigenes Ziel mit Namensfehler, Emoji, +1/+x/Rückgängig, Ja/Nein im Widget abhaken → abgeschlossen, Neuladen, Löschen). 718 Unit-Tests, 100/100 E2E grün. Hauptbundle 325 → 331 KB (Widget lädt Gewohnheiten/Einträge, Karte mit Eintragen-Buttons).
- Abweichungen:
  - Serie nur für Aufhören-Gewohnheiten (für Abhaken gibt es die Serie schon auf der Gewohnheit). Sie zählt wie Kraftziele ab Beginn der Gewohnheit: wer schon 40 Tage geschafft hat, sieht ein 30-Tage-Ziel sofort als erreicht.
  - Menge bei Zähl-Gewohnheiten nur für `count` (Unterpunkte haben verschiedene Einheiten); Tage auch für Zählen (Tage mit erreichtem Tagesziel).
  - Eigene Ziele mit Zahl sind einmalig (optional mit Zieldatum), nicht wiederkehrend. Einträge immer mit dem heutigen Datum, „Rückgängig“ nimmt den zuletzt eingetragenen zurück (auch nach Neuladen).
  - Eigenes Emoji nur für eigene Ziele, nicht für die übrigen Zielarten (dort Symbol der Art bzw. der Gewohnheit).
  - Tagesziel-Kennzahlen rechnen mit dem **aktuellen** Tagesziel aus den Einstellungen, auch rückwirkend (Hinweis im Formular).
  - Pausen einer Gewohnheit ändern Menge, Tage und Obergrenze nicht (gezählt wird, was eingetragen ist); die Serie überspringt Pausen wie `quitStreak`.
- Offene Punkte:
  - Kein Hinweis/Toast beim Erreichen eines Ziels (weiter Schritt 18).
  - Schritt 17 (Bücher-Log) kann eine Quelle für Lese-Ziele werden: neue Kennzahl in `TOTAL_GOAL_METRICS` oder Zielart, Punkte in `goalPoints`.
  - Handytest: Emoji-Tastatur in „Eigenes Emoji“ (iPhone/Android), Darstellung zusammengesetzter Emojis (Flaggen, Hauttöne), Dialog „+x“ mit Bildschirmtastatur.
  - Vor dem nächsten Push an ein Backup erinnern (DB-Version 22 → 24).

### Schritt 17 – Self-Improvement
Journal/Dankbarkeit, Wochenreflexion, Lesen (Bücher, Seiten, Notizen). Timer und Fortschrittsfotos → Schritt 17b.

Mit dem Nutzer beim Start abgestimmt: **aufgeteilt in 17 + 17b**; Ort = **eine große Kachel unter den Alltag-Kacheln** (wie „Krafttraining“ auf der Trainingsseite, nur darunter); Journal = **Freitext + 3× Dankbarkeit + eigene Fragen**, die man **auf der Seite selbst unter „Anpassen“** anlegt (nicht in den Einstellungen); Lesen/Timer **mit Zielen und einer Gewohnheit verknüpfbar**.

**Notizen:**
- Gebaut:
  - Dexie v25: Tabellen `journalPrompts`, `journalEntries` (Index `[kind+date]`), `books`, `readingLogs`, `bookNotes`; `Settings.readingHabitId` (Upgrade setzt `null`). Backup mit allen fünf Tabellen, Sicherungen bis v24 importierbar (leere Tabellen, `readingHabitId: null`).
  - **Große Kachel** `SelfSection` „🌱 Persönliche Entwicklung“ unter den Alltag-Kacheln, je Zeile der Stand des gewählten Tages: Journal („Geschrieben · 2× dankbar“), Wochenreflexion („1 von 3 Fragen“, „Erledigt · 4/5“), Lesen (Seiten des Tages, aktuelles Buch mit Seite/Prozent).
  - **Journal** (`/daily/journal`, mit `DayNavigator`): „Wie war dein Tag?“, „Dankbar für“ (3 Felder), eigene Fragen. Speichert automatisch (600 ms nach dem Tippen, beim Verlassen des Felds/der Seite, wenn die App in den Hintergrund geht), Status „Gespeichert“. Leerer Eintrag wird gelöscht. „Anpassen“: eigene Fragen anlegen (mit Vorschlägen), in der Zeile umbenennen, ziehen, entfernen (archiviert; Antworten an alten Tagen bleiben mit „(entfernte Frage)“ sichtbar), höchstens 20 je Art.
  - **Wochenreflexion** (`/daily/reflection`, Woche aus dem gewählten Tag, ‹ › je Woche, nicht in die Zukunft): Bewertung 1–5, feste Fragen „Was lief diese Woche gut?“, „Was möchte ich ändern?“, „Worauf konzentriere ich mich nächste Woche?“, eigene Wochenfragen (eigenes „Anpassen“), Notizen. Gespeichert unter dem Montag.
  - **Alle Einträge** (`/daily/journal/history`): Tage und Wochen, neueste zuerst, Suche über alle Felder (Umlaute/ß egal, alle Wörter müssen vorkommen), Vorschau, Tippen öffnet den Tag bzw. die Woche.
  - **Lesen** (`/daily/reading`): Seiten heute/diese Woche, „Lese ich gerade“ mit Fortschrittsbalken und „Seiten eintragen“ (Dialog „Bis Seite“ | „Seiten gelesen“, Tag wählbar), „Will ich lesen“, „Gelesen (n)“ mit Datum und Sternen, „Abgebrochen“ zum Aufklappen, Karte „Mit Gewohnheit verknüpfen“ (nur aktive Zähl-Gewohnheiten). Buch-Seite: Status-Buttons (Jetzt beginnen / Gelesen / Abbrechen / Weiterlesen), Bewertung, Notizen & Zitate mit Seite, Verlauf der Einträge (Löschen mit Rückfrage). Formular mit Titel, Autor, Seitenzahl, Status, „Vorher schon gelesen bis Seite“, Daten, Bewertung; Löschen samt Einträgen/Notizen.
  - Automatik beim Eintragen (`addReadingLog`): „Will ich lesen“/„Abgebrochen“ → „Lese ich“, ein früherer Tag verschiebt den Beginn, die letzte Seite beendet das Buch (Hinweis „Buch gelesen!“). Seiten zählen bei der verknüpften Gewohnheit mit (`readingLogs.habitId`), Löschen eines Eintrags/Buchs zieht sie dort wieder ab.
  - **Ziele:** Menge um „Gelesene Seiten“ und „Gelesene Bücher“ erweitert (`TOTAL_GOAL_METRICS` `pages`/`books`, `GoalData.reading`/`finishedBooks`, Namen „500 Seiten pro Monat“, „12 Bücher pro Jahr“).
  - **Rückblick:** Karte „Persönliche Entwicklung“ (Tage mit Journal, Wochenreflexionen, Ø Bewertung der Woche, gelesene Seiten, gelesene Bücher) mit Vergleich (`ReviewSummary.growth`).
  - **Schnellzugriff:** Buttons „Journal“ und „Lesen“ (nicht in der Standardauswahl).
  - `useDayParam().setDate` behält jetzt die Herkunft (`state`), „Zurück“ führt also auch nach einem Tageswechsel zur aufrufenden Seite (gilt für alle Alltag-Unterseiten).
  - Tests: `domain/journal.test.ts`, `domain/reading.test.ts`, Lese-Ziele in `goals.test.ts`, `growth` in `review.test.ts`, `db/journal.test.ts`, `db/reading.test.ts` (Gewohnheit zählt mit/zieht ab, archivierte nicht, Buch löschen, `loadGoalData`), Migration v24→v25, Backup (Wiederherstellen + Sicherung aus v24). E2E `e2e/self.spec.ts` offline in beiden Viewports (Journal mit Autospeichern, Anpassen mit Fehler/Vorschlag/Entfernen, Neuladen, Wochenreflexion mit Blättern und Zurück zur Herkunft, Suche; Lesen mit Gewohnheit, Buch-Formular mit Fehler, Bis Seite/Seiten gelesen, Notiz, Buch beendet, Bewertung, Eintrag löschen zieht ab, Ziel „Gelesene Seiten“, Neuladen). 748 Unit-Tests, 104/104 E2E grün. Hauptbundle 331 → 334 KB (Typen/Labels, Schnellzugriff), Seiten als eigene Chunks.
- Abweichungen:
  - Wochenreflexion als eigene Seite (erreichbar über die große Kachel und das Journal) statt als Teil des Journals; Bewertung der Woche zusätzlich zum Plan.
  - Nur Gewohnheiten der Art „Zählen“ lassen sich mit dem Lesen verknüpfen (Seiten sind eine Menge). Seiten, die vor der Verknüpfung eingetragen wurden, werden nicht nachgetragen.
  - Löschen eines Buchs zieht dessen Seiten bei der Gewohnheit wieder ab (gleiche Regel wie beim einzelnen Eintrag).
  - „Vorher schon gelesen bis Seite“ zählt nicht zu Zielen und Rückblick (dort nur in der App eingetragene Seiten).
  - Fortschritt nur in Seiten (kein Prozent-/Minuten-Modus, keine E-Books/Hörbücher als eigene Art).
- Offene Punkte:
  - Schritt 17b: Timer und Fortschrittsfotos als weitere Zeilen in `SelfSection`.
  - Kein Startseiten-Widget für Journal/Lesen (Schnellzugriff vorhanden); ggf. Schritt 18 (Streaks: Journal-Serie).
  - Journal im PDF-Bericht → Schritt 19 (Inhalte stehen in `journalEntries`).
  - Handytest: Autospeichern beim Wechsel in eine andere App (iOS/Android), Bildschirmtastatur bei langen Texten, Ziehen der Fragen, Datumsfeld im Seiten-Dialog.
  - Vor dem nächsten Push an ein Backup erinnern (DB-Version 22 → 25).

### Schritt 17b – Fokus-/Meditations-Timer & Fortschrittsfotos
**Ziel:** Rest aus Schritt 17 (mit dem Nutzer abgestimmt: aufgeteilt). Beide Bereiche als weitere Zeilen in der großen Kachel `SelfSection`.
- **Timer:** Pomodoro (Fokus/Pause, Runden) und Meditation (Dauer, Gong am Ende), läuft über Zeitstempel weiter (wie der Pausen-Timer), Sitzungen speichern (Art, Dauer, Tag, optional Notiz). Mit einer Gewohnheit verknüpfbar (Minuten zählen mit, wie beim Lesen) und neue Ziel-Kennzahl „Fokus-/Meditationsminuten“, Rückblick.
- **Fortschrittsfotos:** lokal in IndexedDB (Blob), beim Speichern verkleinert/komprimiert (Canvas, JPEG/WebP), Ansicht je Datum, Vergleich zweier Fotos, Speicherhinweis (`navigator.storage.estimate`), im Backup **optional** (Schalter beim Export, sonst zu groß).
- Vor dem nächsten Push an ein Backup erinnern.

**Notizen:**
- Gebaut:
  - Dexie v26: Tabellen `timerSessions` (Art, Tag, `startedAt` bzw. `null` = nachgetragen, Dauer ohne Pausen, Runden, Notiz, `habitId`/`habitAmount`), `progressPhotos` (Tag, Ansicht Vorne/Seite/Hinten/Sonstige, Notiz, Maße, Bytes) und `photoFiles` (je Foto zwei Zeilen `full`/`thumb` als `ArrayBuffer`, Index `[photoId+variant]`); `Settings.timerPresets`, `activeTimer`, `focusHabitId`, `meditationHabitId`.
  - **Timer** (`/daily/timer`, `TimerPage`): Fokus (Fokuszeit/Pause/Runden, Standard 25/5/4, keine Pause nach der letzten Runde) und Meditation (Chips 5–30 min + Stepper). Laufender Timer nur als Zeitstempel in `Settings.activeTimer` (`startedAt`, `pausedAt`, `pausedSeconds`, `skippedSeconds`, Phasenliste), Berechnung in `src/domain/timer.ts` (`timerState`, `timerResult` …) → läuft nach Neuladen weiter. Anhalten/Fortsetzen, „Pause überspringen“ (nur Pausen, Fokuszeit bleibt genau), „Beenden“ mit Speichern/Verwerfen/Weiterlaufen. Gong per Web Audio (`playGong` in `restAlarm.ts`, leiser beim Wechsel zurück in den Fokus), Meditation mit Gong zu Beginn, Bildschirm bleibt an (`useWakeLock`). `TimerAlarm` im Layout klingelt bei Phasenwechseln auf jeder Seite und speichert einen abgelaufenen Timer (auch nach Neuladen, dann ohne Gong) mit Hinweis „… beendet · x min gespeichert“; `finishTimer(startedAt)` schützt vor doppeltem Speichern. Liste der Sitzungen des Tages mit Notiz und Löschen, Summen Tag/Woche, „Sitzung nachtragen“.
  - **Gewohnheit** je Art verknüpfbar: Zählen → Minuten addiert, Abhaken → Tag abgehakt; Löschen zieht ab bzw. nimmt den Haken erst mit der letzten Sitzung des Tages zurück.
  - **Ziele:** Menge um „Fokus-Minuten“/„Meditationsminuten“ (`TOTAL_GOAL_METRICS` `focusTime`/`meditationTime`, intern Sekunden, Namen „300 min Meditation pro Monat“). **Rückblick:** Fokus-Zeit und Meditation in „Persönliche Entwicklung“. **Schnellzugriff:** „Timer“, „Foto“.
  - **Fortschrittsfotos** (`/daily/photos`): Aufnehmen/Auswählen (`<input type="file" accept="image/*">`), per Canvas verkleinert (JPEG, längste Seite 1600 px, Vorschau 400 px, EXIF-Drehung über `createImageBitmap`, `prepareImage.ts`), Dialog mit Vorschau, Tag, Ansicht, Notiz. Raster je Tag (nur Vorschauen geladen), Filter nach Ansicht (in der URL), Detailseite (Angaben ändern, löschen – Bilddaten werden wirklich entfernt), **Vergleich** (`/daily/photos/compare?a=&b=`): Vorher/Nachher nebeneinander, Abstand („30 Tage später“), Gewicht am Tag bzw. bis 7 Tage daneben, Auswahl beider Fotos, „Seiten tauschen“. Speicher-Karte (Fotos-Größe, `navigator.storage.estimate`, Hinweis auf Backup und nicht dauerhaften Speicher).
  - **Backup:** Schalter „Fortschrittsfotos einschließen“ (nur wenn Fotos da sind, mit geschätzter Größe). Bilddaten als Base64. Sicherung ohne Fotos lässt beim Import die Fotos auf dem Gerät unberührt (`backupHasPhotos`), mit Fotos werden sie ersetzt; Hinweis in der Import-Vorschau. Sicherungen bis v25 importierbar.
  - `SelfSection`: Zeilen „Fokus & Meditation“ (läuft: Phase + Restzeit, sonst Minuten des Tages) und „Fortschrittsfotos“.
  - Tests: `domain/timer.test.ts`, `domain/photos.test.ts`, `db/timer.test.ts`, `db/photos.test.ts`, Timer-Ziele in `goals.test.ts`, `review.test.ts`, Migration v25→v26, Backup (mit/ohne Fotos, kaputte Bilddaten, Sicherung aus v25). E2E `e2e/timerPhotos.spec.ts` offline in beiden Viewports (Timer mit `page.clock`: Neuladen, Anhalten, Pause überspringen, automatisches Speichern, Notiz, Meditation mit Gewohnheit, vorzeitig beenden, Nachtragen, Löschen, Ziel; Fotos: Verkleinern hoch/quer, Filter, Vergleich + Zurück mit Filter, ändern, löschen, Backup mit Fotos → DB löschen → Import). 784 Unit-Tests, 108/108 E2E grün. Hauptbundle ~333 KB (unverändert), Seiten als eigene Chunks.
- Abweichungen:
  - Timer-Zustand in `Settings` statt eigener Tabelle (es gibt höchstens einen). Fokus-Phasen laufen automatisch weiter (keine Bestätigung je Runde); kein langer Pause-Block nach x Runden.
  - Gewohnheiten zum Verknüpfen: Zählen **und** Abhaken (Plan: wie beim Lesen nur Minuten), weil „Meditieren“ meist eine Abhak-Gewohnheit ist.
  - Fotos als `ArrayBuffer` statt Blob (robuster in älterem Safari und in Tests), immer JPEG (Safari kann kein WebP per Canvas erzeugen).
  - Backup-Vorschau zählt wie bei allen Tabellen auch gelöschte Fotos (ohne Bilddaten).
- Offene Punkte:
  - **Handytest:** Gong bei gesperrtem Bildschirm/App im Hintergrund (iOS hält die App an → kein Ton; Wake Lock hält den Bildschirm an), Lautstärke/Stummschalter, Kamera-Auswahl beim Foto (iPhone HEIC → JPEG), Speicherplatz bei vielen Fotos, Backup-Datei mit Fotos teilen (Größe).
  - Kein Overlay-/Schieberegler-Vergleich, keine Raster-Hilfslinien beim Aufnehmen, keine Erinnerung „Zeit für ein neues Foto“ (ggf. Schritt 18).
  - Timer-Sitzungen erscheinen nicht im Gewohnheiten-Verlauf als eigene Quelle; Journal-/Meditations-Serie → Schritt 18.
  - Vor dem nächsten Push an ein Backup erinnern (DB-Version 22 → 26).

### Schritt 18 – Motivation
Badges, Streak-Übersicht über alle Bereiche. Trainingsblöcke → Schritt 18b.

Mit dem Nutzer beim Start abgestimmt: **aufgeteilt in 18 + 18b**; Serien für **Training, Gewohnheiten, Journal/Meditation/Lesen und Tagesziele**; Abzeichen als **feste Liste mit Stufen, aus den Daten berechnet**, Hinweis beim Freischalten, Seite mit allen (gesperrte grau mit Fortschritt); Ort = **Seite „🏆 Erfolge“ in der Statistik** neben „🎯 Ziele“ + **Startseiten-Widget**.

**Notizen:**
- Gebaut:
  - Dexie v27: `Settings.trainingWeekTarget` (Standard 2) und `Settings.celebrations` (`{ badges: Abzeichen → gemeldete Stufe, goals: Ziel → Schlüssel des Erreichens }`, `null` = noch nie abgeglichen). Backup: Sicherungen bis v26 importierbar (Standard 2 bzw. `null`).
  - **Serien** (`src/domain/streaks.ts`): `daySeries`/`weekSeries` → `summarizeRuns` (aktuell, beste, heute geschafft; heute offen unterbricht nichts), `runReachedOn`. Bereiche: **Training** (Wochen Mo–So mit mind. x Trainings, Kraft-Workouts + Ausdauer-Einheiten), **Schritt-/Wasser-/Schlafziel** (aktuelle Tagesziele), **Proteinziel** (Trainings-/Ruhetag, Mahlzeiten + schnell erfasstes Protein), **Supplements** (alle fälligen Einnahmen genommen; Tage ohne fällige zählen nicht), **Journal** (nur Tage, nicht Wochenreflexion), **Meditation**, **Fokus**, **Lesen**, jede nicht archivierte **Gewohnheit** (`habitStreak` bzw. `quitStreak`). `streakOverview` sortiert laufende zuerst (Wochen zählen wie 7 Tage) und lässt Bereiche ohne je geschaffte Serie weg.
  - **Abzeichen** (`src/domain/badges.ts`): 17 Abzeichen in 3 Gruppen mit 3–6 Stufen – Training (Krafttrainings, Ausdauer-Einheiten, Strecke, bewegte Last, Rekorde, Trainingsserie), Alltag (Gewohnheitsserie, Schritte gesamt, Tage mit Wasser-/Schlaf-/Proteinziel), Persönliche Entwicklung (Journal-Tage, Bücher, Meditation, Fokus, erreichte Ziele, Fortschrittsfotos). `evaluateBadges` berechnet Wert, Stufe und „erreicht am“ je Stufe; Anzeige in Gewichts-/Streckeneinheit des Nutzers (`formatBadgeValue`, `formatBadgeTier`). Rekorde je Einheit: `recordCounts` (`src/domain/stats.ts`).
  - **Erfolgs-Hinweise:** `celebrate` (`src/domain/celebrations.ts`) vergleicht mit `Settings.celebrations` – erster Abgleich still, Stufen werden nie zurückgenommen, wiederkehrende Ziele je Zeitraum einmal, gelöschte Ziele fallen heraus; Titel „Neues Abzeichen!“/„Ziel erreicht!“/„Geschafft!“, höchstens 4 Zeilen. `checkCelebrations()` (`src/db/motivation.ts`, schreibt nur bei Änderung, prüft in der Transaktion auf gleichzeitigen Abgleich). `CelebrationWatcher` (lazy im Layout) prüft sofort beim Start (damit der stille erste Abgleich vor dem ersten Erfolg liegt) und reagiert auf `Dexie.on.storagemutated` (1,5 s gesammelt, spätestens nach 5 s, laufende Sätze/Verläufe/Bilddaten ignoriert); der Hinweis wartet, bis ein anderer (z. B. Rekord) verschwunden ist. Damit gibt es jetzt auch den offenen „Ziel erreicht“-Hinweis aus Schritt 16/16b.
  - **UI** `src/features/motivation/`: `AchievementsPage` (`/stats/achievements`, `ACHIEVEMENTS_PATH`, Link „🏆 Erfolge“ oben in der Statistik): Karte „Serien“ (Symbol, Status „Heute geschafft/noch offen/Unterbrochen“, beste Serie, 🔥 wenn heute geschafft), Karte „Trainingsserie“ (Stepper „Trainings pro Woche“), „Abzeichen“ je Gruppe als 3er-Raster (Ring je Stufe Bronze/Silber/Gold/…, gesperrt grau) mit Dialog (was zählt, bisher, Balken zur nächsten Stufe, alle Stufen mit Datum). Widget `motivation` „Serien & Abzeichen“ (`MotivationWidget`, lazy): bis zu 3 laufende Serien + nächstes Abzeichen mit Balken. Daten: `loadMotivation()`/`useMotivation(today)`.
  - Widget „Erfolge“ (neueste Rekorde) heißt jetzt **„Neue Rekorde“**, damit es nicht mit der Seite „Erfolge“ verwechselt wird.
  - Tests: `streaks.test.ts`, `badges.test.ts`, `celebrations.test.ts`, `recordCounts` in `stats.test.ts`, `db/motivation.test.ts` (Laden, erster stiller Abgleich, Ziel + Abzeichen einmal gemeldet, gelöschtes Ziel), Migration v26→v27, Backup (Erfolge bleiben, Sicherung aus v26). Testdaten `src/test/motivationData.ts`. E2E `e2e/motivation.spec.ts` offline in beiden Viewports (Widget leer, alles gesperrt, erstes Training → Hinweis, Wochenziel senken → Trainingsserie, Abzeichen-Dialog mit Datum, Journal → Hinweis, eigenes Ziel abhaken → „Geschafft!“, Neuladen ohne erneuten Hinweis, Widget → Erfolge → Zurück); `mvp1` zählt ein Widget mehr. 815 Unit-Tests, 110/110 E2E grün. Hauptbundle ~332 KB (unverändert, Logik in eigenen Chunks).
- Abweichungen:
  - Abzeichen werden aus den Daten berechnet: Wer Daten löscht, verliert die Stufe in der Anzeige wieder (gemeldet wird sie trotzdem nicht erneut). „Gewohnheitsserie“ zeigt kein Datum je Stufe (die Serie der Gewohnheit kennt den Tag nicht) und zählt nur tägliche/feste Tage und Aufhören, nicht „x-mal pro Woche“.
  - „Ziele“-Abzeichen zählt nur erreichte einmalige Ziele; wiederkehrende (z. B. „12 Trainings pro Monat“) melden aber jeden erreichten Zeitraum als Hinweis.
  - Tagesziel-Serien und -Abzeichen rechnen wie die Ziele mit den **aktuellen** Zielen aus den Einstellungen, auch rückwirkend.
  - Kein Schalter zum Abstellen der Hinweise (bei Bedarf nachrüsten). Abzeichen-Liste ist fest (keine eigenen Abzeichen).
  - Bearbeitete Sätze in einem beendeten Workout lösen allein keinen Abgleich aus (erst die nächste andere Änderung oder der nächste Start).
- Offene Punkte:
  - **Handytest:** Lesbarkeit des Abzeichen-Rasters und der Serien auf kleinen Displays, Hinweis nach „Workout beenden“ (kommt nach 1,5 s oben), Rechenzeit der Erfolge-Seite mit vielen Daten.
  - Journal-/Meditations-Serie ist jetzt in der Übersicht (offener Punkt aus 17/17b erledigt); Foto-Erinnerung „Zeit für ein neues Foto“ weiterhin offen.
  - Abzeichen/Serien im PDF-Bericht → Schritt 19 (`evaluateBadges`, `streakOverview`).
  - Vor dem nächsten Push an ein Backup erinnern (DB-Version 22 → 27).

### Schritt 18b – Trainingsblöcke (Aufbau/Deload/Peak) in Plänen
**Ziel:** Rest aus Schritt 18 (mit dem Nutzer abgestimmt: aufgeteilt). Setzt auf `plans`/`planDays`/`planExercises` und `startPlanWorkout` auf.
- Pläne bekommen optional eine Abfolge von **Blöcken** (Art: Aufbau, Deload, Peak/Intensität, ggf. Test; Dauer in Wochen; Startdatum), aktueller Block + Woche („Aufbau · Woche 2 von 4“) auf der Trainingsseite, im Vorschlag und im laufenden Workout.
- **Vorbefüllen je Block:** z. B. Deload mit weniger Sätzen/Gewicht, Peak mit kleinerem Wdh.-Bereich und mehr Gewicht; Overload-Vorschlag entsprechend anpassen (`plannedSetValues`).
- Ende eines Blocks: Hinweis und Übergang zum nächsten (oder Wiederholen); Blöcke in der Statistik sichtbar (z. B. Markierung im Verlauf).
- Beim Start mit dem Nutzer klären: feste Vorlagen (z. B. 3 + 1 Wochen) oder frei; automatische Anpassung der Sätze oder nur Anzeige; Prozentwerte je Blockart.
- Neue Dexie-Version + Backup; vor dem nächsten Push an ein Backup erinnern.

Mit dem Nutzer beim Start abgestimmt: **Vorlagen + frei änderbar**; Sätze **automatisch anpassen, abschaltbar** (dann nur Anzeige); Prozentwerte als **Standard je Blockart, je Block änderbar**; am Ende **Hinweis mit Wahl** (nächster Block / wiederholen / ohne Blöcke weiter), bis dahin läuft der Block weiter.

**Notizen:**
- Gebaut:
  - Dexie v28: `Plan.blocks` (Liste `PlanBlock`: `id`, `kind` `build`/`deload`/`peak`/`test`, `weeks`, `setsPercent`, `loadPercent`, `repShift`, `progression`), `Plan.blockProgress` (`{ index, startDate }` | `null`), `Plan.blockAdjust` (Standard `true`), `Workout.block` (Kopie beim Start: Art, Woche, Werte, `adjusted`). Backup: Sicherungen bis v27 importierbar (leere Blöcke, `block: null`).
  - **Logik** `src/domain/blocks.ts`: `BLOCK_DEFAULTS` (Aufbau 100/100/±0 mit Overload, Deload 50 % Sätze/90 % Gewicht ohne Overload, Peak 105 % Gewicht/Wdh. −2, Test 35 % Sätze/110 %/Wdh. −7), `BLOCK_TEMPLATES` (3+1, 4+1, Aufbau→Peak→Deload, mit Test), `blockStatus` (Woche ab Startdatum, `upcoming`/`running`/`ended`), `workoutBlockFor`, `blockSetCount`, `shiftRepRange`, `scaleWeight` (auf 2,5 kg bzw. 5 lb gerundet, 0/Unterstützung bleibt), `scaleLevel`, `formatBlockWeek`, `formatAdjustment`. `plannedSetValues` nimmt `block` (ohne Overload: Werte vom letzten Mal mit Wdh.-Verschiebung; Last in Prozent).
  - **DB** `src/db/plans.ts`: `setPlanBlocks` (Zod, hält den laufenden Block beim Verschieben), `startPlanBlock(planId, index, startDate)` (Wechseln/Wiederholen), `stopPlanBlocks`, `updatePlan({ blockAdjust })`; `startPlanWorkout` kopiert den Block ins Workout und passt Sätze/Wdh.-Bereich an. `duplicatePlan` kopiert die Blöcke (nicht gestartet).
  - **Grundlage für Overload und Prozente** ist das letzte Training **ohne angepassten Block** (`getLastPerformance(…, { baseOnly: true })`): Nach dem Deload geht es vom letzten Aufbau-Training weiter, eine zweite Deload-Woche rechnet nicht vom Deload aus.
  - **UI:** Seite `PlanBlocksPage` (`/training/plans/:id/blocks`, `planBlocksPath`, Zeile „Trainingsblöcke“ auf der Plan-Seite): ohne Blöcke Vorlagen + „Eigene Abfolge“ (starten heute); sonst Karte „Aktueller Block“ (Status, Block wählen, Beginn des Blocks, „Blöcke anhalten“), Schalter „Sätze automatisch an den Block anpassen“, Abfolge zum Ziehen mit Dialog je Block (Art, Dauer, Sätze %, Gewicht %, Wdh. verschieben, Overload, „Standard für …“), ✕ und „Alle Blöcke entfernen“. `BlockStatusPanel` auf der Trainingsseite (Vorschlagskarte, auch Startseiten-Widget): „Aufbau · Woche 2 von 4“ + Anpassung; nach dem Ende „… ist geschafft!“ mit „Weiter mit …“/„… wiederholen“ bzw. „Abfolge wiederholen“/„Ohne Blöcke weiter“. Startrückfrage, laufendes Workout, Detailseite und Verlauf zeigen den Block; in angepassten Blöcken ohne Overload kein „Vorschlag“ an der Übung. **Statistik:** angepasste Block-Trainings sind im Übungsverlauf orange markiert (Tooltip mit Block, Legende).
  - Tests: `domain/blocks.test.ts`, Block-Fälle in `strength.test.ts`, `db/plans.test.ts` (Abfolge, Aufbau, Deload mit Grundlage, Peak, Anpassen aus, vor Beginn, Duplizieren), Migration v27→v28, Backup (Wiederherstellen, Sicherung aus v27, ungültige Blöcke). E2E `e2e/blocks.spec.ts` offline in beiden Viewports (Vorlage → Aufbau → Wechsel zum Deload → Block auf 80 % ändern → Deload mit 2 Sätzen à 80 kg ohne Vorschlag → Verlauf/Detail/Statistik → Anpassen aus → Ende → Abfolge wiederholen → Neuladen).
- Abweichungen:
  - Blöcke laufen nach **Kalenderwochen ab dem Startdatum** des Blocks (nicht nach Anzahl Trainings). Ein neuer Block beginnt am Tag des Wechsels.
  - Anpassen ist ein Schalter **je Plan** (nicht je Training). Einzelne Werte im Workout ändert man wie gewohnt.
  - Ohne Vorgeschichte gibt es keine Prozente (kein Gewicht bekannt): Wdh. = Untergrenze des verschobenen Bereichs, Gewicht leer.
  - Halteübungen: Dauer bleibt, nur Sätze und Last werden angepasst. Aufwärmsätze bleiben unverändert.
  - Mit Overload in einem angepassten Block (z. B. Deload mit Haken „Overload“) gilt der Vorschlag vom letzten normalen Training, die Wdh.-Verschiebung dann nicht. Ein Aufbau-Block mit geänderten Werten zählt als „angepasst“ und ist dann selbst keine Grundlage mehr – Standard ist unverändert.
  - `Dialog` (`src/components/`) scrollt jetzt bei hohem Inhalt (`max-h-[90dvh]`).
- Offene Punkte:
  - **Handytest:** Block-Dialog auf kleinen Displays, Datumsfeld „Beginn des Blocks“, Lesbarkeit der orangen Punkte im Diagramm.
  - Kein Block in der CSV-Spalte und im Teilen-Bild (ggf. Schritt 19 im Bericht: `Workout.block`).
  - Keine automatische Erinnerung außerhalb der Trainingsseite/des Widgets, wenn ein Block endet.
  - Vor dem nächsten Push an ein Backup erinnern (DB-Version 22 → 28).

### Schritt 18c – Push & Handytest 16–18b
**Ziel:** Stand aus 16, 16b, 17, 17b, 18 und 18b veröffentlichen und auf dem echten Handy prüfen (Nutzerwunsch nach 18b). Danach folgt Schritt 19.

Ablauf:
- **Vorher Backup:** Der Nutzer exportiert auf dem Handy ein Backup (Einstellungen → Datensicherung), weil die DB-Version von 22 auf 28 springt. Erst nach seiner Bestätigung pushen.
- **Push:** Wer „Schritt 18c starten“ schreibt, gibt den Push auf `main` frei (Ausnahme von „Kein Push“). Vorher Definition of Done kurz prüfen (lint, typecheck, test, build). Danach prüfen, dass die GitHub Action durchgelaufen ist, und dem Nutzer sagen, wann die Version online ist.
- **Handytest durch den Nutzer:** App öffnen → „Neue Version verfügbar“ → „Neu laden“; vorhandene Daten noch da? Dann die Punkte „Handytest“ aus den Notizen von 16–18b durchgehen, u. a.: Ziele/Rückblick, Journal-Autospeichern beim App-Wechsel, Bildschirmtastatur, Lesen-Dialog, Timer-Gong bei gesperrtem Bildschirm/Stummschalter, Fortschrittsfotos (Kamera, HEIC, Speicher, Backup mit Fotos), Erfolge-Seite und Hinweise, Trainingsblöcke (Block-Dialog, Datumsfeld, orange Punkte im Diagramm). Alles im Flugmodus.
- Gefundene Probleme beheben und erneut pushen.

**Fertig wenn:** gepusht, Action grün, Nutzer bestätigt den Handytest.

**Notizen:**
- Gebaut:
  - **Push (07.11.2026):** Nutzer hat das Backup auf dem Handy bestätigt. Vorher lint, typecheck, 841 Unit-Tests und Build grün. Schritte 16–18b gepusht (`527d828..2a0a16a`, DB-Version 22 → 28), Run 42401136943 grün (build + deploy), neuer `sw.js` live.
- Ergebnis Handytest: Nutzer hat 18c beim Start von Schritt 19 (10.11.2026) als erledigt abgehakt; die gefundenen Punkte sind unten behoben.
- Offene Punkte (Nutzer beim Handytest, 08.11.2026):
  - Erfolge-Seite: zwei Überschriften überlappen sich.
  - Alltag: Gewohnheitsserie überlappt mit „Schritte“.
  - Training: Am Ende des Workouts unten ein „Fertig“-Button, damit man nicht über „Zurück“/nach oben muss.
- Korrekturen (08.11.2026):
  - Erfolge: Lange Abzeichen-Namen („Gewohnheitsserie“, „Fortschrittsfotos“, „Trainingsserie“ …) haben ihre Rasterspalte verbreitert und stießen an den Nachbarn. Jetzt gleich breite Spalten (`min-w-0`) und feste Trennstellen per weichem Trennzeichen (`NAME_BREAKS` in `MotivationParts.tsx`, z. B. „Fortschritts-fotos“, Nutzerwunsch; `hyphens-manual`, Notfall `overflow-wrap:anywhere`), unter 360 px kleinere Schrift ohne Innenabstand. E2E prüft die Kacheln bei 320 px Breite.
  - Workout-Übersicht (nach „Speichern“ und im Verlauf): unten primärer „Fertig“-Link zur Herkunft (wie „Zurück“), „Teilen-Bild“ ist jetzt ein normaler Button.
  - Noch nicht gepusht: Nutzerwunsch, erst nach 18d/18e (wenn das Design stimmt) zusammen pushen und auf dem Handy testen. 18c wird dann mit diesem Push abgeschlossen. Nach 18e kam noch 18f (Logo) dazu: Push erst danach.
- **Push 2 (08.11.2026):** Nutzer hat das Backup bestätigt und den Push freigegeben. Vorher lint, typecheck, 869 Unit-Tests, Build und 118 E2E grün. Korrekturen 18c + 18d + 18e + 18f gepusht (`2a0a16a..737e1fc`, DB-Version 28 → 33), Run 42507760591 grün, live (Titel „Basey“, Ladebildschirm). Handytest steht aus (Punkte unter 18d, 18e, 18f „Offene Punkte“).
- Handytest-Rückmeldung nach Push 2 (08.11.2026) und Korrekturen (Push 3: `737e1fc..2a68bee`, Run 42511360598 grün, keine DB-Änderung):
  - **Ziele: „Erledigt“-Button kaum sichtbar** (Startseite): Der Button hatte `bg-subtle` und `bg-primary` gleichzeitig, es gewann der helle Hintergrund unter weißer Schrift. Jetzt getrennte Klassen (`ACTION`/`ACTION_PRIMARY` in `GoalCard.tsx`). Alle `className`-Vorlagen per Skript auf feste + bedingte Farbklasse derselben Art geprüft: keine weitere Stelle.
  - **Ladebildschirm:** Unten schien die Startseite durch, die Animation stockte. Jetzt hält `html.splash-on` die App unsichtbar und den Hintergrund dunkel, bis `hideSplash()` ausblendet; der Ladebildschirm ist `100lvh` hoch. Kachel, Ring und Kugel sind eigene HTML-Ebenen (`logoSvg(…, { parts: 'ring' | 'ball' })`), animiert per `transform` mit `will-change` → läuft auf der Grafikkarte, statt jedes Bild die SVG-Filter neu zu rechnen, während die App lädt.
  - **Datum/Beginn überlappen** (Training nachtragen, Ausdauer …, auf dem iPhone): Safari gibt Datum-/Zeitfeldern eine Mindestbreite. Zentral in `index.css` (`min-width: 0`, `appearance: none`, Wert linksbündig, Rasterzellen `min-width: 0`) für alle Datum-/Zeitfelder.
  - **Zurück springt nach oben:** neue Scroll-Erinnerung `useScrollMemory` im `Layout` (Höhe je Pfad; Browser-Zurück oder Link auf die vorherige Seite stellt sie wieder her, mit Wiederholung bis die Seite nachgeladen ist; neue Seiten beginnen oben; reine Parameter-Wechsel bleiben ruhig). E2E `e2e/navigation.spec.ts`.
  - **Icon/Name auf dem Startbildschirm noch „Fitnesstracker“:** kein Fehler im Code. Android aktualisiert Name/Icon einer installierten App selbst (Chrome prüft das Manifest höchstens etwa einmal am Tag beim Öffnen, ggf. mit Rückfrage). iPhone übernimmt beides nur bei Neuinstallation; Entfernen löscht dort die Daten der App → vorher Backup, danach wiederherstellen.

### Schritt 18d – Design-Grundlage & Farbpaletten
**Ziel:** Neues, einheitliches Design als Grundlage (Nutzerwunsch nach 18c). Vor Schritt 19, damit die Berichte gleich im neuen Look entstehen.
- Zum Start 2–3 Design-Entwürfe zum Vergleich zeigen, Richtung mit dem Nutzer klären (Vorbilder, Farben, schlicht/verspielt).
- Farben über Design-Tokens (CSS-Variablen + Tailwind) statt fester Farbklassen.
- Mehrere Farbpaletten wählbar (Einstellung, Dexie-Version + Backup-Default), dazu weiterhin Hell/Dunkel/System.
- Grundbausteine neu gestalten: Karten, Buttons, Eingaben, Bottom-Navigation, Kopfzeile, Abstände, Schrift (gebündelt, offline).

Mit dem Nutzer beim Start abgestimmt (Entwürfe A/B/C als Artifact): **Variante C „Kräftig“** (Apple-Schlichtheit, Systemschrift, wichtigste Karten als Farbblock), **fünf Paletten** nach Vorlagen des Nutzers (je hell/Akzent hell/Akzent/dunkel; im Dunkelmodus werden hell und dunkel getauscht), **Standard Grün**, **alle Emojis durch Liniensymbole ersetzen** (auch bei eigenen Gewohnheiten/Zielen: Symbol-Auswahl statt Emoji), in der roten Palette **eigene Gefahrenfarbe** (Orange-Rot).

**Notizen:**
- Gebaut:
  - **Design-Tokens** in `src/index.css`: Paletten setzen nur `--p-light/--p-mid/--p-strong/--p-deep` (+ Akzent im Dunkelmodus, Gefahr), alles andere wird per `color-mix` berechnet. Tailwind-Farben über `@theme inline`: `page`, `surface`, `subtle(-strong)`, `pressed`, `line(-strong)`, `fg`, `muted`, `faint`, `primary` (+ `on-primary`, `primary-text`, `primary-press`, `primary-soft`, `on-primary-soft`), `hero`/`hero-2` (Farbblöcke), `danger(-soft)`, `warn(-soft)`, `info(-soft)`, `mark` (Blöcke/Warnkreis), `star`, `scrim`. Rundungen etwas weicher (`rounded-xl` 14 px, `rounded-2xl` 20 px), keine `shadow-sm` mehr auf Karten.
  - **Farbblöcke:** Klassen `tone-hero`/`tone-accent`/`tone-soft` setzen die Tokens im Block neu (Buttons, Texte, Balken passen sich an). `Card`/`Tile` haben Prop `tone`. Eingesetzt: Trainingsstart-/Planvorschlagskarte, Pausen-Leiste, laufender Timer, Erfolgs-Hinweis, erste zwei Alltag-Kacheln.
  - Alle ~1150 festen Farbklassen in 134 Dateien per Skript auf Tokens umgestellt (`dark:`-Klassen entfallen), Rest von Hand. Bewusst fest geblieben: Abzeichen-Stufen (Bronze/Silber/Gold …) und Schlafphasen-Farben. Diagramme (`var(--primary)`/`var(--mark)`), Heatmap (Stufen über Deckkraft), Strecke und Teilen-Bild (liest `--p-*`) folgen der Palette.
  - **Einstellung** `Settings.palette` (Dexie v29, `COLOR_PALETTES`, `PALETTE_LABELS`), Auswahl `PalettePicker` unter „Darstellung“. `applyTheme(theme, palette)` setzt `data-palette` am `<html>`, spiegelt in localStorage (`index.html` setzt beides vor dem ersten Rendern) und passt `meta[name=theme-color]` an. Backup: ohne Palette → Grün.
  - **Grundbausteine:** Kopfzeile (großer Titel, „Zurück“ mit Pfeil-Symbol), `Card`, `LinkRow` (Pfeil-Symbol), `Tile` (Symbol-Kachel), Buttons (`primaryButton` 48 px, `secondaryButton` gefüllt statt Rahmen, `dangerButton` getönt), Eingaben (gefüllt, Rahmen beim Fokus), `Stepper` (getönte Tasten), `SegmentedControl` (iOS-Stil), `Chip`, `DeleteRowButton`, `Toast`, `UpdatePrompt`, `BottomNav`.
  - **Symbole:** `src/components/iconPaths.ts` (~90 Liniensymbole als Pfade, auch für Canvas), `<Icon name>`/`<IconBadge name>` (`src/components/icons.tsx`), Namen/Gruppen/Zuordnung in `src/domain/iconChoice.ts` (`ICON_LABELS`, `ICON_GROUPS`, `toIconName`). Alle Emojis aus Labels, Abzeichen, Serien, Kacheln, Titeln, Hinweisen und Teilen-Bild entfernt (Pokal im Teilen-Bild als Symbol gezeichnet). `EmojiPicker`/`domain/emoji.ts` ersetzt durch `IconPicker` (Fenster mit Gruppen, optional „Standard“).
  - **Migration Dexie v30:** gespeicherte Emojis bei Gewohnheiten (`Habit.icon`, unbekannt → `star`) und eigenen Zielen (`Goal.icon`, unbekannt → leer = Symbol der Art) werden zu Symbol-Namen; Backup-Import macht dasselbe.
  - Tests: `iconChoice.test.ts`, Migrationen v28→v29 und v29→v30, Backup (Palette, Emojis aus alten Sicherungen); E2E `e2e/design.spec.ts` (Palette + Dunkel offline, nach Neuladen sofort gesetzt, Farbblock), E2E-Helfer `chooseIcon`; bestehende E2E von Emoji-Texten auf Namen umgestellt („Zurück“ jetzt mit `exact: true`).
- Abweichungen:
  - Statt 2 Commits sind es Teil 1 (Tokens/Paletten/Bausteine) und Teil 2 (Symbole); DB-Versionen getrennt (v29 Palette, v30 Symbole).
  - Typografische Zeichen bleiben Text (✓, ★/☆, ✕ in Texten, ▾/▸, ‹/› im Tagesnavigator, →); nur Emojis wurden ersetzt.
  - Emojis eigener Gewohnheiten/Ziele ohne passendes Symbol (z. B. Flaggen) werden zum Standard-Symbol – der Nutzer wählt ggf. neu.
  - Kein eigenes Schriftpaket (Systemschrift, Nutzerwunsch).
- Offene Punkte:
  - **Handytest** (mit 18e und dem 18c-Push): Kontrast der Paletten auf echten Displays (v. a. Graphit-Akzent in Hell, Violett in Dunkel), Statusleistenfarbe auf Android, Lesbarkeit der Farbblöcke.
  - Seiten selbst umsortieren/vereinfachen → 18e (z. B. „Anpassen“-Buttons im Kopf, ▾/▸ durch Symbole ersetzen, Wochen-/Tagesübersichten im Stil der Entwürfe).
  - Vor dem nächsten Push an ein Backup erinnern (DB-Version 28 → 30).

### Schritt 18e – Seiten aufräumen & übersichtlicher machen
**Ziel:** Bereich für Bereich (Startseite, Training, Alltag, Statistik, Einstellungen) neu sortieren und übersichtlicher machen, auf Basis von 18d. Vorher mit dem Nutzer durchgehen, was ihn je Seite stört.

Mit dem Nutzer beim Start abgestimmt (Entwürfe als Artifact „Fitnesstracker 18e Entwürfe“): **Startseite wie im Entwurf** (Datum + „Heute“, Farbblöcke, kleine Kacheln) und **Widget-Größen klein/mittel/groß** (kurze/mittlere/lange Infos); **überall** runde Symbol-Buttons im Kopf, Pfeile als Symbole, Schalter statt Häkchen, gruppierte Listen; **Training** in Blöcke mit Kacheln wie im Alltag; **Alltag** große Zahlen in den Kacheln; **Statistik** Erfolge/Ziele als Kacheln, Filter in der Karte „Trainingstage“; **Einstellungen** mit Überkapiteln und Symbolen (Unterseiten). **Neues Logo** (neutral zu allen Paletten, nicht nur Training) – sechs Vorschläge gezeigt, Entscheidung des Nutzers steht aus.

**Notizen:**
- Gebaut:
  - **Gemeinsame Bausteine** (`src/components/Page.tsx`): `HeaderButton`/`HEADER_ICON_BUTTON` (runder Kopf-Button), `CustomizeToggle` („Anpassen“/„Fertig“ als Stift/Haken, Name bleibt für Screenreader und E2E), `LinkGroup` + `GroupRow` (gruppierte Liste mit Symbol, Hinweis oder Wert, Pfeil), `MoreLink`. `Switch` (`src/components/Switch.tsx`, `input` mit Rolle `switch`) ersetzt Einstellungs-Häkchen (Einstellungen, Backup-Fotos, Block-Anpassen/Overload, Bestand, Kochgewicht, Einseitig, Ausgeblendete); Auswahllisten beim Import bleiben Checkboxen. `IconBadge` mit `solid`. `Tile` mit `state`/`value`. Neue Symbole `grip`, `filter`, `history`, `user`, `shield`, `clipboard`, `calendarPlus`. Alle `›`/`‹`/`▾`/`▸` durch Pfeil-Symbole ersetzt.
  - **Einstellungen:** Übersicht (`SettingsPage`) mit Profil-Farbblock und Gruppen „Bereiche“ (Training, Tagesziele, Ernährung, Supplements), „App & Daten“ (Darstellung, Datensicherung, Export & Speicher), „Mehr“ (Weitergeben, Über), je Zeile Kurzstand. Unterseiten `/settings/:section` (`SettingsSectionPage`, `settingsPath()`, `SETTINGS_SECTIONS` in `paths.ts`). Backup-Hinweis oben führt zu `/settings/backup`, Pulszonen-Hinweis zu Training, Supplements zu Supplements.
  - **Training:** Startkarte, Block „Krafttraining“ (Kacheln Trainingspläne mit aktivem Plan, Verlauf mit Workouts im Monat, Übungen mit Favoriten, Nachtragen) und „Ausdauer“ (Sportarten wie bisher + Ausrüstung, Importieren). „Anpassen“ sortiert weiter die Sportarten.
  - **Alltag:** Kacheln mit großer Zahl („3 von 5“, „1366 von 2000 kcal“, „2 offen“).
  - **Statistik:** Kacheln „Erfolge“/„Ziele“ statt Kopf-Buttons; Zeitraum + Muskelgruppe in der Karte „Trainingstage“ (`ActivityCard`-Prop `filter`), die jetzt zuerst kommt.
  - **Startseite:** Kopf mit Datum + „Heute“ (mit Namen „Hallo, …!“), Logo entfällt. Widgets im 2er-Raster, **Größen** `Settings.widgetSizes` (Dexie v31, Backup-Default `{}`), mögliche Größen je Widget in `src/domain/widgets.ts` (`WIDGET_SIZE_OPTIONS`, erste = Standard, `widgetSize`, `sizeChoices`), Auswahl S/M/L im Anpassen-Modus (`SizePicker`, Vorschau in der gewählten Größe). Kleine Widgets (`SmallWidget`, `SmallWidgets.tsx`): erste zwei als Farbblock (Akzent, Hellton). Neue Widgets **Schritte, Wasser, Schlaf** (`DailyMetricWidget`: klein Wert + Balken, mittel mit Rest/Buttons, groß mit 7-Tage-Balken). „Diese Woche“: klein Trainings/Wochenziel, mittel Tagespunkte Mo–So (`WeekDots`, `weekTrainings` in `src/domain/week.ts`), groß zusätzlich Sätze/Volumen/Ausdauer. Gewohnheiten/To-dos mittel = 3 offene; Fortschritt, Supplements, Ernährung, Ausdauer, Ziele, Serien auch klein.
  - Tests: `widgets.test.ts`, `week.test.ts`, Migration v30→v31, Backup (Größen, Sicherung aus v30). E2E: Helfer `openSettings(page, Bereich)`, Einstellungen-Tests auf Unterseiten, Schalter (`getByRole('switch')`), Dashboard-Überschrift „Heute“, Größe wählen in `mvp1`, Einstellungs-Übersicht in `design`. 855 Unit-Tests, 114/114 E2E grün. Hauptbundle ~341 KB (vorher ~332, Widget-Varianten und Bausteine).
- Abweichungen:
  - Bestehende Startseiten behalten ihre Widgets; Schritte/Wasser/Schlaf fügt man über „Anpassen“ hinzu (Standardaufbau neuer Installationen unverändert).
  - Nicht jedes Widget hat alle drei Größen (Listen und Heatmap nur mittel/groß, Kennzahlen alle drei).
  - Die Farbblöcke der kleinen Widgets richten sich nach der Reihenfolge der kleinen Widgets in der Auswahl.
- Offene Punkte:
  - **Logo** → eigener Schritt 18f (Nutzerwunsch: mit Animationen und Ladebildschirm).
  - **Handytest** (mit dem 18c-Push): Lesbarkeit der kleinen Widgets, Schalter, Einstellungs-Unterseiten.
  - Vor dem nächsten Push an ein Backup erinnern (DB-Version 28 → 31).

### Schritt 18f – Neues Logo, Animationen & Ladebildschirm
**Ziel:** Abschluss der Design-Überarbeitung (Nutzerwunsch nach 18e), danach Push + Handytest (18c).
- **Logo:** Der Nutzer wählt aus den sechs Vorschlägen im Artifact „Fitnesstracker 18e Entwürfe“ (1 Tagesring, 2 Stufen, 3 Puls, 4 Aufgang, 5 Vier Bereiche, 6 Schleife) oder wünscht Änderungen. Neutral zu allen Paletten, nicht nur Training (keine Hantel). App-Icon (Startbildschirm, Manifest) fest in neutraler Fassung, in der App ggf. in Palettenfarbe. `public/favicon.svg` ersetzen, `npm run icons`, Manifest-Farben prüfen.
- **Ladebildschirm:** beim Start (bis Einstellungen/DB geladen sind) Logo statt leerer Seite, passend zu Palette und Hell/Dunkel (schon in `index.html`, damit nichts aufblitzt); iOS-Startbild (`apple-touch-startup-image`) prüfen.
- **Animationen:** dezent und kurz (z. B. Logo beim Start, Seitenwechsel, Abhaken, Fortschrittsbalken, Erfolgs-Hinweis), offline und ohne Paket wenn möglich; `prefers-reduced-motion` beachten.
- Beim Start mit dem Nutzer klären: welches Logo, welche Stellen animiert werden, wie lange der Ladebildschirm steht.
- **Entschieden (Planung 18f, 2026-11-08):** Die App heißt jetzt **„Basey“** (Untertitel „Fitness & Lifestyle“). Eigenes Logo vom Nutzer: Ring mit Kugel in der Öffnung, vier Varianten (Taupe Silk, Graphite Mesh, Stone Grip, Charcoal Satin), Wortmarke dunkel/hell. Quelle: Artifact „Basey Logo“ (https://claude.ai/artifact/M9K5wxyMXuqFkisNHGN1bL, Dateien `project/Icons.dc.html`, `Lockup.dc.html`, `Main.dc.html`). Dort ist alles reines SVG (Ring = Bogenpfad mit Maske/Unschärfe-Lichtern + Rauschen, Kugel = eigener `circle` mit Radialverlauf) → direkt übernehmbar, Ring und Kugel getrennt animierbar. Wortmarke nutzt „Inter Tight“ von Google Fonts → für die App als SVG-Pfade umwandeln (offline, keine Schrift laden). Das zweite Artifact „Basey Logo – B+Y Monogramm“ wird **nicht** verwendet.
  - **App-Icon:** Standard **Charcoal Satin** (Manifest, Startbildschirm, fest). Variante in der App wählbar (Einstellungen → Darstellung) für Ladebildschirm, Willkommen, Über, Teilen-Bild. iOS: `apple-touch-icon` folgt der gewählten Variante (wirkt beim Hinzufügen zum Home-Bildschirm), Android bleibt beim Manifest-Icon. Favicon/kleine Größen als vereinfachte flache Fassung.
  - **Startanimation „Ring dreht ein“:** Ring dreht mit Schwung in Position, Kugel ploppt auf, Schriftzug „Basey“ blendet ein, dann Überblendung in die App. Inline in `index.html` (kein Aufblitzen), nur beim Kaltstart, ca. 0,8–1,5 s, `prefers-reduced-motion` = statisches Logo. Android-/iOS-Startbild nahtlos (gleicher Hintergrund, gleiche Logo-Position).
  - **Umbenennung:** Manifest, `<title>`, iOS-Titel, Über-Seite, Teilen-Text/-Bild, Dateinamen `basey-backup-…`/`basey-workouts-…`/`basey-….png`. Backups mit alter Kennung `fitnesstracker` bleiben importierbar. Repo/URL `/fitnesstracker/` bleibt (sonst Neuinstallation nötig).
  - **Palette „Basey“** (Taupe/Anthrazit) als Standard für neue Installationen; Manifest-`theme_color`/`background_color` passend zum Logo.
  - **Weitere Animationen:** Seitenwechsel, Abhaken, Fortschrittsbalken, Erfolgs-Hinweis (dezent, ohne Paket, reduzierte Bewegung beachtet).
  - **Logo im Teilen-Bild** statt Text „Fitnesstracker“.
  - Wortmarke als Grafik (keine Online-Schrift).

**Notizen:**
- Gebaut:
  - **Logo als Code:** `src/brand/logo.ts` (`logoSvg(variant, { id, shape: 'rounded' | 'square' | 'none', scale, size, label })`, `LOGO_VARIANTS` mit `charcoal` zuerst = Standard, `LOGO_COLORS`, `LOGO_VARIANT_LABELS`, `logoDataUrl`), SVG 1:1 aus dem Artifact (Maske, Unschärfe-Lichter, Rauschen, Mesh-/Stein-Textur), Ring/Kugel in `<g class="logo-ring">`/`<g class="logo-ball">`. Ohne Imports, damit Node (`npm run icons`) und `vite.config.ts` die Datei direkt laden. React: `BaseyLogo` (`src/components/`, eindeutige IDs per `useId`).
  - **Wortmarke:** `scripts/generate-wordmark.mjs` wandelt „Basey“ (Inter Tight 700, Laufweite −0,045 em) und „Fitness & Lifestyle“ (500) per opentype.js in Pfade → `src/brand/wordmark.ts` (generiert), Zusammenbau `wordmarkSvg` (`src/brand/wordmarkSvg.ts`), React `BaseyWordmark` (eigene Datei, nicht im Hauptbundle). Keine Schrift wird geladen.
  - **Icons:** `npm run icons` erzeugt aus `logo.ts` `favicon.svg`, `pwa-192/512` (abgerundet), `maskable-512` (vollflächig, Motiv 80 %), `apple-touch-icon.png` + `apple-touch-icon-<variante>.png` (je 180 px, vollflächig).
  - **Ladebildschirm:** Vite-Plugin `basey-splash` (`vite.config.ts`) ersetzt `<!-- splash-css -->`/`<!-- splash -->` in `index.html` durch `SPLASH_CSS`/`splashHtml()` (`src/brand/splashHtml.ts`): immer dunkel (`#0C0C0C`, wie Android-Startbild und `theme_color`), je Variante ein `<template>`, ein Inline-Script nimmt `localStorage.logo` und setzt auch das `apple-touch-icon`. Animation „Ring dreht ein“: Kachel blendet ein, Ring dreht von −200° mit Überschwingen (0,8 s), Kugel ploppt (ab 0,55 s), Schriftzug blendet ein (ab 0,7 s). `hideSplash()` (`src/brand/splash.ts`) wird im `Layout` gerufen, sobald die Einstellungen geladen sind, frühestens nach 1,15 s ab Seitenstart, dann 0,3 s Ausblenden. Notbremse nach 6 s. „Bewegung reduzieren“: keine Animation, sofort weg.
  - **Logo-Variante wählbar:** `Settings.logoVariant` (Dexie v32, Standard `charcoal`, Backup-Schema mit Default), Einstellungen → Darstellung → Karte „App-Logo“ (`LogoPicker`). `applyLogoVariant` spiegelt nach `localStorage.logo` und tauscht `apple-touch-icon` (iPhone: gilt beim Hinzufügen zum Home-Bildschirm); Android behält Charcoal Satin (Manifest).
  - **Umbenennung:** Manifest `Basey`/`Basey`, `<title>`, iOS-Titel, Beschreibung, Willkommens-Karte „Willkommen bei Basey!“ mit Logo, Über-Seite mit Logo + Wortmarke, Teilen-Text, Dateinamen `basey-backup-…json`, `basey-workouts-…csv`, `basey-….png`. Teilen-Bild (Story): Logo (gewählte Variante) + Schriftzug statt Text „Fitnesstracker“.
  - **Palette „Basey“** (`--p-*`: `#e8d9c2`, `#bea98e`, `#6f5b43`, `#1a1714`; Akzent dunkel `#bea98e`) als erste in `COLOR_PALETTES`, Standard neuer Installationen (`DEFAULT_SETTINGS`, `index.html` ohne gespeicherten Wert). Paletten-Auswahl jetzt 3 × 2.
  - **Animationen** (`src/index.css`, nur bei `prefers-reduced-motion: no-preference`): `anim-fade-in`/`anim-pop-in` (`Dialog`, `ConfirmDialog`), `anim-slide-down` (Hinweise/Erfolge im `ToastHost`), `anim-check` (`StatusCircle` springt nur nach dem Abhaken, nicht beim Öffnen), `bar-fill` (Fortschrittsbalken wachsen beim Erscheinen und gleiten bei Änderung: Tagesziele, Ziele, Startseite, Abzeichen, Pulszonen, Statistik). Seitenwechsel: `usePageTransition` blendet `<main>` 180 ms ein (nur Deckkraft, damit feste Leisten nicht wandern; nur bei Pfadwechsel, nicht bei `?…`).
  - Tests: `src/brand/logo.test.ts`, `splash.test.ts`, Migration v31→v32, Backup (Logo-Variante); E2E `e2e/branding.spec.ts` (Ladebildschirm mit Animation, Logo wählen offline, iPhone-Icon nach Neuladen, Über-Seite), `design.spec.ts` auf Standard „Basey“ umgestellt. **Playwright läuft jetzt mit `reducedMotion: 'reduce'`** (Ladebildschirm sofort weg, keine Fenster-Animation); Tests mit Animation per `test.use({ reducedMotion: 'no-preference' })`.
- Abweichungen:
  - Ladebildschirm immer dunkel statt passend zu Hell/Dunkel: So geht das Android-Startbild (feste `background_color`) nahtlos über, und das Logo wirkt wie im Entwurf auf Schwarz. Danach blendet die App in ihrem Theme ein.
  - Favicon ist das volle Logo (keine vereinfachte flache Fassung): bleibt auch bei 32 px gut erkennbar.
  - Backup-Kennung `app` bleibt intern `fitnesstracker` (alte und neue App-Stände lesen gegenseitig ihre Sicherungen), nur die Fehlermeldung heißt „Keine Basey-Sicherung“. IndexedDB-Name bleibt `fitnesstracker` (Daten bleiben erhalten), ebenso `package.json`-Name und Repo/URL.
  - Kein eigenes iOS-Startbild (`apple-touch-startup-image` bräuchte je Gerätegröße ein Bild); iOS zeigt kurz Weiß/Schwarz, dann den Ladebildschirm.
- Offene Punkte:
  - **Handytest** (mit dem 18c-Push): Startanimation auf echten Geräten (Dauer, Übergang vom Android-Startbild), Icon auf dem Home-Bildschirm (Android maskable, iPhone mit gewählter Variante), Name „Basey“ unter dem Icon (bestehende Android-Installation aktualisiert Name/Icon nach einiger Zeit, iPhone erst nach Neuinstallation), Lesbarkeit der Palette „Basey“.
  - ~~Vor dem Push an ein Backup erinnern~~ (erledigt, Push 2 unter 18c).
- Nachtrag (08.11.2026, Nutzerwunsch nach dem Ansehen):
  - **Basey für alle:** Dexie v33 stellt jedes Gerät einmalig auf die Palette „Basey“ (danach frei wählbar). Palette **Graphit entfernt** (zu ähnlich zu Basey); Backups mit `graphite` werden beim Import zu `basey`.
  - **Ladebildschirm länger:** Animation langsamer (Ring 1,05 s, Kugel ab 0,75 s, Schriftzug ab 0,95 s), steht mindestens 2,2 s ab Seitenstart, auch wenn die App früher bereit ist (`SPLASH_ANIMATION_MS`), dann 0,4 s Ausblenden.
  - Ideen für später: Schriftzug auch im Seitenkopf der Startseite; Logo im Sticker-Format des Teilen-Bilds; eigene iOS-Startbilder.
- Nachtrag 2 (09.11.2026, Nutzerwunsch nach dem Handytest):
  - **Logo ohne Ring:** Das App-Logo ist jetzt der Schriftzug „Basey“ (wie bei Uber) auf einem Artwork aus dem Poster-Raster des Artifacts „Basey Logo“ (breites Band mit Lichtern, Rauschen und Struktur). `src/brand/artwork.ts` (`artworkSvg`, Charakter `silk`/`mesh`/`speckle`/`satin`, 420er-Raster), `logo.ts` nutzt es (`LOGO_ARTWORKS`). Ring, Kugel und `parts`/`scale` entfallen. **Standard Graphite Mesh** (Dexie v34: wer noch den alten Standard Charcoal hatte, wechselt; andere Wahl bleibt; Backup-Default `graphite`). Icons neu erzeugt (Maskable ohne Verkleinern, Schriftzug 60 % Breite liegt in der sicheren Zone).
  - **Ladebildschirm farbig je Palette:** Kein Logo/Ring mehr, nur der Name blendet über dem Artwork ein (Artwork 0,7 s weich ein, Name ab 0,45 s, Mindestdauer 1,9 s). Je Palette ein Artwork mit ihrem Charakter (`PALETTE_ARTWORKS`): Standard = Taupe-Seide, Grün = gesprenkelter Stein, Rot = glänzender Satin, Blau = Mesh, Violett = Seide; Hintergrund in der dunklen Palettenfarbe. Das Artwork steht wie ein Poster über die ganze Breite (`min(140vw, 100vh)`). Android-Startbild/`theme_color` = Hintergrund der Standardpalette `#14110e`.
  - **Palette „Basey“ heißt „Standard“** (intern weiter `basey`).
  - **Hervorhebungsfarbe je Palette** (`--p-pop`/`--p-pop-dark` → Token `mark`): Standard Zinnober, Grün Pink, Rot Gold, Blau Orange, Violett Petrol. Vorher war `mark` fest Orange und „zu wenige Sätze“ nutzte `warn` (Braun-Orange), das in der Standardpalette im Akzent-Braun unterging. Vorschau als Punkt im `PalettePicker`.
  - **„Sätze pro Woche“:** Balken unter 4 Sätzen (große Muskelgruppen) jetzt in `mark`, Legende mit Farbpunkt statt „Orange = …“ (der Text passte nicht zur Farbe). Ebenso die Block-Legende in der Übungsstatistik (Punkt war `warn`, Diagramm-Markierung `mark`).
  - **Teilen-Bild:** Logo entfernt, nur der Schriftzug „Basey“ unten links. Über-Seite: Logo + Name/Untertitel als Text (`BaseyWordmark` entfernt).
  - Offene Punkte: Handytest (Ladebildschirm je Palette, Icon auf dem Home-Bildschirm, Lesbarkeit von `mark`). Vor dem nächsten Push an ein Backup erinnern (DB-Version 33 → 35).
- **Push 4 (10.11.2026):** Nutzer hat das Backup bestätigt und den Push freigegeben (Nachträge 2 + 3, DB-Version 33 → 35). GitHub-Benutzer heißt jetzt **`bas3y`**: Remote `https://github.com/bas3y/fitnesstracker`, App unter **`https://bas3y.github.io/fitnesstracker/`** (neue Adresse = neuer Speicherort im Browser → App neu installieren und Backup einspielen). Name der App bleibt „Basey“.
- Nachtrag 3 (10.11.2026, Nutzerwunsch nach dem Ansehen): Ladebildschirme je Palette gefallen. **Paletten-Auswahl** zeigt je Palette eine einheitliche Fläche in ihrer Hauptfarbe (statt vier Feldern + Punkt). **App-Logo nur noch Charcoal Satin (Standard) und Taupe Silk**, beide mit dem Satin-Verlauf (Taupe in Taupe-Farben). Graphite Mesh und Stone Grip entfallen: Dexie v34/v35 setzen ungültige Varianten auf Charcoal (`toLogoVariant`, v35 für Geräte mit dem Zwischenstand v34), Backup-Import wandelt `graphite`/`stone` ebenso. Icons neu erzeugt, `apple-touch-icon-graphite/-stone.png` entfernt.

### Schritt 19 – PDF-Export/Berichte
Monats-/Jahresbericht als PDF (lokal erzeugt), Export einzelner Statistiken.

Mit dem Nutzer beim Start abgestimmt (10.11.2026): 18c als erledigt abhaken; **eigener PDF-Baustein** statt Paket oder Druckansicht; Bericht mit **Kennzahlen wie im Rückblick, Diagrammen, Kraft im Detail, Ausdauer im Detail**; Einzelexport = **Übung als PDF + CSV** (und Ausdauer je Sportart).

**Notizen:**
- Gebaut:
  - **PDF-Baustein ohne Paket** (`src/domain/pdf/`): `pdfWriter.ts` (`PdfDocument`/`PdfPage`, PDF 1.4, A4, Ursprung oben links; Text, Rechtecke mit Rundung, Linien, Kreise; Standardschriften Helvetica/Helvetica-Bold mit WinAnsi, nichts eingebettet, nicht komprimiert), `fontMetrics.ts` (AFM-Breiten, `toWinAnsi`, `textWidth`), `layout.ts` (`ReportLayout`: Kopf in der Palette, Abschnitte, Absätze mit Umbruch, Kacheln, Tabellen mit wiederholter Kopfzeile, gestapelte Säulen, Linien, waagrechte Balken, Monatskalender, Legende, Fußzeile „Seite x von n“; automatische Seitenumbrüche). Farben aus der gewählten Palette (`--p-*` per `getComputedStyle`, `currentPdfTheme` in `reportFiles.ts`), Hintergrund immer weiß.
  - **Berichte** (`periodReport.ts`): Woche/Monat/Jahr wie im Rückblick (Button „Monatsbericht als PDF“ usw. in der Zeitraum-Karte), Inhalt: Kacheln, Überblick-Tabellen (Zeitraum/Vorzeitraum/Änderung, gleiche Zeilen wie auf dem Bildschirm), erreichte Ziele, Verlauf (Trainings je Tag/Woche/Monat gestapelt Kraft/Ausdauer, Trainingskalender – Monat groß, Jahr 12 kleine –, Körpergewicht, Schritte, Schlaf), Kraft im Detail (Übungen mit Bestwert ggü. Vorzeitraum, neue Rekorde, Arbeitssätze je Muskelgruppe), Ausdauer im Detail (je Sportart, neue Bestzeiten, Einheiten bzw. im Jahr je Monat). Daten/Logik in `src/domain/report.ts` (Zeitachsen `trainingBuckets`/`dailyBuckets`/`monthBuckets`, `exerciseChanges`, `recordsIn`, `effortRecordsIn` …, Dateinamen `reportFileName`/`fileSlug`), Laden `loadPeriodReport` (`src/db/reports.ts`).
  - **Rückblick-Zeilen ausgelagert** nach `src/domain/reviewRows.ts` (`trainingRows`, `dailyRows`, `nutritionRows`, `habitRows`, `growthRows`, `formatReviewDelta`), `ReviewStats` nutzt sie (Karten über `RowsCard`); erreichte Ziele `goalsAchievedIn` (`domain/goals.ts`). Rekorde als Liste `recordsBetween` (`domain/stats.ts`, `countRecordsBetween` zählt darüber).
  - **Einzel-Exporte:** Karte „Exportieren“ (`StatsExportCard`, `ExportButton` in `src/features/reports/`) auf der Übungsseite (PDF: Kacheln, Verlauf der ersten zwei Kennzahlen, Bestwerte, Einheiten im gewählten Zeitraum; CSV: alle Sätze der Übung über `createWorkoutsCsvFile(unit, date, exercise)`) und in der Ausdauer-Statistik (Sportart + Zeitraum; PDF: Kacheln, Strecke/Dauer je Woche bzw. Monat ab 27 Wochen, Pace, Bestzeiten, Einheiten; CSV `enduranceSessionsToCsv`/`createEnduranceCsvFile`). Hinweis mit Link im Einstellungs-Export.
  - Dateien teilen/speichern wie das Backup (`shareOrDownload`), Namen `basey-bericht-2026-11.pdf`, `basey-bericht-2026.pdf`, `basey-bericht-2026-kw45.pdf`, `basey-bankdruecken-langhantel-<Datum>.pdf/.csv`, `basey-ausdauer-laufen-<Datum>.pdf/.csv`.
  - PDF-Code nur per `import()` (`reportFiles.ts`, eigener Chunk ~29 KB / 11 KB gzip), Hauptbundle unverändert ~344 KB.
  - Tests: `pdf.test.ts` (Zeichensatz, Breiten, xref-Offsets, Längen, Seitenumbruch), `reports.test.ts` (Inhalte der PDFs), `report.test.ts`, `reviewRows.test.ts`, CSV, `db/reports.test.ts`, `workoutExport.test.ts`; Testdaten `src/test/reportInput.ts`, PDF-Text lesen `src/test/pdfText.ts`. E2E `e2e/reports.spec.ts` (offline: Monats-/Jahresbericht, Übung PDF+CSV, Laufen PDF+CSV). 921 Unit-Tests, 124 E2E grün.
- Abweichungen:
  - Auch ein **Wochenbericht** (fiel mit dem Rückblick ab, Tage statt Wochen auf der Achse, ohne Kalender).
  - Zeichen außerhalb von WinAnsi (z. B. kyrillisch, Emojis in eigenen Namen) erscheinen im PDF als „?“; „−“, „→“, „≥“ werden ersetzt. Eine eingebettete Unicode-Schrift wäre deutlich größer.
  - „Übungen mit dem größten Fortschritt“ vergleicht den Bestwert (1RM, sonst Stufe/Wdh./Dauer) im Zeitraum mit dem Vorzeitraum (der Fortschritt aus der Statistik braucht 4 Einheiten je Übung und ist im Monat selten vorhanden). Ohne Einheit im Vorzeitraum steht „–“.
  - Übungs-CSV enthält alle Sätze (unabhängig vom Zeitraum), das PDF den gewählten Zeitraum.
- Offene Punkte:
  - **Handytest:** PDF teilen/speichern auf Android und iPhone (Teilen-Dialog, Dateien-App), Darstellung in den Standard-Viewern, Farben je Palette.
  - Ideen für später: Diagramme der Statistik direkt als Bild teilen; Bericht mit eigener Auswahl der Abschnitte; Fortschrittsfotos im Bericht.

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
- **Datensicherheit** (Nutzerwunsch vom 07.11.2026, siehe Beobachtung „App leer beim Teilen“ unter 15c): Hinweis bei blockiertem/laufendem DB-Update statt leerer App (Dexie `blocked`/`versionchange`, „Andere Fenster schließen“ + Neu laden); Speicher-Info in den Einstellungen (App-/DB-Version, Anzahl Einträge, Speicher dauerhaft?, Start über Icon oder Browser); Willkommens-Karte mit Hinweis „Schon benutzt? Über das Icon öffnen“ + Link „Backup wiederherstellen“; Satz auf „Weitergeben“, dass jeder eigene Daten auf dem eigenen Handy hat; Backup-Erinnerung prüfen

- **Zuerst (Vorab-Analyse 10.11.2026, Nutzerwunsch: diese Fehler vor den übrigen Punkten):**
  - **Ladebildschirm hakt beim Start auf dem Handy** („erst alles weiß, dann kommt es nach und nach“). Gemessen (Chrome-Trace, Playwright, DPR 2,625): Rasterisieren des Artworks (SVG mit `feTurbulence`/`feGaussianBlur`, Filterfläche 1220²) kostet am PC 0,5–1,6 s, ohne Artwork 10–30 ms; CPU-Drosselung (`Emulation.setCPUThrottlingRate`) bremst nur den Hauptthread, zeigt das also nicht. Plan: Artwork je Palette beim Build per `sharp` als WebP vorrendern (wie `npm run icons`, precachen), Splash zeigt nur das Bild; Animation nur Deckkraft (kein `scale`, das neu rastert).
  - **Android: App bleibt leer beim ersten Start** (Link per WhatsApp geteilt, im Browser flüssig, nach „aufs Handy holen“ hängt der erste Start). Nachgestellt mit CPU ×15 und leerer DB: nach dem Ladebildschirm 6–17 s nur „Heute“ + Navigation, Seite leer. Ursache: `applySeed` sperrt mit `db.transaction('rw', [settings, exercises, foods])` auch `settings`, alle Leser der Einstellungen warten bis zum Ende des Seeds (> 1000 Einträge). Plan: Seed-Transaktion nur über `exercises`/`foods` (bleibt idempotent über `builtinKey`), `seedVersion` danach getrennt schreiben. Zusätzlich: **Error Boundary** (bisher keine → ein Renderfehler = weiße Seite) mit Hinweis + „Neu laden“, und Hinweis bei blockiertem DB-Update (siehe Datensicherheit). Ggf. Browser-Tab und installierte App gleichzeitig offen (teilen auf Android denselben Speicher).
  - **Android: untere Leiste bewegt sich mit** – laut Nutzer in der **installierten App**, **ganz am Ende der Seite** = Overscroll-„Stretch“ von Chrome (dehnt die Ansicht samt fester `BottomNav`). Plan: `overscroll-behavior-y: none` an `html`/`body` (`src/index.css`); prüfen, dass Scrollen in Dialogen/Listen und Ziehen (`SortableList`) unverändert gehen. Nur auf dem Gerät prüfbar.
  - Messskripte (nicht im Repo): Preview auf eigenem Port, Playwright mit `newCDPSession` → `Emulation.setCPUThrottlingRate`, `Page.startScreencast`, `Profiler`, `browser.startTracing` (Kategorien `cc`, `disabled-by-default-devtools.timeline`, Summe `RasterTask`).

**Fertig wenn:** App auf Android und iPhone installiert und im Flugmodus voll nutzbar (vom Nutzer bestätigt).

**Notizen:**
- Gebaut (Teil 1, 10.11.2026, vor dem Push):
  - **Ladebildschirm vorgerendert:** `npm run icons` rendert das Artwork je Palette per `sharp` nach `public/splash-<palette>.webp` (Ausschnitt `SPLASH_ART_AREA` = −180/−150, 780 × 720 im 420er-Raster, 2 px je Einheit = 1560 × 1440; 14–87 KB je Bild, im Precache über `webp` in `globPatterns`). `splashHtml()` setzt nur noch `<img src="./splash-<palette>.webp">` (statt `<template>` mit SVG-Filtern), `artworkSvg` hat dafür die Option `area`. Animation nur Deckkraft (`splash-fade`, kein `scale`/`translate`).
  - **Seed sperrt die Einstellungen nicht mehr:** `applySeed` prüft die Version vorher, die Transaktion umfasst nur `exercises`/`foods`, `seedVersion` wird danach in eigener Transaktion gesetzt. Doppelter Lauf bleibt harmlos (Test: gleichzeitig zweimal, und Einstellungen sind während des Seeds lesbar).
  - **Fehleranzeige:** `ErrorBoundary` (`src/components/`) um die ganze App (`main.tsx`) und um den Seiteninhalt im `Layout` (`variant="page"`, `resetKey` = Pfad, Navigation bleibt): „Hier ist etwas schiefgelaufen“, „Neu laden“, „Zur Startseite“, technische Details; erkennt fehlende Teile nach einem Update. `reloadApp()` aktiviert vorher einen wartenden Service Worker.
  - **DB-Hinweis:** `watchDatabase(db)` (`src/db/dbStatus.ts`, in `main.tsx`) meldet `blocked` (Update wartet auf ein anderes Fenster; Hinweis erst nach 1,5 s, verschwindet von selbst), `outdated` (anderes Fenster hebt die Version an → Verbindung schließen statt automatisch neu öffnen, „Neu laden“) und `error` (Öffnen scheitert). Anzeige `DbStatusNotice` als Fenster über allem, blendet den Ladebildschirm aus. Dexie 4 öffnet eine neuere DB auch mit älterem Code (kein VersionError) – dafür kein eigener Fall.
  - **Overscroll:** `overscroll-behavior-y: none` an `html`/`body` (`index.css`). Folge: Im Browser-Tab gibt es kein „Ziehen zum Aktualisieren“ mehr.
  - **Speicher-Info** (Einstellungen → Export & Speicher): eigene Einträge (`loadDataSummary`, `src/db/dataSummary.ts`: aktive Einträge ohne mitgelieferte Übungen/Lebensmittel, dazu Workouts/Ausdauer/Alltagstage), „Geöffnet über das App-Icon/im Browser“ (`isInstalledApp`) mit Hinweis auf getrennte Speicher, dauerhaft, belegt, Version (`__APP_BUILD__` = Build-Datum + Commit aus `vite.config.ts`, CI `GITHUB_SHA`) und DB-Version.
  - **Hinweise:** Willkommens-Karte „Schon benutzt und alles leer? … über ihr Icon öffnen … oder Backup wiederherstellen“ (Link `/settings/backup`); „Weitergeben“: „Jede Person hat ihre eigenen Daten nur auf ihrem eigenen Handy …“. README: Abschnitt „Wenn etwas nicht stimmt“. Backup-Erinnerung geprüft (7 Tage, auch ohne je ein Backup), unverändert.
  - Tests: `dbStatus.test.ts`, `dataSummary.test.ts`, `ErrorBoundary.test.tsx`, Seed (Sperre, doppelter Lauf), `splash.test.ts`/`logo.test.ts`; E2E `e2e/safety.spec.ts` (Overscroll, Willkommen → Backup, Speicher-Info, Weitergeben offline; zweites Fenster hebt die DB-Version an → Hinweis „Neue Version geöffnet“), `branding.spec.ts` (Bild statt SVG, nur Deckkraft animiert).
- **Push 5 (10.11.2026):** Nutzer hat den Push freigegeben (keine DB-Änderung, Version bleibt 35). Gepusht `4db6412..4e75fec` (enthält auch Schritt 19), Run 42899517460 grün, live (`splash-basey.webp` im `sw.js`). Handytest steht aus.
- URL: https://bas3y.github.io/fitnesstracker/ (seit 18c/Push 4; Repo, Action und Pages bestehen seit 2b)
- Ergebnis Handytest (10.11.2026): Nutzer meldet „hat gepasst“ (Ladebildschirm, erster Start, Leiste, Speicher-Info, Flugmodus, Backup, PDF laut Liste). Geräte nicht einzeln genannt.
- Offene Punkte:
  - Ideen: Ausdauer aller Sportarten in einer CSV; einzelnes Workout als Datei exportieren.
  - Ladebildschirm-Bilder zeigen das feine Rauschen (10 % Deckkraft) kaum noch – auf dem Gerät unauffällig.

---

## Phase 7 – Basey Pro: Standards, Zugang, Coach & KI

Mit dem Nutzer abgestimmt (10.11.2026, nach Schritt 20):
- **Standards:** Ein Freund hat ein privates GitHub-Repo „standards“ (allgemeine Regeln, Skills, Vorlagen, `SECURITY.md` für Software mit Claude). Wird als erster Schritt übernommen, vor allem vor dem Server. Ab Schritt 21 gelten diese Standards zusätzlich zu den Projektregeln.
- **Zugang & Bezahlung:** Der Nutzer will bestimmen, wer die App nutzt, und Geld dafür verlangen – nicht einfach per Link teilbar. Entscheidung: **echter Schutz mit Server** (Anmeldung + serverseitige Lizenz), **Bezahlung manuell** (Admin legt Kunden an/verlängert), **Admin-Bereich** und **Trainer sieht Kundendaten** (braucht Sync). Die App bleibt offline voll nutzbar und prüft die Lizenz gelegentlich online (Kulanzzeit, z. B. 14 Tage), danach Sperrbildschirm – Daten bleiben, Backup-Export geht weiter.
- **Dienste (Nutzerentscheidung 10.11.2026): Supabase, Vercel, Sentry.**
  - **Supabase** (Projekt in Region EU/Frankfurt): Auth, Postgres mit Row Level Security, Edge Functions (Lizenzprüfung, Admin-Aktionen, KI-Proxy), später Sync.
  - **Vercel** (Hosting, Deploy aus dem privaten Repo, Vorschau-Deploys je Branch). Achtung: Der kostenlose Hobby-Tarif ist nur für nicht-kommerzielle Nutzung → bei zahlenden Kunden **Pro-Tarif** nötig. Funktionsregion EU (`fra1`), falls Vercel-Funktionen genutzt werden (sonst laufen Server-Teile in Supabase).
  - **Sentry** (Fehlerüberwachung, Organisation in der **EU-Datenregion**): SDK gebündelt (kein CDN), nur Fehler + Build-Kennung (`__APP_BUILD__` als Release, Source Maps per Upload im Build, nicht ausgeliefert). **Keine Gesundheitsdaten:** `sendDefaultPii: false`, kein Session Replay, `beforeSend`/`beforeBreadcrumb` entfernen Eingaben, URL-Parameter und Konsolentexte; Nutzer nur als pseudonyme ID. Offline gesammelte Fehler später senden. Abschaltbar in den Einstellungen (Einwilligung je nach Rechtslage).
- **Repo wird privat**, Hosting zieht von GitHub Pages zu Vercel, eigene Domain empfohlen. Neue Adresse = neuer, leerer Speicher → Umzug per Backup mit Hinweis in der alten App. Geheimnisse (Supabase Service-Role-Key, Sentry-Auth-Token, KI-Schlüssel) nur in Vercel-/Supabase-Umgebungsvariablen, nie im Client; im Client nur Supabase-URL + Anon-Key und Sentry-DSN.
- **KI:** Anbindung an ein LLM eines Anbieters, Daten sind **vertraulich** → Aufruf nur über den eigenen Server (Schlüssel nie im Client), Anbieter mit EU-Verarbeitung/AVV, kein Training mit den Daten, möglichst Zero Data Retention. Freigabe je Datenbereich, Vorschau der gesendeten Daten.
- **Rechtliches** (Nutzer klärt selbst, keine Rechtsberatung): Gewerbe, Impressum, Datenschutzerklärung, AVV mit Anbietern, Gesundheitsdaten = besondere Kategorie (Art. 9 DSGVO) → ausdrückliche Einwilligung.
- **Zwei Bereiche (11.11.2026):** Neben Basey gibt es **LocalGym** mit eigener Optik, eigenem Gym-Admin und Trainern; der Nutzer ist Super-Admin über beide. Umsetzung als Mandanten (Organisationen) mit einem gemeinsamen Code, Unterschiede nur per Konfiguration (Schritte 23, 24, 24b). Gym-Funktionen für Mitglieder (Trainer kontaktieren, Termine, Kurse, wer ist da) und fein abgestufte Rollen folgen nach dem Sync (Schritte 34–37).
- **Fragen:** Fachliche Details werden jeweils beim Start des Schritts geklärt; bekannte offene Fragen stehen im Schritt unter „Offene Fragen“.
- **Grundsätze:** Lokale Daten bleiben der Hauptspeicher. Vorschläge (Kalorienziel, HF-Zonen, Plan, KI-Einträge) werden **nie automatisch übernommen**, immer mit Bestätigung. Neue Tabellen nur per Dexie-Version + Backup. Online-Funktionen offline ausgegraut („Nur mit Internet“).
- Recherche Analysen: InBody (LookinBody 120/LB-Web) exportiert CSV/Excel; seca (mBCA/seca analytics) ohne öffentliche Formatangabe; „Ovida Diagnostics“ online nicht auffindbar → Beispieldateien vom Nutzer.

### Schritt 21 – Standards übernehmen (Regeln, Skills, SECURITY.md)
**Ziel:** Die Standards des Freundes gelten im Projekt, der bestehende Code ist dagegen geprüft.
- **Voraussetzung:** Nutzer stellt das Repo bereit (Einladung bzw. geklont/heruntergeladen, Pfad nennen). Inhalt komplett lesen; Erlaubnis des Freundes zur Übernahme/Lizenz beachten.
- Übernehmen: `SECURITY.md` ins Repo, allgemeine Regeln in `CLAUDE.md` (bei Widerspruch zu bestehenden Projektregeln mit dem Nutzer entscheiden), Skills nach `.claude/skills/`, Vorlagen (Issue/PR/Commit o. ä.) wo sie passen.
- **Bestandsprüfung** gegen die Security-Regeln, z. B.: Content-Security-Policy, Abhängigkeiten (`npm audit`), Import-Parser gegen große/bösartige Dateien (FIT/ZIP/Apple Health), Backup-Import-Validierung, Open-Food-Facts-Abfrage, keine Geheimnisse im Repo/Verlauf. Funde beheben oder als offene Punkte notieren.
- Security-Anforderungen für Server, Admin, KI und Sync (Schritte 23–33) als Checkliste hier in die ROADMAP übernehmen.

**Notizen:**
- Mit dem Nutzer abgestimmt (12.11.2026): Vom Freund kommt **nur `SECURITY.md`** (keine Skills, keine Vorlagen). Steckbrief **Typ 3** (Basey + LocalGym als Mandanten in einer Instanz), Module **Uploads** + **Schnittstellen**, Daten personenbezogen + besonders sensibel; Zahlungen erst mit einem Zahlungsanbieter. **Freigabe:** bei jedem Schritt erst der Plan, Code erst nach OK.
- Gebaut:
  - `SECURITY.md` unverändert im Repo, `CLAUDE.md` mit Abschnitt „Sicherheit“ (Verweis, Steckbrief, Freigabe-Regel), Ablauf Punkt 4 angepasst.
  - **Bestandsprüfung** (Ergebnis):
    - **ZIP-/GZ-Bombe (mittel, behoben):** `decompress`/`readZipEntry` lasen ohne Grenze in den Speicher, eine GZ-Datei, die sich selbst enthält, lief endlos (GZ zählte nicht zur Verschachtelung). Jetzt `MAX_FILE_BYTES` = 200 MB je Datei, gemessen am tatsächlichen entpackten Strom (`limitStream`, Größenangaben im ZIP sind nicht verlässlich), auch für ungepackte Dateien und Garmin-JSON; GZ zählt zur Tiefe (`MAX_NESTING` = 3). Der Apple-Health-Export bleibt gestreamt (mehrere GB möglich, ohne Speicherwachstum). Tests `zip.test.ts`, `readFiles.test.ts`.
    - **Content-Security-Policy (mittel, umgesetzt):** `src/security/csp.ts` + Vite-Plugin `basey-csp` (nur Build) setzt ein `<meta http-equiv>` direkt hinter `<meta charset>`: Skripte nur `'self'` + SHA-256 der Inline-Skripte (automatisch berechnet), Stile inline erlaubt, `connect-src` nur `'self'` + Open Food Facts, `object-src`/`base-uri` `'none'`. Zod erzeugte per `new Function` Code (Verstoß) → `window.__zod_globalConfig = { jitless: true }` im Inline-Skript in `index.html` (`z.config()` kam zu spät, Schemas werden beim Laden des Chunks gebaut). `<meta name="referrer" content="no-referrer">`.
    - **Escaping im Logo-SVG (niedrig, behoben):** `aria-label` wurde ungeprüft eingesetzt (nur mit festem Wert genutzt) → `escapeAttr` (`src/brand/xml.ts`).
    - **npm audit:** ausgelieferte Pakete 0 Funde. 15 Funde (2 low, 13 moderate) nur in Entwicklungswerkzeugen (`eslint`/`typescript-eslint` über `minimatch`, `vite-plugin-pwa` → `workbox-build` über `glob`/`deepmerge`); `npm audit fix --force` würde auf ältere Hauptversionen zurückstufen → nicht übernommen, Dependabot meldet Updates.
    - **In Ordnung:** keine Geheimnisse in Code und gesamter Git-History (Muster-Suche + neues Skript), keine Source Maps im Build, kein `eval`, `localStorage` nur Optik + Erinnerungs-IDs (keine Gesundheitsdaten), Backup-Import per Zod (unbekannte Felder fallen weg, neuere DB-Version abgelehnt), Open-Food-Facts-Abfrage nur mit der Nummer (`credentials: 'omit'`, `no-referrer`, Zeitlimit, Antwort geprüft), Fotos werden per Canvas neu kodiert (EXIF/Standort fällt weg).
  - **Lieferkette/Secrets:** `.github/dependabot.yml` (npm + Actions, wöchentlich, kleine Updates gruppiert), Workflow `security.yml` (Semgrep `p/default`+`p/typescript`+`p/react` im offiziellen Docker-Image, `npm audit --audit-level=high`, Secret-Scan; bei Push, PR und montags; blockiert das Deployment nicht), `deploy.yml` prüft vorher `npm audit --omit=dev --audit-level=high` + Secret-Scan. Secret-Scan ohne Paket: `scripts/check-secrets.mjs` (`--staged` | `--all`, Muster für Schlüssel/Tokens/JWT/DB-URLs, verbietet `.env*`/`.pem`/`.key`; Ausnahme per `secret-scan: ignore`), Git-Hook `.githooks/pre-commit` (aktiv über `git config core.hooksPath .githooks`, findet das portable Node.js). `.env.example` mit leeren Platzhaltern.
  - **E2E:** `e2e/fixtures.ts` – alle Specs importieren `test`/`expect` von dort, jeder Test schlägt bei einem CSP-Verstoß fehl (Ereignis `securitypolicyviolation` + Konsole). `e2e/csp.spec.ts` weist nach, dass eingeschleuste Skripte, `onerror`-Handler und fremde Adressen blockiert werden (`page.evaluate` ist von der CSP ausgenommen, `eval` lässt sich so nicht prüfen). 941 Unit-Tests, 130 E2E grün (ganze Suite ohne CSP-Verstoß; `goals.spec.ts` einmal fehlgeschlagen, in 4 Wiederholungen grün → gelegentlich instabil, nicht CSP).
- Abweichungen:
  - Keine Skills/Vorlagen übernommen (nicht geliefert).
  - CSP als `<meta>`, weil GitHub Pages keine Header setzen kann → `frame-ancestors`, HSTS, `X-Content-Type-Options`, `Permissions-Policy` erst mit Vercel (Schritt 23).
  - `style-src 'unsafe-inline'` bleibt (Ladebildschirm, `style`-Attribute in SVG und Recharts); Skripte sind streng.
- Offene Punkte:
  - **Nach dem nächsten Push prüfen:** Dependabot und `security.yml` laufen erst auf GitHub, Semgrep ist lokal ungetestet (Funde dann beheben oder begründet mit `nosemgrep` markieren; `BaseyLogo` ist schon markiert).
  - **Repo-Einstellungen (Nutzer, GitHub):** Secret Scanning + Push Protection und Dependabot-Alerts einschalten, Branch-Schutz für `main`, 2FA am Konto. Bei privatem Repo (ab 23) ist Secret Scanning je nach Tarif kostenpflichtig → der eigene Secret-Scan bleibt die Grundlage.
  - Audit-Funde der Entwicklungswerkzeuge verschwinden mit den nächsten Updates von ESLint/typescript-eslint/vite-plugin-pwa (Dependabot).
  - `security.txt` braucht die eigene Domain (unter `github.io/fitnesstracker/` liegt `/.well-known/` nicht in unserer Hand) und eine Kontakt-Adresse → Schritt 23.

### Security-Checkliste Phase 7 (aus `SECURITY.md`, Typ 3)
Gilt zusätzlich zur Definition of Done. Beim Start des jeweiligen Schritts abarbeiten und in dessen Notizen vermerken, was erfüllt ist.

**Schritt 23 – Server, Anmeldung, Umzug**
- [ ] Getrennte Supabase-Projekte **Test** und **Live** (eigene Keys); Claude/MCP nur gegen Test (SECURITY 1.3, 10)
- [ ] Secrets nur in Vercel/Supabase/CI (Service-Role-Key, Sentry-Auth-Token); im Client nur URL + Anon/Publishable-Key und DSN; `.env.example` ergänzen; Secret-Scan erkennt neue Schlüsselarten
- [ ] Schema nur als Migrationen in `supabase/`; **RLS auf jeder Tabelle**, Regeln getrennt für select/insert/update/delete, `USING` + `WITH CHECK`, nur `auth.uid()`
- [ ] Mandanten: Tabellen `organizations` + Zuordnung Nutzer↔Organisation serverseitig; jede Datentabelle `organization_id` NOT NULL + FK + Index, Standardwert serverseitig, nie vom Client
- [ ] Rollen in eigener Tabelle (nicht `user_metadata`), Rollenmatrix dokumentiert
- [ ] Supabase Auth: Registrierung aus, nur Einladung (an Organisation + E-Mail gebunden, einmalig, befristet), E-Mail-Bestätigung, Passwort ≥ 10 + Leak-Prüfung, Captcha bei Login/Reset/Einladung, Rate-Limits, Redirect-URLs nur Live-Domain
- [ ] Lizenzprüfung als Edge Function mit eigener Berechtigungsprüfung; gesperrte Nutzer verlieren sofort alle Sitzungen
- [ ] GraphQL und unnötige Schemas aus, `anon` ohne Ausführungsrechte auf Funktionen, Views mit `security_invoker`, `SECURITY DEFINER` nur mit festem `search_path`
- [ ] **Angreifer-Test mit Anon-Key:** automatischer Test fragt jede Tabelle/View/Funktion/Bucket (Liste aus der DB) ohne Login ab → leer/abgelehnt; zusätzlich als Nutzer von Organisation A gegen B
- [ ] Vercel: `vercel.json` mit Headern (CSP als Header inkl. `frame-ancestors 'none'`, HSTS, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` – Kamera nur `self`), Firewall/Bot-Schutz an, keine Source Maps ausgeliefert; CSP `connect-src` um Supabase/Sentry erweitern (`src/security/csp.ts`)
- [ ] Sentry EU: `sendDefaultPii: false`, kein Replay, `beforeSend`/`beforeBreadcrumb` filtern Eingaben/URL-Parameter/Konsole, Test dafür; Schalter in den Einstellungen
- [ ] `/.well-known/security.txt` mit Kontakt; Repo privat, Branch-Schutz, 2FA auf allen Konten (GitHub, Supabase, Vercel, Sentry, Domain), Domain mit Registrar-Lock
- [ ] OWASP ZAP Baseline gegen die Vorschau-Umgebung in der CI (hohe Funde stoppen das Deployment)
- [ ] Alarm bei vielen fehlgeschlagenen Logins / 401/403 / RLS-Ablehnungen; Logs ohne Passwörter, Tokens, Gesundheitsdaten
- [ ] Backups (Supabase PITR o. ä.), Wiederherstellung einmal real geübt; Notfallplan schriftlich (Zugänge sperren, Schlüssel rotieren, 72-h-Meldepflicht)
- [ ] Datenschutzerklärung, Impressum, Einwilligung Art. 9 DSGVO, AVVs (Supabase, Vercel, Sentry) – Nutzer klärt rechtlich

**Schritt 24/24b – Admin, Gym-Bereich**
- [ ] 2FA für Admin- und Gym-Admin-Rollen erzwungen
- [ ] Admin-Aktionen nur serverseitig (Edge Function prüft Rolle), Rechteänderungen und Sperren im Audit-Log
- [ ] Gym-Admin verwaltet nur Nutzer/Einstellungen **seiner** Organisation; Super-Admin-Zugriff auf Kundendaten getrennt und protokolliert
- [ ] Tests je Rolle (erlaubt/verboten, direkt gegen die API) + Mandantentests A↔B (lesen, ändern, löschen, anlegen, `organization_id` fälschen)
- [ ] Massenaktionen (Export, Löschen) auf die erlaubte Datenmenge begrenzt; Nutzer vollständig löschbar

**Schritt 24c/24d – Uhren, Push**
- [ ] Eingehende Webhooks (Whoop, Garmin, Kurzbefehl) mit Signaturprüfung bzw. persönlichem, rotierbarem Token; Daten wie Nutzereingaben validiert (Zod, Größen)
- [ ] OAuth-Tokens der Anbieter nur serverseitig, verschlüsselt, minimale Scopes; ausgehende Aufrufe mit Zeitlimit und Wiederholungsgrenze
- [ ] Push: Abos je Nutzer per RLS, Push-Inhalte ohne Gesundheitsdetails (Sperrbildschirm)

**Schritt 28/29 – Uploads (Befunde)**
- [ ] Dateityp am Inhalt + Größe prüfen (wie Import: Obergrenze, keine Bomben), Dateinamen neu vergeben, Metadaten entfernen
- [ ] Wenn Dateien auf den Server gehen: privater Bucket, Pfad mit `organization_id`/Nutzer, Speicher-Regeln, nur signierte, kurz gültige Links

**Schritt 31/32 – KI**
- [ ] Nur über eigenen Proxy (Edge Function), Schlüssel nie im Client, Login + Lizenz geprüft, Rate-Limit/Kostenlimit je Nutzer
- [ ] Anbieter mit EU-Verarbeitung/AVV, kein Training, möglichst Zero Data Retention; Freigabe je Datenbereich + Vorschau der gesendeten Daten
- [ ] Prompt-Injection: Antworten der KI nie als HTML rendern oder ungeprüft ausführen; KI-Vorschläge nur mit Bestätigung (Grundsatz Phase 7)

**Schritt 33 – Sync & Trainer-Freigabe**
- [ ] Jede synchronisierte Tabelle mit RLS (Besitzer + ausdrückliche Freigabe an Trainer), keine Freigabe per bloßer ID (IDOR), Freigabe widerrufbar
- [ ] Server validiert jeden Datensatz (Zod-Schemas wiederverwenden), nur erlaubte Felder (Mass Assignment), `updatedAt`/`deletedAt` serverseitig plausibel
- [ ] Fotos nur in privatem Bucket mit Speicher-Regeln

**Schritte 34–38 – Gym-Funktionen, Freunde**
- [ ] Feine Rollen in Tabelle + Matrix + Tests je Rolle; Nachrichten nur zwischen berechtigten Personen, keine Gesundheitsdaten in Benachrichtigungen
- [ ] Anwesenheit/Freunde: nur mit Einwilligung sichtbar, Datensparsamkeit, Löschfristen
- [ ] Vor dem ersten echten Kunden: externer Penetrationstest; danach jährlich und nach großen Änderungen

**Laufend (ab 23):** wöchentlich Dependabot/Alarme, monatlich Updates + Zugänge prüfen, vierteljährlich Security-Review in neuer Sitzung (Rolle Angreifer) + Black-Box-Test der Live-Adresse + Wiederherstellung testen + Schlüssel rotieren.

### Schritt 22 – Fotos zuverlässig & Alltag in der Statistik
**Ziel:** Fotos werden beim Hochladen nie verwechselt oder ersetzt; der Alltag-Verlauf ist Teil der Statistik.
- **Fotos:** Fehler beim Hochladen nachstellen (Mehrfachauswahl, iPhone liefert oft `image.jpg`, mehrere Fotos am gleichen Tag/gleiche Ansicht). Metadaten und Bilddaten haben schon UUIDs (`addProgressPhoto`, `src/db/photos.ts`) – Ursache finden (Objekt-URLs, Reihenfolge, gleichzeitiges Speichern) und sicherstellen, dass jedes Foto eindeutig bleibt; Test für Mehrfach-Upload.
- **Alltag in der Statistik:** eigene Ansicht `view=daily` in `useStatsFilter` (Gewicht, Schritte, Schlaf, Wasser, Ruhepuls/HRV) mit Zeitraum, nutzt `DailyHistoryCard`; Recharts nur lazy.

**Notizen:**
- Mit dem Nutzer abgestimmt (13.11.2026): Ein Foto-Fehler war nie aufgetreten, der Punkt war **Vorsorge** (gleiche Dateinamen, später Trainer/mehrere Nutzer) → nachweisen statt umbauen. Mehrfachauswahl mit **einem Fenster für alle**. Verlauf des Alltags **nur noch in der Statistik**, mit Ø-Kacheln. Zusätzlich: Übungsliste der Kraft-Statistik kompakter (Nutzer: „sehr unübersichtlich“); die Seite insgesamt wird mit Schritt 25 neu geordnet (Notiz dort).
- Gebaut:
  - **Fotos – Ergebnis der Prüfung:** Keine Verwechslung möglich. Dateinamen werden nirgends gespeichert, jedes Foto und jede Bilddatei hat eine eigene UUID (`crypto.randomUUID()`), Bilddaten hängen nur an `photoId`, Objekt-URLs sind je Foto getrennt. Auch mit Sync/Trainer (33) kein Konflikt: UUIDs sind global eindeutig, Server-Pfade laut Security-Checkliste mit `organization_id`/Nutzer. Nachweis: Unit-Tests (6 Fotos gleichzeitig, gleicher Tag/Ansicht → jedes mit eigenen Bilddaten; Mehrfachauswahl; ungültiger Eintrag → nichts gespeichert) und E2E (4 Dateien „image.jpg“ als JPEG, gleicher Tag, eins entfernt, Farbe am Pixel von Vorschau und Vollbild geprüft, auch nach Neuladen).
  - **Mehrfachauswahl:** `<input multiple>`, bis `PHOTO_BATCH_MAX` = 10 Fotos (mehr → Hinweis, die ersten 10), nacheinander verkleinert mit Fortschritt („2 von 5“), nicht lesbare Bilder werden gemeldet, der Rest bleibt. Fenster „3 Fotos speichern“: Tag gemeinsam, je Foto Vorschau, Ansicht, Notiz, Entfernen; Speichern über `addProgressPhotos` in **einer Transaktion** (alle oder keins). Bei einem Foto sieht das Fenster aus wie bisher.
  - **Absicherung:** Speichern sperrt sofort per Ref (doppeltes Antippen legt nichts doppelt an, E2E mit Doppelklick), `prepareImage` gibt die Zeichenfläche nach dem Kodieren frei (Canvas-Speichergrenze in Safari).
  - **Statistik → Alltag** (`DailyStats`, `view=daily`): Ø-Kacheln im Zeitraum (`dailyOverview`: Schritte, Schlaf, Wasser mit „Ziel an x von y Tagen“, Gewicht = letzter Wert + Änderung, Ruhepuls, HRV; ohne Werte ausgeblendet; Antippen wählt die Kennzahl), darunter Karte „Verlauf“ wie bisher (alle Tageswerte, Gewohnheiten, Aufhören-Gewohnheiten, Schlafphasen). Kennzahl als `metric` in der URL (übersteht Neuladen und Bereichswechsel). Kachel „Verlauf“ in Alltag und `DailyHistoryPage`/`DailyHistoryCard` entfernt, `/daily/history` leitet um, „Verlauf ansehen“ nach dem Gesundheits-Import führt dorthin.
  - **Übungsliste Kraft:** gruppierte Liste (`GroupRow`: Einheiten darunter, Fortschritt rechts) statt einzelner Zeilen-Karten, erst 5 (`EXERCISE_PREVIEW_COUNT`), dann „Alle x Übungen anzeigen“ mit Suchfeld (`searchOverviews`, Umlaute egal, Sortierung bleibt). Satzpausen ebenfalls als gruppierte Liste.
  - Tests: `daily.test.ts` (Übersicht), `stats.test.ts` (Suche), `photos.test.ts` (gleichzeitig, Mehrfachauswahl, alles-oder-nichts); E2E `daily.spec.ts` (Statistik → Alltag, Kacheln, URL, Umleitung), `habits.spec.ts`/`health.spec.ts` angepasst, `stats.spec.ts` (Übungsliste), `timerPhotos.spec.ts` (Mehrfachauswahl). Helfer `openDailyStats`. 947 Unit-Tests, 134 E2E grün. Hauptbundle ~349 KB.
- Abweichungen:
  - Ø-Kacheln für Schritte/Schlaf/Wasser/Gewicht/Ruhepuls/HRV; Stimmung, Energie, Schlafqualität nur im Diagramm (sonst zu viele Kacheln).
  - Satzpausen-Liste mit umgestellt (gleiche Optik wie die Übungen).
- Offene Punkte:
  - **Handytest:** Mehrfachauswahl auf iPhone (Fotos-App, „image.jpg“) und Android, 10 große Fotos am Stück (Speicher), Statistik → Alltag mit vier Bereichen auf schmalen Handys.

### Schritt 22b – Bedienung: Anpassen-Stift, interaktive Widgets, Navigation
**Ziel:** Die App reagiert mehr auf Antippen und zeigt klarer, wo man ist (Nutzerwunsch 11.11.2026).
- **Anpassen-Stift bleibt sichtbar:** Beim Herunterscrollen bleibt der Stift (`CustomizeToggle` bzw. Kopf-Aktion) erreichbar – z. B. schwebender Button unten rechts über der `BottomNav` oder mitlaufender Kopf. Gilt für alle Seiten mit „Anpassen“ (Startseite, Training, Alltag …).
- **Interaktive Widgets und Diagramme:** Balken/Punkte antippbar mit kleiner Vorschau der Werte (Tag, Menge, Ziel). Beispiel großes Wasser-Widget: Balken antippen → Vorschau des Tages + direkt „+500 ml“ (bzw. Menge ändern) für diesen Tag. Gemeinsamer Baustein (Antipp-Vorschau für `MiniBars`/`WeekDots`/Heatmap/Recharts), mit Tastatur und Screenreader bedienbar.
- **„Intelligenter“ statt statisch:** Widgets zeigen passende nächste Schritte statt nur Zahlen, z. B. „noch 750 ml bis zum Ziel“ + Knopf, „Letztes Beintraining vor 6 Tagen“, „Protein: 40 g fehlen – Favoriten vorschlagen“, überfällige Supplements/Gewohnheiten im passenden Widget. Regeln lokal in `src/domain/` (offline, testbar); später ergänzen die Vorschläge aus 26/27 und die KI (31/32) diese Stellen.
- **Tägliche Hinweise** morgens (Schlaf, heutiger Plan), nach dem Training (Kurzfazit, Rekorde) und abends (Tagesbilanz, **Ernährungsbericht**: Kalorien/Makros vs. Ziel, was fehlt) als Karte auf der Startseite – regelbasiert und offline; ab 24d auch als Push, ab 31 mit KI-Text.
- **Navigation zeigt, wo man ist:** aktiver Eintrag in der `BottomNav` deutlicher (Vorschlag: gefülltes Feld/Pille hinter Symbol + Text in Primärfarbe, auch auf Unterseiten des Bereichs aktiv). **Optik vorher mit dem Nutzer abstimmen** (2–3 Varianten als Vorschau zeigen).
- **Nur noch ein Logo (Nutzerwunsch 12.11.2026):** Logo fest **Charcoal Satin**, die Auswahl entfällt. Karte „App-Logo“ (`LogoPicker`) aus Einstellungen → Darstellung entfernen; `applyLogoVariant`/`localStorage.logo`/Tausch des `apple-touch-icon` entfernen bzw. fest auf `charcoal`; Variante `taupe` aus `LOGO_VARIANTS`/`LOGO_ARTWORKS` und die zugehörigen Icons (`apple-touch-icon-taupe.png`, `npm run icons`) streichen. Daten: `Settings.logoVariant` per neuer Dexie-Version auf `charcoal` setzen oder entfernen; Backup-Import alter Dateien mit `taupe` muss weiter klappen (Wert ignorieren). Tests (`logo.test.ts`, `branding.spec.ts`, Migration) und `CLAUDE.md` (Abschnitt „Logo & Ladebildschirm“) anpassen. Ladebildschirm-Artworks je Farbpalette bleiben.
- **Vorbereitung für 32b:** Die Antipp-Vorschau und Schnell-Aktionen so bauen, dass sie später in einem Fenster (Schnellansicht einer Kachel) wiederverwendet werden können.

**Notizen:**
- Mit dem Nutzer abgestimmt (13.11.2026, Vorschau im Artifact „Basey 22b Navigation“, https://claude.ai/artifact/1iSW6AmuHcoRV7zLREEnaV): **Navigation A** (helle Pille hinter dem Symbol, Text fett, auch auf Unterseiten aktiv); **Anpassen-Stift B** (mitlaufender Kopf: beim Scrollen schmale Leiste oben mit Seitenname + Stift, für alle Seiten über `Page`); **Antipp-Vorschau B** (Detailzeile unter den Balken mit großen Knöpfen, startet auf heute, Baustein wiederverwendbar für 32b); **Tageshinweis als Widget** (morgens/nach dem Training/abends, über Anpassen verschieb- und abschaltbar, bei bestehenden Startseiten einmal oben eingefügt). Vorschlag: Navigationseintrag „Dashboard“ heißt „Heute“.
- **Fehler iPhone (Nutzer, 13.11.2026):** Die untere Leiste stand einmal mitten im Bild, Inhalt lief darunter weiter (Screenshot Startseite, installierte App). Die Overscroll-Lösung aus 20 hilft offenbar auf iOS nicht in jedem Fall → in 22b beheben (mit der neuen Navigation).
- **Neue Ideen (Nutzer, 13.11.2026), erst als Entwurf** (Artboard „Neue Ideen“ im selben Artifact): Artwork der jeweiligen Palette leicht im Hintergrund (Vorbild: Hero-Bild mit großem Text, aber viel dezenter; Varianten A oben auslaufend, B ganzflächig sehr leicht, C dunkel kräftiger) und schwebende Navigation nur mit Symbolen, aktiver Bereich zeigt seinen Namen (D dunkel, E hell, F Akzent) – gut, wenn später mehr Bereiche dazukommen. Nutzer: Hintergrund **A und C gefallen** (A hell oben auslaufend, C dunkel kräftiger); für die Leiste Mischung aus A + F gewünscht → Entwurf Abschnitt 7 (G schwebend abgerundet, H schmale Kapsel, I volle Breite; je hell/dunkel), Entscheidung: **Navigation bleibt Variante A (Pille)**, normale Leiste unten; **Hintergrund A (hell) + C (dunkel) direkt in 22b**. **Ablauf:** neue Optik immer erst als Entwurf im Artifact, Entscheidung des Nutzers in der ROADMAP notieren, dann umsetzen.
- Gebaut:
  - **Nur ein Logo:** `src/brand/logo.ts` hat nur noch `LOGO_ARTWORK` (Charcoal Satin), `logoSvg(options)` ohne Variante. `LogoPicker`, `applyLogoVariant`/`storedLogoVariant`, `apple-touch-icon-taupe/-charcoal.png` entfernt; `npm run icons` erzeugt nur noch `apple-touch-icon.png`. Der Ladebildschirm löscht `localStorage.logo`. **Dexie v36** entfernt `Settings.logoVariant`, Backups mit dem Feld (auch `taupe`/unbekannt) bleiben importierbar (Feld fällt weg).
  - **Leiste kann nicht mehr wandern (iPhone-Fehler):** Nicht mehr das Dokument scrollt, sondern der Inhaltsbereich im `Layout` (`data-scroll-root`, `scrollRoot()`); `html`/`body`/`#root` sind `overflow: hidden`, die `BottomNav` ist ein normales Element unter dem Scrollbereich statt `fixed`. Angepasst: `useScrollMemory`, `SortableList` (Auto-Scroll auf die Scrollhöhe beim Greifen begrenzt – die verschobene Zeile vergrößerte sonst den Bereich), Scroll-Sperre der Vollbild-Auswahlen (`lockScroll()`), `ErrorBoundary` der App. Der Scrollbereich bildet bewusst keine eigene Stapelebene, damit Fenster über der Navigation bleiben.
  - **Navigation A:** helle Pille hinter dem Symbol, Name fett, kräftigerer Strich; auch auf Unterseiten aktiv (`NavLink`). Erster Eintrag heißt jetzt **„Heute“** (vorher „Dashboard“).
  - **Mitlaufender Kopf (B):** `CompactHeader` + `useScrolledPast` – sobald die Überschrift aus dem Bild ist, erscheint oben eine schmale Leiste mit Seitenname, Zurück-Pfeil und Kopf-Aktion (Stift/Fertig). Gilt für alle Seiten über `Page` und für die Startseite. Die Aktion am alten Platz ist dann `inert` + `aria-hidden` (`HeaderAction`), es gibt den Button also nie doppelt.
  - **Hintergrund-Artwork:** `PageArtwork` zeigt das Ladebildschirm-Bild der Palette (`splash-<palette>.webp`, schon im Precache) oben hinter dem Kopf, nach unten auslaufend; hell 35 % (A), dunkel 55 % (C). Scrollt mit.
  - **Balken antippen (B):** `MiniBars`/`WeekDots` mit `selection` (Buttons, `aria-pressed`, Pfeiltasten/Pos1/Ende über `dayKeyNavigation`), darunter `DayPeek` (Tag, Wert, große Knöpfe; startet auf heute). Großes Wasser-/Schritte-/Schlaf-Widget: „0,25 l von 2,5 l · noch 2,25 l“, Wasser „+250 ml“ für genau diesen Tag und „Ändern“ (Körper & Befinden mit dem Tag), sonst „Eintragen“. „Diese Woche“: Tage antippbar, zeigt die Trainings des Tags mit Link.
  - **Nächste Schritte in Widgets** (`src/domain/nudges.ts`): „Letztes Beintraining vor 6 Tagen“ in „Diese Woche“ (Bereiche Beine/Brust/Rücken/Schultern, nur Hauptmuskeln, ab 4 Tagen, nie trainierte Bereiche zählen nicht). Ernährung: ab 10 g fehlendem Protein „Protein: 40 g fehlen – zum Beispiel:“ mit bis zu drei proteinreichen (≥ 10 g/100 g) Favoriten bzw. oft/zuletzt gegessenen Lebensmitteln, Antippen trägt die Standardportion in die Mahlzeit nach Uhrzeit ein (`mealForTime`, `loadPreferredFoods`, `ProteinNudge`). „Noch 750 ml“ gab es schon. Fällige Supplements waren im Widget schon markiert.
  - **Tageshinweis** (Widget `dayHint`, `src/domain/dayHints.ts`): morgens 4–11 Uhr (Schlaf vs. Ziel, Plantag „Heute im Plan“/„Nächstes Training“, Supplements bis Mittag), bis 3 h nach dem Training (Dauer, Sätze bzw. Strecke, neue Rekorde, „Ansehen“), ab 18 Uhr Tagesbilanz (kcal und Protein vs. Ziel, Wasser, offene Gewohnheiten/Supplements bzw. „Alles erledigt“). Farbblock je Tageszeit, wegtippen gilt für diese Tageszeit (`Settings.dayHintDismissed`, v36). Tagsüber unsichtbar. v36 und Backup-Import älterer Sicherungen setzen das Widget einmal an den Anfang der Startseite (`withDayHint`), neue Installationen haben es im Standard.
  - Tests: `nudges.test.ts`, `dayHints.test.ts`, `week.test.ts` (Tagesname, Trainings eines Tags), Migration v35→v36, Backup (Logo-Feld, Tageshinweis); E2E `interaction.spec.ts` (Navigation markiert, Leiste unten + Dokument scrollt nicht, Artwork offline, mitlaufender Kopf mit Fertig/Zurück, Wasser für gestern nachtragen + Pfeiltaste, Tageshinweis abends mit Uhr 20:00 und Wegtippen nach Neuladen), `branding.spec.ts` (keine Logo-Auswahl, festes Icon). E2E-Helfer `scrollTop`/`setScrollTop`; Fixture-Option `dayHint` (Standard aus, weil der Hinweis von der Uhrzeit abhängt). 963 Unit-Tests, 142 E2E (2 Ausfälle nur im vollen Lauf unter Last – `backup.spec`, `endurance.spec` –, einzeln und 3× wiederholt grün). Hauptbundle ~359 KB (vorher ~349).
- Abweichungen:
  - Heatmap und Recharts-Diagramme nicht umgebaut: Die Heatmap wählt Tage schon selbst (`ActivityCard`), Recharts hat Tooltips.
  - Gewohnheiten haben keine Uhrzeit → nichts „Überfälliges“ im Widget; offene Gewohnheiten nennt der Abend-Hinweis.
  - Der Tageshinweis zeigt in E2E nichts (`window.__hideDayHint` aus `e2e/fixtures.ts`), sonst hingen viele Tests von der Uhrzeit ab.
  - „Einstellungen“ bleibt in der Navigation als Name (bei schmalen Handys gekürzt wie bisher).
- Offene Punkte:
  - **Handytest:** Leiste bleibt auf dem iPhone unten (Tastatur, App-Wechsel, Ende der Seite), mitlaufender Kopf unter der Notch, Artwork hell/dunkel je Palette, Balken antippen mit dem Daumen, Tageshinweis morgens/abends. Vor dem nächsten Push an ein Backup erinnern (DB-Version 35 → 36).
  - Durch den eigenen Scrollbereich gibt es auf dem iPhone kein „Statusleiste antippen = nach oben“ mehr; falls gewünscht, eigenen Knopf im mitlaufenden Kopf ergänzen.
  - Ideen: Tageszeiten des Hinweises einstellbar; schwebende Navigation (Entwürfe D–I) für später, wenn mehr Bereiche dazukommen.
- **Nachtrag (Nutzerwunsch 14.11.2026, Entwurf „Nachtrag – Startseite anpassen“ im Artifact):** Textaufräumen → eigener Schritt 22e. Gebaut:
  - **„Weitere Widgets“ mit Filter:** Suchfeld + Chips Alle · Training · Alltag · Ziele & Erfolge (`WIDGET_GROUPS`, `WIDGET_GROUP_OF`, `filterWidgets` in `src/domain/widgets.ts`, Umlaute egal), je Zeile nur Name + Bereich (kein Erklärsatz mehr), „Kein Widget gefunden.“
  - **Kleine Widgets schon beim Bearbeiten nebeneinander:** `SortableList` mit `grid` (zwei Spalten, `wide` = ganze Breite) – gezogen wird auch seitlich, getauscht mit der Zeile unter der Mitte der gezogenen; Pfeiltasten links/rechts gehen auch. Kleine Karte: Griff + Name + Entfernen oben, Vorschau, Größe S/M/L unten über die ganze Breite.
  - Scrollbereich mit `scroll-padding-top` (`scroll-pt-16`): Hineinscrollen endet unter dem mitlaufenden Kopf (vorher verdeckte er gelegentlich die Kopf-Taste – auch in E2E).
  - E2E-Stabilität: `endurance.spec` (langer Ablauf) mit `test.slow()`, `backup.spec` wartet 15 s auf den Import; beide waren im vollen Lauf unter Last über der Zeit.
  - Tests: `widgets.test.ts` (Bereiche, Filter), E2E `interaction.spec.ts` (Filter, Suche, kleine Widgets nebeneinander, seitlich tauschen, Reihenfolge auf der Startseite).

### Schritt 22c – Desktop, Tablet & Querformat
**Ziel:** Die App nutzt den Platz auf großen und quer gehaltenen Bildschirmen, statt nur eine schmale Handy-Spalte in der Mitte zu zeigen (Nutzerwunsch 12.11.2026). Vor 23/24 eingeplant, weil der Admin- und Gym-Bereich vor allem am Computer genutzt wird.
- **Ist-Stand:** Alles steckt in einer Spalte `max-w-md` (`Page.tsx`, `BottomNav.tsx`), auf dem Desktop bleibt links und rechts viel Schwarz. Das Manifest sperrt die installierte App auf Hochformat (`orientation: 'portrait'` in `vite.config.ts`).
- **Bildschirmgrößen (beim Start mit dem Nutzer festlegen, 2–3 Entwürfe je Größe zeigen):**
  - **Handy hoch:** bleibt wie heute.
  - **Handy quer:** Hochformat-Sperre aufheben (`orientation: 'any'`), schmale Navigationsleiste an der Seite statt unten (sonst bleibt zu wenig Höhe), Notch/Safe-Area links und rechts beachten, Workout und Timer bleiben gut bedienbar.
  - **Tablet (iPad hoch/quer):** 2 Spalten (Widgets/Kacheln nebeneinander), Navigation als Seitenleiste mit Symbolen.
  - **Desktop:** Seitenleiste mit Symbol + Text, Inhalt breiter; Startseite als Raster (Widget-Größen `small`/`medium`/`large` werden zu Rasterbreiten), Alltag-/Trainings-Kacheln 3–4 je Zeile, Listen mit Detail daneben (z. B. Verlauf → Workout, Übungen → Übung), Statistik-Diagramme breiter. Hover-Zustände und Tastatur-Bedienung (Fokus sichtbar, Enter/Escape).
- **Technik:** Tailwind-Breakpoints (`sm`/`md`/`lg`/`xl`) mobile-first, gemeinsamer Layout-Baustein statt Einzellösungen je Seite; Fenster/`Dialog` auf großen Bildschirmen mittig statt als Leiste unten; feste Leisten (Pausen-Timer, `data-bottom-bar`) an die Seitenleiste anpassen; `SortableList`/Ziehen mit der Maus prüfen; Teilen-Bild und PDF bleiben unverändert.
- **Tests:** zusätzliche Playwright-Projekte `tablet` und `desktop` (und Handy quer) für die wichtigsten Abläufe; Screenshots zum Abstimmen.

**Notizen:**
- Mit dem Nutzer abgestimmt (14.11.2026, Entwurf im Artifact „Basey 22c Großformate“, https://claude.ai/artifact/75oTEQzrviXDibmJTCkcTS): **Handy quer Q3** (Leiste bleibt unten, flach, nur Symbole), **Tablet T3** (Leiste unten wie am Handy, Inhalt als Raster), **Desktop D1** (Seitenleiste mit Symbol + Name, Einstellungen unten abgesetzt), **Raster R1** (Feldraster: S = 1, M = 2, L = 4 Felder; 2/4/6 Felder je Zeile nach Breite), **Listen L1** (Detail rechts neben der Liste ab großer Breite), **Auswahl F1** (Übungs-/Lebensmittelauswahl als großes Fenster mittig).
- Gebaut:
  - **Bildschirmgrößen (Tailwind):** Handy hoch unverändert. `short` (eigene Variante: quer und höchstens 500 px hoch, unter `xl`) = Handy quer; ab `sm` breiterer Inhalt; ab `lg` (1024 px) Raster mit 6 Feldern, Liste mit Detail, Auswahl als Fenster; ab `xl` (1280 px) Seitenleiste. Ein iPad quer (1180/1194 px) hat also Leiste unten (T3), aber Liste mit Detail und Fenster mittig.
  - **Navigation (`BottomNav`):** quer flach (44 px) nur mit Symbolen (Name für Screenreader), Tablet wie am Handy, ab `xl` Seitenleiste 240 px links mit Logo, Symbol + Name, Einstellungen unten abgesetzt, Hover. Maße als CSS-Variablen `--nav-bottom`/`--nav-left` (`index.css`), danach richten sich mitlaufender Kopf, Pausen-Timer, Hinweise und Update-Hinweis. Safe-Area links/rechts (Notch quer) in Leiste und Seiten.
  - **Seitenbreite:** `PAGE_WIDTH` (`src/components/pageLayout.ts`) statt `max-w-md`: `normal` (ab `sm` 42 rem) für Formulare/Listen, `wide` (48 rem, ab `lg` 72 rem) für Startseite, Training, Alltag, Statistik. `Page`-Prop `width`.
  - **Startseite R1:** `WIDGET_FIELDS`/`WIDGET_GRID_COLUMNS`/`widgetSpan` (`src/domain/widgets.ts`), Raster `grid-flow-dense` (Lücken werden gefüllt). Anpassen-Modus im selben Raster (`SortableList`-Prop `grid` jetzt `{ columns, span }`), Ziehen mit der Maus geht auch seitlich. Kacheln (Training, Alltag) über `TILE_GRID`: 2/3/4 je Zeile. Statistik → Kraft ab `lg` zweispaltig (Aktivität und Fokus über die ganze Breite).
  - **Liste mit Detail (L1):** `SplitView` als Eltern-Route für Verlauf → Workout und Übungen → Übung. Ab `lg` Liste links (klebt, scrollt für sich, Eintrag markiert über `NavLink`), Detail rechts ohne „Zurück“, mitlaufender Kopf nur über der Detailspalte; ohne Auswahl ein Hinweis. Adressen bleiben gleich, am Handy wie bisher.
  - **Auswahl (F1):** `ExercisePicker`/`FoodPicker` ab `lg` als Fenster mittig (`PICKER_DIALOG`, Hintergrund `PICKER_SCRIM` schließt beim Klicken, Escape wie bisher).
  - **Maus & Tastatur:** Hover für Buttons, Listenzeilen, Kacheln und Navigation; sichtbarer Fokusrahmen (`:focus-visible`) überall.
  - **Manifest:** `orientation: 'any'` (Querformat erlaubt).
  - Tests: `widgets.test.ts` (Feldraster); neue Playwright-Projekte `android-quer` (Pixel 7 quer), `tablet` (iPad Pro 11 quer), `desktop` (1440 × 900), die nur `e2e/layout.spec.ts` ausführen (Navigation je Größe, Kacheln je Zeile, kein seitliches Scrollen, Raster 4/6 Felder auch beim Anpassen, Workout mit Auswahlfenster + Escape + Pausen-Timer an der Leiste, Liste mit Detail, Manifest). `android`/`iphone` ignorieren diese Datei.
- Abweichungen:
  - Liste mit Detail nur für Verlauf und Übungen (laut Plan); Pläne, Ausdauer-Einheiten, Lebensmittel, Gewohnheiten könnten folgen.
  - Anpassen-Liste der Trainings-Kacheln bleibt eine einfache Liste (wenige Einträge).
- Offene Punkte:
  - **Handytest:** App quer drehen (iPhone mit Notch links/rechts, Leiste flach, Workout und Timer), iPad hoch/quer (Leiste unten, Raster, Liste mit Detail ab quer), Desktop-Browser (Seitenleiste, Hover, Tab-Taste). Installierte App: Querformat erst nach Neuinstallation bzw. Manifest-Update.
  - Ideen: Liste mit Detail für Pläne, Ausdauer und Lebensmittel; Tastenkürzel am Desktop (z. B. Pfeiltasten in der Liste); Seitenleiste einklappbar.
  - **Seltener E2E-Hänger `goals.spec.ts:29` (untersucht 14.11.2026, nicht durch 22c):** Etwa 1 von 50–150 Läufen hängt auf „Ziel bearbeiten“ (Zeile 108): Überschrift sichtbar, Formular erscheint nie → eine der Abfragen in `GoalEditPage` (`useGoal`, `useExercise`, `useSettings`, `useGoalData`) kommt nicht zurück (Ladezustand, kein Fehler). Normal dauert der Test ~7 s, das Formular kommt nach 10–74 ms; 70 Läufe danach (auch 4 Worker) grün. **Kein Lastproblem**, `test.slow()` hilft nicht. Vermutung: IndexedDB kurz blockiert (z. B. gleichzeitiger Schreibvorgang) – nicht belegt. Achtung: `--trace=on` macht jeden Lauf ~40 s lang (Zeitüberschreitung, kein Befund). Diagnose: Kopie des Ablaufs, die nach 10 s Wartezeit die Lesezeit je Tabelle per rohem `indexedDB` misst und Konsolenfehler sammelt (`--repeat-each=10 --workers=2 --trace=off`). Tritt er wieder auf: damit untersuchen; ggf. prüfen, ob `useLiveQuery` nach Abbruch einer Transaktion hängen bleibt.

### Schritt 22d – Animationen für Kacheln & Inhalte
**Ziel:** Kacheln, Widgets und Inhalte bekommen passende, dezente Animationen (Nutzerwunsch 12.11.2026). Baut auf den Grundlagen aus 18f auf (`anim-*`, `bar-fill`, `usePageTransition`, ohne Paket, nur ohne „Bewegung reduzieren“). Nach 22b/22c, damit die interaktiven Kacheln und die großen Layouts schon stehen.
- **Ablauf:** Claude schlägt zu **jeder** Kachel und jedem Inhaltsbereich eine Animation vor (Liste + Vorschau als Artifact zum Anschauen), der Nutzer wählt aus bzw. streicht; erst dann umsetzen.
- **Erste Vorschläge (zum Abstimmen):**
  - **Allgemein:** Kacheln/Widgets beim Öffnen einer Seite nacheinander leicht einblenden (gestaffelt, kurz); Antippen gibt ein kurzes Eindrücken (Skalierung) als Rückmeldung; Zahlen zählen beim Ändern hoch statt zu springen.
  - **Fortschritt:** Ringe/Balken (Gewohnheiten, Ernährung, Wasser, Schritte, Ziele) füllen sich auf; Ziel erreicht → kurzes Aufleuchten/Konfetti-Funke im Palettenton.
  - **Wasser:** Füllstand steigt wie eine Welle bei „+250 ml“. **Schlaf:** Phasenbalken bauen sich von links auf. **Gewicht:** Linie zeichnet sich nach.
  - **Abhaken** (Gewohnheiten, Supplements, To-dos): Haken zeichnet sich, erledigte Zeile gleitet in „erledigt“; To-do neu → rutscht in die Liste.
  - **Training:** Satz erledigt → Haken + Pausen-Timer läuft als Ring ab; neuer Rekord → Pokal ploppt auf; Workout beendet → Zusammenfassung baut sich Kachel für Kachel auf.
  - **Serien & Abzeichen:** Flamme/Serienzahl zählt hoch, neues Abzeichen dreht/glänzt einmal.
  - **Diagramme/Heatmap:** Balken wachsen, Heatmap-Felder blenden reihenweise ein (nur beim ersten Anzeigen, nicht bei jedem Filterwechsel).
  - **Anpassen-Modus:** Kacheln wackeln leicht (wie beim Startbildschirm), Ziehen mit Schatten.
  - **Fenster/Aufklappen:** `Details` klappt weich auf, Fenster aus 32b gleiten von unten (Handy) bzw. blenden mittig ein (Desktop).
- **Regeln:** nur `transform`/`opacity` (flüssig auf älteren Handys), kurz (≤ 400 ms, Erfolge etwas länger), nie beim Tippen/Scrollen im Weg; `prefers-reduced-motion` schaltet alles ab, ggf. eigener Schalter in Einstellungen → Darstellung. E2E läuft weiter mit `reducedMotion: 'reduce'`, einzelne Tests mit Animation.

**Notizen:**
- Mit dem Nutzer abgestimmt (15.11.2026, Entwurf im Artifact „Basey 22d Animationen“, https://claude.ai/artifact/MJJJaJbt9qkmJaTHF6YJNr): **alle Vorschläge übernommen** – G1 gestaffeltes Einblenden, G2 Eindrücken, G3 Zahlen zählen, N1 Navigations-Pille wächst, F2 Ziel erreicht (Aufleuchten + Funken), W1 Wasser-Welle, Q1 Schnell-Eintrag schwebt hoch, S1 Schlafphasen bauen sich auf, P1 Tageswechsel blendet über, C1 Haken zeichnet sich, C2 Erledigt gleitet weg, C3 neues To-do rutscht rein, T1 Satzzeile leuchtet, T2 Pause als ablaufende **Linie** (statt Ring), T3 Pokal ploppt, T4 Zusammenfassung baut sich auf, M1 Flamme/Serienzahl, M2 Abzeichen dreht + glänzt, D1 Balken wachsen, D2 Heatmap wochenweise, D3 Linie zeichnet sich, **A1 Wackeln im Anpassen-Modus (trotz Empfehlung „optional“ gewünscht)**, A2 Kachel hebt sich beim Ziehen, O1 Aufklappen weich, O2 Auswahl gleitet am Handy von unten, E1 Schalter „Animationen“ in Darstellung. G4 (Seitenwechsel) und F1 (Balken) bleiben wie in 18f.
- Gebaut:
  - **Grundlage:** `motionAllowed()` (`src/components/motion.ts`) = System erlaubt Bewegung **und** Schalter an; alle JS-Animationen fragen nur das. Schalter **„Animationen“** in Einstellungen → Darstellung (`Settings.animations`, **Dexie v37**, Backup-Feld mit Standard an): `data-motion="off"` am `<html>`, gespiegelt in `localStorage.motion` und vom Script in `index.html` vor dem ersten Rendern gesetzt (gilt auch für Ladebildschirm und Seitenwechsel); `index.css` schaltet dann alle Animationen und Übergänge ab. Reine Logik in `src/domain/motion.ts` (Hochzählen deutscher Zahlen, wegrutschende Zeilen, Pausenlänge) mit Tests.
  - **Allgemein:** G1 `anim-stagger` (Widget-Raster, alle `TILE_GRID`-Kacheln, Workout-Zusammenfassung), G2 `press` (Kacheln, kleine Widgets, Schnellzugriff, Haupt-/Zweitknöpfe), G3 `CountUpText` (Kachel- und Widget-Werte, „Heute“-Karte, Trainingsfortschritt, Serien), N1 Pille der Navigation wächst federnd auf.
  - **Fortschritt/Alltag:** F2 `GoalSparks` in `GoalBar` (Alltag, Widgets, Gewohnheiten, Supplements, Wochenziel – der eigene `WeekBar` ist jetzt `GoalBar`) und im Ziel-Balken (`GoalCard`), nur beim Erreichen, nicht beim Öffnen. W1 Wasserbalken im großen Widget wächst vom alten Stand federnd nach, oben läuft kurz eine Welle. Q1 `useFloatUp`/`QuickAddButton`: „+250 ml“, „+20 g“ schweben auf (Schnellzugriff, Wasser-Widget, „Heute“-Karte, Körper & Befinden, Protein). S1 Schlafphasen nacheinander. P1 `DayPeek` blendet beim Tageswechsel über (Web Animations, keine neu gemountete Live-Region).
  - **Listen:** C1 Haken zeichnet sich (`StatusCircle`, To-dos, Sätze). C2 `useLeavingIds`: abgehakte Gewohnheiten/To-dos gleiten erst aus der offenen Liste (0,34 s), dann ploppt die Zahl bei „erledigt“ (`Bump`); Auf/Zu-Pfeil dreht (`ToggleChevron`), Liste blendet ein. C3 neue To-dos (jünger als 2 s) rutschen herein.
  - **Training:** T1 Satzzeile leuchtet nach dem Abhaken. T2 ablaufende Linie unten in der Pausen-Leiste (Länge über `nextRestSpan`, ±15 s ändern sie, auch ohne Animation sichtbar). T3 Pokal im Rekord-Hinweis ploppt. T4 nach „Speichern“ erscheinen die Karten der Zusammenfassung nacheinander (`state.finished`).
  - **Motivation:** M1 Flamme flackert und Serienzahl zählt, wenn die Serie wächst. M2 Erfolgs-Hinweis mit Abzeichen zeigt eine Medaille, die sich hereindreht und glänzt (`ToastMessage.variant: 'badge'`, gesetzt von `celebrate`).
  - **Diagramme:** D1 `MiniBars` wachsen gestaffelt, Recharts-Balken wachsen; D3 Linien zeichnen sich – Recharts nur beim ersten Anzeigen (`useFirstShow`), danach aus. D2 Heatmap blendet die sichtbaren Wochen von links ein.
  - **Bedienung:** A1 Wackeln im Anpassen-Modus (Startseite, Trainings-Kacheln; `SortableList`-Prop `wiggle`; steht still unter Zeiger/Finger und während gezogen wird). A2 gezogene Kachel hebt sich (3 %). O1 `Details` mit drehendem Pfeil + einblendendem Inhalt. O2 Übungs-/Lebensmittelauswahl gleitet am Handy von unten herein, ab `lg` springt sie mittig auf.
  - Tests: `motion.test.ts`, `todos.test.ts` (`withOpen`), Migration v36→v37, Backup (Schalter), `celebrations`/`motivation` (Abzeichen-Hinweis). E2E `motion.spec.ts` mit Bewegung: Widgets gestaffelt, Wackeln im Anpassen-Modus, „+250 ml“ schwebt + Welle, To-do rutscht rein und gleitet in „Erledigt“, Schalter aus (sofort + nach Neuladen vor dem ersten Rendern, keine Animation mehr), Satz leuchtet, Pausen-Linie wird kürzer und +15 s verlängert, Zusammenfassung gestaffelt. 984 Unit-Tests, 163 E2E grün (ganze Suite). Hauptbundle ~378 KB (vorher ~359 seit 22b/22c).
- Abweichungen:
  - W1: Auf der Seite „Körper & Befinden“ gibt es kein Glas (wäre ein neues Element); dort füllt sich wie bisher der Balken, dazu schwebt der Betrag auf. Die Welle läuft im Wasserbalken des großen Widgets.
  - M2: Ein neues Abzeichen dreht sich im Erfolgs-Hinweis; auf der Erfolge-Seite nicht (dafür müsste „schon gesehen“ gespeichert werden).
  - T4: Die Zusammenfassung hat keine Kennzahl-Kacheln, gestaffelt erscheinen die Übungskarten.
  - F2 gilt für alle Balken mit Ziel (`GoalBar`), nicht für Abzeichen-Fortschritt und Statistik-Balken.
  - Statistik-Kacheln: keine eigenen Kacheln vorhanden, gestaffelt sind nur die `TILE_GRID`-Raster.
  - Wackelnde Kacheln sind für Playwright nie „stabil“ → im Test `click({ force: true })`; Wackeln pausiert unter Zeiger/Fokus.
- Offene Punkte:
  - **Handytest:** Flüssigkeit auf älteren Handys (Startseite mit vielen Widgets, Wackeln im Anpassen-Modus), Schalter „Animationen“ aus/an, „Bewegung reduzieren“ in iOS/Android, Welle im Wasserbalken, Pausen-Linie im Training, Auswahl gleitet von unten. Vor dem nächsten Push an ein Backup erinnern (DB-Version 36 → 37).
  - Ideen: Erfolge-Seite markiert neu erreichte Abzeichen (gesehen-Stand speichern); Ring-Variante für den Pausen-Timer, falls er einmal groß angezeigt wird; „Alle anzeigen“ in der Statistik ebenfalls weich aufklappen.

### Schritt 22e – Texte aufräumen, Erklärungen hinter Info-Button
**Ziel:** Weniger Text auf allen Seiten, damit alles übersichtlicher wird (Nutzerwunsch 14.11.2026): „Alle Texte, die unnötig sind, wegmachen; wenn eine Erklärung nötig ist, einen Info-Button mit Popup.“
- **Ablauf:** Erst Entwürfe im Artifact (3–4 typische Seiten vorher/nachher, Optik des Info-Buttons und des Popups), Nutzer entscheidet, dann Seite für Seite (Startseite + Widgets, Training, Alltag, Statistik, Einstellungen, Formulare).
- **Regeln (Vorschlag):** Hinweis- und Erklärsätze unter Überschriften/Kennzahlen entfernen oder in `InfoButton` (rundes „i“-Symbol, ≥ 44 px Touch-Ziel, `Dialog` mit Titel + kurzem Text, Escape/Zurück schließt) verschieben; Leer-Zustände kurz halten (eine Zeile + Aktion); Wichtiges (Warnungen, Datenverlust, Online-Hinweise) bleibt sichtbar.
- E2E, die Texte prüfen, entsprechend anpassen; Info-Popups per E2E stichprobenartig öffnen.

**Notizen:**
- Mit dem Nutzer abgestimmt (15.11.2026, Entwurf im Artifact „Basey 22e Texte & Info-Button“, https://claude.ai/artifact/G7KwPeMtTWU7qr1bAm21gG): **Popup B** (Blatt von unten, ✕ / daneben tippen / Escape schließt, ab `lg` mittig). Regeln und Beispiele aus dem Entwurf passen; Claude entscheidet Seite für Seite selbst nach den Regeln und listet das Ergebnis hier.
- Gebaut:
  - **`InfoButton`** (`src/components/InfoButton.tsx`): rundes „i“ (44 px, `aria-label` „Info: …“, `aria-expanded`), Blatt per Portal in `body` (gleitet am Handy von unten herein = `anim-sheet`, ab `lg` mittig), Titel + ✕, Escape und Antippen daneben schließen, Fokus geht zurück auf den Knopf, Seite scrollt dahinter nicht (`lockScroll`). Klicks reichen nicht an umgebende Zeilen/Kacheln durch. Eingebaut als Prop `info` in `Card` (neben der Überschrift), `WidgetHeader`, `Switch` (`{ title, content }`, Knopf außerhalb des `<label>` → Name des Schalters bleibt gleich) und `Stepper` (`{ title?, content }`).
  - **`EmptyState`** (`Page.tsx`): Leer-Zustand als eine Zeile + optional ein Knopf (`smallButton` aus `buttons.ts`) und optional `info`.
  - **Hinter (i) gewandert:** Einstellungen (Pausen, Puls, Pausen-Auswertung, Nur Protein, Trainingstag-Ziele, verbrannte Kalorien, Supplement-Erinnerungen, Körpergewicht, Fotos im Backup, Export), Startseite (Trainingsfortschritt – Vormonat jetzt als „+2 zum Vormonat“ unter der Kachel –, Diese Woche groß), Statistik (Fokus, Sätze pro Woche, Fortschritt je Muskelgruppe, Pace, Rückblick Ø-Hinweise, Satzpausen der Übung, alle Export-Karten), Training (Training nachtragen, Zusatzgewicht/Negativ-Gewicht im Satz, Ausdauer-Tipp bei Cardio-Übungen), Pläne (Blöcke, Sätze anpassen, Prozente, aktueller Block, Ablauf, Vorlagen), Alltag (importierte Werte, Unterpunkte und Aufhören-Ziel im Gewohnheits-Formular, To-dos), Supplements-Formular, Ausrüstung, SWOLF, Lebensmittel-Formular, Ernährung (Nur Protein, Protein schnell), Ziele-Formular (Art mit allen Beispielen, 1RM, Bestzeit, Gewicht, Menge, Gewohnheit, Eigenes), Ziele-Seite (Fortschritt/Marke), Erfolge (Serien, Trainingsserie, Abzeichen), Timer (Gong), Lesen/Timer-Gewohnheit, „Vorher gelesen“, Fotos-Tipp.
  - **Gekürzt/entfernt:** Leer-Zustände (Gewohnheiten, Supplements, Ziele, Statistik Kraft/Ausdauer mit Knopf „Zum Training“, Startseite, Schnellzugriff, Workout/Plan ohne Übungen, Ziele-/Serien-Widget, Timer-/Lese-Gewohnheit mit Knopf „Gewohnheit anlegen“), „Aktiver Plan“, „Ausgeblendet – erscheint nicht in der Auswahl.“, Portionen-Satz (Platzhalter reicht), Fotos-Seite nur noch „Bleibt nur auf diesem Gerät.“, Weitergeben-Seite in einem Satz, Supplements-Link „Erinnerungen & Bestand einstellen“, Export-Link „PDF-Berichte im Rückblick“, Schalter „Vibration“ (iPhone-Hinweis im Info-Blatt).
  - **Bleibt sichtbar:** Warnungen (Speicher nicht dauerhaft, Backup ersetzt Daten, Fotos nicht im Backup), „Nur mit Internet“, Fehler, Fortschritt/Werte, Hinweise zum Handeln („Letztes Beintraining vor 6 Tagen“, „Wähle oben eine Sportart …“, Körpergewicht für 1RM), kurze Beschreibungen in Auswahl-Knöpfen (Gewohnheits-Art, Block-Art, Plan-Vorlagen), Willkommens-Karte (einmalig), Installations-Anleitung, „Über & Lizenzen“.
  - Tests: `InfoButton.test.tsx` (öffnen/schließen mit ✕, Escape, daneben; Fokus; kein Durchreichen an die Zeile; in Karte und Schalter); E2E `info.spec.ts` (offline: Einstellungen → Training, Blatt unten angedockt, Schalter behält Namen, Leer-Zustand Ziele mit Beispielen; Export-Karte), `layout.spec.ts` (Blatt ab `lg` mittig, quer unten), angepasst `blocks.spec.ts` (Erklärung im Blatt), `safety.spec.ts` (kürzerer Satz), `supplements.spec.ts` (Push-Hinweis im Blatt), `usage.spec.ts` (Schalter per Rolle, `getByLabel` träfe auch „Info: …“). 987 Unit-Tests, 170 E2E grün (gegen eigenen Build auf Port 4183, weil ein Preview auf 4173 lief).
- Abweichungen:
  - „Zurück“ (Android-Zurück-Taste) schließt das Blatt nicht – wie bei den übrigen Fenstern (`Dialog`, `ConfirmDialog`), dafür bräuchte es einen History-Eintrag. Escape, ✕ und daneben tippen gehen.
  - Kurze Beschreibungen in Auswahl-Knöpfen und Listen-Untertitel (`hint` an `LinkRow`/`GroupRow`) bleiben – sie beschreiben die Auswahl selbst.
  - Leer-Zustand „Schnellzugriff“ ohne Knopf: Auswählen geht nur im Anpassen-Modus (Stift oben).
- Offene Punkte:
  - **Handytest:** Info-Blatt mit dem Daumen (iPhone mit Home-Indikator unten, Android-Zurück), lange Texte im Blatt, Info-Knopf neben Schaltern auf schmalen Handys.
  - Vitest: `activity.test.ts` („vereinfacht lange Strecken“) lief im vollen Lauf parallel zum Build einmal über die Zeit; einzeln und im zweiten vollen Lauf grün.
  - **Nachtrag Push (15.11.2026):** Erster Semgrep-Lauf in der CI (`security.yml` seit 21) meldete 21 Funde, behoben: Dependabot `cooldown: default-days: 7` (npm + Actions), alle Actions in `deploy.yml`/`security.yml` per Commit-SHA gepinnt (`@<sha> # vX.Y.Z`, Dependabot hebt beides an), E2E-Regex nur noch über `startsWith`/`containing` aus `e2e/helpers.ts` (escaped, einziges `nosemgrep`; vorher Fehlalarm ReDoS bei festen Testtexten).
  - **Nachtrag Abhängigkeiten (15.11.2026):** Dependabot #8 (12 kleine Updates, u. a. Playwright 1.65, Vite 8.3.6, Vitest 5.1, `@zxing/library` 0.23) eingespielt; `actions/checkout` 7.0.1 und `actions/setup-node` 7.1.0 selbst per SHA gepinnt (statt #6/#7). Playwright 1.65 klickt keine `inert`-Elemente mehr und sucht dann nicht neu → 13 E2E hingen am Knopf, der beim Erscheinen des mitlaufenden Kopfs `inert` wurde. Lösung in der App: `HeaderAction` (`Page.tsx`) ersetzt Kopf-Aktion und „Zurück“ am alten Platz durch einen gleich großen Platzhalter (kein Doppel-Button, kein `inert`). TypeScript 7 und jsdom 31 → Schritt 22f.
  - Ideen: Info-Blatt per Android-Zurück schließen (für alle Fenster gemeinsam lösen); `CatalogSearch` („x … offline verfügbar“) wird nirgends mehr verwendet – bei Gelegenheit entfernen.

### Schritt 22f – Hauptversionen: TypeScript 7, jsdom 31
**Ziel:** Die zwei großen Versionssprünge aus Dependabot getrennt vom übrigen Code einspielen, damit klar ist, was sie kaputt machen (Entscheidung 15.11.2026). Kann vor oder nach Schritt 23 laufen.
- **TypeScript 6 → 7** (Dependabot-PR #5): neuer Compiler – `tsconfig*.json`, `tsc -b`, `typescript-eslint` und `vite`/`vitest` auf Kompatibilität prüfen, neue Typfehler beheben.
- **jsdom 30 → 31** (Dependabot-PR #4): betrifft nur Vitest – Änderungen lesen, Unit-Tests anpassen.
- Je Paket einzeln: einspielen, Definition of Done (Lint, Typecheck, Vitest, E2E, Build), Commit, danach den PR schließen bzw. von Dependabot schließen lassen.

**Notizen:**
- Zusätzlich gewünscht (Nutzer, 15.11.2026): **iPhone – Leiste unten und Info-Blatt enden über einem leeren Streifen** (installierte App), **Wackeln im Anpassen-Modus entfernen** („führt zu Problemen“). TypeScript-Weg **A** (beide Versionen nebeneinander) vom Nutzer gewählt.
- Gebaut:
  - **iPhone-Lücke unten:** Ursache laut Fehlerberichten (WebKit 301108, iOS 26): In der installierten App mit `viewport-fit=cover` + durchsichtiger Statusleiste ist der Viewport um die Statusleiste zu kurz, **solange das Dokument nicht bildschirmhoch ist** – seit 22b (Dokument scrollt nicht mehr, `html` 100 %) also immer. `100%`/`100dvh` und alles mit `fixed bottom-0` (Info-Blatt, Fenster) endeten deshalb zu früh. Lösung in `index.css`: `@media (display-mode: standalone) { html { min-height: min(100lvh, calc(100% + env(safe-area-inset-top))) } }` – dann gibt iOS die volle Höhe frei; `min()` begrenzt auf den Bildschirm (ohne Statusleisten-Abstand, z. B. Android, keine Änderung). `Layout` (und `ErrorBoundary` der App) nutzen `h-full` statt `h-dvh`, folgen also `html`.
  - **Wackeln entfernt:** `anim-wiggle` (CSS + Keyframes) und `SortableList`-Prop `wiggle` gestrichen (Startseite, Trainings-Kacheln). Gezogene Kachel hebt sich weiter (`anim-lift`). E2E `motion.spec.ts` prüft, dass Kacheln im Anpassen-Modus still stehen, und klickt ohne `force`.
  - **jsdom 31:** ohne Anpassungen, 987 Unit-Tests grün.
  - **TypeScript 7:** `typescript-eslint` (8.72.x) verlangt `typescript <6.1` und braucht die klassische JS-Schnittstelle, die TS 7 (nativer Compiler) nicht mehr hat. Deshalb **beide Versionen**: `typescript` 6.0.x nur für ESLint, `typescript-7` (Alias `npm:typescript@^7`) für `npm run typecheck` und `npm run build` (`node node_modules/typescript-7/bin/tsc -b`, Pfad statt `tsc`, weil beide Pakete ein `tsc` mitbringen). Keine neuen Typfehler; Typprüfung ~4 s. `dependabot.yml` ignoriert Hauptversionen von `typescript`.
- Abweichungen:
  - Kein eigener E2E für die iPhone-Lücke: Playwright/Chromium kann den kurzen iOS-Viewport nicht nachstellen. Geprüft ist nur, dass Layout/Navigation auf allen Projekten unverändert bleiben (volle Suite).
  - Ein E2E-Lauf für alle drei Änderungen gemeinsam statt je Paket (Vitest, Lint, Typecheck, Build liefen je Paket).
- Offene Punkte:
  - **Handytest iPhone (installierte App, nach Push):** Leiste ganz unten, Info-Blatt bis zum Rand, nichts lässt sich um die Statusleiste verschieben (Seite darf nicht „wackeln“/scrollen), Tastatur, Querformat. Falls die Lücke bleibt: Variante mit `bottom: calc(-1 * (100lvh - 100dvh))` für feste Elemente prüfen.
  - Dependabot-PRs #4 (jsdom) und #5 (TypeScript) nach dem Push schließen bzw. von Dependabot schließen lassen (#5 würde `typescript` selbst ersetzen und ESLint brechen).
  - Sobald `typescript-eslint` TypeScript 7 unterstützt: `typescript` auf 7 heben, Alias `typescript-7` entfernen, Skripte wieder `tsc -b`, Ignore-Regel in `dependabot.yml` streichen.
  - Lint-Warnung `react-hooks/exhaustive-deps` in `Page.tsx:164` (`HeaderAction`, seit dem Platzhalter-Commit): absichtlich ohne Abhängigkeiten (misst nach jedem Rendern, `setSize` nur bei geänderter Größe) – bei Gelegenheit per `ResizeObserver` lösen oder kommentiert abschalten.

### Schritt 23 – Server-Grundlage, Anmeldung & Umzug
**Ziel:** Nur angemeldete Personen mit gültiger Lizenz nutzen die App; sie läuft auf neuer, geschützter Adresse.
- **Einrichten (mit dem Nutzer, Konten legt er selbst an):** Supabase-Projekt (EU/Frankfurt), Vercel-Projekt aus dem privaten Repo (Tarif klären, `BASE_PATH=/`, SPA mit HashRouter, Service-Worker-Header `Cache-Control: no-cache` für `sw.js`/`index.html` per `vercel.json`), Sentry-Projekt (EU). Domain. Repo privat schalten, GitHub-Pages-Workflow ablösen (Lint/Tests weiter in CI vor dem Deploy). Supabase-Schema als Migrationen im Repo (`supabase/`), lokale Entwicklung mit Supabase CLI.
- **Sentry:** `@sentry/react` gebündelt und lazy initialisiert (Hauptbundle beobachten), `ErrorBoundary` + `watchDatabase` melden an Sentry, Datenschutz-Filter wie oben, Schalter „Fehlerberichte senden“ in Einstellungen → Export & Speicher; Test, dass `beforeSend` keine Eingaben/Werte durchlässt.
- **Anmeldung:** Konten werden nur vom Admin angelegt bzw. per Einladung (keine freie Registrierung). Tabelle `licenses` (gültig bis, Rolle `user`/`trainer`/`admin`, gesperrt), abgesichert per Row Level Security.
- **Mandanten von Anfang an:** Tabelle `organizations` (zunächst `basey` und `localgym`) und Zugehörigkeit `memberships` (Nutzer × Organisation × Rolle `member`/`trainer`/`gym_admin`). Rolle `super_admin` (der Nutzer) steht über allen Organisationen. Jeder Nutzer gehört genau einer Organisation, die beim Einloggen bzw. über den Einladungslink feststeht („zwei Pfade“: Basey oder LocalGym). Alle RLS-Regeln prüfen die Organisation mit (siehe Schritt 24b).
- **App:** Anmeldebildschirm, Lizenzprüfung beim Start mit Kulanzzeit offline, Sperrbildschirm (Backup-Export möglich); Abmelden löscht lokale Daten nur nach Rückfrage. Lizenzlogik in `src/domain/license.ts` + Tests.
- **Umzug:** letzte Version auf GitHub Pages zeigt „Backup exportieren → neue Adresse öffnen → importieren“, danach nur noch Weiterleitung. README anpassen.
- E2E mit gemocktem Server (`page.route`), offline mit gültiger und abgelaufener Kulanzzeit.

**Notizen:**

### Schritt 24 – Admin-Bereich & Nutzerverwaltung
**Ziel:** Der Nutzer verwaltet Kunden selbst (manuelle Bezahlung).
- Nur Rolle `admin`: Nutzer anlegen/einladen, Laufzeit verlängern, sperren, Rolle setzen (`user`/`trainer`), Notiz (z. B. „bezahlt bis …“), letzte Anmeldung.
- Serverseitig abgesichert (RLS/Edge Function), nicht nur in der Oberfläche. Im Admin keine Gesundheitsdaten sichtbar.
- Super-Admin sieht und verwaltet **alle Organisationen** (Basey + LocalGym), Filter nach Organisation; Gym-Admins sehen nur ihre eigene (Schritt 24b).
- **Tarife** als Lizenz-Typ (z. B. Einzel, Familie, Student, Gym-Mitglied) mit freigeschalteten Funktionen je Tarif (z. B. „KI enthalten“, siehe Schritt 31). Familie = ein Zahler, mehrere verknüpfte Konten.

**Notizen:**

### Schritt 24b – Gym-Bereich (LocalGym): eigene Oberfläche & Verwaltung
**Ziel:** LocalGym hat einen eigenen Bereich mit eigener Optik, den Gym-Admin/Trainer selbst anpassen; der Nutzer verwaltet als Super-Admin beides (Nutzerwunsch 11.11.2026).
- **Rollen:** `super_admin` (Nutzer, alles), `gym_admin` (LocalGym: eigene Mitglieder, Trainer, Inhalte, Optik), `trainer` (Mitglieder betreuen, Pläne zuweisen), `member`. Ein Trainer von LocalGym sieht nur LocalGym.
- **Eine App, ein Code – Unterschiede nur als Konfiguration** (Vorschlag, im Schritt mit dem Nutzer festlegen): Je Organisation ein Datensatz `organizationConfig` (Name, Logo, Farbpalette als `--p-*`-Werte, Ladebildschirm, freigeschaltete Bereiche, Standard-Widgets/Schnellzugriff/Kacheln, eigene Pläne/Übungen/Maschinen-Codes aus Schritt 30, Texte wie Willkommen/Impressum). Die App lädt sie nach dem Login und speichert sie lokal (offline nutzbar).
- **Änderungen gelten für beide:** Neue Funktionen/Fehlerbehebungen landen automatisch in beiden Oberflächen, weil es nur einen Code gibt. Was je Organisation abweicht, steht ausschließlich in der Konfiguration (keine `if (gym === 'localgym')` im Code). Inhalte, die für alle gelten sollen (z. B. neue Übungen, Planvorlagen), legt der Super-Admin global an; Organisationen können sie ergänzen/ausblenden, aber nicht überschreiben (wie `builtin`/`user` bei Übungen).
- **Optik LocalGym:** baut auf dem Design-System auf (Tokens/Paletten seit 18d): eigene Palette + Logo + Name, ggf. eigener Ladebildschirm/App-Name; Gym-Admin passt im Gym-Bereich an (Vorschau vor dem Speichern). Logo/Marke nur mit Erlaubnis des Gyms verwenden. Ein eigenes Installations-Icon/Manifest je Gym bräuchte eine eigene Adresse (z. B. `localgym.<domain>`) – im Schritt klären.
- **Gym-Bereich in der App** (nur `gym_admin`/`trainer`): Mitglieder, Trainer, Inhalte (Pläne, Übungen, Maschinen-Codes), Optik, Ankündigungen.
- Tests: RLS-Tests je Rolle und Organisation (kein Zugriff über Organisationsgrenzen), Konfiguration offline aus dem lokalen Speicher, E2E Login als Basey- und als LocalGym-Mitglied.

**Notizen:**

### Schritt 24c – Uhren & Smartgeräte live anbinden (Whoop, Garmin, Apple Health …)
**Ziel:** Schritte, Schlaf, Puls/HRV, Erholung und Trainings kommen automatisch nach jedem Sync der Uhr in die App – ohne Datei-Import (Nutzerwunsch 11.11.2026).
- **Grundlage:** Eine PWA kann Uhr/Schrittzähler nicht direkt lesen. Weg: Kunde verbindet einmal sein Anbieter-Konto (OAuth), der Anbieter schickt neue Daten per Webhook an den Server (Supabase Edge Function), die App holt sie beim Öffnen/online ab. „Live“ = einige Minuten nach dem Sync der Uhr mit der Hersteller-App.
- **Anbindung – zuerst prüfen (mit dem Nutzer entscheiden):**
  - **Sammeldienst** mit EU-Verarbeitung (z. B. Thryve; Alternativen Terra, Rook, Spike): eine Schnittstelle für Garmin, Whoop, Oura, Polar, Suunto, Fitbit, Withings …, Garmin-Freigabe läuft über den Dienst. Kosten je Nutzer/Monat, AVV nötig.
  - **Oder direkt:** Whoop Developer API (einfach), Garmin Health/Activity API (Antrag + Freigabe durch Garmin, Vorlauf), später Oura, Polar, Withings (Waage → Gewicht/Körperfett) usw.
- **Apple Health / Apple Watch und Android Health Connect** (keine Web-Schnittstelle):
  - Start: **iPhone-Kurzbefehl** (Automation täglich bzw. mehrmals am Tag), liest Apple-Health-Werte und sendet sie an eine Edge Function mit persönlichem Token; Kurzbefehl als Link + Anleitung in der App.
  - Später optional: **Basey als echte App** (Capacitor-Hülle um die PWA) mit HealthKit/Health Connect – bringt auch Hintergrund-GPS, Vibration, Mitteilungen (siehe Ideen-Parkplatz). Kosten: Apple 99 €/Jahr, Google 25 € einmalig, Store-Prüfung. Entscheidung beim Start des Schritts (relevant v. a., wenn LocalGym-Kunden die App aus dem Store installieren sollen).
- **Daten in der App:** Schreiben wie der Gesundheits-Import (14b) über `writeImportedDailyLog` (Herkunft in `importedFields`, **eigene Werte werden nie überschrieben**), Trainings wie der Einheiten-Import (14) mit Duplikat-Erkennung (`planImport`, Startzeit + Dauer) gegen Datei-Importe. Neue Werte wie Whoop-Erholung/Belastung als Felder per Dexie-Version; sie speisen Regeneration (27) und Kalorienziel (26).
- **Einstellungen:** „Verbundene Geräte“ mit Verbinden/Trennen je Quelle, letzter Sync, Schalter je Datenart; Trennen löscht die Server-Kopie.
- **Datenschutz:** Gesundheitsdaten liegen damit auch auf dem Server → ausdrückliche Einwilligung je Quelle, Server-Kopie nur so lange wie nötig (nach Abholung löschen), Zugangstoken verschlüsselt nur auf dem Server, Security-Standards aus 21.
- **Später (optional):** strukturierte Workouts/Pläne auf die Garmin-Uhr übertragen (Garmin Training API) – interessant für Trainer, die Pläne zuweisen (33/34).
- **Offene Fragen:** Sammeldienst oder direkt? Welche Geräte nutzen LocalGym-Kunden am häufigsten? Kurzbefehl reicht oder gleich echte App? Wer trägt die Kosten (je Nutzer) – im Preis enthalten?

**Notizen:**

### Schritt 24d – Push-Benachrichtigungen
**Ziel:** Die App erinnert und benachrichtigt auch, wenn sie geschlossen ist (Nutzerwunsch 12.11.2026).
- **Technik:** Web Push (VAPID) über den Service Worker; Versand aus Supabase (Edge Function + geplante Jobs). Android: Chrome im Browser und installiert; **iPhone nur bei installierter App ab iOS 16.4** (Hinweis in der App, wenn im Safari-Tab geöffnet). Abo je Gerät in Tabelle `pushSubscriptions`, Erlaubnis erst nach Antippen fragen (nicht beim Start).
- **Arten (je einzeln abschaltbar, Ruhezeiten):** Supplement-Erinnerungen (ersetzt/ergänzt `SupplementReminder` bei geschlossener App), Gewohnheiten, Wasser/Protein-Tagesrest, Pausenende im Training (vom Server zum Zeitpunkt `restEndsAt`), Fokus-/Meditations-Timer-Ende, Wochenrückblick, Backup-Erinnerung, erreichte Ziele/Abzeichen; später Nachrichten (35), Termine/Kurse (36), Freunde/Challenges (38), Trainer-Änderungen (33).
- **Datenschutz:** Der Server kennt nur Zeitpunkte und kurze Texte, die das Gerät für die Erinnerung hinterlegt (z. B. „Kreatin nehmen“) – keine Gesundheitswerte im Push-Text; Sync der Erinnerungszeiten statt Daten. Abschalten löscht das Abo.
- Einstellungen: neuer Abschnitt „Benachrichtigungen“ (`SETTINGS_SECTIONS`); Test „Testbenachrichtigung senden“.
- **Offene Fragen:** Welche Arten standardmäßig an? Gym-Ankündigungen abschaltbar oder Pflicht?

**Notizen:**

### Schritt 25 – Körpermodell im Training
**Ziel:** Unten auf der Trainingsseite sieht man an einer Figur (vorne/hinten), welche Muskeln wie viel trainiert wurden.
- Eigene SVG-Figur (kein Paket), Muskelbereiche aus den Muskelgruppen der Übungen (primär/sekundär gewichtet).
- Arbeitssätze je Muskel (Standard 7 Tage, Zeitraum wählbar), Farbintensität über Tokens (`--primary`/`mark`), Antippen → Muskel-Statistik.
- Logik in `src/domain/` (Sätze je Muskel) + Tests; nicht ins Hauptbundle.
- **Kraft-Statistik neu ordnen (Nutzerwunsch 13.11.2026, aus Schritt 22):** Die Seite ist mit Aktivität, Fokus, Sätzen pro Woche, Fortschritt je Muskelgruppe, Übungen und Satzpausen unübersichtlich. Zusammen mit der Körperfigur eine sinnvollere Anordnung finden (z. B. Figur + Muskel-Auswahl oben statt Sätze-/Fortschrittsbalken, Übungen darunter) – Entwürfe vorher mit dem Nutzer abstimmen. Die Übungsliste ist seit 22 schon kompakt (5 + „Alle anzeigen“ mit Suche).

**Notizen:**

### Schritt 26 – Kalorienziel über Gewichtsverlauf (adaptiv)
**Ziel:** Das Kalorienziel passt sich dem tatsächlichen Verbrauch an.
- Verbrauch aus geglättetem Gewichtstrend + gegessenen Kalorien schätzen (rollierend 2–4 Wochen, nur Tage mit Einträgen, Wassergewicht-Schwankungen glätten).
- Ziel abnehmen/halten/zunehmen mit Tempo; wöchentlicher Vorschlag für `Settings.nutritionGoals` mit Bestätigung, Verlauf der Schätzung.
- Logik in `src/domain/energy.ts` + Tests (Lücken, wenige Daten, Ausreißer).

**Notizen:**

### Schritt 27 – Belastung, Form & Regeneration (Laufcoach)
**Ziel:** Sehen, wie belastet man ist und wann man wieder erholt ist.
- Belastung je Einheit: TRIMP aus Puls (`trackSummary`), sonst Dauer × Bewertung; Kraft über Volumen je Muskel.
- Akute/chronische Belastung, Erholungszeit je Einheit („erholt in ca. x h“), Hinweise bei Spitzen; Ruhepuls/HRV-Trend (14b) als Zusatzsignal.
- **Fitness, Ermüdung, Form** (CTL/ATL/TSB) als Verlauf, Zeitfenster anpassbar (Standard 42/7 Tage).
- **Ruhetag-Vorschlag** bei hoher Ermüdung bzw. schlechter Erholung (HRV/Ruhepuls/Schlaf) – als Hinweis, nie automatisch im Plan.
- **Schlafscore** (0–100) aus Dauer vs. Ziel, Phasen (falls vorhanden), Regelmäßigkeit; im Alltag und als Signal für die Erholung.
- Muskel-Erholung im Körpermodell (Schritt 25). Widget + Karte auf der Trainingsseite. Werte von Uhren (24c, z. B. Whoop-Erholung) werden angezeigt und fließen ein.

**Notizen:**

### Schritt 27b – Ausdauer-Analyse & Plan-Vorlagen
**Ziel:** Mehr aus vorhandenen Ausdauer-Daten herausholen und fertige Pläne für Laufen/Rad/Mobilität anbieten (offline).
- **VO2max-Schätzung, VDOT und Wettkampfprognosen** (5 km bis Marathon) aus Bestzeiten (`bestEffortsOf`) und Puls; Verlauf über die Zeit.
- **Steigungsbereinigtes Tempo (GAP)** aus dem Höhenverlauf importierter Einheiten (Anzeige in der Einheit, Splits, Pace-Statistik).
- **Vergleich auf wiederkehrenden Strecken:** gleiche Runde automatisch erkennen (Start/Ziel + Form der Strecke aus `enduranceTracks`, Zusammenfassung beim Import speichern wie `trackSummary`), Zeiten der Runde im Verlauf vergleichen.
- **Eigene Pace-Zonen** (aus VDOT bzw. Schwellen aus Schritt 29) neben den HF-Zonen.
- **Plan-Vorlagen Ausdauer:** feste Pläne (z. B. 5 km, 10 km, Halbmarathon; Rad-Grundlage) mit Einheiten je Woche, Vorschlag „heute dran“ wie bei Kraftplänen; Fortschritt passt Pace-Vorgaben an VDOT an.
- **Mobilität & Verletzungsprävention:** Routinen als Plan-Vorlagen aus vorhandenen Übungen (z. B. Läufer-Mobility, Schulter, Rücken), startbar wie ein Workout mit Zeit-Übungen.
- Optional (nur bei Bedarf, z. B. Radfahrer mit Powermeter): Leistungszonen, Leistungskurve, FTP-Verlauf aus FIT-Leistungsdaten.

**Notizen:**

### Schritt 28 – Körperanalyse (BIA: InBody, seca)
**Ziel:** Messungen von InBody/seca übernehmen und auswerten.
- Neue Tabelle `bodyCompositions` (Fettanteil, Muskelmasse, Körperwasser, viszerales Fett, Grundumsatz, Segmente optional, Gerät, `source`).
- Import: InBody-CSV/Excel (LookinBody-Export), seca nach Beispieldatei des Nutzers; sonst Formular. Parser lazy in `src/domain/import/`.
- Anzeige im Körper-Bereich, in der Statistik und als Ziel (Fettanteil, Muskelmasse); Grundumsatz als Vorschlag für Schritt 26.

**Notizen:**

### Schritt 29 – Diagnostik-Berichte (Ovida u. a.) → Training & Ernährung
**Ziel:** Ergebnisse aus Leistungs-/Stoffwechseldiagnostik wirken sich auf Training und Ernährung aus.
- Beim Start Beispiel-PDF vom Nutzer, Inhalt klären (Grundumsatz/Stoffwechsel, Laktat-/HF-Schwellen, Zonen, Empfehlungen).
- PDF-Text lokal auslesen (Bibliothek gebündelt + lazy oder eigener Leser), erkannte Werte zur Prüfung anzeigen, sonst Formular; PDF optional als Anhang speichern.
- Auswirkungen mit Bestätigung: Schwellen/HF-Zonen → Einstellungen, Grundumsatz/Verbrauch → Kalorienziel (Schritt 26), Laufbereiche → Pace-Zonen.

**Notizen:**

### Schritt 30 – Geräte-Codes an Maschinen (QR + NFC)
**Ziel:** Code an der Maschine scannen → Übung ist im Training.
- Je Übung einen Code erzeugen: QR als PDF zum Drucken (PDF-Baustein), NFC-Tag beschreiben auf Android (Web NFC). Der Code enthält nur eine App-interne Übungskennung (kein Link – sonst öffnet das iPhone Safari statt der installierten App).
- Scannen in der App: QR über `detector.ts` (iPhone + Android), NFC nur Android → Übung ins laufende Workout bzw. Start mit Bestätigung, letzte Last vorbelegt.

**Notizen:**

### Schritt 31 – KI-Grundlage: Fragen beantworten
**Ziel:** „Frag Basey“ beantwortet Fragen zu den eigenen Daten, vertraulich.
- KI-Proxy auf dem Server (Edge Function): Anbieter-Schlüssel nur dort, keine Speicherung von Inhalten, Kontingent je Nutzer (Kosten). Anbieter nach AVV/EU/Zero Data Retention wählen (Kandidaten: Anthropic Claude API, Mistral EU, Azure OpenAI EU).
- Einwilligung + Freigabe je Datenbereich (Training, Ernährung, Alltag, Gesundheit; Journal standardmäßig aus), Vorschau „Das wird gesendet“, keine Namen.
- Chat mit lesenden Werkzeugen auf die lokalen Daten, nur nötige Ausschnitte senden. Offline ausgegraut.
- KI-Zusammenfassungen einzelner Aktivitäten und tägliche Hinweise (morgens/nach dem Training/abends aus Schlaf, HRV, Belastung, Ernährung) ergänzen die regelbasierten Hinweise aus 22b.
- **Version ohne KI (Nutzerwunsch 12.11.2026):** Die KI kostet laufend Geld (je Anfrage beim Anbieter) – es braucht jemanden, der die Kosten trägt. Deshalb muss die App **vollständig ohne KI** funktionieren (alle KI-Stellen ausblendbar, regelbasierte Vorschläge bleiben). Freischaltung je Tarif (Schritt 24, z. B. „mit KI“ als teurerer Tarif oder Zusatz), Kontingent je Nutzer/Monat, Kostenübersicht für den Admin. **Im Schritt weiterplanen:** Preis und Kontingent, wer zahlt bei LocalGym (Gym oder Mitglied), was passiert beim Erreichen des Limits.

**Notizen:**

### Schritt 32 – KI: Eintragen, Foto-Kalorien, Anpassungsvorschläge
**Ziel:** Die KI trägt auf Wunsch ein, schätzt Mahlzeiten aus Fotos und schlägt Anpassungen vor.
- Schreibende Werkzeuge über die bestehenden `src/db/*`-Funktionen (Mahlzeit, Wasser, Gewicht, Satz, Gewohnheit …), jede Änderung als Vorschau mit „Übernehmen“.
- Mahlzeitenfoto → Lebensmittel/Mengen schätzen → Abgleich mit der lokalen Lebensmittel-DB → bearbeitbar in der Mahlzeit; Bild verkleinert gesendet, nicht gespeichert.
- Anpassungsvorschläge für Plan/Ernährung aus den Schritten 26–29 als erklärte Empfehlung, Übernahme nur mit Bestätigung.

**Notizen:**

### Schritt 32b – Kacheln öffnen als Fenster (Schnellansicht statt neuer Seite)
**Ziel:** Einzelne Kacheln öffnen keine neue Seite mehr, sondern ein Fenster im Vordergrund – man bleibt auf der Übersicht (Nutzerwunsch 12.11.2026). Bewusst spät eingeplant: Erst wenn die Kacheln durch 22b und 25–32 viele Funktionen haben, lohnt sich das und ist klar, was hineingehört.
- **Beim Start mit dem Nutzer festlegen**, welche Kacheln ein Fenster bekommen (Kandidaten: Alltag-Kacheln Wasser/Körper & Befinden, Supplements, To-dos, Gewohnheiten, Ernährung-Tagesstand; Training-Aktivitäten; Startseiten-Widgets) und welche weiter eine Seite öffnen (große Bereiche wie Pläne, Verlauf, Statistik).
- **Fenster:** Bottom-Sheet bzw. Popup über der aktuellen Seite (baut auf `Dialog` auf, Animation `anim-pop-in`), mit Tagesstand + den wichtigsten Aktionen (abhaken, +Menge, eintragen) und Link „Alles anzeigen“ zur bisherigen Unterseite. Gewählter Tag (`useDayParam`) gilt auch im Fenster. Optik vorher mit 2–3 Varianten abstimmen.
- **Bedienung:** Zurück-Taste/Wischgeste schließt das Fenster statt die Seite zu verlassen (History-Eintrag), Scrollhöhe der Übersicht bleibt; Fokus im Fenster gefangen, Escape schließt, Screenreader-Rolle `dialog`; Touch-Ziele ≥ 44 px; offline voll nutzbar.
- Baut auf der Antipp-Vorschau/den Schnell-Aktionen aus 22b auf; schwere Inhalte (Recharts) im Fenster nur lazy. E2E: Kachel → Fenster → Aktion → Wert auf der Kachel aktualisiert, Zurück schließt nur das Fenster.

**Notizen:**

### Schritt 33 – Sync & Trainer-Freigabe
**Ziel:** Ein Trainer sieht freigegebene Daten seiner Kunden.
- Sync der freigegebenen Bereiche zum Server (nutzt UUID/`updatedAt`/`deletedAt`, letzter Stand gewinnt je Datensatz).
- Kunde wählt Trainer + Bereiche, jederzeit widerrufbar; Trainer-Ansicht (Kundenliste, Training/Ernährung/Körper lesen, ggf. Plan zuweisen).
- Prüfen: Ende-zu-Ende-Verschlüsselung vs. serverseitige Auswertung; Fotos/Journal nie ohne ausdrückliche Freigabe.
- **Trainer ändert beim Kunden** (Nutzerwunsch 11.11.2026): Sync in beide Richtungen für freigegebene Bereiche (z. B. Plan, Ziele, Notizen); Änderungen des Trainers sind beim Kunden markiert („von Trainer X geändert“) und nachvollziehbar (Änderungsverlauf). Was ein Trainer darf, regelt Schritt 34.

**Notizen:**

### Schritt 34 – Gym: Rollen & Rechte fein einstellbar
**Ziel:** Der Gym-Admin (Gym-Chef) vergibt eigene, kleinere Rollen mit abgestuften Rechten.
- Statt fester Rollen: **Rechte** (z. B. Mitglieder sehen, Pläne zuweisen, Kundendaten ändern, Termine verwalten, Kurse anlegen, Nachrichten an alle, Optik ändern, Mitarbeiter verwalten) und **Rollen als Bündel** davon je Organisation. Vorlagen: Gym-Chef (alles), Trainer, Kursleiter, Empfang/Mitarbeiter, Mitglied. Gym-Admin legt eigene Rollen an/ändert sie; kann nie mehr Rechte vergeben, als er selbst hat; Super-Admin kann alles.
- Kundendaten: Trainer sehen/ändern nur Mitglieder, die ihnen zugeordnet sind **und** die freigegeben haben (Schritt 33).
- Durchsetzung serverseitig (RLS prüft Rechte, nicht nur die Oberfläche), Änderungsprotokoll (wer hat was wann geändert), Tests je Recht.
- **Offene Fragen (im Schritt klären):** Welche Rollen braucht LocalGym konkret? Darf ein Trainer Kundendaten ändern oder nur vorschlagen? Wer sieht Gesundheitsdaten (Gewicht, Fotos, Journal)? Gelten Rollen auch für Basey?

**Notizen:**

### Schritt 35 – Gym: Trainer kontaktieren (Nachrichten) & Mitteilungen
**Ziel:** Mitglieder schreiben ihrem Trainer direkt aus der App; das Gym kann Ankündigungen senden.
- Chat Mitglied ↔ Trainer (Text, ggf. Bild/Workout teilen), Gruppen-/Ankündigungen vom Gym (Recht aus 34). Supabase Realtime, nur online; offline geschriebene Nachrichten werden später gesendet.
- Benachrichtigung bei neuer Nachricht/Ankündigung über die Push-Grundlage aus Schritt 24d.
- Melden/Blockieren, Aufbewahrungsdauer, Löschen beim Austritt.
- **Offene Fragen:** Nur 1:1 mit dem eigenen Trainer oder mit allen Mitarbeitern? Antwortzeiten/Erreichbarkeit anzeigen? Dateien/Bilder erlaubt? Verschlüsselt?

**Notizen:**

### Schritt 36 – Gym: Termine & Kurse buchen
**Ziel:** Mitglieder buchen Termine bei Trainern und Kurse; Mitarbeiter verwalten Zeiten und Plätze.
- **Termine:** Trainer hinterlegen freie Zeiten (Verfügbarkeit, Dauer, Art: Probetraining, Planbesprechung, Körperanalyse …), Mitglied wählt Slot, Bestätigung/Absage/Umbuchen, Erinnerung per Push, Termin im Kalender des Handys (`.ics`).
- **Kurse:** Kursplan (wiederkehrend), Kursleiter, Plätze/Warteliste, Buchen/Stornieren mit Frist, Teilnehmerliste für Mitarbeiter, Anwesenheit abhaken.
- Eigene Übersicht „Meine Termine & Kurse“ + Widget auf der Startseite; im Gym-Bereich Kalenderansicht für Mitarbeiter.
- **Offene Fragen:** Kosten/Kontingente (z. B. 10er-Karte) – in der App oder außerhalb? Stornofristen? Gibt es schon ein Buchungssystem im Gym, das abgelöst oder angebunden werden soll? Termine nur bei Trainern oder auch Geräte/Räume?

**Notizen:**

### Schritt 37 – Gym: Wer ist gerade da?
**Ziel:** Mitglieder sehen, welche Mitarbeiter/Trainer gerade im Gym sind.
- Anzeige „Gerade da“ mit Foto/Name/Rolle, darunter „Heute noch da“ aus dem Dienstplan.
- Quelle (im Schritt festlegen): Mitarbeiter stempeln sich in der App ein/aus (z. B. QR-Code am Empfang, Wiederverwendung aus Schritt 30), oder Dienstplan, oder beides; automatisches Ausstempeln nach Schichtende.
- Datenschutz: Mitarbeiter müssen zustimmen, nur Anwesenheit (keine Standortdaten), Verlauf nur für den Gym-Admin.
- Optional später: Auslastung des Gyms (Mitglieder-Check-ins) anzeigen.

**Notizen:**

### Schritt 38 – Freunde, Vergleiche & Challenges
**Ziel:** Andere Nutzer als Freunde hinzufügen – auch aus dem eigenen Gym – und sich vergleichen (Nutzerwunsch 12.11.2026).
- **Freunde:** Anfrage per Name/Einladungslink/QR-Code, annehmen/ablehnen, entfernen, blockieren; im Gym zusätzlich Mitgliederliste (nur wer sichtbar sein will). Organisationsübergreifend (Basey ↔ LocalGym) nur, wenn beide zustimmen.
- **Was geteilt wird, bestimmt jeder selbst** (Standard: wenig): z. B. Trainingstage/-anzahl, Serien, Abzeichen, ausgewählte Rekorde, Ausdauer-Wochensumme. Nie Gewicht, Fotos, Journal, Gesundheitswerte ohne ausdrückliche Freigabe. Geteilt werden nur Kennzahlen (serverseitig zusammengefasst), nicht die Rohdaten.
- **Vergleichen:** Freund-Profil mit freigegebenen Kennzahlen, Vergleich nebeneinander (z. B. Wochenvolumen, Rekord Bankdrücken, km im Monat), kleine Rangliste unter Freunden bzw. im Gym (freiwillig).
- **Challenges:** mit Freunden oder vom Gym (z. B. „100 km im März“, „12 Trainings im Monat“), Fortschritt aus den eigenen Daten berechnet (wie `goalProgress`), Abzeichen bei Abschluss; Gym-Challenges legt das Gym an (Recht aus 34).
- Benachrichtigungen über Push (24d): Freundschaftsanfrage, Challenge-Stand. Optional später: Feed/Kudos.
- Danach **Push & Handytest 21–38** (wie 18c), nur nach Freigabe.

**Notizen:**

---

## Phase 6 – Später mit Internet/Server (nur Ausblick, keine Schritte)
- ~~Server + Sync (nutzt vorbereitete UUIDs/Timestamps/Soft-Delete), Mehrbenutzer mit Admin-Rolle, Privatsphäre~~ → vorgezogen in Phase 7 (Schritte 23, 24, 33)
- **„Multiplayer“-Modus** (Nutzerwunsch nach Schritt 15): Bis dahin nutzt jede Person die App über denselben Link mit eigenen Daten auf ihrem Gerät (Schritt 15b). Später überlegen, wie Geräte verbunden werden (Konto, Freunde, gemeinsame Pläne/Challenges) und ob dafür eine eigene, gehostete Version mit Server nötig ist.
- ~~Freunde, Pläne teilen, Ranglisten, Challenges~~ → vorgezogen als Schritt 38
- ~~Garmin-Connect-/Strava-API, Schlaf/Ruhepuls/HRV-Übernahme~~ → vorgezogen als Schritt 24c; Online-Karten bleiben Ausblick
- ~~Barcode-Scanner mit Open Food Facts online~~ → vorgezogen als Schritt 15c
- ~~Push-Benachrichtigungen~~ → vorgezogen als Schritt 24d
- ~~KI-Funktionen (Trainingsanalyse, Planvorschläge über Claude API)~~ → vorgezogen in Phase 7 (Schritte 31, 32)

## Ideen-Parkplatz
Ideen, die während der Umsetzung entstehen und keinem Schritt zugeordnet sind:
- ~~**Exzentrik (Negativ mit mehr Gewicht)**~~ – umgesetzt in Schritt 5 (siehe Notizen dort). Ursprüngliche Idee: Manche Maschinen geben in der negativen Phase mehr Gewicht als in der positiven. Umsetzungsidee: optionaler Wert pro Satz „Negativ“ (`eccentricWeight` in kg bzw. `eccentricLevel` bei Stufe), im Satz-Editor hinter einem Chip „Exzentrik“ wie RPE/RIR; wird wie das normale Gewicht in neue Sätze übernommen und an der Übung gemerkt. Anzeige z. B. „80 kg (neg. 100 kg) × 8“. Volumen/1RM/PRs (Schritt 5/7) rechnen mit dem positiven Gewicht, Exzentrik-Gewicht nur als eigener Verlauf/PR. Dexie-Version + Backup-Defaults nötig. Passt als kleiner Zusatz zu Schritt 5 oder 6. Sonstige Geräteeinstellungen (Sitz, Polster) bleiben in der Übungsnotiz.
- **Haptisches Feedback auf dem iPhone** (Nutzerwunsch, beim Feinschliff des Designs): iOS-Safari kann nicht vibrieren (`navigator.vibrate` fehlt). Ab iOS 18 gibt es einen Trick über einen versteckten `<input type="checkbox" switch>`, der beim Antippen ein haptisches Tick auslöst – **nur direkt bei einem Tipp** (z. B. Satz abhaken, Stepper), nicht automatisch am Ende der Pause. Eine **Mitteilung** am Pausenende wäre auf dem iPhone nur per Web-Push möglich (installierte PWA + Server), weil iOS die App im Hintergrund anhält → erst mit Server (Phase 6). Bis dahin: Ton + gut sichtbare Pausenleiste bei geöffneter App.
- **GPS-Tracking mit dem Handy** (beim Planen von Phase 3 verworfen): Eine PWA zeichnet nur bei eingeschaltetem Bildschirm auf (Wake Lock, Tastensperre, Lücken erkennen wären möglich). Echtes Hintergrund-Tracking nur als native App (z. B. Capacitor, App Store 99 €/Jahr). Bis dahin per Import (Schritt 14).
- **Karten, Routenplaner, Rennsimulation** (beim Planen von Phase 3 verworfen): Karte über MapLibre + OpenFreeMap (nur online), Routing über BRouter, GPX der Rennstrecke importieren, Pace-Plan mit Steigungsanpassung, Pace-Band, GPX-Export für die Uhr, Heatmap aller Strecken. Bräuchte eine Ausnahme vom Offline-Prinzip.
- **Intervalltraining mit Ansagen** (z. B. 6 × 400 m), nur sinnvoll zusammen mit GPS-Tracking.
