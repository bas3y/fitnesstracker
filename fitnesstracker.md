# Fitnesstracker – Ideensammlung

Sammlung aller bisherigen Ideen für eine Fitness- & Lifestyle-Tracking-Anwendung.
Mit ⭐ markiert sind Ergänzungen, die über die ursprünglichen Stichpunkte hinausgehen.

---

## Grundidee

Eine Anwendung (Format noch offen), mit der man sein Training tracken kann. Der Fokus liegt zunächst auf der persönlichen Nutzung. Die Mehrbenutzer-Funktion (Admin, andere Nutzer, Konkurrenz) ist eine spätere Erweiterung.

---

## 1. Training

**Bereiche:** Krafttraining, Laufen, Schwimmen, Radfahren, ⭐ Wandern, ⭐ Mobility/Yoga, ⭐ Sonstiges (frei anlegbar)

### Trainingsplan
- Pläne anlegen (z. B. Push/Pull/Legs, 5x5, Halbmarathon-Plan)
- ⭐ Vorlagen und Wochenplan mit festen Trainingstagen
- ⭐ Plan duplizieren und anpassen
- ⭐ Trainingsblöcke (Aufbau, Deload, Peak)

### Krafttraining
- Übungsdatenbank mit eigenen Übungen
- Pro Satz: Gewicht, Wiederholungen
- ⭐ RPE/RIR und Pausenzeit pro Satz
- ⭐ Automatische Berechnung von Volumen und geschätztem 1RM
- ⭐ Personal Records (PRs) mit Benachrichtigung
- ⭐ Progressive-Overload-Vorschläge (z. B. "Letztes Mal 80 kg × 8, heute 82,5 kg probieren")
- ⭐ Rest-Timer und Aufwärmsätze

### Ausdauer
- Distanz, Zeit, Pace, Herzfrequenz, Höhenmeter
- ⭐ Herzfrequenzzonen
- ⭐ Intervalle
- ⭐ Streckenkarte
- ⭐ Schuhe tracken (Kilometerstand pro Laufschuh)
- ⭐ Schwimmen: Bahnen, Schwimmstil, SWOLF

---

## 2. Auswertung & Fortschritt

- Fortschritt bei Gewichten und Ausdauerstatistiken
- Graphische Anzeige pro Übung (Gewicht, Volumen, 1RM über Zeit)
- Ausdauerstatistiken (Pace-Entwicklung, Wochenkilometer)
- ⭐ Wochen-/Monats-/Jahresrückblick
- ⭐ Ziele setzen (z. B. "Bankdrücken 100 kg bis Dezember") mit Fortschrittsbalken
- ⭐ Trainingsfrequenz-Heatmap (wie bei GitHub)
- ⭐ Muskelgruppen-Auswertung (wo wird zu wenig trainiert?)
- ⭐ Vergleich von Zeiträumen
- ⭐ Streaks und Badges für Motivation

---

## 3. Geräteanbindung

- Garmin Forerunner 255 (Garmin Connect API bzw. FIT-Dateien)
- Andere Geräte, falls weitere Nutzer die Anwendung verwenden
- ⭐ Erster Schritt ohne API: manueller Import von FIT/GPX/TCX-Dateien
- ⭐ Später: Strava, Apple Health, Google Health Connect, Polar, Wahoo, Withings (Waage)
- ⭐ Daten wie Schlaf, Ruhepuls, HRV und Body Battery übernehmen

---

## 4. Alltag & Gesundheit

### Tägliches Tracking
- Schritte
- Wasser
- ⭐ Schlaf
- ⭐ Gewicht und Körpermaße
- ⭐ Stimmung/Energielevel

### Supplements
- Mehrere Felder für Supplements, eigene Liste mit Dosierung und Uhrzeit
- ⭐ Erinnerungen und Abhaken
- ⭐ Bestand mit Warnung, wenn etwas fast leer ist

### Ernährung
- Option für Proteintracker
- Kalorientracker
- ⭐ Makros komplett (optional)
- ⭐ Barcode-Scanner und Lebensmitteldatenbank (z. B. Open Food Facts)
- ⭐ Eigene Rezepte und Mahlzeiten speichern
- ⭐ Tagesziele passend zu Trainings- und Ruhetagen

---

## 5. Gewohnheiten & Self-Improvement

- Habit-Tracker: Gewohnheiten abhaken, frei erweiterbar
- ⭐ Streaks
- ⭐ Tagebuch / Journaling, Dankbarkeit
- ⭐ Lesen (Bücher, Seiten, Notizen)
- ⭐ Lernziele, Fokuszeit (Pomodoro), Meditation
- ⭐ Morgen- und Abendroutine als Checkliste
- ⭐ Wochenreflexion ("Was lief gut? Was ändere ich?")
- ⭐ Bildschirmzeit
- ⭐ Fortschrittsfotos

---

## 6. Benutzer & Rollen

- Ich als Admin, andere Nutzer können ebenfalls schauen/nutzen
- Fokus zunächst auf der Nutzung für mich allein
- ⭐ Privatsphäre: jeder sieht standardmäßig nur seine eigenen Daten
- Später: Freunde, Ranglisten, Challenges (Konkurrenz-Idee)
- ⭐ Daten teilen (z. B. Trainingsplan an Freunde senden)

---

## 7. Weitere Extras

- ⭐ Dashboard mit Tagesübersicht (Training, Wasser, Schritte, Habits auf einen Blick)
- ⭐ Dark Mode
- ⭐ Export (CSV/PDF) und Backup
- ⭐ Offline-Nutzung im Gym
- ⭐ Erinnerungen und Benachrichtigungen
- ⭐ KI-Funktionen: Trainingsanalyse, Planvorschläge

---

## Offene Fragen

1. **Format:** Web-App, Handy-App oder beides? (Eine PWA wäre ein guter Kompromiss: eine Codebasis, installierbar auf dem Handy, offlinefähig.)
2. **Nutzer:** Nur ich am Anfang? Dann reicht erstmal ein einfaches Konto-System.
3. **Daten:** Lokal gespeichert oder auf einem Server? (Wichtig für Mehrbenutzer und Garmin-Sync.)
4. **Priorität:** Welcher Teil zuerst?

### Vorschlag für MVP-Reihenfolge
1. Krafttraining mit Graphen
2. Habits / Wasser / Schritte
3. Ausdauer
4. Garmin-Anbindung
5. Mehrbenutzer

---

## Nächste Schritte (Ideen)

- [ ] Ideen nach Priorität sortieren
- [ ] Datenmodell entwerfen
- [ ] Technologie-Optionen für das Format vergleichen
