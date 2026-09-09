function battleHover(event) {
	if (menu || showPick || showUpgrade || showObjective || showEnd || event.type == "pointerleave") {
		gc.style.cursor = "";
		return;
	}
	const cell = getPosFromEvent(event);
	gc.style.cursor = cell && (battleActive
		? !battleResult && !animating && getTileAt(cell.x, cell.y)
		: puzzleMoveAt(cell.x, cell.y) || isTrail(cell.x, cell.y)
	) ? "pointer" : "";
}

function outlineUnit(u, size, col, lw, inset) {
	gameContext.strokeStyle = col;
	gameContext.lineWidth = Math.max(1, size * lw);
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

function getBattleUIAlly() {
	if (battleSelect && !battleSelect.enemy && battleSelect.hp > 0) return battleSelect;
	for (let i = 0; i < battleUnits.length; i++) {
		if (battleUnits[i].hero) return battleUnits[i];
	}
	return makeUnit(UNITS[0], 0, 0);
}

function getBattleUIFoe() {
	if (showPick) {
		const v = battleWave(levelIndex / 3 | 0)[0];
		return createEnemy(v / 10 | 0, 0, 0, v % 10);
	}
	if (battleSelect && battleSelect.enemy && battleSelect.hp > 0) return battleSelect;
	let fallback = null;
	for (let i = 0; i < battleUnits.length; i++) {
		const u = battleUnits[i];
		if (!u.enemy || u.hp <= 0) continue;
		if (u.type == 4) return u;
		if (!fallback) fallback = u;
	}
	return fallback;
}

// the ray buttons name what the next step actually grants: R2, B1, or the knight leap
function upgradeLabel(kind, unit) {
	if (kind > 4) return kind > 5 ? "Life +1" : "Around";
	if (kind < 3) return kind > 1 ? "Dmg +1" : "HP +2";
	const atk = kind > 3;
	return (atk ? "Att " : "Move ")
		+ rayStep(atk ? unit.atk : unit.mv, atk ? unit.reach : unit.range, allyMod(unit.name)[kind - 1]);
}
