const tileWidth = 6;
const cellSize = 18;
const unitScale = 2 / 3;
const campaignLength = 63;

let boardWidth;
let boardHeight;
let boardOffsetX = 0;
let boardOffsetY = 0;
let iconContext;

let enemies = []; // 0 empty, 1 blue, 2 green, 3 red, 4-6 dying
let obstacles = [];
let coins = [];
let clouds = []; // 1 cross
let exits = [];
let rescues = []; // 0 empty, else unit bitmap index
let pathData = [];
let pathStep = [];
let fillData = [];
let moveLog = []; // flushed enemy cells per forward move (for undo)
let player;
let moving = 0;
let gameLoop;
let time = 0;
let pathCount = 0;
let hiscore = 0;
let lives = 3;
let puzzleMode = 0;
let menu = 1; // 1 title, 2 pause
let perfects = 0;

let state = 1; // 1 play, 2 win, 3 lose
let showEnd = 0;
let showObjective = 0;
let stageCaptive = 0;

let levelIndex = 0;
let enemiesTotal = 0;
let enemiesCleared = 0;
let coinsCollected = 0;
let moveCount = 0;
let levelScore = 0;
let totalScore = 0;
let scoreStart = 0;
let scoreBanked = 0;
let revealPlayerTile = 0;

let leftoverEnemies = 0;
let leftTotalThisLevel = 0;
let leftoverKinds = [0, 0, 0];
let leftUnitsThisLevel = [0, 0, 0];
let leftGoldThisLevel = 0;
let leftUnitConverted = 0;
let goldFlies = [];
let rescuedUnits = [];
let deadUnits = [];
let levelCaptives = [];
let rescueDying = [];
let unitMods = {}; // name -> [hp, att, move steps taken, attack steps taken, around]
const UNITS = [
	// name,     hp,dm,mv,at,bm,pttrn, rng, rc - born as 0:+ 1:x 2:* 3:knight 4:around
	//           |  |  |  |  |  |      |    |    rn/rc cap each ladder: K*100 + maxR*10 + maxB
	//           |  |  |  |  |  |      |    |    and 0 means it never upgrades
	[0,          6, 2, 3, 3, 0, 0,     100, 100], // Unicorn
	["Corwin",   9, 1, 0, 3, 7, "012", 121,  0],
	["Merlin",   5, 1, 2, 0, 7, "b56", 131, 43], // yellow
	["Benedict", 10,2, 0, 1, 6, "046", 21,  22], // blue
	["Fiona",    4, 1, 1, 1, 5, 0,     33,  6],
	["Random",   8, 1, 1, 1, 7, 0,     2,   12],
	["Bleys",    7, 1, 0, 2, 6, 0,     1,   10],
	["Julian",   7, 1, 1, 1, 5, "392", 3,   50],// green
	["Caine",    9, 1, 0, 0, 6, "096", 20,  30],// blue
	["Gerard",   12,2, 0, 0, 6, "356", 11,  21],
];
const ENEMIES = [
	["Manticore",20,5, 2, 1, 1, "cd6", 43,  16],
	["Guisel",   28,4, 1, 0, 4, "1e2", 21,  21],
	["Shroud",   16,6, 3, 3, 3, "d65", 300, 111],
	["Brand",    24,6, 3, 3, 7, "b16", 166, 11]
];

// each battle: kind*10+lvl, kind 0 lep 1 hydra 2 serpent 3+ named ENEMIES
const BATTLES = [
	[2], [4], [11,2,2],
	[5,4,4], [12], [21,5,5],
	[11,11], [13,4,4], [22,3,3],
	[21,21], [23,5,5], [30,21,21],
	[15,11,11], [25,3,3], [40,23,23],
	[15,22,22], [30,30,30], [50,13,13],
	[40,30,30], [25,14,14], [60,50,50]
];

const EnemyPalettes = [
	// 2 - leprechaun
	["d72", "3d2", "d32", "eb2", "abe"],
	// 3 - hydra
	["396", "bd2", "382", "bce", "abe"],
	// 4 - serpent
	["456" ,"ce2", "382", "bde", "abe"]
]

const UP = [0, -1];
const RIGHT = [1, 0];
const DOWN = [0, 1];
const LEFT = [-1, 0];

const ROOK = [UP, RIGHT, DOWN, LEFT];
// 4 rook dirs, 4 bishop dirs, 8 knight hops - a unit's rays are a mask over these
const DIRS = [...ROOK, [1, 1], [1, -1], [-1, 1], [-1, -1], [1, -2], [-1, -2], [2, -1], [-2, -1], [1, 2], [-1, 2], [2, 1], [-2, 1]];
// move/atk type - the rays a unit is spawned with: 0:+, 1:x 2:*, 3:knight, 4:around
const RAYBASE = [[1, 0, 0], [0, 1, 0], [1, 1, 0], [0, 0, 1], [1, 1, 1]];

