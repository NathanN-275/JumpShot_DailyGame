# Cloudflare controls versus matches

Versus matches use a Cloudflare Worker and Durable Objects for matchmaking, round deadlines, answer validation, and scoring while GitHub Pages serves the interface. This keeps a shared match authoritative across two browsers without operating a persistent server. The browser still contains the daily game's answer bank, so this first release is a casual competition rather than a cheat-resistant ranked mode.
