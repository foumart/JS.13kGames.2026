# JS.13kGames.2026

Unicorn rainbow-trail puzzle for [JS13kGames](https://js13kgames.com/) (13KB zip).

Leave a rainbow path (snake-style). Surround enemies on each side with rainbow to capture them. Stage can be cleared perfectly or with no moves left with enemies remaining (`R` resets).

## Install

```bash
npm install
```

## Scripts

| Command | What it does |
|---------|----------------|
| `npm run debug` | Inlined JS/CSS, no Closure minify, BrowserSync live reload |
| `npm run build` | Closure-minified PWA build + zip (no live server) |
| `npm run prod` | Closure + Roadroller + zip (use when packing denser JS) |
| `npm run raw` | Separate JS/CSS files for easier debugging |
| `npm test` | Re-zip `public/` as `zip/game.zip` and report size |

## Controls

Arrow keys / WASD - move. `R` - reset level.

