let boardWidth;
let boardHeight;
let cellSize = 1;
let zoom = 1;
let boardOffsetX = 0;
let boardOffsetY = 0;
//let portrait;
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
let fillCharges = 3;
let fillStart = 3;
let moveLog = []; // flushed enemy cells per forward move (for undo)
let player;
let moving = 0;
let gameLoop;
let time = 0;
let pathCount = 0;
let hiscore = 0;

let state = 1; // 1 play, 2 win, 3 lose
let showEnd = 0;
let showObjective = 0;
let skipObjective = 0;
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
let unitMods = {}; // name -> [hp, att, move steps taken, attack steps taken]
const UNITS = [
	// name,     hp,dm,mv,at,bm[pa,rn,rc] - move/atk: 0:* 1:+ 2:x 3:knight
	["Unicorn",  5, 2, 3, 1, 0],
	["Corwin",   9, 2, 0, 3, 9, 1, 0],
	["Merlin",   5, 2, 0, 1, 5, 2],
	["Benedict", 10,3, 2, 0, 8, 1, 1, 0],
	["Fiona",    4, 2, 0, 2, 6],
	["Random",   8, 2, 1, 1, 5],
	["Bleys",    7, 2, 1, 1, 8],
	["Julian",   7, 2, 2, 0, 5, 1],
	["Caine",    9, 2, 2, 2, 9],
	["Gerard",   12,3, 1, 1, 7, 1, 1, 0],
	
	/*["Eric",     11,2, 1, 0, 7],
	["Flora",    4, 1, 1, 1, 6, 1, 0],
	["Martin",   5, 2, 1, 0, 7, 2, 0],
	["Deirdre",  3, 1, 0, 1, 6, 2, 1, 0],

	["Brand",    8, 2, 9, 2, 8, 2, 1, 0]*/

	// Rest of Amberites (except Oberon and Dworkin)
	
	//["Flora",  4, 1, 0, 1, 7, 2, 0]
	//["Deirdre",3, 1, 0, 1, 7, 2, 0]
	//["Martin", 3, 1, 0, 1, 7, 2, 0]
	
	// From Chaos
	//["Jasra",    3, 1, 0, 1, 7, 2, 0]
	//["Borel",    3, 1, 0, 1, 7, 2, 0]
	//["Jurt",    3, 1, 0, 1, 7, 2, 0]
	//["Mandor",    3, 1, 0, 1, 7, 2, 0]
	//["Dara",    3, 1, 0, 1, 7, 2, 0]

	//["Luke",    3, 1, 0, 1, 7, 2, 0]
	//["Ghostwheel",    3, 1, 0, 1, 7, 2, 0]
];

const EnemyPalettes = [
	["d72", "3d2", "d32", "eb2"],
	["396", "bd2", "382", "bce"],
	["456" ,"ce2", "382", "bde"]
]

const UP = [0, -1];
const RIGHT = [1, 0];
const DOWN = [0, 1];
const LEFT = [-1, 0];

const ROOK = [UP, RIGHT, DOWN, LEFT];
// 4 rook dirs, 4 bishop dirs, 8 knight leaps - a unit's rays are a mask over these
const DIRS = [...ROOK, [1, 1], [1, -1], [-1, 1], [-1, -1], [1, -2], [-1, -2], [2, -1], [-2, -1], [1, 2], [-1, 2], [2, 1], [-2, 1]];
// move/atk type -> how far rook, bishop and knight reach: 0:* 1:+ 2:x 3:knight
const RAYBASE = [[1, 1, 0], [1, 0, 0], [0, 1, 0], [0, 0, 1]];

// [dx, dy, steps] per live direction, so rook and bishop can reach different distances
function rayList(g) {
	const out = [];
	for (let i = 0; i < 16; i++) {
		const n = g[i < 4 ? 0 : i < 8 ? 1 : 2];
		if (n) out.push([DIRS[i][0], DIRS[i][1], n]);
	}
	return out;
}

