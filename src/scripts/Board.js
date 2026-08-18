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
let rescues = []; // 0 empty, 3 Corwin, 4 Merlin
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
let revealPlayerTile = 0;
let clearTimer = 0;
let endBtnWrap = null;
let endNextBtn = null;
let endRetryBtn = null;

let leftoverEnemies = 0;
let leftoverThisStage = 0;
let rescuedCorwin = 0;
let rescuedMerlin = 0;
let rescueDying = [];

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
	rescues = [];
	stageCaptive = 0;
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
	leftoverThisStage = 0;
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
			enemies[y][x] = c == "1" ? 1 : 0;
			obstacles[y][x] = c == "3" ? 1 : 0;
			coins[y][x] = c == "4" ? 1 : 0;
			clouds[y][x] = c == "5" ? 1 : c == "6" ? 2 : c == "7" ? 3 : 0;
			exits[y][x] = c == "8" ? 1 : 0;
			castle[y][x] = c == "9" ? 1 : 0;
			rescues[y][x] = c == "A" ? 3 : c == "B" ? 4 : 0;
			rescueDying[y][x] = 0;
			if (rescues[y][x]) stageCaptive = rescues[y][x];
			if (c == "A") rescuedCorwin = 0;
			if (c == "B") rescuedMerlin = 0;
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
			if (rescueDying[y][x] && rescues[y][x]) collectRescue(x, y);
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

function collectRescue(x, y) {
	const k = rescues[y][x];
	if (!k) return;
	rescues[y][x] = 0;
	rescueDying[y][x] = 0;
	fillData[y][x] = 1;
	if (k == 3) rescuedCorwin = 1;
	if (k == 4) rescuedMerlin = 1;
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
	const i = battleActive ? levels.length - 1 : levelIndex;
	return (i / 3 | 0) + 1;
}

function stageNumber() {
	return (levelIndex % 3) + 1;
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
	const bmp = unitBitmaps[2];
	const scale = size / tileWidth * unitScale;
	const dw = bmp.width * scale;
	const dh = bmp.height * scale;
	const bounce = bounceSpeed && Math.sin(Date.now() * bounceSpeed + x * 1.7 + y * 2.3) > 0 ? scale : 0;
	gameContext.drawImage(
		bmp, 0, 0, bmp.width, bmp.height,
		px + (size - dw) / 2, py + (size - dh) / 2 - bounce, dw, dh
	);
}

function drawUnitIcon(bmpIndex, cx, cy, size) {
	const bmp = unitBitmaps[bmpIndex];
	const scale = size / Math.max(bmp.width, bmp.height);
	const dw = bmp.width * scale;
	const dh = bmp.height * scale;
	gameContext.drawImage(bmp, 0, 0, bmp.width, bmp.height, cx - dw / 2, cy - dh / 2, dw, dh);
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
		gameContext.fillText("World " + worldNumber() + " - Boss", cx, cy - fs * 1.3);
		gameContext.font = "bold " + (fs * 0.72 | 0) + "px sans-serif";
		gameContext.fillText("Destroy all enemies", cx, cy + fs * 0.35);
	} else {
		gameContext.fillText("World " + worldNumber() + ", Level " + stageNumber(), cx, cy - fs * 1.6);
		drawObjectiveLine(cx, cy + fs * 0.25, fs * 0.72 | 0, icon);
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
			const sp = 7 + ((Date.now() / 180 | 0) % 2);
			gameContext.drawImage(
				offscreenBitmaps[sp], 0, 0, tileWidth, tileWidth,
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
	endNextBtn.onclick = battleActive ? restartCampaign : nextLevel;
	endNextBtn.textContent = battleActive
		? "REPLAY"
		: (levelIndex < levels.length - 1 ? "NEXT LEVEL" : "BATTLE");
	endNextBtn.style.display = state == 2 ? "block" : "none";
	endBtnWrap.style.display = "flex";
}

function showObjectiveButtons() {
	ensureEndButtons();
	endRetryBtn.style.display = "none";
	endNextBtn.textContent = "START";
	endNextBtn.onclick = dismissObjective;
	endNextBtn.style.display = "block";
	endBtnWrap.style.display = "flex";
}

function dismissObjective() {
	if (!showObjective) return;
	showObjective = 0;
	hideEndButtons();
	redraw();
}

function nextLevel() {
	leftoverEnemies += leftoverThisStage;
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
			} else if (rescues[y][x]) {
				gameContext.drawImage(offscreenBitmaps[1], 0, 0, tileWidth, tileWidth, px, py, size, size);
				const bounce = rescueDying[y][x] && Math.sin(Date.now() * 0.014 + x * 1.7 + y * 2.3) > 0 ? size * 0.08 : 0;
				drawUnitIcon(rescues[y][x], px + size / 2, py + size / 2 - bounce, size * 0.9);
				gameContext.drawImage(offscreenBitmaps[10], 0, 0, tileWidth, tileWidth, px, py, size, size);
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

			const showG = rescuedCorwin;
			const showT = rescuedMerlin;
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

	drawObjectiveScreen();
}
