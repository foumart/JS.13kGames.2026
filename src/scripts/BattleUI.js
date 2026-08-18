let endTurnX = 0;
let endTurnY = 0;
let endTurnR = 0;
let hoverTile = null;

function battleHover(event) {
	if (!battleActive || battleResult || animating) {
		if (hoverTile) {
			hoverTile = null;
			gameCanvas.style.cursor = "";
		}
		return;
	}
	const cell = getPosFromEvent(event);
	const tile = cell && getTileAt(cell.x, cell.y);
	const nx = tile ? tile.x : -1;
	const ny = tile ? tile.y : -1;
	if (hoverTile && hoverTile.x == nx && hoverTile.y == ny) return;
	if (!tile && !hoverTile) return;
	hoverTile = tile ? {x: nx, y: ny} : null;
	gameCanvas.style.cursor = tile ? "pointer" : "";
}

function drawEndTurn(cx, cy, r, on) {
	endTurnX = cx;
	endTurnY = cy;
	endTurnR = r;
	gameContext.beginPath();
	gameContext.arc(cx, cy, r, 0, 7);
	gameContext.fillStyle = on ? "#adc" : "#456";
	gameContext.fill();
	gameContext.fillStyle = "#124";
	const s = r * 0.32;
	for (let k = 0; k < 2; k++) {
		const ox = cx - s * 0.55 + k * s * 0.9;
		gameContext.beginPath();
		gameContext.moveTo(ox - s * 0.25, cy - s);
		gameContext.lineTo(ox + s * 0.45, cy);
		gameContext.lineTo(ox - s * 0.25, cy + s);
		gameContext.fill();
	}
}

function battleHinted(x, y) {
	for (let i = 0; i < battleHints.length; i++) {
		if (battleHints[i].x == x && battleHints[i].y == y) return 1;
	}
	return 0;
}

function drawBattle() {
	gameContext.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
	const tileSize = fitBoard(battleWidth, battleHeight);

	for (let y = 0; y < battleHeight; y++) {
		for (let x = 0; x < battleWidth; x++) {
			const px = boardOffsetX + x * tileSize;
			const py = boardOffsetY + y * tileSize;
			gameContext.drawImage(
				offscreenBitmaps[0],
				0, 0, tileWidth, tileWidth, px, py, tileSize, tileSize
			);
		}
	}

	for (let i = 0; i < battleTiles.length; i++) {
		const t = battleTiles[i];
		const hot = (battleAim && battleHinted(t.x, t.y)) || (t.live && hoverTile && hoverTile.x == t.x && hoverTile.y == t.y);
		gameContext.fillStyle = t.kind
			? (hot ? "#f458" : t.live ? "#f456" : "#f454")
			: (hot ? "#9f8c" : t.live ? "#9f88" : "#9f84");
		gameContext.fillRect(
			boardOffsetX + t.x * tileSize,
			boardOffsetY + t.y * tileSize,
			tileSize, tileSize
		);
	}

	if (battleControl && battleControl.hp > 0) {
		gameContext.strokeStyle = "#fff";
		gameContext.lineWidth = Math.max(2, tileSize * 0.06);
		gameContext.strokeRect(
			boardOffsetX + battleControl.x * tileSize + 1,
			boardOffsetY + battleControl.y * tileSize + 1,
			tileSize - 2, tileSize - 2
		);
	}
	if (battleSelect && battleSelect != battleControl && battleSelect.hp > 0) {
		gameContext.strokeStyle = battleSelect.enemy ? "#f89" : "#fe6";
		gameContext.lineWidth = Math.max(2, tileSize * 0.05);
		gameContext.strokeRect(
			boardOffsetX + battleSelect.x * tileSize + 2,
			boardOffsetY + battleSelect.y * tileSize + 2,
			tileSize - 4, tileSize - 4
		);
	}

	const order = battleUnits.slice().sort((a, b) => a.y - b.y);
	for (let i = 0; i < order.length; i++) {
		if (order[i].hp > 0 || order[i].shake) order[i].draw(tileSize);
	}

	drawUI(tileSize);

	if (showEnd && battleResult > 1) {
		gameContext.fillStyle = battleResult == 2 ? "#103c" : "#0009";
		gameContext.fillRect(0, 0, width, height);
		gameContext.fillStyle = "#fff";
		gameContext.textAlign = "center";
		gameContext.textBaseline = "middle";
		gameContext.font = "bold " + Math.max(18, tileSize * 0.5 | 0) + "px sans-serif";
		gameContext.fillText(battleResult == 2 ? "VICTORY!" : "DEFEAT - R", width / 2, height / 2);
	}
}