// [dx, dy, steps] per live direction, so rook and bishop can reach different distances
function rayList(g) {
	const out = [];
	for (let i = 0; i < 16; i++) {
		const n = g[i < 4 ? 0 : i < 8 ? 1 : 2];
		if (n) out.push([DIRS[i][0], DIRS[i][1], n]);
	}
	return out;
}

// A unit can upgrade its rays until the limits rn/rc set in unit settings are reached.
// The shorter rays rook/bishop (R/B) are first, knight (K) is last. Summary:
// knight * 100 + maxRook * 10 + maxBishop, so 121 reads "up to R2/B1, finally K".
function upgradeRay(t, lim, n) {
	const base = RAYBASE[t] || RAYBASE[0];
	let r = base[0];
	let b = base[1];
	let k = base[2];
	const mr = lim / 10 % 10 | 0;
	const mb = lim % 10;
	for (let i = 0; i < n; i++) {
		if (r < mr && (r <= b || b >= mb)) r ++;
		else if (b < mb) b ++;
		else if (lim > 99 && !k) k = 1;
		else break;
	}
	return [r, b, k];
}

// upgrades go like "R~1", "B~1", "K", or 0 once maxed
function rayStep(t, lim, n) {
	const a = upgradeRay(t, lim, n);
	const b = upgradeRay(t, lim, n + 1);
	return b[0] > a[0] ? "R" + b[0] : b[1] > a[1] ? "B" + b[1] : b[2] > a[2] ? "K" : 0;
}

function rayText(g) {
	let s = g[0] ? "R" + g[0] : "";
	if (g[1]) s += (s && "-") + "B" + g[1];
	if (g[2]) s += (s && "-") + "K";
	return s;
}

function inBounds(x, y) {
	return x >= 0 && y >= 0 && x < boardWidth && y < boardHeight;
}

function isMapTile(x, y) {
	return inBounds(x, y) && !obstacles[y][x];
}

function initBoard() {
	const levelData = getLevelData(levelIndex);
	boardHeight = levelData.length;
	boardWidth = levelData[0].length;
	enemies = [];
	obstacles = [];
	coins = [];
	clouds = [];
	exits = [];
	rescues = [];
	stageCaptive = 0;
	unrescueLevel(levelIndex);
	rescueDying = [];
	pathData = [];
	pathStep = [];
	fillData = [];
	pathTrail = [];
	moveLog = [];
	pathCount = 0;
	retractX = -1;
	hopping = 0;
	enemiesTotal = 0;
	enemiesCleared = 0;
	coinsCollected = 0;
	moveCount = 0;
	levelScore = 0;
	totalScore = scoreStart;
	scoreBanked = 0;
	leftTotalThisLevel = 0;
	leftUnitsThisLevel = [0, 0, 0];
	leftGoldThisLevel = 0;
	leftUnitConverted = 0;
	goldFlies = [];
	revealPlayerTile = 0;
	state = 1;
	showEnd = 0;
	battleResult = 0;
	showObjective = !menu;
	moving = 0;

	let startX = 0;
	let startY = 0;
	let capIdx = 0;
	if (!levelCaptives[levelIndex]) levelCaptives[levelIndex] = [];

	for (let y = 0; y < boardHeight; y++) {
		enemies[y] = [];
		obstacles[y] = [];
		coins[y] = [];
		clouds[y] = [];
		exits[y] = [];
		rescues[y] = [];
		rescueDying[y] = [];
		pathData[y] = [];
		pathStep[y] = [];
		fillData[y] = [];
		for (let x = 0; x < boardWidth; x++) {
			const c = levelData[y][x];
			enemies[y][x] = c == 1 ? 1 + (levelIndex > 3 && RNG(2)) : 0;
			obstacles[y][x] = c == 3 ? 1 : 0;
			coins[y][x] = c == 4 ? 1 : 0;
			clouds[y][x] = c == 7 ? 1 : 0;
			exits[y][x] = c == 8 ? 1 : 0;
			rescues[y][x] = 0;
			if (c == 9 && !puzzleMode) {
				let bmp = levelCaptives[levelIndex][capIdx];
				if (!bmp) {
					bmp = pickRescueBmp();
					levelCaptives[levelIndex].push(bmp);
				}
				capIdx ++;
				rescues[y][x] = bmp;
				if (!stageCaptive) stageCaptive = bmp;
			}
			rescueDying[y][x] = 0;
			if (c == 1) enemiesTotal ++;
			pathData[y][x] = 0;
			pathStep[y][x] = 0;
			fillData[y][x] = 0;
			if (c == 2) {
				startX = x;
				startY = y;
			}
		}
	}

	player = new Player(startX, startY);
	placeStartPath(startX, startY);
	buildRainbowBackdrop();
}

