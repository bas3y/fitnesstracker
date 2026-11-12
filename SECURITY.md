# SECURITY.md – Sicherheitsregeln für Claude Code Projekte

Oct 21, 2026 · @Manuel Lopez

Diese Datei gilt für jedes Projekt. Lege zuerst den App-Typ fest: Er bestimmt, welche Regeln zusätzlich zur Basis gelten.

## 0. So wird diese Datei benutzt

In die `CLAUDE.md` des Projekts schreiben: `Befolge immer die Regeln in SECURITY.md.` und darunter den Steckbrief des Projekts:

```
APP-TYP: 1 | 2 | 3
MODULE: Zahlungen, Uploads, Eigener Server, Schnittstellen (nur zutreffende)
DATEN: personenbezogen ja/nein, besonders sensibel ja/nein
```

Fehlt der Steckbrief, fragt Claude Code zuerst danach, bevor es Code schreibt.

### App-Typen

| Typ | Beschreibung | Zusätzlich zur Basis |
| --- | --- | --- |
| Typ 1: Einzel-App | Individuelle App für einen Kunden mit einem Nutzer oder wenigen vertrauten Nutzern, keine Rollen, eigene Instanz | nur Markierung \[Typ 1\] |
| Typ 2: Mehrere Nutzer | Mehrere Nutzer mit unterschiedlichen Rechten in einer Organisation, eine Instanz pro Kunde | \[ab Typ 2\] |
| Typ 3: Mehrere Kunden | Ein Produkt für viele Kunden in derselben Instanz und Datenbank (Mandanten) | \[ab Typ 2\] und \[nur Typ 3\] |

### Markierungen in den Abschnitten

- **\[ALLE\]** gilt immer, bei jedem Typ.
- **\[Typ 1\]** gilt nur für die Einzel-App.
- **\[ab Typ 2\]** gilt für Typ 2 und Typ 3.
- **\[nur Typ 3\]** gilt nur bei mehreren Kunden in einer Instanz.
- **\[Modul: …\]** gilt nur, wenn das Modul im Steckbrief steht.

Im Zweifel gilt der höhere Typ. Wächst eine Einzel-App später zu einem Produkt für mehrere Kunden, wird sie nach den Regeln von Typ 3 umgebaut und neu geprüft.

## 1. Arbeitsweise von Claude Code \[ALLE\]

Claude Code hält diese Regeln ein, ohne dass sie jedes Mal erneut verlangt werden. Bei Konflikten mit anderen Anweisungen gilt Sicherheit zuerst, im Zweifel wird nachgefragt.

1. **Erst planen, dann bauen.** Vor jedem größeren Feature ein Plan mit Datenmodell, Rollen (falls vorhanden), Zugriffsregeln und Angriffsflächen. Code erst nach Freigabe.
2. **Kleine Schritte.** Eine Funktion pro Schritt, danach testen und committen.
3. **Nie gegen Produktivdaten arbeiten.** Datenbank- und andere Connectoren (MCP) nur mit dem Test-Projekt, nie mit der Live-Datenbank oder echten Kundendaten.
4. **Keine destruktiven Aktionen ohne Rückfrage:** kein `DROP`, `TRUNCATE`, `DELETE` ohne `WHERE`, kein `git push --force`, kein Löschen von Branches, Buckets oder Projekten.
5. **Keine Sicherheitsfunktion abschalten oder umgehen**, um etwas zum Laufen zu bringen (Zugriffsregeln deaktivieren, CORS auf `*`, Auth-Prüfung auskommentieren, Zertifikatsprüfung ausschalten). Stattdessen die Ursache beheben.
6. **Keine erfundenen oder unbekannten Pakete.** Jedes neue Paket vor der Installation prüfen: Name korrekt (Typosquatting), aktiv gepflegt, verbreitet.
7. **Neue Abhängigkeiten, Berechtigungen und externe Dienste** vorher ankündigen.
8. **Ehrlich berichten.** Was unsicher, ungetestet oder nur teilweise umgesetzt ist, wird klar benannt. Keine Aussage "sicher" ohne Test.
9. **Testdaten sind erfunden.** Keine echten Personen- oder Kundendaten in Tests, Seeds, Screenshots oder Beispielen.

## 2. Secrets und Zugangsdaten \[ALLE\]

