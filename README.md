# JS.13kGames.2026

Minimal tile-grid engine for [JS13kGames](https://js13kgames.com/).

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

Zip is about **3KB** (~10KB free).

## Controls

Arrow keys or WASD move the player on land tiles. Water and walls block movement.
