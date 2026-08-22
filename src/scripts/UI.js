function txt(s, x, y, z) {
	z = z | 0;
	gameContext.font = (z < 0 ? "" : "900 ") + (z < 0 ? -z : z) + "px sans-serif";
	if (x != null) gameContext.fillText(s, x, y);
	return gameContext.measureText(s).width;
}

function drawFrame(x, y, w, h) {
	gameContext.fillStyle = "#fff3";
	const fx = Math.max(0, x - 16);
	const fy = Math.max(0, y - 8);
	gameContext.fillRect(fx, fy, Math.min(width, x + w + 16) - fx, y + h + 8 - fy);
}

function drawUI(size) {
	portrait = height > width;
	const on = battleActive && !battlePhase && !animating && !battleResult && !thinking && !showPick && !showUpgrade;
	const fontSize = Math.min(26, Math.max(12, size * 0.42 | 0));
	const side = Math.max(boardOffsetX, width - boardOffsetX - (battleActive ? battleWidth : boardWidth) * size);
	const panelW = Math.min(96, Math.min(side > 48 ? side - 12 : width * 0.42, 240));
	const panelH = Math.min(96, Math.min(portrait ? Math.max(boardOffsetY - 12, 80) : size * 2.4, 240));
	const px = 16, py = 8;

	if (battleActive) drawBattleHUD(px, py, panelW, panelH, fontSize, on);
	else {
		drawUIPlayer(px, py, panelW, panelH, fontSize);
		const enemyW = Math.min(160, Math.max(panelW, fontSize * 7));
		drawUIEnemy(width - enemyW - px, py, enemyW, panelH, fontSize);
	}

	if (!showObjective) {
		const label = "Score: " + currentScore();
		const sw = txt(label, null, 0, fontSize);
		drawFrame(width / 2 - sw / 2, py, sw, fontSize);
		gameContext.textAlign = "center";
		gameContext.textBaseline = "top";
		gameContext.fillStyle = "#ffd";
		txt(label, width / 2, py, fontSize);
	}
}

function drawUIPlayer(x, y, w, h, fs) {
	const pic = (portrait ? Math.min(w, h) : Math.max(w, h)) * 0.42;
	const sm = pic * 0.55;
	const wsl = "W" + worldNumber() + " S" + shadowNumber() + " L" + stageNumber();
	const tw = Math.max(txt(wsl, null, 0, fs), txt("M:" + moveCount, null, 0, fs), fs * 0.95 + txt(":" + fillCharges, null, 0, fs));
	const n = rescuedUnits.length;
	drawFrame(x, y, Math.max(pic + 8 + tw, n * (sm + 2)), Math.max(pic + (n ? sm + 2 : 0), fs * 3.4));
	drawUnitIcon(0, x + pic / 2, y + pic / 2, pic);
	let rx = x;
	const ry = y + pic + 2;
	for (let i = 0; i < n; i++) {
		drawUnitIcon(rescuedUnits[i], rx + sm / 2, ry + sm / 2, sm);
		rx += sm + 2;
	}
	gameContext.textAlign = "left";
	gameContext.textBaseline = "top";
	gameContext.fillStyle = "#fff";
	const tx = x + pic + 8;
	txt(wsl, tx, y, fs);
	txt("M:" + moveCount, tx, y + fs * 1.2, fs);
	const sy = y + fs * 2.4;
	gameContext.drawImage(objectBitmaps[3], 0, 0, tileWidth, tileWidth, tx, sy, fs, fs);
	txt(":" + fillCharges, tx + fs * 0.95, sy, fs);
}

function drawUIEnemy(x, y, w, h, fs) {
	const pic = Math.min(w, h) * 0.5;
	const sm = Math.max(fs * 1.2, 16);
	let rows = 0, maxW = pic;
	for (let k = 0; k < 3; k++) {
		const n = kindAlive(k + 1);
		const m = leftoverKinds[k];
		if (!n && !m) continue;
		rows ++;
		maxW = Math.max(maxW, sm + 2 + txt(": " + n + (m ? " (" + m + ")" : ""), null, 0, fs));
	}
	drawFrame(x + w - maxW, y, maxW, pic + (rows && 2 + rows * (sm + 2)));
	drawLeprechaunSprite(x + w - pic, y, pic, 0, 0, 0, 4);
	let ty = y + pic + 2;
	gameContext.fillStyle = "#fff";
	gameContext.textBaseline = "middle";
	gameContext.textAlign = "right";
	for (let k = 0; k < 3; k++) {
		const n = kindAlive(k + 1);
		const m = leftoverKinds[k];
		if (!n && !m) continue;
		let label = ": " + n;
		if (m) label += " (" + m + ")";
		const tw = txt(label, x + w, ty + sm / 2, fs);
		drawLeprechaunSprite(x + w - tw - sm - 2, ty, sm, 0, 0, 0, k + 1);
		ty += sm + 2;
	}
}