function isPassable(x, y, dx, dy) {
	if (!inBounds(x, y) || enemies[y][x] || obstacles[y][x] || fillData[y][x] == 1) return 0;
	if (rescues[y][x] && !rescueDying[y][x]) return 0;
	if (exits[y][x] && remainingRescue()) return 0;
	const cross = clouds[y][x];
	if (pathStep[y][x]) {
		if (cross) {
			const pd = pathData[y][x];
			const horiz = pd & 10; // E|W
			const vert = pd & 5; // N|S
			if (dx && !horiz) return 1;
			if (dy && !vert) return 1;
		}
		return 0;
	}
	return 1;
}

function leprechaunType(v) {
	return v > 3 ? v - 3 : v;
}

function leprechaunDying(v) {
	return v > 3;
}

function isLeprechaunAlive(v) {
	return v > 0 && v < 4;
}

function anyDying() {
	for (let y = 0; y < boardHeight; y++) {
		for (let x = 0; x < boardWidth; x++) {
			if (leprechaunDying(enemies[y][x]) || rescueDying[y][x]) return 1;
		}
	}
	return 0;
}

function countEnemiesLeft() {
	leftTotalThisLevel = 0;
	leftUnitsThisLevel = [0, 0, 0];
	for (let y = 0; y < boardHeight; y++) {
		for (let x = 0; x < boardWidth; x++) {
			const v = enemies[y][x];
			if (!isLeprechaunAlive(v)) continue;
			leftTotalThisLevel ++;
			leftUnitsThisLevel[v - 1] ++;
		}
	}
}

function countEnemiesAndCoinsLeft() {
	const golds = [];
	const leps = [];
	for (let y = 0; y < boardHeight; y++) {
		for (let x = 0; x < boardWidth; x++) {
			if (coins[y][x]) golds.push([x, y]);
			if (enemies[y][x] == 1) leps.push([x, y]);
		}
	}
	leftGoldThisLevel = golds.length;
	leftUnitConverted = Math.min(golds.length, leps.length);
	goldFlies = [];
	for (let i = 0; i < leftUnitConverted; i++) {
		const g = golds[i];
		const l = leps[i];
		coins[g[1]][g[0]] = 0;
		const fly = { x: g[0], y: g[1] };
		goldFlies.push(fly);
		tween(fly, 60, { x: l[0], y: l[1] }, () => {
			enemies[l[1]][l[0]] = 3;
			const k = goldFlies.indexOf(fly);
			if (k >= 0) goldFlies.splice(k, 1);
			if (!goldFlies.length) {
				countEnemiesLeft();
				scheduleEndScreen();
			}
		}, -9);
	}
	if (!goldFlies.length) countEnemiesLeft();
}

function waitDelay(callback, frames = 30) {
	tween({}, frames, {}, callback);
}

function hasMove() {
	return canRetract()
		|| isPassable(player.x + 1, player.y, 1, 0)
		|| isPassable(player.x - 1, player.y, -1, 0)
		|| isPassable(player.x, player.y + 1, 0, 1)
		|| isPassable(player.x, player.y - 1, 0, -1);
}

function reviveDyingEnemies() {
	for (let y = 0; y < boardHeight; y++) {
		for (let x = 0; x < boardWidth; x++) {
			if (leprechaunDying(enemies[y][x])) {
				enemies[y][x] = leprechaunType(enemies[y][x]);
				fillData[y][x] = 0;
			}
			if (rescueDying[y][x]) {
				rescueDying[y][x] = 0;
				fillData[y][x] = 0;
			}
		}
	}
}

function isJailed(x, y) {
	return rescues[y][x] && !rescueDying[y][x];
}

function inGroup(x, y) {
	return isLeprechaunAlive(enemies[y][x]) || isJailed(x, y);
}

function getClusters() {
	const seen = [];
	const clusters = [];
	for (let y = 0; y < boardHeight; y++) {
		seen[y] = [];
		for (let x = 0; x < boardWidth; x++) seen[y][x] = 0;
	}

	for (let y = 0; y < boardHeight; y++) {
		for (let x = 0; x < boardWidth; x++) {
			if (!inGroup(x, y) || seen[y][x]) continue;
			const cluster = [];
			const stack = [[x, y]];
			seen[y][x] = 1;
			while (stack.length) {
				const cur = stack.pop();
				const cx = cur[0];
				const cy = cur[1];
				cluster.push(cur);
				const dirs = ROOK;
				for (let i = 0; i < 4; i++) {
					const nx = cx + dirs[i][0];
					const ny = cy + dirs[i][1];
					if (inBounds(nx, ny) && inGroup(nx, ny) && !seen[ny][nx]) {
						seen[ny][nx] = 1;
						stack.push([nx, ny]);
					}
				}
			}
			clusters.push(cluster);
		}
	}
	return clusters;
}