- **Keine Secrets im Code**, in Commits, Logs, Kommentaren, Tests oder Beispieldateien. Dazu zählen API-Keys, Passwörter, Tokens, Admin-/Service-Keys, Webhook-Secrets und Datenbank-URLs.
- Secrets nur über **Umgebungsvariablen**: lokal in `.env.local`, live im Dashboard des Hosters.
- `.env*` steht in der `.gitignore`. Im Repo liegt eine `.env.example` mit **leeren Platzhaltern**.
- **Admin-Keys** (z. B. der `service_role`-Key von Supabase) gehören nie ins Frontend und nie in Variablen mit Frontend-Präfix (`NEXT_PUBLIC_`, `VITE_`). Nur serverseitig.
- Nur der öffentliche Key (`anon`/`publishable`) darf ins Frontend, und nur, weil die Zugriffsregeln der Datenbank ihn absichern.
- Wurde je ein Secret committet: **Key sofort rotieren**. Löschen aus dem Code reicht nicht, die Git-History bleibt.
- Vor jedem Commit auf Secrets prüfen (Secret-Scanning oder pre-commit-Hook).
- Test und Live nutzen **verschiedene** Keys und Zugangsdaten.

**\[Typ 1\]** Auch bei einer kleinen Einzel-App gelten alle Punkte. Kundenzugänge (z. B. Zugriff auf dessen Hosting-Konto) werden getrennt von eigenen Zugängen verwaltet und nach Projektende zurückgegeben oder gelöscht.

## 3. Authentifizierung (Login) \[ALLE\]

- **Keine selbstgebaute Login-Logik.** Ein geprüfter Dienst (Supabase Auth, Clerk, Auth0 oder das Auth-System des Frameworks) wird verwendet. Passwörter werden nie selbst gespeichert oder gehasht.
- Jede Seite und jeder Endpunkt außer ausdrücklich öffentlichen verlangt serverseitig einen gültigen Login. Die Prüfung im Frontend allein zählt nicht.
- **Passwort-Reset** sicher: Token einmalig, kurz gültig, keine Auskunft darüber, ob eine E-Mail existiert ("Falls das Konto existiert, wurde eine Mail gesendet").
- **Rate-Limits** für Login, Registrierung, Passwort-Reset und Einladungen.
- Sitzungen: kurze Token-Laufzeit, Logout beendet die Sitzung, Cookies mit `HttpOnly`, `Secure` und `SameSite=Lax` oder `Strict`.
- Passwort-Mindestlänge 10 Zeichen. Prüfung gegen geleakte Passwörter aktivieren, wenn der Dienst es anbietet.

**\[Typ 1\]** Registrierung ist **ausgeschaltet**. Der Nutzer wird manuell angelegt. Zugang nur mit starkem Passwort, 2FA wenn möglich. Gibt es nur einen Nutzer, wird die Zugriffsbeschränkung trotzdem serverseitig durchgesetzt (kein "die URL kennt ja niemand").

**\[ab Typ 2\]**

- E-Mail-Bestätigung bei Registrierung ist Pflicht.
- Neue Nutzer kommen nur über **Einladung** oder Freigabe durch einen Admin ins System, nicht per freier Selbstregistrierung (außer bewusst gewollt und dokumentiert).
- **2FA ist für Admin-Rollen Pflicht** und wird für alle Nutzer angeboten.
- Rechteänderungen (Rolle ändern, Nutzer sperren) sind nur für Admins möglich und werden protokolliert.
- Gesperrte oder entfernte Nutzer verlieren sofort alle Sitzungen.

**\[nur Typ 3\]**

- Die Zuordnung Nutzer zu Mandant wird serverseitig gespeichert und nie aus Client-Angaben abgeleitet.
- Einladungslinks sind an Mandant und E-Mail gebunden, einmalig und befristet.
- Nach dem Login sieht ein Nutzer ausschließlich Daten seines Mandanten (siehe Abschnitt 5).

## 4. Autorisierung und Datenbank \[ALLE\]

Autorisierung beantwortet: Darf dieser eingeloggte Nutzer genau diese Aktion auf genau diesen Daten ausführen? Sie wird immer **serverseitig und in der Datenbank** durchgesetzt.

