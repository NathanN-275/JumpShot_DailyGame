# Jumpshot

A responsive, single-player NBA trivia arcade game. Each run draws seven questions from a curated bank. Players can retry until an answer is accepted or the 30-second clock expires. Accepted answers score 10, 50, 100, or 200 points based on their assigned tier.

## Play locally

Open `dist/index.html` in a browser, or serve `dist/` with any static file server. The personal best is stored in that browser's local storage.

The answer bank and tier assignments are in `dist/game.js`. The first pack is a manually curated starting set, not a complete NBA database. See [SOURCES.md](SOURCES.md) for the records used to curate it.