function isClusterSurrounded(cluster) {
	for (let i = 0; i < cluster.length; i++) {
		const x = cluster[i][0];
		const y = cluster[i][1];
		for (let d = 0; d < 4; d++) {
			const nx = x + ROOK[d][0];
			const ny = y + ROOK[d][1];
			if (!inBounds(nx, ny)) continue;
			if (obstacles[ny][nx] || rescues[ny][nx]) continue; // wall / cell seals this side
			let inCluster = 0;
			for (let j = 0; j < cluster.length; j++) {
				if (cluster[j][0] == nx && cluster[j][1] == ny) inCluster = 1;
			}
			if (inCluster) continue;
			if (!isPath(nx, ny) && !fillData[ny][nx]) return 0;
		}
	}
	return 1;
}

function markClusterDying(cluster) {
	for (let i = 0; i < cluster.length; i++) {
		const x = cluster[i][0];
		const y = cluster[i][1];
		if (isLeprechaunAlive(enemies[y][x])) enemies[y][x] += 3;
		if (rescues[y][x]) rescueDying[y][x] = 1;
		fillData[y][x] = 1;
	}
	if (rainbowAnim) rainbowDone = 2;
	else {
		rainbowDone = 0;
		rainbowWait = 0;
	}
}

function flushDyingEnemies() {
	const flushed = [];
	for (let y = 0; y < boardHeight; y++) {
		for (let x = 0; x < boardWidth; x++) {
			if (leprechaunDying(enemies[y][x])) {
				const kind = leprechaunType(enemies[y][x]);
				enemies[y][x] = 0;
				fillData[y][x] = 1;
				enemiesCleared ++;
				sfx("AI", .2);
				flushed.push([x, y, 0, kind]);
			}
			const rescued = collectRescue(x, y);
			if (rescued) flushed.push(rescued);
		}
	}
	return flushed;
}

function restoreFlushed(flushed) {
	for (let i = 0; i < flushed.length; i++) {
		const x = flushed[i][0];
		const y = flushed[i][1];
		const bmp = flushed[i][2];
		fillData[y][x] = 0;
		if (bmp) {
			rescues[y][x] = bmp;
			rescueDying[y][x] = 0;
			const k = rescuedUnits.indexOf(bmp);
			if (k >= 0) rescuedUnits.splice(k, 1);
		} else if (flushed[i][3] < 0) {
			coins[y][x] = 1;
			coinsCollected --;
		} else {
			enemies[y][x] = flushed[i][3] || 1;
			enemiesCleared --;
		}
	}
}

function collectCoin(x, y) {
	if (!coins[y][x]) return 0;
	coins[y][x] = 0;
	coinsCollected ++;
	sfx("QX");
	return [x, y, 0, -1];
}

function getCurrentContext() {
	return iconContext || gameContext;
}

function drawSparkle(x, y, size, frame) {
	blit(objectBitmaps[3 + (frame & 1)], x, y, size);
}

function pickRescueBmp() {
	const taken = {};
	for (let i = 0; i < rescuedUnits.length; i++) taken[rescuedUnits[i]] = 1;
	const placed = levelCaptives[levelIndex];
	if (placed) {
		for (let i = 0; i < placed.length; i++) taken[placed[i]] = 1;
	}
	const pool = [];
	for (let i = 1; i < UNITS.length; i++) {
		if (!taken[UNITS[i][0]]) pool.push(UNITS[i][0]);
	}
	if (!pool.length) for (let i = 1; i < UNITS.length; i++) pool.push(UNITS[i][0]);
	return pool[RNG(pool.length)];
}

function unrescueLevel(i) {
	const list = levelCaptives[i];
	if (!list) return;
	for (let j = 0; j < list.length; j++) {
		const k = rescuedUnits.indexOf(list[j]);
		if (k >= 0) rescuedUnits.splice(k, 1);
	}
}

function allyMod(name) {
	if (!unitMods[name]) unitMods[name] = [0, 0, 0, 0];
	return unitMods[name];
}

function getUnitDefinition(name) {
	for (let i = 0; i < UNITS.length; i++) {
		if (UNITS[i][0] == name) return UNITS[i];
	}
}

function makeUnit(data, x, y, type) {
	const unit = new Unit(data, x, y, type);
	if (!unit.enemy) {
		const mod = allyMod(data[0]);
		unit.hpMax += mod[0];
		unit.hp = unit.hpMax;
		unit.dmg += mod[1];
	}
	return unit;
}