- **Row Level Security (RLS)** oder eine gleichwertige Zugriffsregel ist auf **jeder** Tabelle aktiv, die über eine API erreichbar ist. Eine Tabelle ohne Regeln gilt als Fehler.
- **Standard ist verboten.** Zugriffe werden einzeln erlaubt (Least Privilege), getrennt für Lesen, Anlegen, Ändern und Löschen. Bei Änderungen werden Bedingung vor und nach der Änderung geprüft (`USING` und `WITH CHECK`).
- Regeln nutzen die serverseitig bekannte Nutzer-ID (`auth.uid()`), **nie** Werte, die der Client frei mitschicken kann (z. B. `user_id` im Request-Body).
- **IDOR vermeiden:** Nie nur anhand einer ID Daten ausliefern. Immer prüfen, ob der Nutzer das Objekt sehen oder ändern darf.
- Views mit `security_invoker = true`, sonst umgehen sie die Zugriffsregeln.
- `SECURITY DEFINER`-Funktionen nur bei zwingender Notwendigkeit, mit festem `search_path` und eigener Prüfung.
- Die Datenbank ist nie direkt aus dem Internet erreichbar. Zugriff nur über die API oder den Server.
- Alle Schema-Änderungen als **Migrationsdateien im Repo**, nicht per Klick im Dashboard.
- Sensible Spalten (Kontodaten, Notizen, Gehälter) nur freigeben, wenn nötig.

**\[Typ 1\]** Auch mit nur einem Nutzer bleibt RLS aktiv. Es gibt keine "öffentlichen" Tabellen außer dokumentierten Ausnahmen. Der einzige erlaubte Nutzer wird über die Nutzer-ID oder eine Allowlist festgelegt.

**\[ab Typ 2\]**

- **Rollen** (z. B. Admin, Mitarbeiter, Nur-Lesen) liegen in einer **eigenen Tabelle**, nicht in vom Nutzer änderbaren Feldern (z. B. `user_metadata`).
- Rechte pro Rolle sind in einer Matrix dokumentiert: wer darf welche Tabelle lesen, anlegen, ändern, löschen.
- Admin-Funktionen sind zusätzlich zur Oberfläche **auf dem Server** auf Admins beschränkt.
- Es gibt Tests je Rolle: Jede Rolle versucht erlaubte und verbotene Aktionen, auch direkt gegen die API.

## 5. Mandantentrennung \[nur Typ 3\]

Gilt, sobald mehrere Kunden (Betriebe, Firmen, Teams) dieselbe App und Datenbank nutzen. Ein einziger Fehler hier betrifft alle Kunden. Bei Typ 1 und Typ 2 entfällt dieser Abschnitt.

**Aufbau**

- Eine Tabelle für Mandanten und eine Zuordnung Nutzer zu Mandant.
- **Jede Datentabelle hat eine `mandant_id`** (NOT NULL, Fremdschlüssel, Index).
- Jede Zugriffsregel prüft die `mandant_id` anhand der **serverseitig ermittelten** Zugehörigkeit des eingeloggten Nutzers.
- Die `mandant_id` wird beim Anlegen **nie vom Client übernommen**, sondern serverseitig oder per Standardwert gesetzt.
- Dateispeicher ebenfalls getrennt: Pfad mit `mandant_id` plus Speicher-Regeln, die denselben Schutz erzwingen.
- Auch Hintergrundjobs, Exporte, Suche, Caches und E-Mail-Vorlagen sind mandantengetrennt (kein gemeinsamer Cache ohne Mandanten-Schlüssel).
- Support-/Admin-Zugriff auf Kundendaten läuft über eine getrennte, protokollierte Rolle und ist vertraglich geregelt.

**Pflichttests (automatisiert, vor jedem Release)**

Mit zwei Test-Mandanten A und B versucht ein Nutzer von A:

- Daten von B zu **lesen**, zu **ändern**, zu **löschen** und in B **anzulegen**.
- Dateien von B abzurufen.
- IDs und URLs von B direkt aufzurufen, auch **direkt gegen die API**, nicht nur über die Oberfläche.
- Die `mandant_id` im Request zu fälschen oder zu ändern.

Alle Versuche müssen fehlschlagen. Schlägt ein Test fehl, wird nicht veröffentlicht.

**Zusätzlich vor dem ersten echten Kunden:** externer Penetrationstest oder Review durch einen Sicherheitsprofi (siehe Abschnitt 13).

## 6. Eingaben, Ausgaben und typische Angriffe \[ALLE\]

- **Alle Eingaben serverseitig validieren**: Typ, Länge, Format, erlaubte Werte (z. B. mit Zod). Prüfung im Browser ist nur Komfort.
- **SQL-Injection:** nur parametrisierte Abfragen, ORM oder der Datenbank-Client. Nie SQL per String-Zusammenbau.
- **XSS:** Kein `dangerouslySetInnerHTML` oder `innerHTML` mit Nutzerdaten. Ist HTML nötig, wird es bereinigt (z. B. DOMPurify).
- **CSRF:** Bei Cookie-Login CSRF-Schutz und `SameSite`-Cookies. Änderungen nur per POST, PUT, PATCH oder DELETE, nie per GET.
- **Mass Assignment:** Aus Requests werden nur ausdrücklich erlaubte Felder übernommen.
- **SSRF:** Keine Server-Requests an vom Nutzer angegebene URLs ohne Allowlist.
- **Open Redirect:** Weiterleitungsziele nur aus einer Allowlist.
- **Fehlermeldungen** an den Client ohne interne Details (keine Stacktraces, SQL, Dateipfade). Details nur ins Server-Log.
- **Kein `eval`** und keine dynamische Codeausführung mit Nutzerdaten.
- **Rate-Limiting** auf allen öffentlichen und rechenintensiven Endpunkten.
- **CORS** auf die eigenen Domains beschränken, nie `*` zusammen mit Anmeldedaten.

