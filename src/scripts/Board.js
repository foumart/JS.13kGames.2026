let boardWidth;
let boardHeight;
let cellSize = 1;
let boardOffsetX = 0;
let boardOffsetY = 0;
let portrait;

let enemies = []; // 0 empty, 1 alive, 2 dying
let obstacles = [];
let coins = [];
let clouds = []; // 1 H bridge, 2 V bridge, 3 cross
let exits = [];
let castle = [];
let pathData = [];
let pathStep = [];
let fillData = [];
let moveLog = []; // flushed enemy cells per forward move (for undo)
let player;
let moving = 0;
let gameLoop;
let pathCount = 0;
let state = 1; // 1 play, 2 win, 3 lose
let showEnd = 0;
let endTimer = 0;

let levelIndex = 0;
let enemiesTotal = 0;
let enemiesCleared = 0;
let coinsCollected = 0;
let moveCount = 0;
let levelScore = 0;
let revealPlayerTile = 0;
let clearTimer = 0;
let endBtnWrap = null;
let endNextBtn = null;
let endRetryBtn = null;

let leftoverEnemies = 0;
let leftoverThisStage = 0;
let rescuedCorwin = 0;
let rescuedMerlin = 0;

// 0 empty, 1 enemy, 2 player, 3 obstacle, 4 coin, 5 cloud H, 6 cloud V, 7 cloud cross, 8 exit, 9 castle
const levelGround = [0, 0, 0, 3, 3, 3];
const levels = [
	// Stage 1
	[
		"000000033",
		"010001000",
		"000010410",
		"000000000",
		"340200100",
		"000000000",
		"401100800",
		"000000001"
	],
	// Stage 2
	[
		"00000000003",
		"01100100100",
		"00010000010",
		"31000111000",
		"30002000001",
		"30100010400",
		"00001810010",
		"01000010000",
		"00001000001",
		"33100011003"
	],
	// Stage 3
	[
		"000010000",
		"010090010",
		"010989000",
		"000000001",
		"003070070",
		"301040100",
		"000020000",
		"010100010",
		"000300000"
	]
];

function inBounds(x, y) {
	return x >= 0 && y >= 0 && x < boardWidth && y < boardHeight;
}