function getEnemyPalette(kind, l) {
	return l > 1 ? EnemyPalettes[kind][l - 2] : unitData[kind + 3];
}

function collectRescue(x, y) {
	const k = rescues[y][x];
	if (!k || !rescueDying[y][x]) return 0;
	rescues[y][x] = 0;
	rescueDying[y][x] = 0;
	fillData[y][x] = 1;
	if (rescuedUnits.indexOf(k) < 0) rescuedUnits.push(k);
	return [x, y, k];
}

function remainingRescue() {
	for (let y = 0; y < boardHeight; y++) {
		for (let x = 0; x < boardWidth; x++) {
			if (isJailed(x, y)) return 1;
		}
	}
	return 0;
}

function worldNumber() {
	return (levelIndex / 9 | 0) + 1;
}

function shadowNumber() {
	return ((levelIndex / 3 | 0) % 3) + 1;
}

function stageNumber() {
	return (levelIndex % 3) + 1;
}

function isPerfect() {
	if (leftTotalThisLevel) return 0;
	if (stageCaptive && rescuedUnits.indexOf(stageCaptive) < 0) return 0;
	return 1;
}

function stageScore() {
	return enemiesCleared * 10 + coinsCollected * 5 + (state == 2 && isPerfect() ? 100 : 0);
}

function currentScore() {
	return totalScore + (scoreBanked ? 0 : stageScore());
}

function calcLevelScore() {
	levelScore = stageScore();
	return levelScore;
}

function scheduleEndScreen() {
	sfx(state == 2 ? "IMQX" : "QMIE");
	waitDelay(()=> {
		calcLevelScore();
		if (state == 2 && !scoreBanked) {
			totalScore += levelScore;
			scoreBanked = 1;
			if (isPerfect()) perfects ++;
		}
		if (currentScore() > hiscore) hiscore = currentScore();

		showEnd = 1;
		endBtnCur = 1; // start on NEXT; clamps back to RETRY when it is the only one
		showEndButtons();
		redraw();
	});
}

function drawUnitIcon(src, cx, cy, size, pal) {
	const d = !src || src.bgr != null ? src : getUnitDefinition(src);
	const bmp = unitBitmaps[d && d.bgr != null ? d.bgr : d ? d[5] : 0];
	if (pal == null) pal = d && (d.palette != null ? d.palette : d.pal != null ? d.pal : d[6]);
	const scale = size / Math.max(bmp.width, bmp.height);
	const dw = bmp.width * scale;
	const dh = bmp.height * scale;
	if (pal.length ? pal : pal != null && bmp[2]) {
		drawPaletted(bmp, pal, cx - dw / 2, cy - dh / 2, dw, dh, getCurrentContext());
	} else getCurrentContext().drawImage(bmp, 0, 0, bmp.width, bmp.height, cx - dw / 2, cy - dh / 2, dw, dh);
}

function drawMoveArrows(size) {
	if (moving || state != 1 || menu || showObjective || showEnd) return;
	const showGold = (time / 1000 | 0) % 3;
	for (let i = 0; i < 4; i++) {
		const nx = player.x + ROOK[i][0];
		const ny = player.y + ROOK[i][1];
		if (!puzzleMoveAt(nx, ny) || isPrevPath(nx, ny)) continue;
		if ((coins[ny][nx] || exits[ny][nx]) && showGold) continue;
		blit(objectBitmaps[6 + i], boardOffsetX + nx * size, boardOffsetY + ny * size, size);
	}
}

function drawGoldFlies(size) {
	const n = goldFlies.length;
	if (!n) return;
	const cs = size * 0.8;
	for (let i = 0; i < n; i++) {
		const f = goldFlies[i];
		const px = boardOffsetX + f.x * size + (size - cs) / 2;
		const py = boardOffsetY + f.y * size + size - cs - size * 0.06;
		blit(objectBitmaps[1], px, py, cs);
	}
}

function checkCaptures(flushAcc) {
	const clusters = getClusters();
	for (let i = 0; i < clusters.length; i++) {
		if (isClusterSurrounded(clusters[i])) markClusterDying(clusters[i]);
	}

	if (exits[player.y][player.x] && !remainingRescue()) {
		if (flushAcc) {
			const extra = flushDyingEnemies();
			for (let i = 0; i < extra.length; i++) flushAcc.push(extra[i]);
		} else {
			flushDyingEnemies();
		}
		countEnemiesAndCoinsLeft();
		revealPlayerTile = 1;
		state = 2;
		if (!goldFlies.length) scheduleEndScreen();
		return;
	}

	if (!hasMove()) {
		if (flushAcc) {
			const extra = flushDyingEnemies();
			for (let i = 0; i < extra.length; i++) flushAcc.push(extra[i]);
		} else if (!canRetract()) {
			flushDyingEnemies();
		}
	}

	if (!hasMove()) {
		state = 3;
		scheduleEndScreen();
	}
}