**\[Typ 1\]** Ist die App nur im internen Netz oder für einen Nutzer gedacht, gelten diese Regeln trotzdem. Interne Apps werden oft später geöffnet, und "nur intern" schützt nicht vor Angriffen über den Browser des Nutzers.

**\[ab Typ 2\]** Zusätzlich: Jede Server-Funktion prüft die Berechtigung des Nutzers für das konkrete Objekt (siehe Abschnitt 4), und Massenaktionen (Export, Löschen mehrerer Einträge) sind auf die erlaubte Datenmenge beschränkt.

## 7. Web-Konfiguration \[ALLE\]

- Nur **HTTPS**. HTTP leitet um, HSTS ist aktiv.
- Sicherheits-Header setzen: `Content-Security-Policy`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `frame-ancestors` (bzw. `X-Frame-Options`), `Permissions-Policy`.
- Debug-Modus, Test-Routen, Demo-Konten und Admin-Seiten sind im Live-System aus oder geschützt.
- **Speicher-Buckets sind standardmäßig privat.** Öffentlich nur bewusst und dokumentiert.
- Keine sensiblen Daten in URLs, `localStorage` oder Client-Logs.
- Keine unnötigen personenbezogenen Daten in Logs, Fehlermeldungen oder Analytics.
- Cookie- und Tracking-Dienste von Dritten nur mit Einwilligung und Auftragsverarbeitung.

**\[ab Typ 2\]** Redirect-URLs und erlaubte Domains der Login-Dienste werden auf die Live-Domain begrenzt. Test- und Preview-Domains stehen nicht in der Live-Konfiguration.

## 7a. Schutz vor automatisierten Angriffen (auch KI-gestützt) \[ALLE\]

Angreifer lassen KI-Werkzeuge automatisch viele Apps nach Standardlücken absuchen: offene Tabellen, Schlüssel im Browser-Code, Datensätze per geänderter ID. Ziel: Die App bietet keine dieser Lücken und fällt bei solchen Scans durch.

1. **Angreifer-Test mit dem öffentlichen Schlüssel:** Ein automatischer Test fragt mit dem öffentlichen Schlüssel (`anon`/`publishable`) aus dem Browser-Code **jede Tabelle, jede View, jede Datenbankfunktion und jeden Speicher-Bucket** ohne Login ab. Ergebnis muss immer leer oder abgelehnt sein. Neue Tabellen werden automatisch mitgeprüft (Liste aus der Datenbank, nicht von Hand).
2. **Unbenutzte Zugänge abschalten:** Nicht genutzte Supabase-Funktionen aus (z. B. GraphQL-Endpunkt, nicht benötigte Schemas in der API). Keine Datenbankfunktionen, die ohne Login aufrufbar sind, außer dokumentierte Ausnahmen. Ausführungsrechte für `anon` auf Funktionen standardmäßig entzogen.
3. **Kleine Angriffsfläche:** Ohne Login ist nur die Login-Seite (plus Impressum/Datenschutz) erreichbar. Keine öffentlichen API-Routen ohne dokumentierten Grund.
4. **Bot-Schutz am Login:** Unsichtbares Captcha (z. B. Cloudflare Turnstile oder das Captcha von Supabase Auth) bei Login, Passwort-Reset und Einladung annehmen, zusätzlich zu den Rate-Limits aus Abschnitt 3.
5. **Firewall des Hosters:** Die Firewall bzw. der Bot- und Angriffsschutz des Hosters (z. B. Vercel Firewall) ist eingeschaltet. Auffällige Massenanfragen werden blockiert.
6. **Browser-Code sauber:** Keine Secrets, keine internen Adressen, keine Kommentare mit Interna im ausgelieferten Code. **Keine Source Maps** im Live-Betrieb öffentlich ausliefern.
7. **Automatischer Schwachstellen-Scan:** Ein Scanner von außen (z. B. OWASP ZAP Baseline) läuft bei jeder Veröffentlichung gegen die Test- bzw. Vorschau-Umgebung. Funde mit hohem Schweregrad stoppen die Veröffentlichung.
8. **Alarm bei Herumprobieren:** Benachrichtigung bei vielen fehlgeschlagenen Logins, vielen abgelehnten Zugriffen (z. B. RLS-Ablehnungen, 401/403) oder ungewöhnlich vielen Abrufen von einer Quelle.
9. **KI zur Abwehr nutzen:** Vierteljährlich prüft eine **neue Claude-Sitzung ohne Code-Kenntnis** die Live-Adresse von außen wie ein echter Angreifer (Black-Box-Test). Nur gegen die eigene App, nur mit erfundenen Testkonten, keine Last- oder Zerstörungstests. Ergebnis als Liste mit Schweregrad, Funde werden behoben.
10. **Externer Test wiederholen:** Externer Sicherheitstest nicht nur vor dem Start (siehe Abschnitt 13), sondern **jährlich und nach großen Änderungen** (neue Rollen, neue Schnittstellen, Umbau der Zugriffsregeln).
11. **Meldeadresse für Lücken:** Eine `/.well-known/security.txt` mit Kontakt-E-Mail ist veröffentlicht, damit gutwillige Finder Lücken melden können. Eingehende Meldungen werden innerhalb weniger Werktage beantwortet.

