# JS.13kGames.2026

Unicorn rainbow-guide puzzle for [JS13kGames](https://js13kgames.com/)

Guide the Unicorn - create a rainbow path and surround enemies on each side to capture them. Reach the sparkle exit to clear a stage. There are 4 worlds to purify, 3 puzzle levels in each one, with a boss fight at the end. Enemies left in the puzzle stages are summoned in the boss fight.

## Install

```bash
npm install
```

## Scripts

| Command | What it does |
|---------|----------------|
| `npm run debug` | Inline JS/CSS, no minification, BrowserSync live reload |
| `npm run build` | Minified PWA build + zip (no live reload) |
| `npm run prod` | Minify + Roadroller + zip |
| `npm run raw` | Kaap JS/CSS files for easier debugging |
| `npm test` | Re-zip `public/` as `zip/game.zip` and report size |

## Controls

Arrow keys / WASD
 - move the Unicorn to guide a rainbow path (puzzle levels).
 - pick Unicorn L-step movement in two phases to hop (in-battle).

`R` - reset.
`B` - skip to battle.
`N` - debug-clear stage.