function hideEndButtons() {
	Y.style.display = N.style.display = "none";
}

// Keyboard focus across the RETRY / NEXT buttons
let endBtnCur = 0;

function endButtons() {
	const a = [];
	if (Y.style.display != "none") a.push(Y);
	if (N.style.display != "none") a.push(N);
	return a;
}

function syncEndCursor() {
	const a = endButtons();
	if (endBtnCur >= a.length) endBtnCur = a.length - 1;
	const on = showUpgrade ? upgradeCurUnit >= upgradeRows().length : showEnd || menu;
	for (let i = 0; i < a.length; i++) a[i].className = on && i == endBtnCur ? "cur" : "";
}

function moveEndCursor(dx) {
	const n = endButtons().length;
	if (!n || !dx) return;
	endBtnCur = (endBtnCur + dx + n) % n;
	syncEndCursor();
}

function activateEndButton() {
	const b = endButtons()[endBtnCur];
	if (b) b.onclick();
}

function showBattleTurnButton() {
	const on = !battlePhase && !animating && !thinking;
	Y.style.display = "none";
	N.style.display = "block";
	N.textContent = "END ROUND";
	N.style.opacity = on ? "1" : "0.3";
	N.onclick = battleEndTurn;
	syncEndCursor();
}

function showEndButtons() {
	Y.style.display = "block";
	Y.textContent = "RE" + (lives ? "TRY" : "START");
	Y.onclick = lives ? resetHere : restartCampaign;
	N.style.opacity = "1";
	N.onclick = battleActive ? afterBattleWin : nextLevel;
	N.textContent = battleActive && levelIndex > campaignLength - 2 ? "REPLAY"
		: !puzzleMode && !battleActive && levelIndex % 3 == 2 ? "CONFRONT" : "NEXT";
	N.style.display = lives && state == 2 ? "block" : "none";
	syncEndCursor();
}

function showObjectiveButtons() {
	Y.style.display = "none";
	N.textContent = "PLAY";
	N.onclick = showPick ? confirmParty : dismissObjective;
	N.style.display = "block";
	N.style.opacity = "1";
	syncEndCursor();
	syncPickButton();
}

function syncPickButton() {
	if (!showPick) return;
	const need = Math.min(2, livingRescueCount());
	N.style.opacity = battleParty.length >= need ? "1" : "0.3";
}

function dismissObjective() {
	if (!showObjective) return;
	showObjective = 0;
	hideEndButtons();
	redraw();
}

function nextLevel() {
	scoreStart = totalScore;
	if (!puzzleMode) {
		leftoverEnemies += leftTotalThisLevel;
		for (let i = 0; i < 3; i++) leftoverKinds[i] += leftUnitsThisLevel[i];
	}
	leftTotalThisLevel = 0;
	leftUnitsThisLevel = [0, 0, 0];
	if (!puzzleMode && levelIndex % 3 == 2) {
		battleKind = isBossBattle() ? 2 : 1;
		startBattle();
	} else if (levelIndex < campaignLength - 1) {
		levelIndex ++;
		resetLevel();
	} else restartCampaign();
}

function clearLeftovers() {
	leftoverEnemies = 0;
	leftTotalThisLevel = 0;
	leftoverKinds = [0, 0, 0];
	leftUnitsThisLevel = [0, 0, 0];
	leftGoldThisLevel = 0;
	leftUnitConverted = 0;
}

function afterBattleWin() {
	applyUpgradePicks();
	markHeroesDead();
	clearLeftovers();
	showUpgrade = 0;
	upgradePicks = {};
	showPick = 0;
	hideEndButtons();
	battleKind = 0;
	battleActive = 0;
	battleResult = 0;
	scoreStart = totalScore;
	if (levelIndex < campaignLength - 1) {
		levelIndex ++;
		resetLevel();
	} else {
		restartCampaign();
	}
}

function restartCampaign() {
	clearLeftovers();
	rescuedUnits = [];
	deadUnits = [];
	levelCaptives = [];
	generatedLevels = [];
	unitMods = {};
	battleParty = [];
	battleKind = 0;
	battleActive = 0;
	showPick = 0;
	showUpgrade = 0;
	levelIndex = 0;
	lives = 3;
	perfects = 0;
	totalScore = 0;
	scoreStart = 0;
	scoreBanked = 0;
	menu = 1;
	endBtnCur = 0;
	resetLevel();
	gameStart();
}

function startMode(puz) {
	puzzleMode = puz;
	menu = 0;
	resetLevel();
}