**\[Typ 1\]** Punkte 1 bis 8 und 11 gelten. Punkt 9 und 10 empfohlen.

**\[ab Typ 2\]** Alle Punkte gelten. Punkt 10 empfohlen, bei sensiblen Daten Pflicht.

**\[nur Typ 3\]** Alle Punkte sind Pflicht. Der Angreifer-Test aus Punkt 1 läuft zusätzlich mit einem eingeloggten Nutzer von Mandant A gegen alle Tabellen und Buckets von Mandant B.

## 8. Zusatzmodule

Diese Regeln gelten nur, wenn das Modul im Steckbrief (Abschnitt 0) steht.

### Modul: Zahlungen

- Keine Kartendaten selbst verarbeiten oder speichern, nur Hosted-Checkout oder Elements des Zahlungsanbieters (z. B. Stripe).
- Zahlungs- und Abo-Status wird **serverseitig über signierte Webhooks** gesetzt, nie dem Client geglaubt.
- Preise und Beträge werden serverseitig aus der eigenen Preisliste bestimmt, nie vom Client übernommen.
- Zugriff bei Zahlungsausfall wird serverseitig gesperrt, nicht nur im Frontend ausgeblendet.
- **\[nur Typ 3\]** Jeder Zahlungsdatensatz ist genau einem Mandanten zugeordnet, und das Kundenportal des Anbieters zeigt nur dessen eigene Daten.

### Modul: Uploads

- Dateityp (anhand des Inhalts, nicht nur der Endung) und Größe prüfen. Dateinamen neu vergeben.
- Uploads in privaten Speicher legen, nie in ausführbare Verzeichnisse. Auslieferung über zeitlich begrenzte, signierte Links.
- Bei Bildern und Dokumenten Metadaten (z. B. Standort) entfernen, wenn nicht nötig.
- **\[ab Typ 2\]** Zugriff auf Dateien folgt denselben Regeln wie die zugehörigen Datensätze (Speicher-Regeln, nicht nur Oberfläche).
- **\[nur Typ 3\]** Dateipfade enthalten die `mandant_id`, und die Speicher-Regeln erzwingen sie.

### Modul: Eigener Server (VPS)

- SSH nur mit Schlüssel. Passwort-Login und Root-Login aus.
- Firewall: nur 80/443 offen, SSH auf bekannte IPs beschränkt.
- Automatische Sicherheitsupdates, Datenbank nicht öffentlich erreichbar.
- Dienste in getrennten Containern hinter einem Reverse-Proxy mit HTTPS. Verwaltungsoberflächen nie direkt ins Internet.
- Backups auf einem **getrennten** Ziel, Wiederherstellung wird getestet.
- Kundensoftware und eigene Automatisierungen (z. B. n8n) laufen **nicht auf demselben Server**.
- Bevorzugt gemanagte Dienste (Datenbank, Hosting), wenn kein Grund für den eigenen Betrieb besteht.

### Modul: Schnittstellen, Webhooks, Automatisierung

- Eingehende Webhooks mit Signaturprüfung oder geheimem Token, nie offen.
- Eigene API-Schlüssel pro Anbindung, mit minimalen Rechten, rotierbar.
- Ausgehende Aufrufe mit Zeitlimit und Wiederholungsgrenze. Fehler werden protokolliert, aber ohne Geheimnisse.
- Daten von außen (Webhook, Import, Formular) werden wie Nutzereingaben validiert.

