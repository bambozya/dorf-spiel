# Younes' Dorf

Ein Dorf-Spiel, ausgedacht von Younes (12): Felder bestellen, Bäume fällen, eine Brücke über den Fluss bauen, auf dem Markt handeln, Häuser einrichten, im Hafen angeln, in der Grotte kämpfen und mit Pferden oder Fahrrädern unterwegs sein. Es gibt eine normale Ansicht, eine 3D-Ansicht und eine Karte.

Spielbar unter <https://bambozya.github.io/dorf-spiel/>.

## Spielen und Server starten

Das Spiel läuft online mit mehreren Spielern. Dafür gibt es einen kleinen Spielserver in `server/` (Node 18 oder neuer, eine Abhängigkeit: `ws`). Er liefert die Spieldateien aus und hält unter `/ws` die Verbindung zu allen Spielern: Passwort, wer gerade online ist, und den gemeinsamen Spielstand.

```sh
cd server
npm install
cp .env.example .env     # DORF_PASSWORD und DORF_OWNER_TOKEN eintragen
npm start                # http://127.0.0.1:8787
npm test                 # Rauchtest
```

- `DORF_PASSWORD`: das Dorf-Passwort, das alle Spieler einmal eingeben. Der Browser merkt es sich.
- `DORF_OWNER_TOKEN`: wer die Seite einmal mit `?owner=<Token>` öffnet, ist danach auf diesem Gerät Besitzer (Admin-Knopf, Bannen).
- `DORF_MAX_PLAYERS`: wie viele gleichzeitig ins Dorf dürfen (Standard 30).
- Der Spielstand liegt in `server/data/db.json`.

Spieler müssen sich nicht registrieren: jedes Gerät bekommt beim ersten Besuch eine zufällige Kennung (localStorage), daraus macht der Server die Spieler-Kennung.

## Aufbau

| Pfad | Inhalt |
|---|---|
| `index.html` | Markup: Canvas, HUD-Panels, Dialoge, Skript-Reihenfolge |
| `css/style.css` | Alle Styles |
| `js/config.js` | Konstanten, Welt-Maße, Gegenstände, Häuser, Stände, Zufall |
| `js/world.js` | Karte des Dorfs aufbauen (Wege, Zäune, Bäume) |
| `js/state.js` | Spielstand: Standardwerte, Laden, Speichern (localStorage) |
| `js/sprites.js` | Pixel-Sprites und gezeichnetes Gemüse |
| `js/draw-figures.js`, `js/draw-buildings.js` | Figuren, Pferde, Häuser, Scheune, Laden |
| `js/input.js` | Tastatur, Touch-Stick, Buttons |
| `js/logic.js` | Spiellogik: Bewegung, Kollision, Tagesablauf, Händler |
| `js/hud.js` | Anzeigen, Toasts, Dialoge, Figur-Editor |
| `js/interior.js`, `js/building.js`, `js/kitchen.js`, `js/garages.js` | Häuser von innen, Bauen, Möbel |
| `js/views.js`, `js/terrain.js`, `js/bike-3d.js`, `js/effects.js` | Normal-, 3D- und Kartenansicht, Boden, Bäume, Licht, Animationen |
| `js/workshop.js`, `js/harbor.js`, `js/grotto.js`, `js/barn.js`, `js/barn-sacks.js` | Werkstatt, Hafen und Meer, Grotte und Kampf, Scheune |
| `js/online.js`, `js/online-shared.js`, `js/player-stalls.js`, `js/admin.js`, `js/ban.js` | Online-Modus (siehe unten) |
| `js/moments.js` | Erfolgsmomente und der Fernseher |
| `js/net.js` | Verbindung zum Spielserver: Passwort-Fenster, Anwesenheit, gemeinsamer Spielstand |
| `js/main.js` | Start und Spielschleife |
| `server/` | Spielserver (Node + ws) mit Rauchtest |

Die Skripte sind klassische Skripte und teilen sich einen globalen Scope. Die Reihenfolge in `index.html` ist deshalb wichtig: `config.js` zuerst, `main.js` zuletzt. Globale Namen: `state` (Spielstand), `player`, `ground`/`solid`/`fence` (Kacheln der Außenwelt), `MAP_W`/`MAP_H`/`TILE`.

Formatierung mit [Prettier](https://prettier.io) (`.prettierrc` liegt bei):

```sh
npx prettier --write "js/*.js" css/style.css
```

## Steuerung

| Taste | Aktion |
|---|---|
| W / A / S / D | laufen |
| ← → / Maus | umschauen (3D) |
| Leertaste | springen / aufstehen |
| E | benutzen: Tür, Stand, Bett … |
| N | mit dem Schwert zuschlagen |
| P | Möbel tragen |
| B | bauen (im Haus) |
| X | Möbel wegräumen |
| Q | Samen wechseln |
| V | Sicht wechseln |
| H | Tasten-Legende an/aus |

## Hinweis zum Online-Modus

Die Online-Dateien (`online.js`, `online-shared.js`, `player-stalls.js`, `barn-sacks.js`, `ban.js`, `admin.js`) sprechen eine kleine Schnittstelle an: einen Raum mit Anwesenheit, einen Dokumentenspeicher und eine Spieler-Kennung. `js/net.js` stellt sie über unseren Spielserver bereit. In der Claude-Artifact-Umgebung liefert `window.claude` dieselbe Schnittstelle, dann tut `net.js` nichts. Der persönliche Spielstand (Münzen, Rucksack, Haus) liegt noch im Browser (localStorage); er wandert als nächster Schritt auf den Server.
