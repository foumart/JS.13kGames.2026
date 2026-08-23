function txt(text, x, y, size) {
	gameContext.textAlign = "center";
	gameContext.textBaseline = "top";
	gameContext.font = "900 " + size + "px arial";
	if (x != null) gameContext.fillText(text, x, y);
	return gameContext.measureText(text).width;
}

function drawFrame(x, y, w, h) {
	gameContext.fillStyle = "#546d";
	const fx = Math.max(0, x - 16);
	const fy = Math.max(0, y - 8);
	gameContext.fillRect(fx, fy, Math.min(width, x + w * 1.5) - fx, y + h + 9 - fy);
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

	if (currentScore()) {
		const label = "Score: " + currentScore();
		const sw = txt(label, null, 0, fontSize);
		drawFrame(width / 2 - sw / 2, py, sw, fontSize);
		gameContext.fillStyle = "#ffd";
		//gameContext.textAlign = "center";
		//gameContext.textBaseline = "top";
		txt(label, width / 2, py, fontSize);
	}
}

function drawUIPlayer(x, y, w, h, fs) {
	const pic = (portrait ? Math.min(w, h) : Math.max(w, h)) / 2;
	const sm = pic / 2;
	const tw = fs + txt(fillCharges, null, 0, fs);
	const n = rescuedUnits.length;
	drawFrame(x, y, Math.max(pic + 8 + tw, n * (sm + 2)), pic + (n ? sm + 2 : 0));
	drawUnitIcon(0, x + pic / 2, y + pic / 2, pic);
	let rx = x;
	const ry = y + pic + 2;
	for (let i = 0; i < n; i++) {
		drawUnitIcon(rescuedUnits[i], rx + sm / 2, ry + sm / 2, sm);
		rx += sm + 2;
	}
	gameContext.fillStyle = "#fff";
	//gameContext.textAlign = "left";
	//gameContext.textBaseline = "top";
	const tx = x + pic + 8;
	const sy = y + (pic - fs) / 2;
	drawSparkle(tx, sy, fs, time / 180);
	txt(":" + fillCharges, tx + fs * 0.95, sy, fs);
}

function drawUIEnemy(x, y, w, h, fs) {
	const pic = Math.min(w, h) * 0.5;
	const sm = Math.max(fs * 1.2, 16);
	const wsl = "Vail " + (levelIndex / 3 | 1);
	const list = [];
	if (!isBossBattle()) list.push([4, 1]);
	for (let k = 0; k < 3; k++) {
		const n = leftoverKinds[k] + countAliveLeprechaunsOfKind(k + 1);
		if (n) list.push([k + 1, n]);
	}
	let maxW = txt(wsl, null, 0, fs), hgt = fs * 1.2;
	for (let i = 0; i < list.length; i++) {
		const sz = i ? sm : pic;
		maxW = Math.max(maxW, sz + 2 + txt(list[i][1], null, 0, sz * 0.5));
		hgt += 2 + sz;
	}
	drawFrame(x + w - maxW, y, maxW, hgt);
	gameContext.fillStyle = "#fff";
	//gameContext.textAlign = "right";
	//gameContext.textBaseline = "top";
	txt(wsl, x + w, y, fs);
	let ty = y + fs * 1.2;
	//gameContext.textBaseline = "middle";
	for (let i = 0; i < list.length; i++) {
		const sz = i ? sm : pic;
		ty += 2;
		drawLeprechaunSprite(x + w - sz, ty, sz, 0, 0, 0, list[i][0]);
		txt(list[i][1], x + w - sz - 2, ty + sz / 2, sz * 0.5);
		ty += sz;
	}
}