## 9. Abhängigkeiten und Lieferkette \[ALLE\]

- Nur etablierte, gepflegte Pakete. Die Zahl der Abhängigkeiten bleibt klein.
- **Lockfile** (`package-lock.json`, `pnpm-lock.yaml` o. ä.) wird committet. Versionen nicht blind auf `latest`.
- **Dependabot** (oder Renovate) und **Secret-Scanning** sind im Repository aktiv. `npm audit` oder das Äquivalent läuft regelmäßig und vor jedem Release.
- Ein unabhängiger Scanner (Semgrep oder Snyk) läuft zusätzlich, am besten automatisch in der CI.
- Neue Pakete: Name, Downloads, letzte Aktualisierung und Maintainer prüfen, Install-Skripte beachten.
- Sicherheits-Updates zeitnah einspielen und testen.

**\[Typ 1\]** Auch hier Dependabot und Lockfile. Bei einer Einzel-App wird im Wartungsvertrag festgelegt, wer Updates einspielt und wie oft.

**\[ab Typ 2\]** Updates mit Sicherheitsrelevanz werden innerhalb einer festgelegten Frist eingespielt (z. B. kritisch: wenige Tage), und es gibt eine Test-Umgebung, in der Updates vorher geprüft werden.

## 10. Logging, Monitoring, Backups und Notfall \[ALLE\]

- Wichtige Ereignisse werden protokolliert: Logins (Erfolg und Fehler), Rechteänderungen, Löschungen, Admin-Zugriffe, Zahlungsereignisse. **Keine Passwörter, Tokens oder unnötigen Personendaten im Log.**
- Fehlerüberwachung (z. B. Sentry) mit Benachrichtigung an eine Person, die sie auch liest.
- **Backups** laufen automatisch. Die Wiederherstellung wird vor dem Livegang **einmal real geübt** und danach regelmäßig getestet.
- **Getrennte Umgebungen:** Entwicklung/Test und Live mit eigenen Projekten und eigenen Keys.
- Deployments nur aus dem geprüften Hauptbranch. Der Hauptbranch ist geschützt (Pull Request oder Review, Prüfungen müssen bestehen).
- Notfallplan ist schriftlich: Zugänge sperren, Schlüssel rotieren, Betroffene informieren, Ursache beheben. Er steht an einem Ort, der auch bei Ausfall erreichbar ist.
- Bei Datenpannen mit Personenbezug gilt in der EU eine **Meldepflicht an die Aufsichtsbehörde innerhalb von 72 Stunden** (DSGVO). Bei Auftragsverarbeitung muss der Kunde unverzüglich informiert werden.

**\[Typ 1\]** Ein einfacher Notfallplan genügt (wer wird angerufen, wie wird der Zugang gesperrt, wo liegen Backups). Im Wartungsvertrag steht, wer bei einem Vorfall reagiert und in welcher Zeit.

**\[ab Typ 2\]** Zusätzlich: Audit-Log für Rechteänderungen und Admin-Zugriffe, Alarm bei auffälligen Mustern (viele fehlgeschlagene Logins, ungewöhnlich große Exporte), Statusseite oder feste Kommunikationswege für Störungen.

**\[nur Typ 3\]** Zusätzlich: Wiederherstellung einzelner Mandanten ist geklärt und getestet (ein Kunde möchte seinen Stand von gestern zurück, ohne andere zu beeinflussen), und das Löschen eines Mandanten entfernt dessen Daten vollständig, auch aus Backups nach Frist.

## 11. Konten und Infrastruktur (außerhalb des Codes) \[ALLE\]

- **2FA** überall: Code-Hosting (GitHub), Datenbank-Dienst, Hoster, Zahlungsanbieter, Domain-Anbieter, E-Mail und Passwortmanager.
- Passwortmanager nutzen, überall eindeutige, lange Passwörter.
- Code-Repository **privat**, Branch-Schutz an, wenige Personen mit Schreibrechten.
- Domain mit Registrar-Lock. E-Mail-Absender-Domain mit SPF, DKIM und DMARC.
- Zugänge ausgeschiedener Personen sofort entfernen. Jeder bekommt nur die Rolle mit den geringsten nötigen Rechten.

**\[Typ 1\]** Liegt die App im Konto des Kunden, bist du dort als eingeladener Admin eingetragen (nicht mit dem Passwort des Kunden). Am Projektende werden Eigentum und Zugänge sauber übergeben, und deine Zugänge bleiben nur, wenn ein Wartungsvertrag besteht.