function showMenuButtons() {
	const t = menu == 1;
	Y.style.display = N.style.display = "block";
	Y.textContent = t ? "Story" : "Resume";
	N.textContent = t ? "Puzzle" : "Quit";
	Y.onclick = t ? () => startMode(0) : togglePause;
	N.onclick = t ? () => startMode(1) : restartCampaign;
	N.style.opacity = "1";
	syncEndCursor();
}

function togglePause() {
	if (menu == 1 || showPick || showUpgrade || showObjective || showEnd) return;
	if (menu) {
		menu = 0;
		hideEndButtons();
		redraw();
		gameStart();
	} else {
		menu = 2;
		endBtnCur = 0;
		cancelAnimationFrame(gameLoop);
		updateUI();
	}
}

function debugAdvance() {
	if (menu) return;
	if (battleActive) {
		if (showUpgrade || battleResult == 2) {
			afterBattleWin();
			return;
		}
		if (showPick) {
			const need = Math.min(2, livingRescueCount());
			for (let i = 0; i < rescuedUnits.length && battleParty.length < need; i++) {
				if (!isDeadBmp(rescuedUnits[i]) && battleParty.indexOf(rescuedUnits[i]) < 0) {
					battleParty.push(rescuedUnits[i]);
				}
			}
			confirmParty();
		}
		showObjective = 0;
		hideEndButtons();
		for (let i = 0; i < battleUnits.length; i++) {
			if (battleUnits[i].enemy) battleUnits[i].hp = 0;
		}
		battleFinish(2);
		return;
	}
	if (showEnd && state == 2) {
		nextLevel();
		return;
	}
	if (moving) return;
	showObjective = 0;
	hideEndButtons();
	for (let y = 0; y < enemies.length; y++) {
		for (let x = 0; x < enemies[y].length; x++) {
			if (enemies[y][x]) {
				enemies[y][x] = 0;
				if (fillData[y]) fillData[y][x] = 1;
			}
			if (coins[y] && coins[y][x]) {
				coins[y][x] = 0;
				coinsCollected ++;
			}
			const k = rescues[y] && rescues[y][x];
			if (k) {
				rescues[y][x] = 0;
				if (rescueDying[y]) rescueDying[y][x] = 0;
				if (fillData[y]) fillData[y][x] = 1;
				if (rescuedUnits.indexOf(k) < 0) rescuedUnits.push(k);
			}
		}
	}
	enemiesCleared = enemiesTotal;
	countEnemiesAndCoinsLeft();
	revealPlayerTile = 1;
	state = 2;
	if (!goldFlies.length) scheduleEndScreen();
}

function debugClearLevel() {
	if (state != 1 || moving || showObjective) return;
	for (let y = 0; y < boardHeight; y++) {
		for (let x = 0; x < boardWidth; x++) {
			if (enemies[y][x]) {
				enemies[y][x] = 0;
				fillData[y][x] = 1;
			}
		}
	}
	enemiesCleared = enemiesTotal;
	countEnemiesAndCoinsLeft();
	revealPlayerTile = 1;
	state = 2;
	if (!goldFlies.length) scheduleEndScreen();
	redraw();
}

function debugSkipToBattle() {
	if (moving || menu || puzzleMode) return;
	rescuedUnits = [];
	const pool = [];
	for (let i = 0; i < UNITS.length; i++) pool.push(UNITS[i][0]);
	for (let i = 0; i < 4 && pool.length; i++) {
		const j = RNG(pool.length);
		rescuedUnits.push(pool.splice(j, 1)[0]);
	}
	if (!leftoverEnemies) leftoverEnemies = leftTotalThisLevel || 3;
	battleKind = 1;
	startBattle();
}

function blit(src, px, py, s) {
	getCurrentContext().drawImage(src, 0, 0, tileWidth, tileWidth, px, py, s, s);
}

function fitBoard(c, r) {
	const z = Math.max(2, (portrait ? width : height) / 99 - (portrait ? c : r) / 6);
	const k = Math.min(width / (c + z), height / (r + z)) / cellSize || 1;
	const w = width / k | 0, h = height / k | 0;
	if (gameCanvas.width - w | gameCanvas.height - h) {
		gameCanvas.width = w;
		gameCanvas.height = h;
		bgKey = 0;
	}
	gameContext.imageSmoothingEnabled = false;
	boardOffsetX = (w - c * cellSize) / 2 | 0;
	boardOffsetY = (h - r * cellSize) / 2 | 0;
	return cellSize;
}

let bgKey = 0;

