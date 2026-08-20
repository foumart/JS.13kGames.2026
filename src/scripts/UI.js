function drawUI(size) {
	portrait = height > width;
	const on = battleActive && !battlePhase && !animating && !battleResult && !thinking && !showPick && !showUpgrade;
	const fontSize = Math.min(26, Math.max(12, size * 0.42 | 0));
	const side = Math.max(boardOffsetX, width - boardOffsetX - (battleActive ? battleWidth : boardWidth) * size);
	const panelW = Math.min(96, Math.min(side > 48 ? side - 12 : width * 0.42, 240));
	const panelH = Math.min(96, Math.min(portrait ? Math.max(boardOffsetY - 12, 80) : size * 2.4, 240));
	const uniX = 8;
	const uniY = portrait ? 8 : Math.max(8, boardOffsetY);

	if (battleActive) drawBattleHUD(uniX, uniY, panelW, panelH, fontSize, on);
	else {
		drawUIPlayer(uniX, uniY, panelW, panelH, fontSize);
		const enemyW = Math.min(160, Math.max(panelW, fontSize * 7));
		drawUIEnemy(width - enemyW - 8, uniY, enemyW, panelH, fontSize);
	}

	gameContext.textAlign = "center";
	gameContext.textBaseline = "top";
	gameContext.font = "bold " + fontSize + "px sans-serif";
	gameContext.fillStyle = "#ffd";
	gameContext.fillText("Score: " + currentScore(), width / 2, 8);
}

function drawUIPlayer(x, y, w, h, fs) {
	const pic = (portrait ? Math.min(w, h) : Math.max(w, h)) * 0.42;
	drawUnitIcon(0, x + pic / 2, y + pic / 2, pic);
	const sm = pic * 0.55;
	let rx = x;
	const ry = y + pic + 2;
	for (let i = 0; i < rescuedUnits.length; i++) {
		drawUnitIcon(rescuedUnits[i], rx + sm / 2, ry + sm / 2, sm);
		rx += sm + 2;
	}
	gameContext.textAlign = "left";
	gameContext.textBaseline = "top";
	gameContext.font = "bold " + fs + "px sans-serif";
	gameContext.fillStyle = "#fff";
	const tx = x + pic + 8;
	gameContext.fillText("W:" + worldNumber() + " S:" + shadowNumber() + " L:" + stageNumber(), tx, y);
	gameContext.fillText("M:" + moveCount, tx, y + fs * 1.2);
	const sy = y + fs * 2.4;
	gameContext.drawImage(objectBitmaps[3], 0, 0, tileWidth, tileWidth, tx, sy, fs, fs);
	gameContext.fillText(":" + fillCharges, tx + fs * 0.95, sy);
}

function drawUIEnemy(x, y, w, h, fs) {
	const pic = Math.min(w, h) * 0.5;
	drawLeprechaunSprite(x + w - pic, y, pic, 0, 0, 0, 4);
	const sm = Math.max(fs * 1.2, 16);
	let ty = y + pic + 2;
	gameContext.font = "bold " + fs + "px sans-serif";
	gameContext.fillStyle = "#fff";
	gameContext.textBaseline = "middle";
	for (let k = 0; k < 3; k++) {
		const n = kindAlive(k + 1);
		const m = leftoverKinds[k];
		if (!n && !m) continue;
		let label = ": " + n;
		if (m) label += " (" + m + ")";
		gameContext.textAlign = "right";
		gameContext.fillText(label, x + w, ty + sm / 2);
		const tw = gameContext.measureText(label).width;
		drawLeprechaunSprite(x + w - tw - sm - 2, ty, sm, 0, 0, 0, k + 1);
		ty += sm + 2;
	}
}