**\[ab Typ 2\]** Konten des Betriebs (Hoster, Datenbank, Zahlungen) laufen auf eine Firma oder zumindest eine eigene Adresse, nicht auf private Konten, und eine zweite Vertrauensperson kennt den Notfallzugang.

**\[nur Typ 3\]** Kunden bekommen nie Zugang zu Hoster, Datenbank oder Repository. Kundenadministratoren verwalten nur Nutzer und Einstellungen **ihres** Mandanten in der App.

## 12. Datenschutz und Recht (Checkliste, kein Rechtsrat) \[ALLE\]

- Datenspeicherung bevorzugt in der **EU-Region**.
- **Datensparsamkeit:** Nur Daten erheben, die wirklich nötig sind. Aufbewahrungs- und Löschfristen festlegen.
- **Auftragsverarbeitungsvertrag (AVV)** mit jedem Kunden, dessen personenbezogene Daten verarbeitet werden, und AVVs mit allen eingesetzten Diensten (Datenbank, Hoster, Zahlungen, E-Mail).
- Betroffenenrechte (Auskunft, Berichtigung, Löschung, Export) müssen umsetzbar sein.
- Nutzungsrechte am Quellcode, Haftungsbegrenzung und Supportumfang vertraglich regeln. Keine Zusage "100 % sicher", stattdessen beschreiben, welche Maßnahmen umgesetzt sind.
- Verträge und AGB einmal anwaltlich prüfen lassen, Steuerfragen mit Steuerberatung klären.
- Cyber- bzw. Berufshaftpflicht prüfen.

**\[Typ 1\]**

- Individualvertrag (Werkvertrag) für die Erstellung und getrennter Wartungsvertrag mit Laufzeit, Kündigungsfrist und Reaktionszeiten.
- Im Vertrag steht, **wem der Quellcode gehört** und ob der Kunde ihn bekommt.
- Wenn die App im Kundenkonto läuft, ist der Kunde Verantwortlicher für seine Daten und du bist Auftragsverarbeiter. AVV trotzdem abschließen.

**\[ab Typ 2\]**

- Datenschutzerklärung und Impressum in der App, Einwilligungen nur dort, wo nötig.
- Rollen und Zugriffe sind dokumentiert (Verarbeitungsverzeichnis, technische und organisatorische Maßnahmen).
- Auf Wunsch kann ein Nutzer vollständig gelöscht werden, ohne die Daten der Organisation zu beschädigen.

**\[nur Typ 3\]**

- Standard-AGB, Abo-Vertrag mit Kündigungsregeln und ein **einheitlicher AVV** für alle Kunden.
- Unterauftragsverarbeiter (Hoster, Datenbank, E-Mail, Zahlungen) sind aufgelistet und werden Kunden mitgeteilt.
- Regeln für Vertragsende: Datenexport für den Kunden, danach Löschung mit Frist.
- Klare Haftungsgrenzen, da ein Fehler mehrere Kunden gleichzeitig betreffen kann.

## 13. Tests und Security-Review vor jedem Release

Welche Prüfungen Pflicht sind, hängt vom App-Typ ab.

| Prüfung | Typ 1 | Typ 2 | Typ 3 |
| --- | --- | --- | --- |
| Dependency-Audit, Secret-Scan, statische Analyse ohne offene kritische Funde | Pflicht | Pflicht | Pflicht |
| Tests für Eingabevalidierung und Fehlerfälle | Pflicht | Pflicht | Pflicht |
| Security-Review durch Claude Code in neuer Sitzung (Rolle Angreifer) | Pflicht | Pflicht | Pflicht |
| Zugriffstest: nicht eingeloggt kommt an keine geschützte Seite oder API | Pflicht | Pflicht | Pflicht |
| Tests je Rolle (erlaubte und verbotene Aktionen, direkt gegen die API) | – | Pflicht | Pflicht |
| Mandantentests aus Abschnitt 5 | – | – | Pflicht |
| Angreifer-Test mit öffentlichem Schlüssel und Schwachstellen-Scan von außen (Abschnitt 7a, Punkte 1 und 7) | Pflicht | Pflicht | Pflicht |
| Black-Box-Prüfung der Live-Adresse durch Claude (Abschnitt 7a, Punkt 9) | empfohlen | Pflicht | Pflicht |
| Backup-Wiederherstellung real getestet | Pflicht | Pflicht | Pflicht |
| Externer Penetrationstest oder Review durch Sicherheitsprofi | empfohlen | empfohlen bei sensiblen Daten | Pflicht vor dem ersten Kunden |

### Security-Review (neue Sitzung, Rolle Angreifer)

