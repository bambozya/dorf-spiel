# Younes' Dorf

Ein Dorf-Spiel, ausgedacht von Younes (12): Felder bestellen, Bäume fällen, eine Brücke über den Fluss bauen, auf dem Markt handeln, Häuser einrichten, im Hafen angeln, in der Grotte kämpfen und mit Pferden oder Fahrrädern unterwegs sein. Es gibt eine normale Ansicht, eine 3D-Ansicht und eine Karte.

Spielbar unter <https://bambozya.github.io/dorf-spiel/>.

## Spielen

Kein Build, keine Installation: `index.html` im Browser öffnen. Die Skripte werden über `<script src>` geladen, deshalb sollte das Spiel über einen Webserver laufen (lokal z. B. `python3 -m http.server`, online über GitHub Pages).

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
| `js/main.js` | Start und Spielschleife |

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

Online-Spielen, Haus-Codes, Spieler-Stände, die gemeinsame Brücke, der Admin-Bann und die Spieler-Anzeige laufen über die Claude-Artifact-Umgebung (`window.claude`). Außerhalb davon, zum Beispiel auf GitHub Pages, läuft das Spiel als Einzelspieler-Version. Der Spielstand wird im Browser gespeichert (localStorage).
