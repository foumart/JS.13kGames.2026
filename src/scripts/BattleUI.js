let endTurnX = 0;
let endTurnY = 0;
let endTurnR = 0;
let hoverTile = null;

function battleHover(event) {
	if (!battleActive || battleResult || animating || showPick || showUpgrade) {
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
	portrait = height > width;
	drawEdgeTiles(tileSize, groundBmp());

	for (let y = 0; y < battleHeight; y++) {
		for (let x = 0; x < battleWidth; x++) {
			const px = boardOffsetX + x * tileSize;
			const py = boardOffsetY + y * tileSize;
			gameContext.drawImage(
				groundBmp(),
				0, 0, tileWidth, tileWidth, px, py, tileSize, tileSize
			);
			if (hasObstacle(x, y)) {
				gameContext.drawImage(
					objectBitmaps[0],
					0, 0, tileWidth, tileWidth, px, py, tileSize, tileSize
				);
			}
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

	if (showEnd && battleResult > 1 && !showUpgrade) {
		gameContext.fillStyle = battleResult == 2 ? "#103c" : "#0009";
		gameContext.fillRect(0, 0, width, height);
		gameContext.fillStyle = "#fff";
		gameContext.textAlign = "center";
		gameContext.textBaseline = "middle";
		gameContext.font = "bold " + Math.max(18, tileSize * 0.5 | 0) + "px sans-serif";
		gameContext.fillText(battleResult == 2 ? "VICTORY!" : "DEFEAT - R", width / 2, height / 2);
	}

	drawPickScreen();
	drawUpgradeScreen();
	drawObjectiveScreen();
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
	let pink = null;
	let fallback = null;
	for (let i = 0; i < battleUnits.length; i++) {
		const u = battleUnits[i];
		if (!u.enemy || u.hp <= 0) continue;
		if (u.type == 4) return u;
		if (u.lep == 4) pink = u;
		else if (!fallback) fallback = u;
	}
	return pink || fallback;
}

function drawBattleHUD(x, y, w, h, fs, on) {
	const u = getBattleUIAlly();
	if (u) drawUIUnit(x, y, w, h, fs, u, 0);
	const r = Math.max(16, Math.min(width, height) * 0.04);
	const m = Math.max(24, Math.min(width, height) * 0.045);
	if (!showPick && !showUpgrade) drawEndTurn(width - r - m, height - r - m, r, on);
	const foe = getBattleUIFoe();
	if (foe && foe.hp > 0) drawUIUnit(width - w - 8, y, w, h, fs, foe, 1);
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
	if (!u.hero) {
		gameContext.fillText("RG " + u.range, tx, y + fs * 2.4);
		gameContext.fillText("RC " + u.reach, tx, y + fs * 3.6);
	}
}

function drawMenuBtn(x, y, w, h, label, on, fn) {
	gameContext.fillStyle = on ? "#ffe066" : "#345";
	gameContext.fillRect(x, y, w, h);
	gameContext.strokeStyle = "#fff";
	gameContext.lineWidth = 2;
	gameContext.strokeRect(x, y, w, h);
	gameContext.fillStyle = on ? "#120028" : "#fff";
	gameContext.textAlign = "center";
	gameContext.textBaseline = "middle";
	gameContext.fillText(label, x + w / 2, y + h / 2 + 1);
	menuHits.push({x, y, w, h, fn});
}

function drawPickScreen() {
	if (!showPick) return;
	menuHits = [];
	const fs = Math.max(16, Math.min(width, height) * 0.045 | 0);
	const icon = Math.max(40, Math.min(width / (rescuedUnits.length + 1), height * 0.14) | 0);
	const cx = width / 2;
	const cy = height / 2;
	gameContext.fillStyle = "#103c";
	gameContext.fillRect(0, 0, width, height);
	gameContext.fillStyle = "#fff";
	gameContext.textAlign = "center";
	gameContext.textBaseline = "middle";
	gameContext.font = "bold " + fs + "px sans-serif";
	gameContext.fillText(battleTitle(), cx, cy - icon * 2.15);
	gameContext.font = "bold " + (fs * 0.78 | 0) + "px sans-serif";
	gameContext.fillText("Destroy all enemies", cx, cy - icon * 1.45);
	const need = Math.min(2, livingRescueCount());
	gameContext.fillText(need > 1 ? "Pick " + need + " allies" : "Your ally", cx, cy - icon * 0.8);
	const n = rescuedUnits.length;
	const gap = icon * 0.32;
	let x = cx - (n * icon + (n - 1) * gap) / 2;
	const y = cy + icon * 0.15;
	for (let i = 0; i < n; i++) {
		const bmp = rescuedUnits[i];
		const dead = isDeadBmp(bmp);
		const picked = battleParty.indexOf(bmp) >= 0;
		const cur = i == pickCursor;
		if (picked) {
			gameContext.strokeStyle = "#fff";
			gameContext.lineWidth = 4;
			gameContext.strokeRect(x - 4, y - icon / 2 - 4, icon + 8, icon + 8);
		}
		if (cur) {
			gameContext.strokeStyle = "#6e6";
			gameContext.lineWidth = 4;
			gameContext.strokeRect(x - 8, y - icon / 2 - 8, icon + 16, icon + 16);
		}
		if (dead) gameContext.globalAlpha = 0.45;
		drawUnitIcon(bmp, x + icon / 2, y, icon);
		gameContext.globalAlpha = 1;
		if (dead) {
			gameContext.strokeStyle = "#e22";
			gameContext.lineWidth = Math.max(3, icon * 0.08);
			gameContext.beginPath();
			gameContext.moveTo(x + 4, y - icon / 2 + 4);
			gameContext.lineTo(x + icon - 4, y + icon / 2 - 4);
			gameContext.moveTo(x + icon - 4, y - icon / 2 + 4);
			gameContext.lineTo(x + 4, y + icon / 2 - 4);
			gameContext.stroke();
			menuHits.push({
				x: x, y: y - icon / 2, w: icon, h: icon,
				fn: function() { pickCursor = i; redraw(); }
			});
		} else {
			menuHits.push({
				x: x, y: y - icon / 2, w: icon, h: icon,
				fn: toggleParty.bind(null, bmp)
			});
		}
		x += icon + gap;
	}
	drawPickInfo(cx, y + icon * 0.72, fs);
}

function rayStyle(rays) {
	if (rays == Unit.KNIGHT) return "knight";
	if (rays == Unit.BISHOP) return "bishop";
	if (rays == Unit.QUEEN) return "queen";
	return "rook";
}

function drawPickInfo(cx, y, fs) {
	const bmp = rescuedUnits[pickCursor];
	if (!bmp) return;
	const u = makeRescued(bmp, 0, 0);
	const name = unitNames[bmp] || "";
	const moveN = u.range;
	const atkN = u.around || u.reach;
	const ls = fs * 0.78 | 0;
	gameContext.textAlign = "center";
	gameContext.textBaseline = "top";
	gameContext.fillStyle = "#fff";
	gameContext.font = "900 " + fs + "px sans-serif";
	gameContext.fillText(name, cx, y);
	gameContext.font = "bold " + ls + "px sans-serif";
	gameContext.fillText("HP:" + u.hpMax + "  AT:" + u.dmg, cx, y + fs * 1.15);
	gameContext.fillText("Move Range:" + moveN + " (" + rayStyle(u.moveRays()) + " style)", cx, y + fs * 2.05);
	gameContext.fillText("Attack Reach:" + atkN + " (" + rayStyle(u.attackRays()) + " style)", cx, y + fs * 2.95);
}

function drawUpgradeScreen() {
	if (!showUpgrade) return;
	menuHits = [];
	const list = battleRoster();
	const fs = Math.max(14, Math.min(width, height) * 0.036 | 0);
	const icon = Math.max(34, Math.min(width, height) * 0.09 | 0);
	const btnW = Math.max(48, fs * 3.6);
	const btnH = Math.max(24, fs * 1.45);
	gameContext.fillStyle = "#103c";
	gameContext.fillRect(0, 0, width, height);
	gameContext.fillStyle = "#fff";
	gameContext.textAlign = "center";
	gameContext.textBaseline = "middle";
	gameContext.font = "bold " + (fs * 1.4 | 0) + "px sans-serif";
	gameContext.fillText("VICTORY!", width / 2, height * 0.1);
	gameContext.font = "bold " + fs + "px sans-serif";
	gameContext.fillText("Choose a bonus", width / 2, height * 0.1 + fs * 1.7);
	const rowH = icon + fs * 1.1 + btnH + 18;
	let y = height * 0.2;
	for (let i = 0; i < list.length; i++) {
		const u = list[i];
		const fallen = u.hp <= 0;
		const id = upgradeId(u);
		const pick = upgradePicks[id];
		const kinds = fallen ? [] : u.hero ? ["hp", "att"] : ["hp", "att", "range", "reach"];
		const labels = u.hero ? ["HP +2", "AT +1"] : ["HP +2", "AT +1", "RG +1", "RC +1"];
		const tw = Math.max(kinds.length, 1) * (btnW + 8) - 8;
		const rowW = icon + 16 + Math.max(tw, fs * 14);
		let x = width / 2 - rowW / 2;
		if (fallen) gameContext.globalAlpha = 0.45;
		drawUnitIcon(u.bmp, x + icon / 2, y + icon / 2, icon, u.pal);
		gameContext.globalAlpha = 1;
		gameContext.textAlign = "left";
		gameContext.fillStyle = "#fff";
		if (fallen) {
			gameContext.fillText("fallen", x + icon + 12, y + icon / 2);
		} else {
			gameContext.fillText(
				"HP " + u.hpMax + "  AT " + u.dmg + (u.hero ? "" : "  RG " + u.range + "  RC " + u.reach),
				x + icon + 12, y + fs * 0.7
			);
			let bx = x + icon + 12;
			const by = y + fs * 1.3;
			for (let k = 0; k < kinds.length; k++) {
				drawMenuBtn(bx, by, btnW, btnH, labels[k], pick == kinds[k], setUpgrade.bind(null, id, kinds[k]));
				bx += btnW + 8;
			}
		}
		y += rowH;
	}
}