Claude Code prüft den gesamten Code gezielt auf:

- fehlende oder falsche Zugriffsregeln, fehlende Autorisierung auf Server-Endpunkten, IDOR
- Secrets im Code und in der Git-History
- Injection, XSS, unsichere Uploads, offene Speicher-Buckets
- fehlende Rate-Limits, zu offene CORS-Regeln, Mass Assignment, unsichere Redirects
- Webhooks ohne Signaturprüfung, Debug-Reste, zu ausführliche Fehlermeldungen
- unsichere oder verdächtige Abhängigkeiten

Das Ergebnis ist eine Liste mit Schweregrad und Lösung. Alle kritischen und hohen Punkte werden behoben, danach läuft der Review erneut.

### Datenbank-Dienst (z. B. Supabase)

- Sicherheits- und Performance-Hinweise im Dashboard sind abgearbeitet.
- Jede Tabelle hat Zugriffsregeln, Speicher-Regeln sind geprüft.
- Auth-Einstellungen kontrolliert: E-Mail-Bestätigung, Passwortregeln, erlaubte Redirect-URLs, Registrierung (an oder aus).

### Manuell

- Jede Rolle einmal durchklicken und gezielt Aufrufe versuchen, die nicht erlaubt sein dürfen.
- Fehler- und Alarmmeldungen kommen tatsächlich an.

## 14. Checkliste vor dem Livegang und laufende Pflege

### Für alle Typen

- [ ] Abschnitt 13 vollständig erledigt, keine offenen kritischen Funde
- [ ] Live-Umgebung mit eigenen Keys und eigenem Projekt, Testdaten entfernt
- [ ] Keine Secrets im Repo und in der Git-History (Scan durchgeführt)
- [ ] 2FA auf allen Konten, Repository privat, Branch-Schutz an
- [ ] HTTPS, Sicherheits-Header, CORS und Redirect-URLs auf die Live-Domain begrenzt
- [ ] Rate-Limits, Logging und Fehler-Alarm aktiv
- [ ] Abschnitt 7a umgesetzt: Angreifer-Test grün, unbenutzte Zugänge aus, Bot-Schutz und Firewall an, keine Source Maps live, `security.txt` veröffentlicht
- [ ] Backups laufen, Wiederherstellung geübt
- [ ] Notfallplan geschrieben (wer, was, in welcher Reihenfolge)
- [ ] Verträge, AVV, Datenschutzerklärung und Impressum vorhanden

### Zusätzlich Typ 1 (Einzel-App)

- [ ] Registrierung ausgeschaltet, Zugang nur für den vorgesehenen Nutzer
- [ ] Eigentum an Konten und Quellcode vertraglich geregelt
- [ ] Wartungsvertrag mit Update-Rhythmus und Reaktionszeit unterschrieben
- [ ] Übergabe dokumentiert (Zugänge, Backups, Ansprechpartner)

### Zusätzlich ab Typ 2 (mehrere Nutzer)

- [ ] Rollenmatrix dokumentiert und per Test belegt
- [ ] Einladungs- und Sperr-Ablauf getestet
- [ ] 2FA für Admins erzwungen
- [ ] Audit-Log für Rechteänderungen aktiv

### Zusätzlich nur Typ 3 (mehrere Kunden)

- [ ] Mandantentests bestehen, auch direkt gegen die API
- [ ] Externer Penetrationstest oder Sicherheitsreview durchgeführt, Funde behoben
- [ ] Einheitlicher AVV, AGB und Unterauftragsverarbeiter-Liste vorhanden
- [ ] Wiederherstellung und Löschung einzelner Mandanten geklärt
- [ ] Start mit wenigen Pilotkunden, danach schrittweise ausweiten

### Laufende Pflege

| Rhythmus | Aufgabe |
| --- | --- |
| Wöchentlich | Dependabot-Meldungen und Alarme prüfen |
| Monatlich | Updates einspielen, Zugänge und Rollen prüfen, Logs stichprobenartig ansehen |
| Vierteljährlich | Security-Review wiederholen, Black-Box-Prüfung der Live-Adresse (Abschnitt 7a), Wiederherstellung testen, Schlüssel rotieren |
| Jährlich und nach großen Änderungen | Externer Sicherheitstest (Abschnitt 7a, Punkt 10) |
| Bei jedem größeren Feature | Abschnitte 4 bis 6 und 13 erneut anwenden |

Hinweis: Diese Regeln senken das Risiko deutlich, garantieren aber keine vollständige Sicherheit. Rechtliche und steuerliche Fragen werden mit Fachleuten geklärt.