function getBattleUIAlly() {
	if (battleSelect && !battleSelect.enemy && battleSelect.hp > 0) return battleSelect;
	for (let i = 0; i < battleUnits.length; i++) {
		if (battleUnits[i].hero) return battleUnits[i];
	}
	return null;
}

function getBattleUIFoe() {
	if (battleSelect && battleSelect.enemy && battleSelect.hp > 0) return battleSelect;
	return battleUnits[0];
}

function drawUI(size) {
	portrait = height > width;
	const on = battleActive && !battlePhase && !animating && !battleResult && !thinking;
	const fontSize = Math.min(26, Math.max(12, size * 0.42 | 0));
	const side = Math.max(boardOffsetX, width - boardOffsetX - (battleActive ? battleWidth : boardWidth) * size);
	const panelW = Math.min(96, Math.min(side > 48 ? side - 12 : width * 0.42, 240));
	const panelH = Math.min(96, Math.min(portrait ? Math.max(boardOffsetY - 12, 80) : size * 2.4, 240));
	const uniX = 8;
	const uniY = portrait ? 8 : Math.max(8, boardOffsetY);
	drawUIPlayer(uniX, uniY, panelW, panelH, fontSize);

	const r = Math.max(16, Math.min(width, height) * 0.04);
	const m = Math.max(24, Math.min(width, height) * 0.045);
	if (battleActive) drawEndTurn(width - r - m, height - r - m, r, on);

	drawUIEnemy(width - panelW - 8, uniY, panelW, panelH, fontSize);
}

function drawUIPlayer(x, y, w, h, fs) {
	if (battleActive) {
		const u = getBattleUIAlly();
		if (!u) return;
		drawUIUnit(x, y, w, h, fs, u, 0);
		return;
	}
	const pic = (portrait ? Math.min(w, h) : Math.max(w, h)) * 0.42;
	drawUnitIcon(0, x + pic / 2, y + pic / 2, pic);
	gameContext.textAlign = "left";
	gameContext.textBaseline = "top";
	gameContext.font = "bold " + fs + "px sans-serif";
	gameContext.fillStyle = "#fff";
	const tx = x + pic + 8;
	gameContext.fillText("LV " + (levelIndex + 1), tx, y);
	gameContext.fillText("" + (enemiesCleared * 100 + coinsCollected * 50), tx, y + fs * 1.2);
	gameContext.fillText("M" + moveCount, tx, y + fs * 2.4);
}

function drawUIEnemy(x, y, w, h, fs) {
	if (battleActive) {
		const u = getBattleUIFoe();
		if (u && u.hp > 0) drawUIUnit(x, y, w, h, fs, u, 1);
		return;
	}
	const pic = Math.min(w, h) * 0.42;
	drawUnitIcon(2, x + w - pic / 2, y + pic / 2, pic);
	gameContext.textAlign = "right";
	gameContext.textBaseline = "top";
	gameContext.font = "bold " + fs + "px sans-serif";
	gameContext.fillStyle = "#fff";
	gameContext.fillText("x " + aliveCount(), x + w - pic - 8, y);
}

function drawUIUnit(x, y, w, h, fs, u, right) {
	if (!u) return;
	const pic = Math.min(w, h) * 0.42;
	const px = right ? x + w - pic : x;
	u.drawPortrait(px, y, pic);
	gameContext.textAlign = right ? "right" : "left";
	gameContext.textBaseline = "top";
	gameContext.font = "bold " + fs + "px sans-serif";
	gameContext.fillStyle = "#fff";
	const tx = right ? px - 8 : x + pic + 8;
	gameContext.fillText("HP " + Math.max(0, u.hp) + "/" + u.hpMax, tx, y);
	gameContext.fillText("AT " + u.dmg, tx, y + fs * 1.2);
}
