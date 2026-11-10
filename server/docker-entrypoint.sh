#!/bin/sh
# Startet den Spielserver als Benutzer "node". Das Datenverzeichnis kommt als Volume und gehört
# anfangs root, deshalb wird es vorher übergeben; sonst könnte der Server den Spielstand nicht schreiben.
set -e
DATA_DIR="$(dirname "${DORF_DATA:-/app/server/data/db.json}")"
mkdir -p "$DATA_DIR"
chown -R node:node "$DATA_DIR"
exec su-exec node node index.js
