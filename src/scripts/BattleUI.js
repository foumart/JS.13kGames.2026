let hoverTile = null;

function battleHover(event) {
	if (showPick || showUpgrade || showObjective || showEnd) {
		if (hoverTile) {
			hoverTile = null;
			gameCanvas.style.cursor = "";
		}
		return;
	}
	if (!battleActive) {
		const cell = getPosFromEvent(event);
		gameCanvas.style.cursor = cell && (puzzleMoveAt(cell.x, cell.y) || isTrail(cell.x, cell.y)) ? "pointer" : "";
		return;
	}
	if (battleResult || animating) {
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

function outlineUnit(u, size, col, lw, inset) {
	gameContext.strokeStyle = col;
	gameContext.lineWidth = Math.max(2, size * lw);
	gameContext.strokeRect(
		boardOffsetX + u.x * size + inset,
		boardOffsetY + u.y * size + inset,
		size - inset * 2, size - inset * 2
	);
}

function battleHinted(x, y) {
	for (let i = 0; i < battleHints.length; i++) {
		if (battleHints[i].x == x && battleHints[i].y == y) return 1;
	}
	return 0;
}

function drawBattle() {
	gameContext.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
	const tileSize = fitBoard(boardWidth, boardHeight);
	//portrait = height > width;
	drawEdgeTiles(tileSize, groundBmp());

	for (let y = 0; y < boardHeight; y++) {
		for (let x = 0; x < boardWidth; x++) {
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
		outlineUnit(battleControl, tileSize, "#fff", 0.06, 1);
	}
	if (battleSelect && battleSelect != battleControl && battleSelect.hp > 0) {
		outlineUnit(battleSelect, tileSize, battleSelect.enemy ? "#f89" : "#fe6", 0.05, 2);
	}

	const order = battleUnits.slice().sort((a, b) => a.y - b.y);
	for (let i = 0; i < order.length; i++) {
		if (order[i].hp > 0 || order[i].shake) order[i].draw(tileSize);
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
	let pink = null;
	let fallback = null;
	for (let i = 0; i < battleUnits.length; i++) {
		const u = battleUnits[i];
		if (!u.enemy || u.hp <= 0) continue;
		if (u.type == 4) return u;
		if (u.advance && u.reach > 1) pink = u;
		else if (!fallback) fallback = u;
	}
	return pink || fallback;
}

/*function rayStyle(rays) {
	if (rays == KNIGHT) return "+";
	if (rays == BISHOP) return "X";
	if (rays == QUEEN) return "*";
	return "*";
}*/

// the ray buttons name what the next step actually grants: R2, B1, or the knight leap
function upgradeLabel(kind, unit) {
	if (kind == "hp") return "HP +2";
	if (kind == "att") return "Dmg +1";
	const atk = kind != "range";
	return (atk ? "Att " : "Move ")
		+ rayStep(atk ? unit.atk : unit.mv, atk ? unit.reach : unit.range, allyMod(unit.name)[atk ? 3 : 2]);
}