function initBoard() {
	const levelData = levels[levelIndex];
	boardHeight = levelData.length;
	boardWidth = levelData[0].length;
	enemies = [];
	obstacles = [];
	coins = [];
	clouds = [];
	exits = [];
	castle = [];
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
	leftoverThisStage = 0;
	revealPlayerTile = 0;
	state = 1;
	showEnd = 0;
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

	for (let y = 0; y < boardHeight; y++) {
		enemies[y] = [];
		obstacles[y] = [];
		coins[y] = [];
		clouds[y] = [];
		exits[y] = [];
		castle[y] = [];
		pathData[y] = [];
		pathStep[y] = [];
		fillData[y] = [];
		for (let x = 0; x < boardWidth; x++) {
			const c = levelData[y].charAt(x);
			enemies[y][x] = c == "1" ? 1 : 0;
			obstacles[y][x] = c == "3" ? 1 : 0;
			coins[y][x] = c == "4" ? 1 : 0;
			clouds[y][x] = c == "5" ? 1 : c == "6" ? 2 : c == "7" ? 3 : 0;
			exits[y][x] = c == "8" ? 1 : 0;
			castle[y][x] = c == "9" ? 1 : 0;
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
}

function isPassable(x, y, dx, dy) {
	if (!inBounds(x, y) || enemies[y][x] || obstacles[y][x] || castle[y][x] || fillData[y][x]) return 0;
	const c = clouds[y][x];
	// 1 = H bridge, 2 = V bridge, 3 = cross
	if (c == 1 && dy) return 0;
	if (c == 2 && dx) return 0;
	if (pathStep[y][x]) {
		if (c == 3) {
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

function aliveCount() {
	let n = 0;
	for (let y = 0; y < boardHeight; y++) {
		for (let x = 0; x < boardWidth; x++) {
			if (enemies[y][x] == 1) n ++;
		}
	}
	return n;
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
			if (enemies[y][x] == 2) enemies[y][x] = 1;
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
			if (enemies[y][x] != 1 || seen[y][x]) continue;
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
					if (inBounds(nx, ny) && enemies[ny][nx] == 1 && !seen[ny][nx]) {
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
			if (!isPath(nx, ny)) return 0;
		}
	}
	return 1;
}

function markClusterDying(cluster) {
	for (let i = 0; i < cluster.length; i++) {
		enemies[cluster[i][1]][cluster[i][0]] = 2;
	}
}

function flushDyingEnemies() {
	const flushed = [];
	for (let y = 0; y < boardHeight; y++) {
		for (let x = 0; x < boardWidth; x++) {
			if (enemies[y][x] == 2) {
				enemies[y][x] = 0;
				fillData[y][x] = 1;
				enemiesCleared ++;
				flushed.push([x, y]);
			}
		}
	}
	return flushed;
}

function restoreFlushed(flushed) {
	for (let i = 0; i < flushed.length; i++) {
		const x = flushed[i][0];
		const y = flushed[i][1];
		fillData[y][x] = 0;
		enemies[y][x] = 1;
		enemiesCleared --;
	}
}

function collectCoin(x, y) {
	if (coins[y][x]) {
		coins[y][x] = 0;
		coinsCollected ++;
	}
}

function calcLevelScore() {
	const perfect = enemiesCleared >= enemiesTotal;
	levelScore = enemiesCleared * 100 + coinsCollected * 50 + (perfect ? 1000 : 0);
	return levelScore;
}

function scheduleEndScreen() {
	if (endTimer) return;
	calcLevelScore();
	endTimer = setTimeout(() => {
		showEnd = 1;
		showEndButtons();
		redraw();
	}, 1000);
}

function drawLeprechaunSprite(px, py, size, bounceSpeed, x, y) {
	const enemyScale = size / tileWidth * 0.8;
	const drawWidth = tileWidth * enemyScale;
	const drawX = px + (size - drawWidth) / 2;
	const bodyHeight = 4;
	const legHeight = 2;
	const drawY = py + size - (bodyHeight - 1 + legHeight) * enemyScale;
	const bodyBounce = Math.sin(Date.now() * bounceSpeed + x * 1.7 + y * 2.3) > 0 ? enemyScale : 0;
	gameContext.drawImage(
		unitBitmaps[2], 0, 0, tileWidth, bodyHeight,
		drawX, drawY - bodyBounce, drawWidth, bodyHeight * enemyScale
	);
	gameContext.drawImage(
		unitBitmaps[2], 0, bodyHeight, tileWidth, legHeight,
		drawX, drawY + (bodyHeight - 1) * enemyScale, drawWidth, legHeight * enemyScale
	);
}

function drawUnitIcon(bmpIndex, cx, cy, size) {
	const bmp = unitBitmaps[bmpIndex];
	const scale = size / Math.max(bmp.width, bmp.height);
	const dw = bmp.width * scale;
	const dh = bmp.height * scale;
	gameContext.drawImage(bmp, 0, 0, bmp.width, bmp.height, cx - dw / 2, cy - dh / 2, dw, dh);
}

function checkCaptures(flushAcc) {
	const clusters = getClusters();
	for (let i = 0; i < clusters.length; i++) {
		if (isClusterSurrounded(clusters[i])) markClusterDying(clusters[i]);
	}

	if (exits[player.y][player.x]) {
		if (flushAcc) {
			const extra = flushDyingEnemies();
			for (let i = 0; i < extra.length; i++) flushAcc.push(extra[i]);
		} else {
			flushDyingEnemies();
		}
		leftoverThisStage = aliveCount();
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

function showEndButtons() {
	if (!endBtnWrap) {
		endBtnWrap = document.createElement("div");
		endBtnWrap.id = "btnWrap";
		endRetryBtn = document.createElement("button");
		endRetryBtn.id = "retryBtn";
		endRetryBtn.textContent = "RETRY";
		endRetryBtn.onclick = resetLevel;
		endNextBtn = document.createElement("button");
		endNextBtn.id = "nextBtn";
		endNextBtn.onclick = nextLevel;
		endBtnWrap.appendChild(endRetryBtn);
		endBtnWrap.appendChild(endNextBtn);
		mainDiv.appendChild(endBtnWrap);
	}
	endRetryBtn.onclick = battleActive ? resetBattle : resetLevel;
	endNextBtn.onclick = battleActive ? restartCampaign : nextLevel;
	endNextBtn.textContent = battleActive
		? "REPLAY"
		: (levelIndex < levels.length - 1 ? "NEXT LEVEL" : "BATTLE");
	endNextBtn.style.display = state == 2 ? "block" : "none";
	endBtnWrap.style.display = "flex";
}

function nextLevel() {
	leftoverEnemies += leftoverThisStage;
	if (levelIndex == 0) rescuedCorwin = 1;
	if (levelIndex == 1) rescuedMerlin = 1;
	if (levelIndex < levels.length - 1) {
		levelIndex ++;
		resetLevel();
	} else {
		startBattle();
	}
}

function restartCampaign() {
	leftoverEnemies = 0;
	leftoverThisStage = 0;
	rescuedCorwin = 0;
	rescuedMerlin = 0;
	battleActive = 0;
	levelIndex = 0;
	resetLevel();
}

function debugClearLevel() {
	if (state != 1 || moving || clearTimer) return;
	for (let y = 0; y < boardHeight; y++) {
		for (let x = 0; x < boardWidth; x++) {
			if (enemies[y][x]) {
				enemies[y][x] = 0;
				fillData[y][x] = 1;
			}
		}
	}
	enemiesCleared = enemiesTotal;
	leftoverThisStage = 0;
	revealPlayerTile = 1;
	state = 2;
	scheduleEndScreen();
	drawBoard();
}

function debugSkipToBattle() {
	if (moving || clearTimer) return;
	rescuedCorwin = 1;
	rescuedMerlin = 1;
	if (!leftoverEnemies) leftoverEnemies = leftoverThisStage || 3;
	startBattle();
}

function fitBoard(cols, rows) {
	const size = Math.min(width / cols, height / rows);
	cellSize = size;
	boardOffsetX = (width - cols * size) / 2;
	boardOffsetY = (height - rows * size) / 2;
	return size;
}

function drawBoard() {
	if (battleActive) {
		drawBattle();
		return;
	}
	gameContext.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
	const size = fitBoard(boardWidth, boardHeight);

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
					offscreenBitmaps[levelGround[levelIndex] || 0],
					0, 0, tileWidth, tileWidth, px, py, size, size
				);
			}
			if (clouds[y][x]) {
				const cb = clouds[y][x];
				gameContext.drawImage(
					offscreenBitmaps[cb == 1 ? 4 : cb == 2 ? 5 : 6],
					0, 0, tileWidth, tileWidth, px, py, size, size
				);
			}

			if (obstacles[y][x]) {
				gameContext.drawImage(offscreenBitmaps[1], 0, 0, tileWidth, tileWidth, px, py, size, size);
			} else if (castle[y][x]) {
				gameContext.drawImage(offscreenBitmaps[9], 0, 0, tileWidth, tileWidth, px, py, size, size);
			} else if (exits[y][x]) {
				const sp = 7 + ((Date.now() / 180 | 0) + x + y) % 2;
				gameContext.drawImage(offscreenBitmaps[sp], 0, 0, tileWidth, tileWidth, px, py, size, size);
			} else if (coins[y][x]) {
				const cs = size * 0.8;
				const cox = px + (size - cs) / 2;
				const coy = py + size - cs - size * 0.06;
				gameContext.drawImage(offscreenBitmaps[2], 0, 0, tileWidth, tileWidth, cox, coy, cs, cs);
			}

			if (enemies[y][x]) {
				drawLeprechaunSprite(
					px, py, size,
					enemies[y][x] == 2 ? 0.014 : 0.004,
					x, y
				);
			}
		}
	}

	drawFlowingPath();

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
			drawLeprechaunSprite(cx - icon * 1.6, cy - fs * 1.35, icon, 0.004, 0, 0);
			gameContext.fillStyle = "#fff";
			gameContext.font = "bold " + (fs * 0.7 | 0) + "px sans-serif";
			gameContext.textAlign = "left";
			gameContext.textBaseline = "middle";
			gameContext.fillText("x " + leftoverThisStage, cx - icon * 0.3, cy - fs * 1.35 + icon * 0.45);

			gameContext.textAlign = "center";
			gameContext.font = (fs * 0.4 | 0) + "px sans-serif";
			gameContext.fillStyle = "#ffd";
			gameContext.fillText("SCORE " + levelScore, cx, cy - fs * 0.15);

			const showG = rescuedCorwin || levelIndex >= 0;
			const showT = rescuedMerlin || levelIndex >= 1;
			let n = 1 + (showG ? 1 : 0) + (showT ? 1 : 0);
			let ix = cx - (n - 1) * icon * 0.7;
			const by = cy + fs * 0.55;
			drawUnitIcon(0, ix, by, icon);
			ix += icon * 1.4;
			if (showG) {
				drawUnitIcon(3, ix, by, icon);
				ix += icon * 1.4;
			}
			if (showT) drawUnitIcon(4, ix, by, icon);
		} else {
			gameContext.font = (fs * 0.7 | 0) + "px sans-serif";
			gameContext.fillText("SCORE " + levelScore + "  MOVES " + moveCount, cx, cy - fs * 0.4);
		}
	}

}
