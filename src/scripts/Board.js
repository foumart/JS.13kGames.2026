let boardWidth;
let boardHeight;
let cellSize = 1;
let boardOffsetX = 0;
let boardOffsetY = 0;
let portrait;

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
let endBtnWrap = null;
let endNextBtn = null;
let endRetryBtn = null;

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
let unitMods = {}; // name -> [hp, att, range, reach]
const UNITS = [
	// name,     hp,dm,mv,at,bm[pa,rn,rc] - move/atk: 0:* 1:+ 2:x 3:knight
	["Unicorn",  5, 2, 3, 1, 0],
	["Corwin",   9, 2, 0, 3, 9, 1, 0],
	["Merlin",   5, 3, 0, 1, 5],
	["Benedict", 10,3, 2, 0, 8, 1, 1, 0],
	["Fiona",    3, 2, 0, 2, 6],
	["Random",   8, 2, 1, 1, 7],
	["Bleys",    7, 2, 1, 1, 8],
	["Julian",   7, 2, 2, 0, 6, 1],
	["Caine",    9, 2, 2, 2, 9],
	["Gerard",   12,3, 1, 1, 7, 1, 1, 0]

	//["Brand",  20,5, 9, 2, 8, 1]

	// Rest of Amberites (except Oberon and Dworkin)
	//["Eric",   10,2, 0, 1, 7, 2, 0],
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
	for (let y = 0; y < boardHeight; y++) {
		for (let x = 0; x < boardWidth; x++) {
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
		TweenFX.to(fly, 60, { x: l[0], y: l[1] }, ()=>{}, () => {
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
				const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
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
		const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
		for (let d = 0; d < 4; d++) {
			const nx = x + dirs[d][0];
			const ny = y + dirs[d][1];
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

function drawSparkle(x, y, s, n) {
	gameContext.drawImage(objectBitmaps[3 + (n & 1)], 0, 0, tileWidth, tileWidth, x, y, s, s);
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
	if (typeof data == "string") data = getUnitDefinition(data);
	const unit = new Unit(data, x, y, type);
	if (!unit.enemy) {
		const mod = allyMod(data[0]);
		unit.hpMax += mod[0];
		unit.hp = unit.hpMax;
		unit.dmg += mod[1];
		if (!unit.lockRange) unit.range += mod[2];
		if (!unit.lockReach) unit.reach += mod[3];
	}
	return unit;
}

function makeFoe(kind, x, y, l) {
	l = l ? l > 4 ? 4 : l : 1;
	return makeUnit([
		,
		kind ? kind > 1 ? 6 + l * 4 : l * 3 : l,
		kind ? 1 + l : (1 + l) * 2,
		+!kind,
		2 * !kind,
		2 + kind,
		l - 1,
		1 + (kind > 1),
		1 + (!kind && l > 3)
	], x, y, kind ? 4 : 3);
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
		bmp, (kind || 1) - 1,
		px + (size - dw) / 2, py + (size - dh) / 2 - bounce, dw, dh, gameContext
	);
}

function drawUnitIcon(src, cx, cy, size, pal) {
	const d = !src || src.bgr != null ? src : getUnitDefinition(src);
	const bmp = unitBitmaps[d && d.bgr != null ? d.bgr : d ? d[5] : 0];
	pal = pal || (d && (d.pal || d[6]));
	const scale = size / Math.max(bmp.width, bmp.height);
	const dw = bmp.width * scale;
	const dh = bmp.height * scale;
	if (pal) drawPaletted(bmp, pal, cx - dw / 2, cy - dh / 2, dw, dh, gameContext);
	else gameContext.drawImage(bmp, 0, 0, bmp.width, bmp.height, cx - dw / 2, cy - dh / 2, dw, dh);
}

function drawMoveArrows(size) {
	if (moving || state != 1 || showObjective || showEnd) return;
	const dirs = [[0, -1], [1, 0], [0, 1], [-1, 0]];
	const showGold = (time / 1000 | 0) % 2;
	for (let i = 0; i < 4; i++) {
		const dx = dirs[i][0];
		const dy = dirs[i][1];
		const nx = player.x + dx;
		const ny = player.y + dy;
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

function drawObjectiveScreen() {
	if (!showObjective) return;
	const size = cellSize || Math.min(width, height) / 12;
	const fs = Math.max(18, size /2);
	const icon = Math.max(32, size * 0.9);
	const cx = width / 2;
	const cy = height / 2;
	gameContext.fillStyle = "#103c";
	gameContext.fillRect(0, 0, width, height);
	gameContext.fillStyle = "#fff";
	//gameContext.textAlign = "center";
	//gameContext.textBaseline = "middle";
	if (battleActive) {
		txt(battleTitle(), cx, cy - fs * 1.7, fs);
		txt("Destroy all enemies", cx, cy + fs * 0.7, fs * 0.7);
	} else {
		const lh = fs * 2;
		const ic = icon * 1.2;
		let y = height / 4;
		txt("World: " + worldNumber() + "-" + shadowNumber(), cx, y, fs);
		txt("Stage: " + stageNumber(), cx, y + lh, fs);
		if (stageCaptive) drawObjectiveParts(cx, y*2, fs, ic, [
			{ text: "Rescue " }, { bmp: stageCaptive }, { text: stageCaptive }
		]);
		drawObjectiveParts(cx + ic * 0.4, y*2 + lh * (stageCaptive ? 1.35 : 0.55), fs, ic, [
			{ text: "Proceed to " }, { sparkle: 1 }
		]);
	}
}

function drawObjectiveParts(cx, cy, fs, icon, parts) {
	const gap = icon * 0.2;
	let total = 0;
	const widths = [];
	for (let i = 0; i < parts.length; i++) {
		const w = parts[i].text ? txt(parts[i].text, null, 0, fs) : icon + gap;
		widths.push(w);
		total += w;
	}
	let x = cx - total / 2;
	gameContext.fillStyle = "#fff";
	//gameContext.textAlign = "left";
	//gameContext.textBaseline = "middle";
	for (let i = 0; i < parts.length; i++) {
		const p = parts[i];
		if (p.text) {
			txt(p.text, x, cy, fs);
		} else if (p.sparkle) {
			drawSparkle(x + gap / 2, cy - icon / 2, icon, time / 180);
		} else {
			drawUnitIcon(p.bmp, x + (icon + gap) / 2, cy, icon);
		}
		x += widths[i];
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
	if (endBtnWrap) endBtnWrap.style.display = "none";
}

function ensureEndButtons() {
	if (endBtnWrap) return;
	endBtnWrap = document.createElement("div");
	endBtnWrap.id = "btnWrap";
	endRetryBtn = document.createElement("button");
	endRetryBtn.id = "retryBtn";
	endRetryBtn.textContent = "RETRY";
	endBtnWrap.appendChild(endRetryBtn);
	endNextBtn = document.createElement("button");
	endNextBtn.id = "nextBtn";
	endBtnWrap.appendChild(endNextBtn);
	mainDiv.appendChild(endBtnWrap);
}

function showEndButtons() {
	ensureEndButtons();
	endRetryBtn.style.display = "block";
	endRetryBtn.onclick = () => {
		if (battleActive) resetBattle();
		else {
			skipObjective = 1;
			resetLevel();
		}
	};
	endNextBtn.style.opacity = "1";
	endNextBtn.onclick = battleActive ? afterBattleWin : nextLevel;
	endNextBtn.textContent = battleActive
		? (levelIndex < campaignLength - 1 ? "NEXT LEVEL" : "REPLAY")
		: (levelIndex % 3 == 2 ? "BATTLE" : "NEXT LEVEL");
	endNextBtn.style.display = state == 2 ? "block" : "none";
	endBtnWrap.style.display = "flex";
}

function showObjectiveButtons() {
	ensureEndButtons();
	endRetryBtn.style.display = "none";
	endNextBtn.textContent = "START";
	endNextBtn.onclick = showPick ? confirmParty : dismissObjective;
	endNextBtn.style.display = "block";
	endBtnWrap.style.display = "flex";
	syncPickButton();
}

function syncPickButton() {
	if (!showPick || !endNextBtn) return;
	const need = Math.min(2, livingRescueCount());
	endNextBtn.style.opacity = battleParty.length >= need ? "1" : "0.35";
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

function afterBattleWin() {
	applyUpgradePicks();
	markHeroesDead();
	leftoverEnemies = 0;
	leftTotalThisLevel = 0;
	leftoverKinds = [0, 0, 0];
	leftUnitsThisLevel = [0, 0, 0];
	leftGoldThisLevel = 0;
	leftUnitConverted = 0;
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
	leftoverEnemies = 0;
	leftTotalThisLevel = 0;
	leftoverKinds = [0, 0, 0];
	leftUnitsThisLevel = [0, 0, 0];
	leftGoldThisLevel = 0;
	leftUnitConverted = 0;
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
	for (let y = 0; y < boardHeight; y++) {
		for (let x = 0; x < boardWidth; x++) {
			if (enemies[y][x]) {
				enemies[y][x] = 0;
				fillData[y][x] = 1;
			}
			if (coins[y][x]) {
				coins[y][x] = 0;
				coinsCollected ++;
			}
			const k = rescues[y][x];
			if (k) {
				rescues[y][x] = 0;
				rescueDying[y][x] = 0;
				fillData[y][x] = 1;
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
	drawBoard();
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
	const size = Math.min(width / (cols + 1), height / (rows + 1));
	cellSize = size;
	boardOffsetX = (width - cols * size) / 2;
	boardOffsetY = (height - rows * size) / 2;
	return size;
}

function drawEdgeTiles(size, bmp) {
	const ox = boardOffsetX;
	const oy = boardOffsetY;
	const cols = battleActive ? battleWidth : boardWidth;
	const rows = battleActive ? battleHeight : boardHeight;
	const gx0 = Math.floor(-ox / size);
	const gy0 = Math.floor(-oy / size);
	const gx1 = Math.ceil((width - ox) / size);
	const gy1 = Math.ceil((height - oy) / size);
	const rock = objectBitmaps[0];
	for (let gy = gy0; gy < gy1; gy++) {
		for (let gx = gx0; gx < gx1; gx++) {
			if (gx >= 0 && gx < cols && gy >= 0 && gy < rows) continue;
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
	portrait = height > width;
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

	if (!showObjective && !showEnd) drawUI(size);

	if (showEnd && state > 1) {
		gameContext.fillStyle = state == 2 ? "#103c" : "#0009";
		gameContext.fillRect(0, 0, gameCanvas.width, gameCanvas.height);
		gameContext.fillStyle = "#fff";
		//gameContext.textAlign = "center";
		//gameContext.textBaseline = "middle";
		const cx = gameCanvas.width / 2;
		const cy = gameCanvas.height / 2;
		const fs = Math.max(16, size * 0.55 | 0);
		txt(state == 2 ? "STAGE CLEAR!" : "STUCK - R", cx, cy - fs * 2.2, fs);

		if (state == 2) {
			const icon = Math.max(28, size * 0.7 | 0);
			if (isPerfect()) txt("Perfect!", cx, cy - fs * 0.9, fs * 0.72 | 0);

			const by = cy + fs * 0.55;
			const ss = icon;
			const psz = fs * 0.85 | 0;
			const pw = txt("+1", null, 0, psz);
			const n = rescuedUnits.length;
			const gap = icon * 1.4;
			let ix = cx - (ss + 6 + pw + n * gap) / 2;
			drawSparkle(ix, by - ss / 2, ss, time / 180);
			ix += ss + 6;
			gameContext.fillStyle = "#fff";
			//gameContext.textAlign = "left";
			txt("+1", ix, by, psz);
			ix += pw + gap * 0.35;
			for (let i = 0; i < n; i++) {
				ix += gap;
				drawUnitIcon(rescuedUnits[i], ix, by, icon);
			}
		} else {
			txt("SCORE " + currentScore() + "  MOVES " + moveCount, cx, cy - fs * 0.4, fs * 0.7 | 0);
		}
	}

	drawObjectiveScreen();
	if (showObjective || showEnd) drawUI(size);
}