// Each upgrade lengthens the shorter ray, giving R1 -> B1 -> R2 -> B2 ... The third
// attack step grants the knight leap instead, unless the unit already leaps.
function growRay(t, len, n, atk) {
	const base = RAYBASE[t] || RAYBASE[0];
	let r = base[0] * len;
	let b = base[1] * len;
	let k = base[2];
	for (let i = 0; i < n; i++) {
		if (atk && i == 2 && !k) k = 1;
		else if (b < r) b ++;
		else r ++;
	}
	return [r, b, k];
}

const tileWidth = 6;
const unitScale = 0.665;

const campaignLength = 63;

function inBounds(x, y) {
	return x >= 0 && y >= 0 && x < boardWidth && y < boardHeight;
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
	fillCharges = fillStart;
	leftTotalThisLevel = 0;
	leftUnitsThisLevel = [0, 0, 0];
	leftGoldThisLevel = 0;
	leftUnitConverted = 0;
	goldFlies = [];
	revealPlayerTile = 0;
	state = 1;
	showEnd = 0;
	battleResult = 0;
	showObjective = skipObjective ? 0 : 1;
	skipObjective = 0;
	moving = 0;
	hideEndButtons();

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
			const c = levelData[y].charAt(x);
			enemies[y][x] = c == "1" ? (levelIndex >= 4 && Math.random() < 0.5 ? 2 : 1) : 0;
			obstacles[y][x] = c == "3" ? 1 : 0;
			coins[y][x] = c == "4" ? 1 : 0;
			clouds[y][x] = c == "7" ? 1 : 0;
			exits[y][x] = c == "8" ? 1 : 0;
			rescues[y][x] = 0;
			if (c >= "A" && c <= "Z") {
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
			if (c == "1") enemiesTotal ++;
			pathData[y][x] = 0;
			pathStep[y][x] = 0;
			fillData[y][x] = 0;
			if (c == "2") {
				startX = x;
				startY = y;
			}
		}
	}

	player = new Player(startX, startY);
	placeStartPath(startX, startY);
	buildRainbowBackdrop();
	if (showObjective) showObjectiveButtons();
}

