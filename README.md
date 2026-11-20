# Jumpshot

A responsive, single-player NBA trivia arcade game. Everyone gets the same seven questions each day, with a new set at midnight Eastern. Players can retry until an answer is accepted or the 30-second clock expires. Accepted answers score 10, 50, 100, or 200 points based on their assigned tier.

## Play locally

Open `dist/index.html` in a browser, or serve `dist/` with any static file server. The daily attempt and personal best are stored in that browser's local storage.

Run `python3 art/draw_sprites.py` to regenerate the original player and crowd artwork.

The 21-day rotation uses all 147 prompts once before repeating. Each game opens with two name prompts, followed by five NBA trivia questions from different categories. Edit `dist/questions.js` for the expanded bank and `dist/game.js` for the original pack. See [SOURCES.md](SOURCES.md) for the directory and NBA records used.
