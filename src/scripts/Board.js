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
let castle = [];
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
let pathCount = 0;
let state = 1; // 1 play, 2 win, 3 lose
let showEnd = 0;
let showObjective = 0;
let skipObjective = 0;
let endTimer = 0;
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
let clearTimer = 0;
let endBtnWrap = null;
let endNextBtn = null;
let endRetryBtn = null;

let leftoverEnemies = 0;
let leftTotalThisLevel = 0;
let leftoverKinds = [0, 0, 0];
let leftUnitsThisLevel = [0, 0, 0];
let leftGoldThisLevel = 0;
let leftUnitConverted = 0;
const leprechaunPalettes = ["3a6", "542", "c98", "069"]; // blue, green, red, pink
let rescuedUnits = [];
let deadUnits = [];
let levelCaptives = [];
let rescueDying = [];
let unitMods = {}; // bmp -> [hp, att, range, reach]
let uniMods = [0, 0, 0, 0]; // hp, att, range, reach
const rescueBmps = [11, 3, 12, 5, 6, 7, 8, 9, 13]; // Corwin, Merlin, Benedict, Fiona, Random, Bleys, Julian, Caine, Gerard
const unitNames = {11:"Corwin",3:"Merlin",12:"Benedict",5:"Fiona",6:"Random",7:"Bleys",8:"Julian",9:"Caine",13:"Gerard"};
const unitSprites = {11:9,12:8,13:6}; // Corwin←Caine, Benedict←Julian, Gerard←Random
const unitPalettes = {11:"2b0",12:"b23",13:"a3c"};

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
	castle = [];
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
	revealPlayerTile = 0;
	state = 1;
	showEnd = 0;
	showObjective = skipObjective ? 0 : 1;
	skipObjective = 0;
	moving = 0;
	if (endTimer) {
		clearTimeout(endTimer);
		endTimer = 0;
	}
	if (clearTimer) {
		clearTimeout(clearTimer);
		clearTimer = 0;
	}
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
		castle[y] = [];
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
			castle[y][x] = c == "9" ? 1 : 0;
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
	if (!inBounds(x, y) || enemies[y][x] || obstacles[y][x] || castle[y][x] || fillData[y][x]) return 0;
	if (rescues[y][x] && !rescueDying[y][x]) return 0;
	const c = clouds[y][x];
	if (pathStep[y][x]) {
		if (c) {
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

function fillNiche() {
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

function lepKind(v) {
	return v > 3 ? v - 3 : v;
}

function lepDying(v) {
	return v > 3;
}

function lepAlive(v) {
	return v > 0 && v < 4;
}

function kindAlive(k) {
	let n = 0;
	for (let y = 0; y < boardHeight; y++) {
		for (let x = 0; x < boardWidth; x++) {
			if (enemies[y][x] == k) n ++;
		}
	}
	return n;
}

function countLeftovers() {
	leftGoldThisLevel = coins.flat().reduce((n, c) => n + c, 0);
	leftUnitConverted = 0;
	let gold = leftGoldThisLevel;
	for (let y = 0; y < boardHeight; y++) {
		for (let x = 0; x < boardWidth; x++) {
			if (enemies[y][x] != 1 || !gold) continue;
			enemies[y][x] = 3;
			leftUnitConverted ++;
			gold --;
		}
	}
	leftTotalThisLevel = 0;
	leftUnitsThisLevel = [0, 0, 0];
	for (let y = 0; y < boardHeight; y++) {
		for (let x = 0; x < boardWidth; x++) {
			const v = enemies[y][x];
			if (!lepAlive(v)) continue;
			leftTotalThisLevel ++;
			leftUnitsThisLevel[v - 1] ++;
		}
	}
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
			if (lepDying(enemies[y][x])) enemies[y][x] = lepKind(enemies[y][x]);
			rescueDying[y][x] = 0;
		}
	}
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
			if (!lepAlive(enemies[y][x]) || seen[y][x]) continue;
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
					if (inBounds(nx, ny) && lepAlive(enemies[ny][nx]) && !seen[ny][nx]) {
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
			if (obstacles[ny][nx] || castle[ny][nx]) continue; // wall seals this side
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
		if (lepAlive(enemies[cluster[i][1]][cluster[i][0]])) {
			enemies[cluster[i][1]][cluster[i][0]] += 3;
		}
	}
}

function flushDyingEnemies() {
	const flushed = [];
	for (let y = 0; y < boardHeight; y++) {
		for (let x = 0; x < boardWidth; x++) {
			if (lepDying(enemies[y][x])) {
				const kind = lepKind(enemies[y][x]);
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
		} else {
			enemies[y][x] = flushed[i][3] || 1;
			enemiesCleared --;
		}
	}
}

function collectCoin(x, y) {
	if (coins[y][x]) {
		coins[y][x] = 0;
		coinsCollected ++;
	}
}

function pickRescueBmp() {
	const taken = {};
	for (let i = 0; i < rescuedUnits.length; i++) taken[rescuedUnits[i]] = 1;
	const placed = levelCaptives[levelIndex];
	if (placed) {
		for (let i = 0; i < placed.length; i++) taken[placed[i]] = 1;
	}
	const pool = [];
	for (let i = 0; i < rescueBmps.length; i++) {
		if (!taken[rescueBmps[i]]) pool.push(rescueBmps[i]);
	}
	const list = pool.length ? pool : rescueBmps;
	return list[Math.random() * list.length | 0];
}

function unrescueLevel(i) {
	const list = levelCaptives[i];
	if (!list) return;
	for (let j = 0; j < list.length; j++) {
		const k = rescuedUnits.indexOf(list[j]);
		if (k >= 0) rescuedUnits.splice(k, 1);
	}
}

function allyMod(bmp) {
	if (!unitMods[bmp]) unitMods[bmp] = [0, 0, 0, 0];
	return unitMods[bmp];
}

function makeRescued(bmp, x, y) {
	let u;
	if (bmp == 11) u = new Corwin(x, y);
	else if (bmp == 3) u = new Merlin(x, y);
	else if (bmp == 12) u = new Benedict(x, y);
	else if (bmp == 5) u = new Fiona(x, y);
	else if (bmp == 6) u = new Random(x, y);
	else if (bmp == 7) u = new Bleys(x, y);
	else if (bmp == 8) u = new Julian(x, y);
	else if (bmp == 13) u = new Gerard(x, y);
	else u = new Caine(x, y);
	const m = allyMod(bmp);
	u.hpMax += m[0];
	u.hp = u.hpMax;
	u.dmg += m[1];
	u.range += m[2];
	u.reach += m[3];
	return u;
}

function buffUnicorn(u) {
	u.hpMax += uniMods[0];
	u.hp = u.hpMax;
	u.dmg += uniMods[1];
	u.range += uniMods[2];
	u.reach += uniMods[3];
	return u;
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
			if (rescues[y][x]) return 1;
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
	return offscreenBitmaps[(worldNumber() - 1) % offscreenBitmaps.length];
}

function stageScore() {
	return enemiesCleared * 100 + coinsCollected * 50 + (enemiesCleared >= enemiesTotal ? 1000 : 0);
}

function currentScore() {
	return totalScore + (scoreBanked ? 0 : stageScore());
}

function calcLevelScore() {
	levelScore = stageScore();
	return levelScore;
}

function scheduleEndScreen() {
	if (endTimer) return;
	calcLevelScore();
	if (state == 2) {
		fillCharges ++;
		if (!scoreBanked) {
			totalScore += levelScore;
			scoreBanked = 1;
		}
	}
	endTimer = setTimeout(() => {
		showEnd = 1;
		showEndButtons();
		redraw();
	}, 1000);
}

function drawLeprechaunSprite(px, py, size, bounceSpeed, x, y, kind) {
	const bmp = unitBitmaps[2];
	const scale = size / tileWidth * unitScale;
	const dw = bmp.width * scale;
	const dh = bmp.height * scale;
	const bounce = bounceSpeed && Math.sin(Date.now() * bounceSpeed + x * 1.7 + y * 2.3) > 0 ? scale : 0;
	drawPaletted(
		bmp, leprechaunPalettes[(kind || 1) - 1],
		px + (size - dw) / 2, py + (size - dh) / 2 - bounce, dw, dh
	);
}

function drawUnitIcon(bmpIndex, cx, cy, size, pal) {
	const bmp = unitBitmaps[unitSprites[bmpIndex] || bmpIndex];
	pal = pal || unitPalettes[bmpIndex];
	const scale = size / Math.max(bmp.width, bmp.height);
	const dw = bmp.width * scale;
	const dh = bmp.height * scale;
	if (pal) drawPaletted(bmp, pal, cx - dw / 2, cy - dh / 2, dw, dh);
	else gameContext.drawImage(bmp, 0, 0, bmp.width, bmp.height, cx - dw / 2, cy - dh / 2, dw, dh);
}

function drawObjectiveScreen() {
	if (!showObjective) return;
	const size = cellSize || Math.min(width, height) / 12;
	const fs = Math.max(18, size * 0.48 | 0);
	const icon = Math.max(32, size * 0.9 | 0);
	const cx = width / 2;
	const cy = height / 2;
	gameContext.fillStyle = "#103c";
	gameContext.fillRect(0, 0, width, height);
	gameContext.fillStyle = "#fff";
	gameContext.textAlign = "center";
	gameContext.textBaseline = "middle";
	gameContext.font = "bold " + fs + "px sans-serif";
	if (battleActive) {
		gameContext.fillText(battleTitle(), cx, cy - fs * 1.3);
		gameContext.font = "bold " + (fs * 0.72 | 0) + "px sans-serif";
		gameContext.fillText("Destroy all enemies", cx, cy + fs * 0.35);
	} else {
		gameContext.fillText("W:" + worldNumber() + " S:" + shadowNumber() + " L:" + stageNumber(), cx, cy - fs * (stageCaptive ? 2.1 : 1.6));
		drawObjectiveLine(cx, cy + fs * (stageCaptive ? -0.1 : 0.25), fs * 0.72 | 0, icon);
		if (stageCaptive) {
			const ns = fs * 1.45 | 0;
			gameContext.font = "900 " + ns + "px sans-serif";
			gameContext.textAlign = "center";
			gameContext.textBaseline = "middle";
			gameContext.fillStyle = "#fff";
			gameContext.fillText(unitNames[stageCaptive], cx, cy + fs * 2.2);
		}
	}
}

function drawObjectiveLine(cx, cy, fs, icon) {
	const parts = [];
	if (stageCaptive) {
		parts.push({ text: "Rescue " });
		parts.push({ bmp: stageCaptive });
		parts.push({ text: " and proceed to " });
		parts.push({ sparkle: 1 });
	} else {
		parts.push({ text: "Proceed to " });
		parts.push({ sparkle: 1 });
	}
	gameContext.font = "bold " + fs + "px sans-serif";
	const gap = icon * 0.15;
	let total = 0;
	const widths = [];
	for (let i = 0; i < parts.length; i++) {
		const w = parts[i].text ? gameContext.measureText(parts[i].text).width : icon + gap;
		widths.push(w);
		total += w;
	}
	let x = cx - total / 2;
	gameContext.textAlign = "left";
	gameContext.textBaseline = "middle";
	gameContext.fillStyle = "#fff";
	for (let i = 0; i < parts.length; i++) {
		const p = parts[i];
		if (p.text) {
			gameContext.fillText(p.text, x, cy);
		} else if (p.sparkle) {
			const sp = 3 + ((Date.now() / 180 | 0) % 2);
			gameContext.drawImage(
				objectBitmaps[sp], 0, 0, tileWidth, tileWidth,
				x + gap / 2, cy - icon / 2, icon, icon
			);
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
	for (let y = 0; y < boardHeight; y++) {
		for (let x = 0; x < boardWidth; x++) {
			if (rescues[y][x] && isClusterSurrounded([[x, y]])) rescueDying[y][x] = 1;
		}
	}

	if (exits[player.y][player.x] && !remainingRescue()) {
		if (flushAcc) {
			const extra = flushDyingEnemies();
			for (let i = 0; i < extra.length; i++) flushAcc.push(extra[i]);
		} else {
			flushDyingEnemies();
		}
		countLeftovers();
		revealPlayerTile = 1;
		state = 2;
		scheduleEndScreen();
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
	endRetryBtn.onclick = () => { skipObjective = 1; battleActive ? resetBattle() : resetLevel(); };
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
	markBattleDead();
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
	uniMods = [0, 0, 0, 0];
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

function debugClearLevel() {
	if (state != 1 || moving || clearTimer || showObjective) return;
	for (let y = 0; y < boardHeight; y++) {
		for (let x = 0; x < boardWidth; x++) {
			if (enemies[y][x]) {
				enemies[y][x] = 0;
				fillData[y][x] = 1;
			}
		}
	}
	enemiesCleared = enemiesTotal;
	countLeftovers();
	revealPlayerTile = 1;
	state = 2;
	scheduleEndScreen();
	drawBoard();
}

function debugSkipToBattle() {
	if (moving || clearTimer) return;
	rescuedUnits = [];
	const pool = rescueBmps.slice();
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
				const sp = 3 + ((Date.now() + phase) / period | 0) % 2;
				drawPaletted(objectBitmaps[sp], "9ab", px, py, size, size);
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
			} else if (castle[y][x]) {
				gameContext.drawImage(objectBitmaps[5], 0, 0, tileWidth, tileWidth, px, py, size, size);
			} else if (exits[y][x]) {
				const sp = 3 + ((Date.now() / 180 | 0) + x + y) % 2;
				gameContext.drawImage(objectBitmaps[sp], 0, 0, tileWidth, tileWidth, px, py, size, size);
			} else if (coins[y][x]) {
				const cs = size * 0.8;
				const cox = px + (size - cs) / 2;
				const coy = py + size - cs - size * 0.06;
				gameContext.drawImage(objectBitmaps[1], 0, 0, tileWidth, tileWidth, cox, coy, cs, cs);
			} else if (rescues[y][x]) {
				if (!rescueDying[y][x]) {
					gameContext.drawImage(objectBitmaps[0], 0, 0, tileWidth, tileWidth, px, py, size, size);
				}
				const bounce = rescueDying[y][x] && Math.sin(Date.now() * 0.014 + x * 1.7 + y * 2.3) > 0 ? size * 0.08 : 0;
				drawUnitIcon(rescues[y][x], px + size / 2, py + size / 2 - bounce, size * 0.9);
				if (!rescueDying[y][x]) {
					gameContext.drawImage(objectBitmaps[6], 0, 0, tileWidth, tileWidth, px, py, size, size);
				}
			}

			if (enemies[y][x]) {
				drawLeprechaunSprite(
					px, py, size,
					lepDying(enemies[y][x]) ? 0.014 : 0.004,
					x, y, lepKind(enemies[y][x])
				);
			}
		}
	}

	drawFlowingPath();
	drawFillNiches();

	player.resize();
	player.draw();

	drawUI(size);

	if (showEnd && state > 1) {
		gameContext.fillStyle = state == 2 ? "#103c" : "#0009";
		gameContext.fillRect(0, 0, gameCanvas.width, gameCanvas.height);
		gameContext.textAlign = "center";
		gameContext.textBaseline = "middle";
		const cx = gameCanvas.width / 2;
		const cy = gameCanvas.height / 2;
		const fs = Math.max(16, size * 0.55 | 0);
		gameContext.fillStyle = "#fff";
		gameContext.font = "bold " + fs + "px sans-serif";
		gameContext.fillText(state == 2 ? "STAGE CLEAR!" : "STUCK - R", cx, cy - fs * 2.2);

		if (state == 2) {
			const icon = Math.max(28, size * 0.7 | 0);
			const conv = leftUnitConverted;
			const rowY = cy - fs * (conv ? 1.7 : 1.35);
			let lx = cx - icon * 1.85;
			for (let k = 0; k < 3; k++) {
				drawLeprechaunSprite(lx, rowY, icon, 0.004, k, 0, k + 1);
				gameContext.fillStyle = "#fff";
				gameContext.font = "bold " + (fs * 0.55 | 0) + "px sans-serif";
				gameContext.textAlign = "left";
				gameContext.textBaseline = "middle";
				gameContext.fillText("x" + leftUnitsThisLevel[k], lx + icon * 0.85, rowY + icon * 0.45);
				lx += icon * 1.7;
			}

			if (conv) {
				const sm = icon * 0.65;
				const cy2 = cy - fs * 0.72;
				const gLabel = "x" + leftGoldThisLevel;
				const cLabel = "x" + conv;
				gameContext.font = "bold " + (fs * 0.5 | 0) + "px sans-serif";
				const gw = gameContext.measureText(gLabel).width;
				const aw = gameContext.measureText("→").width;
				const cw = gameContext.measureText(cLabel).width;
				let x = cx - (sm + gw + sm + aw + sm + cw + 22) / 2;
				gameContext.textAlign = "left";
				gameContext.fillStyle = "#fff";
				gameContext.drawImage(objectBitmaps[1], 0, 0, tileWidth, tileWidth, x, cy2 - sm / 2, sm, sm);
				x += sm + 2;
				gameContext.fillText(gLabel, x, cy2);
				x += gw + 8;
				drawLeprechaunSprite(x, cy2 - sm / 2, sm, 0, 0, 0, 1);
				x += sm + 4;
				gameContext.fillText("→", x, cy2);
				x += aw + 4;
				drawLeprechaunSprite(x, cy2 - sm / 2, sm, 0, 0, 0, 3);
				x += sm + 2;
				gameContext.fillText(cLabel, x, cy2);
			}

			gameContext.textAlign = "center";
			gameContext.font = (fs * 0.4 | 0) + "px sans-serif";
			gameContext.fillStyle = "#ffd";
			gameContext.fillText("SCORE " + currentScore(), cx, cy - fs * (conv ? -0.05 : 0.15));

			const n = 1 + rescuedUnits.length;
			let ix = cx - (n - 1) * icon * 0.7;
			const by = cy + fs * (conv ? 0.7 : 0.55);
			drawUnitIcon(0, ix, by, icon);
			const ss = icon * 0.5;
			gameContext.drawImage(
				objectBitmaps[3], 0, 0, tileWidth, tileWidth,
				ix + icon * 0.28, by - ss * 0.55, ss, ss
			);
			for (let i = 0; i < rescuedUnits.length; i++) {
				ix += icon * 1.4;
				drawUnitIcon(rescuedUnits[i], ix, by, icon);
			}
		} else {
			gameContext.font = (fs * 0.7 | 0) + "px sans-serif";
			gameContext.fillText("SCORE " + currentScore() + "  MOVES " + moveCount, cx, cy - fs * 0.4);
		}
	}

	drawObjectiveScreen();
}