function drawBoard() {
	if (!battleActive) {
		rainbowPulse = anyDying() || state == 2;
		scrollRainbow();
	}
	const size = fitBoard(boardWidth, boardHeight);
	const ox = boardOffsetX, oy = boardOffsetY;
	const vw = gameCanvas.width, vh = gameCanvas.height;
	// the canvas is never cleared, so the far backdrop keeps between frames
	const bgNow = ox + oy * 7 + size;
	const bgStale = bgNow != bgKey;
	bgKey = bgNow;
	for (let gy = -oy / size - 1 | 0; gy < (vh - oy) / size + 1 | 0; gy++) {
		for (let gx = -ox / size - 1 | 0; gx < (vw - ox) / size + 1 | 0; gx++) {
			const px = ox + gx * size, py = oy + gy * size;
			if (!isMapTile(gx, gy)) {
				if (!bgStale && (gx < -1 || gy < -1 || gx > boardWidth || gy > boardHeight)) continue;
				drawPaletted(backgroundsBitmaps[0], 1, px, py, size, size, gameContext);
				let m = 0;
				for (let i = 4; i--;) if (isMapTile(gx + ROOK[i][0], gy + ROOK[i][1])) m |= 1 << i;
				if (m) blit(backgroundsBitmaps[m], px, py, size);
				continue;
			}
			if (battleActive) {
				blit(backgroundsBitmaps[0], px, py, size);
				continue;
			}
			const onPlayer = gx == player.x && gy == player.y;
			let tipOnly = 0;
			if (onPlayer && pathStep[gy][gx] && !revealPlayerTile && !(showEnd && state == 3)) {
				let visits = 0;
				for (let i = 0; i < pathTrail.length; i++) {
					if (pathTrail[i][0] == gx && pathTrail[i][1] == gy) visits ++;
				}
				const tip = pathTrail[pathTrail.length - 1];
				tipOnly = tip[0] == gx && tip[1] == gy && visits <= 1;
			}
			if (fillData[gy][gx] || (pathStep[gy][gx] && !tipOnly)) drawPurifiedTile(gx, gy);
			else blit(backgroundsBitmaps[0], px, py, size);
			if (clouds[gy][gx]) blit(objectBitmaps[2], px, py, size);
			if (exits[gy][gx]) {
				if (!puzzleMoveAt(gx, gy) || isPrevPath(gx, gy) || (time / 1000 | 0) % 3) {
					drawSparkle(px, py, size, (time / 180 | 0) + gx + gy);
				}
			} else if (coins[gy][gx]) {
				if (!puzzleMoveAt(gx, gy) || isPrevPath(gx, gy) || (time / 1000 | 0) % 3) {
					const cs = size * 0.8;
					blit(objectBitmaps[1], px + (size - cs) / 2, py + size - cs - size * 0.06, cs);
				}
			}
		}
	}

	if (battleActive) {
		const hero = (battleControl || battleSelect || 0).hero;
		for (let i = 0; i < battleTiles.length; i++) {
			const bt = battleTiles[i];
			const aimed = battleAim && battleHinted(bt.x, bt.y);
			const hot = aimed || (bt.live && hoverTile && hoverTile.x == bt.x && hoverTile.y == bt.y);
			gameContext.fillStyle = "#" + (bt.kind ? "f45" : hero ? "fe8" : "9f8") + (hot ? "c" : bt.live ? "8" : "4");
			gameContext.fillRect(ox + bt.x * size, oy + bt.y * size, size, size);
			if (hot && (bt.kind || aimed)) outlineUnit(bt, size, bt.kind ? "#f89" : "#fe8", 0.06, 2);
		}
		if (battleSelect && battleSelect != battleControl && battleSelect.hp > 0) {
			outlineUnit(battleSelect, size, battleSelect.enemy ? "#f89" : "#fe6", 0.05, 2);
		}
	} else drawFlowingPath();

	for (let y = 0; y < boardHeight; y++) {
		if (battleActive) {
			for (let i = 0; i < battleUnits.length; i++) {
				const u = battleUnits[i];
				if ((u.hp > 0 || u.shake) && (u.y + u.offsetY | 0) == y) u.draw(size);
			}
		} else {
			for (let x = 0; x < boardWidth; x++) {
				const px = ox + x * size, py = oy + y * size;
				if (rescues[y][x]) {
					drawUnitIcon(rescues[y][x], px + size / 2, py + size / 2, size * 0.9);
					if (!rescueDying[y][x]) blit(objectBitmaps[5], px, py, size);
				}
				if (enemies[y][x]) {
					const k = enemies[y][x];
					const hop = (time + x * 90 + y * 180) / (leprechaunDying(k) ? 180 : 720) & 1;
					drawUnitIcon({bgr: 2, palette: getEnemyPalette(0, leprechaunType(k))},
						px + size / 2, py + size / 2 - hop * size / 8,
						size / tileWidth * unitBitmaps[2].width * unitScale);
				}
			}
			if ((player.y + player.offsetY | 0) == y) player.draw();
		}
	}

	if (!battleActive) {
		drawMoveArrows(size);
		drawGoldFlies(size);
	}
}
