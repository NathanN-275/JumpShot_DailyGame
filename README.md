# Jumpshot

A responsive, single-player NBA trivia arcade game. Everyone gets the same seven questions each day, with a new set at midnight Eastern. Players can retry until an answer is accepted or the 30-second clock expires. Accepted answers score 10, 50, 100, or 200 points based on their assigned tier.

## Play locally

Open `dist/index.html` in a browser, or serve `dist/` with any static file server. The daily attempt and personal best are stored in that browser's local storage.

Run `python3 art/draw_sprites.py` to regenerate the original player and crowd artwork.

The 28-day rotation starts December 11, 2026, after the initial 21-day rotation. It uses all 196 prompts once before repeating. Each game opens with two name prompts, followed by five NBA trivia questions from different categories. See [SOURCES.md](SOURCES.md) for the directory and NBA records used.

Run `node --test` to check answer matching and the daily rotation.

## Versus arcade

The [versus plan](docs/versus-plan.md) describes online matchmaking, bot fallback, steals, and mobile play. GitHub Pages still hosts `dist/`; a Cloudflare Worker and Durable Objects run the live matches.

For local development, run `npm install`, `npm run bank`, `npm run dev:worker`, and serve `dist/` at `http://localhost:8000`. When testing locally, set `FRONTEND_ORIGIN` to `http://localhost:8000` for that Wrangler session. The versus page uses `http://localhost:8787` until a deployed endpoint is set in `dist/versus-config.js`.

To publish, run `npm run deploy:worker` while signed into Cloudflare, and put the resulting Worker URL in `dist/versus-config.js` before publishing the frontend. The Worker data is generated from the existing daily question bank; the daily game's public scripts still expose those answers to anyone inspecting the site, so versus is intended as casual play.