function isPassable(x, y, dx, dy) {
	if (!inBounds(x, y) || enemies[y][x] || obstacles[y][x] || fillData[y][x] == 1) return 0;
	if (rescues[y][x] && !rescueDying[y][x]) return 0;
	const cross = clouds[y][x] || fillData[y][x] == 2;
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

function useSparkAbility() {
	if (battleActive || moving || showEnd || showObjective || state != 1) return;
	if (fillCharges < 1) return;
	const x = player.x;
	const y = player.y;
	if (!inBounds(x, y) || fillData[y][x]) return;
	fillData[y][x] = 2;
	fillCharges --;
	checkCaptures();
	redraw();
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

function countAliveLeprechaunsOfKind(k) {
	let n = 0;
	for (let y = 0; y < enemies.length; y++) {
		for (let x = 0; x < enemies[y].length; x++) {
			if (enemies[y][x] == k) n ++;
		}
	}
	return n;
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
		TweenFX.to(fly, 60, { x: l[0], y: l[1] }, drawBoard, () => {
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
	TweenFX.to({}, frames, {}, ()=>{}, callback);
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
	rainbowDone = 0;
	rainbowAnim = 0;
	rainbowWait = 0;
	paintRainbow(0);
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
			obstacles[y][x] = 0;
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
	return [x, y, 0, -1];
}

function getCurrentContext() {
	return iconContext || gameContext;
}

function drawSparkle(x, y, size, frame) {
	getCurrentContext().drawImage(objectBitmaps[3 + (frame & 1)], 0, 0, tileWidth, tileWidth, x, y, size, size);
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
	return pool[Math.random() * pool.length | 0];
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
	//if (typeof data == "string") data = getUnitDefinition(data);
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

function createEnemy(unitType, x, y, l) {
	l = l ? l > 4 ? 4 : l : 1;
	return makeUnit([
		,
		// unitType: 1: leprechaun, 2: hydra, 3: serpent
		// HP:
		unitType ? unitType > 1 ? 6 + l * 4 : l * 3
			: l + 1,
		// DMG
		unitType ? (1 + l) * 2
			: l < 3 ? 1 : 2,
		+!unitType,
		2 * !unitType,
		2 + unitType,
		getEnemyPalette(unitType, l),
		1 + (unitType > 1),
		1 + (!unitType && l > 3)
	], x, y, unitType ? 4 : 3);
}

function collectRescue(x, y) {
	const k = rescues[y][x];
	if (!k || !rescueDying[y][x]) return 0;
	rescues[y][x] = 0;
	rescueDying[y][x] = 0;
	fillData[y][x] = 1;
	obstacles[y][x] = 1; // the emptied cage stays put, and blocks in the battle too
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

function groundBmp() {
	return backgroundsBitmaps[worldNumber() % backgroundsBitmaps.length];
}

function isPerfect() {
	if (leftTotalThisLevel) return 0;
	if (stageCaptive && rescuedUnits.indexOf(stageCaptive) < 0) return 0;
	return 1;
}

function stageScore() {
	return enemiesCleared * 100 + coinsCollected * 50 + (state == 2 && isPerfect() ? 1000 : 0);
}

function currentScore() {
	return totalScore + (scoreBanked ? 0 : stageScore());
}

function calcLevelScore() {
	levelScore = stageScore();
	return levelScore;
}

function scheduleEndScreen() {
	waitDelay(()=> {
		calcLevelScore();
		if (state == 2) {
			fillCharges ++;
			if (!scoreBanked) {
				totalScore += levelScore;
				scoreBanked = 1;
			}
		}

		showEnd = 1;
		endBtnCur = 1; // start on NEXT; clamps back to RETRY when it is the only one
		showEndButtons();
		redraw();
	});
}

function drawLeprechaunSprite(px, py, size, bounceSpeed, x, y, kind) {
	const bmp = unitBitmaps[2];
	const scale = size / tileWidth * unitScale;
	const dw = bmp.width * scale;
	const dh = bmp.height * scale;
	const bounce = bounceSpeed && Math.sin(time * bounceSpeed + x * 1.7 + y * 2.3) > 0 ? scale : 0;
	drawPaletted(
		bmp, getEnemyPalette(0, kind || 1),
		px + (size - dw) / 2, py + (size - dh) / 2 - bounce, dw, dh, getCurrentContext()
	);
}

function drawUnitIcon(src, cx, cy, size, pal) {
	const d = !src || src.bgr != null ? src : getUnitDefinition(src);
	const bmp = unitBitmaps[d && d.bgr != null ? d.bgr : d ? d[5] : 0];
	if (pal == null) pal = d && (d.palette != null ? d.palette : d.pal != null ? d.pal : d[6]);
	const scale = size / Math.max(bmp.width, bmp.height);
	const dw = bmp.width * scale;
	const dh = bmp.height * scale;
	if (typeof pal == "string" ? pal : pal != null && bmp.pal) {
		drawPaletted(bmp, pal, cx - dw / 2, cy - dh / 2, dw, dh, getCurrentContext());
	} else getCurrentContext().drawImage(bmp, 0, 0, bmp.width, bmp.height, cx - dw / 2, cy - dh / 2, dw, dh);
}

function drawMoveArrows(size) {
	if (moving || state != 1 || showObjective || showEnd) return;
	const showGold = (time / 1000 | 0) % 2;
	for (let i = 0; i < 4; i++) {
		const nx = player.x + ROOK[i][0];
		const ny = player.y + ROOK[i][1];
		if (!puzzleMoveAt(nx, ny) || isPrevPath(nx, ny)) continue;
		if ((coins[ny][nx] || exits[ny][nx]) && showGold) continue;
		const bmp = objectBitmaps[6 + i];
		const px = boardOffsetX + nx * size;
		const py = boardOffsetY + ny * size;
		gameContext.drawImage(bmp, 0, 0, bmp.width, bmp.height, px, py, size, size);
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
		gameContext.drawImage(objectBitmaps[1], 0, 0, tileWidth, tileWidth, px, py, cs, cs);
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
	const on = showUpgrade ? upgradeCurUnit >= upgradeRows().length : showEnd;
	for (let i = 0; i < a.length; i++) a[i].className = on && i == endBtnCur ? "cur" : "";
}

function moveEndCursor(dx) {
	const n = endButtons().length;
	if (!n || !dx) return;
	endBtnCur = (endBtnCur + dx + n) % n;
	redraw();
}

function activateEndButton() {
	const b = endButtons()[endBtnCur];
	if (b) b.onclick();
}

function showBattleTurnButton() {
	const on = !battlePhase && !animating && !thinking;
	Y.style.display = "none";
	N.style.display = "block";
	N.textContent = "END";
	N.style.opacity = on ? "1" : "0.35";
	N.onclick = battleEndTurn;
	syncEndCursor();
}

function showEndButtons() {
	Y.style.display = "block";
	Y.onclick = () => {
		if (battleActive) resetBattle();
		else {
			skipObjective = 1;
			resetLevel();
		}
	};
	N.style.opacity = "1";
	N.onclick = battleActive ? afterBattleWin : nextLevel;
	N.textContent = battleActive
		? (levelIndex < campaignLength - 1 ? "NEXT LEVEL" : "REPLAY")
		: (levelIndex % 3 == 2 ? "BATTLE" : "NEXT LEVEL");
	N.style.display = state == 2 ? "block" : "none";
	syncEndCursor();
}

function showObjectiveButtons() {
	Y.style.display = "none";
	N.textContent = "START";
	N.onclick = showPick ? confirmParty : dismissObjective;
	N.style.display = "block";
	N.style.opacity = "1";
	syncEndCursor();
	syncPickButton();
}

function syncPickButton() {
	if (!showPick) return;
	const need = Math.min(2, livingRescueCount());
	N.style.opacity = battleParty.length >= need ? "1" : "0.35";
}

function dismissObjective() {
	if (!showObjective) return;
	showObjective = 0;
	hideEndButtons();
	redraw();
}

function nextLevel() {
	fillStart = fillCharges;
	scoreStart = totalScore;
	leftoverEnemies += leftTotalThisLevel;
	for (let i = 0; i < 3; i++) leftoverKinds[i] += leftUnitsThisLevel[i];
	leftTotalThisLevel = 0;
	leftUnitsThisLevel = [0, 0, 0];
	if (levelIndex % 3 == 2) {
		battleKind = isBossBattle() ? 2 : 1;
		startBattle();
	} else {
		levelIndex ++;
		resetLevel();
	}
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
	fillCharges = 3;
	fillStart = 3;
	totalScore = 0;
	scoreStart = 0;
	scoreBanked = 0;
	resetLevel();
}

function debugAdvance() {
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
	if (moving) return;
	rescuedUnits = [];
	const pool = [];
	for (let i = 0; i < UNITS.length; i++) pool.push(UNITS[i][0]);
	for (let i = 0; i < 4 && pool.length; i++) {
		const j = Math.random() * pool.length | 0;
		rescuedUnits.push(pool.splice(j, 1)[0]);
	}
	if (!leftoverEnemies) leftoverEnemies = leftTotalThisLevel || 3;
	battleKind = 1;
	startBattle();
}

function fitBoard(cols, rows) {
	const size = Math.min(width / (cols + zoom), height / (rows + zoom));
	cellSize = size;
	boardOffsetX = (width - cols * size) / 2;
	boardOffsetY = (height - rows * size) / 2;
	return size;
}

function drawEdgeTiles(size, bmp) {
	const ox = boardOffsetX;
	const oy = boardOffsetY;
	const gx0 = Math.floor(-ox / size);
	const gy0 = Math.floor(-oy / size);
	const gx1 = Math.ceil((width - ox) / size);
	const gy1 = Math.ceil((height - oy) / size);
	const rock = objectBitmaps[0];
	for (let gy = gy0; gy < gy1; gy++) {
		for (let gx = gx0; gx < gx1; gx++) {
			if (inBounds(gx, gy)) continue;
			const px = ox + gx * size;
			const py = oy + gy * size;
			gameContext.drawImage(bmp, 0, 0, tileWidth, tileWidth, px, py, size, size);
			const rockHere = ((gx * 13 + gy * 7 + levelIndex * 3) % 5 + 5) % 5;
			if (rockHere) {
				gameContext.drawImage(rock, 0, 0, tileWidth, tileWidth, px, py, size, size);
			} else {
				const period = 1400 + ((gx * 19 + gy * 11) % 10 + 10) % 10 * 180;
				const phase = gx * 430 + gy * 710;
				drawPaletted(objectBitmaps[3 + ((time + phase) / period & 1)], "543", px, py, size, size, gameContext);
			}
		}
	}
}

function drawBoard() {
	if (battleActive) {
		drawBattle();
		return;
	}
	gameContext.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
	const size = fitBoard(boardWidth, boardHeight);
	drawEdgeTiles(size, groundBmp());
	rainbowPulse = anyDying();
	scrollRainbow();

	for (let y = 0; y < boardHeight; y++) {
		for (let x = 0; x < boardWidth; x++) {
			const px = boardOffsetX + x * size;
			const py = boardOffsetY + y * size;

			const onPlayer = x == player.x && y == player.y;
			// Hide rainbow under unicorn (on cross, only the second time)
			let tipOnly = 0;
			if (onPlayer && pathStep[y][x] && !revealPlayerTile && !(showEnd && state == 3)) {
				let visits = 0;
				for (let i = 0; i < pathTrail.length; i++) {
					if (pathTrail[i][0] == x && pathTrail[i][1] == y) visits ++;
				}
				const tip = pathTrail[pathTrail.length - 1];
				tipOnly = tip[0] == x && tip[1] == y && visits <= 1;
			}
			const purified = fillData[y][x] || (pathStep[y][x] && !tipOnly);
			if (purified) {
				drawPurifiedTile(x, y);
			} else {
				gameContext.drawImage(
					groundBmp(),
					0, 0, tileWidth, tileWidth, px, py, size, size
				);
			}
			if (clouds[y][x]) {
				gameContext.drawImage(
					objectBitmaps[2],
					0, 0, tileWidth, tileWidth, px, py, size, size
				);
			}

			if (obstacles[y][x]) {
				gameContext.drawImage(objectBitmaps[0], 0, 0, tileWidth, tileWidth, px, py, size, size);
			} else if (exits[y][x]) {
				if (!puzzleMoveAt(x, y) || isPrevPath(x, y) || (time / 1000 | 0) % 2) {
					drawSparkle(px, py, size, (time / 180 | 0) + x + y);
				}
			} else if (coins[y][x]) {
				if (!puzzleMoveAt(x, y) || isPrevPath(x, y) || (time / 1000 | 0) % 2) {
					const cs = size * 0.8;
					const cox = px + (size - cs) / 2;
					const coy = py + size - cs - size * 0.06;
					gameContext.drawImage(objectBitmaps[1], 0, 0, tileWidth, tileWidth, cox, coy, cs, cs);
				}
			} else if (rescues[y][x]) {
				if (!rescueDying[y][x]) {
					gameContext.drawImage(objectBitmaps[0], 0, 0, tileWidth, tileWidth, px, py, size, size);
				}
				const bounce = rescueDying[y][x] && Math.sin(time * 0.014 + x * 1.7 + y * 2.3) > 0 ? size * 0.08 : 0;
				drawUnitIcon(rescues[y][x], px + size / 2, py + size / 2 - bounce, size * 0.9);
				if (!rescueDying[y][x]) {
					gameContext.drawImage(objectBitmaps[5], 0, 0, tileWidth, tileWidth, px, py, size, size);
				}
			}

			if (enemies[y][x]) {
				drawLeprechaunSprite(
					px, py, size,
					leprechaunDying(enemies[y][x]) ? 0.014 : 0.004,
					x, y, leprechaunType(enemies[y][x])
				);
			}
		}
	}

	drawFlowingPath();
	drawFillNiches();
	drawMoveArrows(size);
	drawGoldFlies(size);

	player.resize();
	player.draw();
}
