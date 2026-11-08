# Basey – Fitness & Lifestyle

Offline-Fitness- und Lifestyle-Tracker als Progressive Web App (PWA) für Android und iPhone.
Nach dem ersten Laden läuft die App komplett ohne Internet, alle Daten bleiben auf dem Gerät.

## Installation aufs Handy

Adresse: **https://niklasbesarab.github.io/fitnesstracker/**
Einmal mit Internet öffnen und installieren, danach funktioniert sie im Flugmodus.

- **Android (Chrome):** Adresse öffnen → Menü ⋮ → „App installieren“ (bzw. „Zum Startbildschirm hinzufügen“).
- **iPhone (Safari):** Adresse in **Safari** öffnen → Teilen-Symbol → „Zum Home-Bildschirm“. Nur die
  installierte App vom Home-Bildschirm aus nutzen, nicht den Safari-Tab (eigener Speicher).

**Wichtig:** Alle Daten liegen nur auf dem Gerät, ohne Konto und ohne Server. Regelmäßig unter
Einstellungen → Datensicherung ein Backup exportieren und die Datei außerhalb des Handys ablegen
(iOS kann Daten von Web-Apps nach längerer Nichtnutzung löschen). Nicht im Privat-/Inkognito-Modus nutzen.

### An andere weitergeben

Jeder, der den Link öffnet, bekommt eine eigene, leere App mit seinen Daten auf seinem Gerät – es
werden keine Daten geteilt. In der App: Einstellungen → „App weitergeben & installieren“ (teilt den
Link oder kopiert ihn, dort steht auch diese Anleitung).

Updates: Bei geöffneter App mit Internet erscheint „Neue Version verfügbar – Neu laden“.

## Veröffentlichung

Jeder Push auf `main` startet `.github/workflows/deploy.yml` (Lint, Typecheck, Unit-Tests, Build mit
`BASE_PATH=/<repo-name>/`, Deploy auf GitHub Pages). In den Repo-Einstellungen muss unter
Settings → Pages als Source „GitHub Actions“ gewählt sein.

## Voraussetzungen

- Node.js 24 LTS (inkl. npm)
- git

## Befehle

| Befehl                 | Zweck                                                              |
| ---------------------- | ------------------------------------------------------------------ |
| `npm install`          | Abhängigkeiten installieren                                        |
| `npm run dev`          | Entwicklungsserver (ohne Service Worker)                           |
| `npm run build`        | Produktions-Build nach `dist/`                                     |
| `npm run preview`      | Build lokal ausliefern, Service Worker aktiv (http://localhost:4173) |
| `npm test`             | Unit-Tests (Vitest)                                                |
| `npm run test:e2e`     | E2E-Tests (Playwright, Android- und iPhone-Viewport)               |
| `npm run lint`         | ESLint + Prettier-Prüfung                                          |
| `npm run format`       | Code mit Prettier formatieren                                      |
| `npm run typecheck`    | TypeScript-Prüfung                                                 |
| `npm run icons`        | PWA-Icons aus `public/favicon.svg` neu erzeugen                    |

Unterpfad für das Hosting (z. B. GitHub Pages) über `BASE_PATH`, Standard ist `/`:

```powershell
$env:BASE_PATH = '/fitnesstracker/'; npm run build
```

## Offline lokal testen

1. `npm run build` und `npm run preview`
2. http://localhost:4173 in Chrome öffnen, DevTools → Application → Service Workers prüfen
3. DevTools → Network → „Offline“ → Seite neu laden → App startet trotzdem
