# Roadmap Fitnesstracker

Jeder Schritt wird in einem eigenen Chat mit „Schritt X starten“ umgesetzt (Ablauf siehe [CLAUDE.md](../CLAUDE.md)).
Nach Abschluss: Checkbox abhaken und Notizen ausfüllen.

## Übersicht

- [x] Schritt 0 – Projekt-Setup (lokal)
- [x] Schritt 1 – Lokale Datenbank, App-Shell & Datensicherung
- [ ] Schritt 2 – Mitgelieferte Datenbanken (Übungen & Nährwerte)
- [ ] Schritt 2b – *optional:* früher Testpush & Handytest
- [ ] Schritt 3 – Übungsverwaltung
- [ ] Schritt 4 – Workout loggen
- [ ] Schritt 5 – Berechnungen & PRs
- [ ] Schritt 6 – Trainingspläne
- [ ] Schritt 7 – Statistiken & Graphen (Kraft)
- [ ] Schritt 8 – Dashboard & CSV-Export (MVP 1 fertig)
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
- Abweichungen:
- Offene Punkte:

### Schritt 2b – *optional:* früher Testpush & Handytest
**Ziel:** Früh prüfen, ob Installation, Offline-Start und Speicher auf echten Geräten (v. a. iPhone/Safari) funktionieren, bevor viele Features darauf aufbauen. Kann übersprungen werden.
- Entspricht dem Inhalt von Schritt 20 (Repo, GitHub Action, Pages), nur früher ausgeführt
- Danach wieder lokal weiterarbeiten; spätere Pushes erst in Schritt 20
- Ergebnisse der Handytests hier notieren (Probleme → als offene Punkte in betroffene Schritte eintragen)

**Notizen:**
- Gebaut / übersprungen:
- Ergebnis Android:
- Ergebnis iPhone:

---

## Phase 1 – MVP 1: Krafttraining mit Graphen

### Schritt 3 – Übungsverwaltung
- Übungsliste mit Suche und Filter (Muskelgruppe, Equipment, Kategorie), Detailseite
- Eigene Übungen anlegen/bearbeiten, builtin-Übungen ausblenden statt löschen, Favoriten
- Wiederverwendbare Komponente `ExercisePicker` (für Schritt 4 und 6)

**Fertig wenn:** Eigene Übung anlegen → in `ExercisePicker` auswählbar. E2E-Test.

**Notizen:**
- Gebaut:
- Abweichungen:
- Offene Punkte:

### Schritt 4 – Workout loggen
- Dexie-Version mit `workouts`, `workoutExercises`, `sets` (`weight`, `reps`, `rpe?`, `rir?`, `isWarmup`, `restSeconds?`, `completedAt`)
- Workout starten (leer), Übungen per `ExercisePicker` hinzufügen, Reihenfolge ändern
- Sätze erfassen mit Steppern (Gewicht ±2,5 kg, Wdh. ±1), Satz abhaken, Aufwärmsatz markieren, optional RPE/RIR
- „Letztes Mal“-Anzeige pro Übung
- Rest-Timer nach abgehaktem Satz (Standardzeit einstellbar, Vibration/Ton, läuft über Zeitstempel weiter, auch wenn App kurz im Hintergrund war)
- Laufendes Workout wird sofort gespeichert und nach App-Neustart fortgesetzt
- Workout beenden: Dauer, Notiz; Historie (Liste + Detail, nachträglich bearbeiten/löschen)

**Fertig wenn:** E2E: im Offline-Modus komplettes Workout loggen, App neu laden, Workout ist in Historie.

**Notizen:**
- Gebaut:
- Abweichungen:
- Offene Punkte:

### Schritt 5 – Berechnungen & PRs
- `src/domain/strength.ts`: Volumen (ohne Aufwärmsätze), geschätztes 1RM (Epley, Brzycki), beste Sätze
- PR-Erkennung: max. Gewicht, max. 1RM, max. Volumen (Satz/Einheit), max. Wdh. bei Gewicht
- PR-Toast beim Abhaken eines Satzes, PR-Markierung in der Historie
- Progressive-Overload-Vorschlag: z. B. Zielwdh. erreicht → +2,5 kg, sonst gleiches Gewicht / +1 Wdh.
- Ausführliche Unit-Tests

**Fertig wenn:** Alle Formeln getestet, PR-Toast im E2E sichtbar.

**Notizen:**
- Gebaut:
- Abweichungen:
- Offene Punkte:

### Schritt 6 – Trainingspläne
- Dexie-Version mit `plans`, `planDays`, `planExercises` (Zielsätze, Zielwdh.-Bereich, Pausenzeit)
- Plan anlegen/bearbeiten, Tage mit Wochentagen verknüpfen, Plan duplizieren, aktiven Plan wählen
- Mitgelieferte Vorlagen: Push/Pull/Legs, 5x5, Ganzkörper 3x/Woche, Oberkörper/Unterkörper
- Workout aus Plan-Tag starten → Übungen und Sätze vorbefüllt (mit Overload-Vorschlag aus Schritt 5)

**Fertig wenn:** E2E: Plan aus Vorlage → Workout starten → Sätze vorbefüllt.

**Notizen:**
- Gebaut:
- Abweichungen:
- Offene Punkte:

### Schritt 7 – Statistiken & Graphen (Kraft)
- Pro Übung: Verlauf max. Gewicht, geschätztes 1RM, Volumen (Recharts), PR-Liste
- Trainingsfrequenz-Heatmap (Jahresansicht wie GitHub)
- Muskelgruppen-Verteilung: Sätze pro Muskelgruppe und Woche, Hinweis auf vernachlässigte Gruppen
- Zeitraumfilter (4 Wochen, 3 Monate, 1 Jahr, alles)
- Aggregationen in `src/domain/` mit Unit-Tests

**Fertig wenn:** Graphen mit Testdaten korrekt, Unit-Tests für Aggregationen.

**Notizen:**
- Gebaut:
- Abweichungen:
- Offene Punkte:

### Schritt 8 – Dashboard & CSV-Export (MVP 1 fertig)
- Dashboard: heutiger/nächster Plantag (Startbutton), letztes Workout, Wochenvolumen, neueste PRs, Mini-Heatmap
- CSV-Export der Workouts/Sätze (Web Share / Download)
- Lighthouse-PWA- und Performance-Check (lokal mit `npm run preview`), Fehler beheben
- Playwright-E2E über den kompletten MVP-1-Ablauf im Android- und iPhone-Viewport, offline

**Fertig wenn:** MVP 1 lokal im Browser (Handy-Ansicht, offline) vollständig nutzbar, Lighthouse-PWA-Check bestanden.

**Notizen:**
- Gebaut:
- Abweichungen:
- Offene Punkte:

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
-
