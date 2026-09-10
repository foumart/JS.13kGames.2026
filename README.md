# The Fourth Labyrinth

A puzzle / tactical battle strategy game for [JS13kGames](https://js13kgames.com/).

## Gameplay

Guide the Unicorn of Order - with each step you lay a snake-like rainbow trail. Try to surround all leprechauns presented on stage with that trail to capture them. The goal is to clear all (or as many as possible) of the leprechauns and reach the sparkle exit. Stepping back along the trail undoes the last moves.

There are **Story** and **Puzzle** modes, and **Easy** or **Hard** option. Hard adds special cross tile that makes the puzzles more complex, and also the enemy AI is bit smarter.

## Story mode

A campaign of **7 worlds** - each world consisiting of **3 Vails**. To confront a Vail you must solve **3 puzzles** and then win the **Vail** battle. You have three lives - you loose 1 life if you get defeated in the vail battle.

On some puzzle stages you will encounter imprisoned heroes and the objective changes - you must rescue the hero by surrounding with the rainbow trail before exitting through the sparkle exit. For the vail battle you pick up to two rescued allies to fight beside the Unicorn. Leprechauns left alive in the puzzles are summoned into the Vail fight. The last stage of each world also hides a **Jewel of Judgement** - the objective then is to surround the jewel with the trail before the exit.

Win the Vail and surviving allies each take one upgrade: extra HP, +1 damage, a longer move or attack ray, and for the Unicorn a special **Around** attack (the Unicorn strikes every foe in range at once), or additional life. Fallen allies skip that round of upgrades but they will continue to be available for the next Vail.

The move and attack types are abbriviated like R, B, Q and K - corresponding to Rook, Bishop, Queen and Knight (chess style). So for example an upgrade of R2 means two adjacent (horizontal / vertical) tiles range.

## Puzzle mode

This mode is endless and consists of puzzles with increasing difficulty, where you must obtain the Jewel of Judgement and then exit through the sparkle.

## Vail battles

Turn-based tactics - The Unicorn always fights; rescued heroes you picked take their turns automatically after yours, then comes the enemies turn to move and attack.

The Unicorn moves as a **knight**. With keyboard you aim an L-shaped jump in two arrow presses: first a cardinal direction (the long leg), then left or right (or up and down) to pick the landing. Yellow tiles are moves, red tiles are attacks. **Space** attacks if anyone is in range (or skips the attack if you already moved). Click or tap a highlighted tile to move or strike. **Tab** cycles allies; **Enter** ends the Unicorn’s turn early.

After the Unicorn learns **Around**, after a move the unicorn attacks all foes at range automatically.

## Keyboard Controls

| Input | Puzzle | Vail |
|-------|--------|------|
| Arrows / WASD | Step, or retract along the trail | Knight move or attack (two keypresses) |
| Click / tap | Step onto the neighbouring tile, or retract toward a trail cell | Select a unit to see stats, or perform move/attack on a highlighted tile |
| Drag / swipe | Move in the drag direction | Same as an arrow |
| Space | — | Attack, or skip attack after a move |
| Enter | Confirm menus | Pass and skip the Unicorn's turn |
| Tab | — | Cycle through unit stats |
| Esc | Pause (Resume / Quit) | Pause |
| R | Restart the stage | Restart the battle |

Title, pause, briefing, party pick, and upgrade screens also use arrows plus Space or Enter.

Debug builds only: **N** clears the current stage (or wins the Vail), **B** skips to the next battle. Roadroller release builds strip those keys.

## Install

```bash
npm install
```

## Scripts

| Command | What it does |
|---------|----------------|
| `npm run debug` | Inline JS/CSS, no minification + BrowserSync live reload |
| `npm run build` | Minified build + BrowserSync live reload |
| `npm run prod` | Minify + Roadroller + zip - creates the smallest package possible |
| `npm run raw` | Keep JS/CSS as separate files for easier debugging |
| `npm test` | Re-zip `public/` as `zip/game.zip` and report size |

Release zip fits the 13,312-byte compo limit.

