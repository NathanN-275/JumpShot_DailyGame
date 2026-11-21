# Versus arcade implementation plan

## Rules

- Search the live queue for 10 seconds with a visible searching animation. Match the first available human; otherwise start a bot match automatically. Cancel leaves the queue.
- Each match has seven shared prompts, two name prompts and five trivia categories. Both opponents have 30 seconds to submit one accepted answer per prompt. Existing 10/50/100/200 tiers determine base points.
- After the answer window, the player with a lower tier has 10 seconds to submit a different answer at a strictly higher tier than the opponent's. A successful steal removes the opponent's base points, preserves the defender's base points, and adds 15/20/30 points for a 50/100/200-point steal answer. Equal tiers and 200-point answers cannot be stolen.
- The bot draws uniformly from the prompt's answer bank for its base answer and, if eligible, for its steal attempt. A player can reconnect within 15 seconds before forfeiting.

## Delivery

1. Export the existing question banks into the Worker bundle during the backend build. Keep answer validation and scores on the Worker. Use one Durable Object for the initial matchmaking queue and one per match.
2. Add a standalone versus screen to `dist/` with queue, match, reveal, and final states. Keep the daily game intact and link the modes from the home screen.
3. Animate both teams toward their respective baskets and face each sprite in its direction of travel. Respect reduced-motion preferences.
4. Adjust the play layout for 360–430 px phones, with readable prompts and reachable answer controls when the keyboard opens.
5. Document local Worker setup and the deployment URL. Deploying requires the owner's Cloudflare account; GitHub Pages can continue serving `dist/`.

## Acceptance

- Two browsers queue into one match and see identical prompts, deadlines, and results.
- A lone browser starts against a bot after 10 seconds; cancelling before then prevents a match.
- A valid rarer steal cancels the opponent's base points and awards only the defined bonus. Equal or weaker answers do not steal.
- Reconnection restores the active match within 15 seconds; later disconnection forfeits.
- Both teams' motion is coherent, and play remains usable at 360 px width.
