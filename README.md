# Younes' Dorf

Ein Dorf-Spiel, ausgedacht von Younes (12): Felder bestellen, Bäume fällen, eine Brücke über den Fluss bauen, auf dem Markt handeln, Häuser einrichten und mit Pferden oder Fahrrädern unterwegs sein. Es gibt eine normale Ansicht, eine 3D-Ansicht und eine Karte.

## Spielen

Das ganze Spiel steckt in einer einzigen Datei: `index.html`. Einfach im Browser öffnen, ohne Installation und ohne Build.

Über GitHub Pages (Settings → Pages → Branch `main`, Ordner `/root`) ist es dann unter `https://<dein-name>.github.io/<repo-name>/` spielbar.

## Steuerung

| Taste | Aktion |
|---|---|
| W / A / S / D | laufen |
| ← → / Maus | umschauen (3D) |
| Leertaste | springen / aufstehen |
| E | benutzen: Tür, Stand, Bett … |
| P | Möbel tragen |
| B | bauen (im Haus) |
| V | Sicht wechseln |
| H | Tasten-Legende an/aus |

## Hinweis zum Online-Modus

Online-Spielen, Haus-Codes, Spieler-Stände, die gemeinsame Brücke, der Admin-Bann und die Spieler-Anzeige laufen über die Claude-Artifact-Umgebung (`window.claude`). Außerhalb davon, zum Beispiel auf GitHub Pages, läuft das Spiel als Einzelspieler-Version. Der Spielstand wird im Browser gespeichert (localStorage).
