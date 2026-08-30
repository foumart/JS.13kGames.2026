// expanded on https://www.foumartgames.com/games/AnimalTactics/ (laser chess)
// by Noncho Savov' 2020
// All Rights reserved!
let battleActive = 0;
let battleUnits = [];
let battleSelect = null;
let battleControl = null;
let battlePhase = 0; // 0 player, 1 enemy
let thinking = 0;
let animating = 0;
let battleResult = 0; // 0 playing, 2 win, 3 lose
let battleAim = null; // {dx, dy} first keyboard direction
let battleTiles = []; // {x, y, kind} kind: 0 move, 1 attack
let battleHints = []; // currently aimed
let battleEpoch = 0; // bumped to drop stale AI timeouts
let showPick = 0;
let showUpgrade = 0;
let battleParty = [];
let pickCursor = 0;
let upgradePicks = {};
let upgradeCurUnit = 0;
let upgradeCurOpt = 0;
let battleKind = 0; // 1 regular, 2 boss


function startBattle() {
	const skip = skipObjective;
	skipObjective = 0;
	battleActive = 1;
	hideEndButtons();
	showEnd = 0;
	showUpgrade = 0;
	upgradePicks = {};
	showPick = 0;
	showObjective = 0;
	state = 1;
	battleResult = 0;
	animating = 0;
	thinking = 0;
	battleEpoch ++;
	battleAim = null;
	battleTiles = [];
	battleHints = [];
	battleControl = null;
	totalScore = scoreStart;
	battleUnits = [];
	if (!skip) {
		battleParty = [];
		if (livingRescueCount() <= 2) {
			for (let i = 0; i < rescuedUnits.length; i++) {
				if (!isDeadBmp(rescuedUnits[i])) battleParty.push(rescuedUnits[i]);
			}
		}
	} else {
		const kept = [];
		for (let i = 0; i < battleParty.length; i++) {
			if (deadUnits.indexOf(battleParty[i]) < 0) kept.push(battleParty[i]);
		}
		battleParty = kept;
	}
	pickCursor = firstLivingPick();
	if (livingRescueCount() && !skip) {
		showPick = 1;
		showObjectiveButtons();
		updateUI();
		return;
	}
	spawnBattleParty();
	showObjective = 1;
	showObjectiveButtons();
	updateUI();
}

// used when placing enemies for battle
function clearRock(x, y) {
	if (obstacles[y]) obstacles[y][x] = 0;
}

function spawnBattleParty() {
	// using the puzzle's stage for battle
	const cx = boardWidth / 2 | 0;
	const row = boardHeight - 2;
	clearRock(cx, row);
	battleUnits = [makeUnit(getUnitDefinition(UNITS[0][0]), cx, row)];
	for (let i = 0; i < battleParty.length && i < 2; i++) {
		const x = cx + (i ? 2 : -2);
		clearRock(x, row);
		battleUnits.push(makeUnit(getUnitDefinition(battleParty[i]), x, row));
	}
	spawnEnemies();
	beginRound();
}

function confirmParty() {
	if (!showPick) return;
	const need = Math.min(2, livingRescueCount());
	if (battleParty.length < need) return;
	showPick = 0;
	hideEndButtons();
	spawnBattleParty();
	redraw();
}

function isDeadBmp(bmp) {
	return deadUnits.indexOf(bmp) >= 0;
}

function livingRescueCount() {
	let n = 0;
	for (let i = 0; i < rescuedUnits.length; i++) {
		if (!isDeadBmp(rescuedUnits[i])) n ++;
	}
	return n;
}

function firstLivingPick() {
	for (let i = 0; i < rescuedUnits.length; i++) {
		if (!isDeadBmp(rescuedUnits[i])) return i;
	}
	return 0;
}

function movePickCursor(dir) {
	const n = rescuedUnits.length;
	if (!n) return;
	pickCursor = (pickCursor + dir + n) % n;
	redraw();
}

function pickPartyBmp(bmp) {
	if (!bmp || isDeadBmp(bmp)) return;
	const i = battleParty.indexOf(bmp);
	if (i >= 0) battleParty.splice(i, 1);
	else if (battleParty.length < 2) battleParty.push(bmp);
	syncPickButton();
	redraw();
}

function pickCursorUnit() {
	pickPartyBmp(rescuedUnits[pickCursor]);
}

function markHeroesDead() {
	for (let i = 0; i < battleUnits.length; i++) {
		const unit = battleUnits[i];
		if (unit.enemy || unit.hero || unit.hp > 0) continue;
		if (deadUnits.indexOf(unit.name) < 0) deadUnits.push(unit.name);
	}
}

function toggleParty(bmp) {
	const i = rescuedUnits.indexOf(bmp);
	if (i >= 0) pickCursor = i;
	pickPartyBmp(bmp);
}

function battleRoster(aliveOnly) {
	const list = [];
	for (let i = 0; i < battleUnits.length; i++) {
		const unit = battleUnits[i];
		if (!unit.enemy && (!aliveOnly || unit.hp > 0)) list.push(unit);
	}
	return list;
}

function upgradeId(u) {
	return u.hero ? 0 : u.name;
}

// a ray choice only appears while there are still upgrades left
function upgradeKinds(unit) {
	if (!unit || unit.hp <= 0) return [];
	const m = allyMod(unit.name);
	return ["hp", "dm"].concat(rayStep(unit.mv, unit.range, m[2]) ? ["rg"] : []).concat(rayStep(unit.atk, unit.reach, m[3]) ? ["reach"] : []);
}

function upgradeRows() {
	const list = battleRoster();
	const rows = [];
	for (let i = 0; i < list.length; i++) {
		const kinds = upgradeKinds(list[i]);
		if (kinds.length) rows.push({u: list[i], id: upgradeId(list[i]), kinds});
	}
	return rows;
}

function defaultUpgradePicks() {
	upgradePicks = {};
	upgradeCurUnit = 0;
	upgradeCurOpt = 0;
	const rows = upgradeRows();
	for (let i = 0; i < rows.length; i++) upgradePicks[rows[i].id] = "hp";
}

function setUpgrade(id, kind) {
	upgradePicks[id] = kind;
	const rows = upgradeRows();
	for (let i = 0; i < rows.length; i++) {
		if (rows[i].id != id) continue;
		upgradeCurUnit = i;
		const j = rows[i].kinds.indexOf(kind);
		if (j >= 0) upgradeCurOpt = j;
	}
	redraw();
}

// After the last unit comes RETRY / NEXT buttons
function moveUpgradeCursor(dx, dy) {
	const rows = upgradeRows();
	if (!rows.length) return;
	const last = rows.length;
	upgradeCurUnit = (upgradeCurUnit + dy + last + 1) % (last + 1);
	if (upgradeCurUnit == last) {
		moveEndCursor(dx);
		redraw();
		return;
	}
	const n = rows[upgradeCurUnit].kinds.length;
	upgradeCurOpt = dx ? (upgradeCurOpt + dx + n) % n : Math.min(upgradeCurOpt, n - 1);
	redraw();
}

function pickUpgradeCursor() {
	const rows = upgradeRows();
	if (upgradeCurUnit >= rows.length) {
		activateEndButton();
		return;
	}
	const row = rows[upgradeCurUnit];
	if (!row) return;
	const kind = row.kinds[upgradeCurOpt];
	if (kind) setUpgrade(row.id, kind);
}

function applyUpgradePicks() {
	const list = battleRoster(1);
	for (let i = 0; i < list.length; i++) {
		const unit = list[i];
		const k = upgradePicks[upgradeId(unit)];
		if (!k) continue;
		const m = allyMod(unit.name);
		// the ceilings gate these already, so a banked step past the top is harmless
		if (k == "hp") m[0] += 2;
		else if (k == "dm") m[1] += 1;
		else if (k == "rg") m[2] += 1;
		else m[3] += 1;
	}
}

function createEnemy(unitType, x, y, l) {
	l = l > 5 ? 5 : l || 1;
	return makeUnit([
		,
		// unitType: 0 leprechaun, 1 hydra, 2 serpent, lvl 1-5
		// HP:
		unitType ? unitType * 3 + l * (4 - unitType)
			: l + 1,
		// DMG
		unitType ? unitType - 1 + l * (3 - unitType)
			: l < 3 ? 1 : 3,
		unitType ? 2 : 0,
		unitType ? 2 : 1,
		2 + unitType,
		getEnemyPalette(unitType, l),
		// enemies never upgrade, so they are simply born at their ceiling
		unitType > 1 ? 22 : 0,
		!unitType && l > 3 ? 2 : 0
	], x, y, unitType ? 4 : 3);
}

function spawnEnemies() {
	const cx = boardWidth / 2 | 0;
	const taken = {};
	const put = (u, x) => {
		battleUnits.push(u);
		taken[x] = 1;
		clearRock(x, 0);
	};
	const wave = BATTLES[levelIndex / 3 | 0];
	const xs = wave.length == 2 ? [cx - 2, cx + 2] : [cx, cx - 2, cx + 2];
	for (let i = 0; i < wave.length; i++) {
		const v = wave[i];
		const kind = v / 10 | 0;
		const x = xs[i];
		put(kind > 2 ? makeUnit(ENEMIES[kind - 3], x, 0, 5) : createEnemy(kind, x, 0, v % 10), x);
	}
	const queue = [];
	for (let k = 0; k < 3; k++) {
		for (let q = leftoverKinds[k]; q--;) queue.push(k + 1);
	}
	let n = queue.length;
	const spots = [];
	for (let y = 0; y < 3; y++) {
		for (let x = 0; x < boardWidth; x++) {
			if (!y && taken[x] || hasObstacle(x, y)) continue;
			spots.push([x, y]);
		}
	}
	if (n > spots.length) n = spots.length;
	for (let i = spots.length - 1; i > 0; i--) {
		const j = RNG(i + 1);
		const t = spots[i];
		spots[i] = spots[j];
		spots[j] = t;
	}
	for (let i = 0; i < n; i++) {
		battleUnits.push(createEnemy(0, spots[i][0], spots[i][1], queue[i]));
	}
}

function hasObstacle(x, y) {
	return obstacles[y] && obstacles[y][x];
}

function resetBattle() {
	startBattle();
}

function getUnitAt(x, y) {
	for (let i = 0; i < battleUnits.length; i++) {
		const u = battleUnits[i];
		if (u.hp > 0 && u.x == x && u.y == y) return u;
	}
	return null;
}

function isMapEmptyAt(x, y) {
	return inBounds(x, y) && !getUnitAt(x, y) && !hasObstacle(x, y);
}

function checkForBattleEnd() {
	let p = 0;
	let e = 0;
	let breach = 0;
	for (let i = 0; i < battleUnits.length; i++) {
		const u = battleUnits[i];
		if (u.hp <= 0) continue;
		if (u.enemy) {
			e ++;
			if (u.advance && u.y >= boardHeight - 1) breach = 1;
		} else p ++;
	}
	if (!p || breach) {
		battleFinish(3);
		return 1;
	}
	if (!e) {
		battleFinish(2);
		return 1;
	}
	return 0;
}

function battleFinish(result) {
	battleEpoch ++;
	battleResult = result;
	state = result;
	animating = 0;
	thinking = 0;
	battleTiles = [];
	battleHints = [];
	if (result == 2) {
		showUpgrade = 1;
		defaultUpgradePicks();
	}
	scheduleEndScreen();
}

function getNextUnit() {
	for (let i = 0; i < battleUnits.length; i++) {
		const u = battleUnits[i];
		if (u.hp > 0 && u.hero && !u.acted) return u;
	}
	return null;
}

function beginRound() {
	if (checkForBattleEnd()) return;
	battlePhase = 0;
	thinking = 0;
	battleAim = null;
	battleTiles = [];
	battleHints = [];
	for (let i = 0; i < battleUnits.length; i++) {
		battleUnits[i].moved = 0;
		battleUnits[i].acted = 0;
	}
	const unit = getNextUnit();
	if (unit) selectUnit(unit);
	else nextRoundPhase();
}

function selectUnit(u) {
	battleControl = u && u.hero && u.hp > 0 && !(u.moved && u.acted) ? u : null;
	battleSelect = u;
	battleAim = null;
	battleHints = [];
	if (battleControl) activateUnitTiles(battleControl);
	else if (u) activateUnitTiles(u);
	updateUI();
}

function showTiles(u, attack) {
	battleTiles = [];
	battleHints = [];
	if (!u || u.hp <= 0) return;
	if (attack) {
		u.addAttackTiles(1);
		return;
	}
	const moves = u.moves();
	for (let i = 0; i < moves.length; i++) {
		battleTiles.push({x: moves[i].x, y: moves[i].y, kind: 0, live: 1});
	}
}

function activateUnitTiles(u) {
	battleTiles = [];
	battleHints = [];
	if (!u || u.hp <= 0) return;
	const mine = u == battleControl && !battlePhase && !thinking && !(u.moved && u.acted);
	if (!mine || !u.moved) {
		const moves = u.moves();
		const live = mine && !u.moved ? 1 : 0;
		for (let i = 0; i < moves.length; i++) {
			battleTiles.push({x: moves[i].x, y: moves[i].y, kind: 0, live});
		}
	}
	if (!mine || !u.acted) {
		u.addAttackTiles(mine && !u.acted ? 1 : 0);
	}
}

function battleRefreshTiles() {
	const u = battleControl;
	if (!u || u.hp <= 0 || (u.moved && u.acted) || battlePhase || thinking) {
		battleTiles = [];
		battleHints = [];
		return;
	}
	activateUnitTiles(u);
}

function hasLiveTile(kind) {
	for (let i = 0; i < battleTiles.length; i++) {
		if (battleTiles[i].live && (kind == null || battleTiles[i].kind == kind)) return 1;
	}
	return 0;
}

function getTileAt(x, y) {
	for (let i = 0; i < battleTiles.length; i++) {
		if (battleTiles[i].x == x && battleTiles[i].y == y && battleTiles[i].live) return battleTiles[i];
	}
	return null;
}

function battleFinishUnit(u) {
	u.moved = 1;
	u.acted = 1;
	battleTiles = [];
	battleHints = [];
	battleAim = null;
	battleControl = null;
	if (checkForBattleEnd()) return;
	nextRoundPhase();
}

function nextRoundPhase() {
	battleControl = null;
	battleAim = null;
	thinking = 1;
	const q = [];
	for (let i = 0; i < battleUnits.length; i++) {
		const u = battleUnits[i];
		if (u.hp > 0 && !u.enemy && !u.hero) q.push(u);
	}
	nextUnitInQueue(q, startEnemyPhase);
	updateUI();
}

function playerMove(u, x, y) {
	performMove(u, x, y, () => {
		battleAim = null;
		battleHints = [];
		if (u.acted) {
			battleFinishUnit(u);
			return;
		}
		battleRefreshTiles();
		if (!hasLiveTile(1)) battleFinishUnit(u);
	});
}

function playerAttack(u, x, y) {
	const hits = u.actHits(x, y);
	if (!hits.length) {
		if (u.moved) battleFinishUnit(u);
		return;
	}
	performAttack(u, hits, () => {
		if (checkForBattleEnd()) return;
		battleAim = null;
		battleHints = [];
		if (u.moved) {
			battleFinishUnit(u);
			return;
		}
		battleRefreshTiles();
	});
}

function startEnemyPhase() {
	if (checkForBattleEnd()) return;
	battlePhase = 1;
	thinking = 1;
	battleControl = null;
	battleTiles = [];
	battleHints = [];
	battleAim = null;
	const q = [];
	for (let i = 0; i < battleUnits.length; i++) {
		const u = battleUnits[i];
		if (u.hp > 0 && u.enemy) {
			u.moved = 0;
			u.acted = 0;
			q.push(u);
		}
	}
	nextUnitInQueue(q, beginRound);
	updateUI();
}

function performMove(u, x, y, done) {
	animating = 1;
	u.offsetX = u.x - x;
	u.offsetY = u.y - y;
	if (x < u.x) u.face = 1;
	if (x > u.x) u.face = -1;
	u.x = x;
	u.y = y;
	u.moved = 1;
	battleTiles = [];
	battleHints = [];
	updateUI();
	TweenFX.to(u, 9, {offsetX: 0, offsetY: 0}, drawBattle, () => {
		animating = 0;
		updateUI();
		done();
	});
}

function hitShake(hits, then) {
	let n = hits.length;
	if (!n) {
		then();
		return;
	}
	for (let i = 0; i < hits.length; i++) {
		hits[i].shake = 1;
		TweenFX.to(hits[i], 9, {shake: 0}, drawBattle, () => {
			if (--n <= 0) then();
		});
	}
}

function performAttack(u, hits, done) {
	animating = 1;
	battleTiles = [];
	battleHints = [];
	updateUI();
	const t = hits[0];
	const dx = t ? (t.x - u.x) : 0;
	const dy = t ? (t.y - u.y) : 0;
	const len = Math.max(1, Math.abs(dx) + Math.abs(dy));
	TweenFX.to(u, 5, {offsetX: dx / len * 0.4, offsetY: dy / len * 0.4}, drawBattle, () => {
		for (let i = 0; i < hits.length; i++) hits[i].hp -= u.dmg;
		if (!u.enemy) {
			const mul = u.hero ? 2 : 1;
			for (let i = 0; i < hits.length; i++) {
				totalScore += 50 * mul;
				if (hits[i].hp <= 0) totalScore += 100 * mul;
			}
		}
		updateUI();
		hitShake(hits, () => {
			TweenFX.to(u, 5, {offsetX: 0, offsetY: 0}, drawBattle, () => {
				u.acted = 1;
				animating = 0;
				updateUI();
				done();
			});
		});
	});
}

function knightSide(u, tile, dx, dy) {
	const tx = tile.x - u.x;
	const ty = tile.y - u.y;
	if (dy) return tx < 0 ? -1 : tx > 0 ? 1 : 0;
	return ty < 0 ? -1 : ty > 0 ? 1 : 0;
}

function knightTilesInDir(u, dx, dy) {
	const out = [];
	for (let i = 0; i < battleTiles.length; i++) {
		const t = battleTiles[i];
		const tx = t.x - u.x;
		const ty = t.y - u.y;
		if (t.kind == 0) {
			if (dy && ty == dy * 2 && (tx == 1 || tx == -1)) out.push(t);
			else if (dx && tx == dx * 2 && (ty == 1 || ty == -1)) out.push(t);
		}
	}
	return out;
}

function pickKnightAim(u, dx, dy, dx2, dy2) {
	let side;
	if (dy) {
		if (dx2 < 0) side = -1;
		else if (dx2 > 0) side = 1;
		else side = 0;
	} else {
		if (dy2 < 0) side = -1;
		else if (dy2 > 0) side = 1;
		else side = 0;
	}
	const pool = [];
	for (let i = 0; i < battleHints.length; i++) {
		if (battleHints[i].live && knightSide(u, battleHints[i], dx, dy) == side) pool.push(battleHints[i]);
	}
	if (!pool.length) return null;
	if (pool[0].kind == 1) {
		for (let i = 0; i < pool.length; i++) {
			if (getUnitAt(pool[i].x, pool[i].y)) return pool[i];
		}
	}
	let best = pool[0];
	let bestD = 0;
	for (let i = 0; i < pool.length; i++) {
		const d = Math.abs(pool[i].x - u.x) + Math.abs(pool[i].y - u.y);
		if (d >= bestD) {
			bestD = d;
			best = pool[i];
		}
	}
	return best;
}

function battleEndTurn() {
	if (!battleActive || battleResult || animating || battlePhase) return;
	battleEpoch ++;
	battleAim = null;
	battleTiles = [];
	battleHints = [];
	battleControl = null;
	startEnemyPhase();
	updateUI();
}

function getPosFromEvent(event) {
	if (!cellSize) return null;
	const x = (event.clientX - boardOffsetX) / cellSize | 0;
	const y = (event.clientY - boardOffsetY) / cellSize | 0;
	if (!inBounds(x, y)) return null;
	return {x, y};
}

function battleClick(event) {
	if (showPick || showUpgrade || showEnd) return;
	if (showObjective) {
		dismissObjective();
		return;
	}
	if (!battleActive) {
		puzzleClick(event);
		return;
	}
	if (battleResult) return;
	if (animating) return;
	const cell = getPosFromEvent(event);
	if (!cell) return;
	const occ = getUnitAt(cell.x, cell.y);

	if (!battlePhase && !thinking && occ && !occ.enemy) {
		if (occ.hero && !(occ.moved && occ.acted)) selectUnit(occ);
		else {
			battleSelect = occ;
			activateUnitTiles(occ);
			updateUI();
		}
		return;
	}

	if (occ) {
		if (!battlePhase && !thinking && battleControl && !battleControl.acted) {
			const hits = battleControl.hits(battleControl.x, battleControl.y);
			for (let i = 0; i < hits.length; i++) {
				if (hits[i] == occ) {
					playerAttack(battleControl, occ.x, occ.y);
					return;
				}
			}
		}
		battleSelect = occ;
		activateUnitTiles(occ);
		updateUI();
		return;
	}

	if (!battlePhase && !thinking) {
		const tile = getTileAt(cell.x, cell.y);
		if (tile && battleControl && !(battleControl.moved && battleControl.acted)) {
			if (tile.kind == 0 && !battleControl.moved) playerMove(battleControl, cell.x, cell.y);
			else if (tile.kind == 1 && !battleControl.acted) playerAttack(battleControl, cell.x, cell.y);
		}
	}
}

function battleKey(event) {
	if (battleResult || animating) return;
	const k = event.keyCode;
	if (k == 13 || k == 69) {
		battleEndTurn();
		return;
	}
	if (k == 9) {
		event.preventDefault();
		return;
	}
	if (battlePhase || thinking) return;
	const u = battleControl;
	if (!u || !u.hero || (u.moved && u.acted)) return;

	if (k == 32) {
		if (battleAim) {
			battleAim = null;
			battleHints = [];
		}
		if (!u.acted && u.hits(u.x, u.y).length) {
			playerAttack(u, u.x, u.y);
			return;
		}
		if (u.moved && !u.acted) battleFinishUnit(u);
		return;
	}

	const d = arrowDXY(k);
	if (!d) return;
	const dx = d[0];
	const dy = d[1];

	if (u.moved && !u.acted) {
		if (u.hits(u.x, u.y).length) playerAttack(u, u.x + dx, u.y + dy);
		else battleFinishUnit(u);
		return;
	}

	if (u.moved) return;

	if (!battleTiles.length) battleRefreshTiles();

	if (!battleAim) {
		const forks = knightTilesInDir(u, dx, dy);
		if (!forks.length) return;
		battleAim = {dx, dy};
		battleHints = forks;
		return;
	}

	if ((!battleAim.dx && !dx) || (!battleAim.dy && !dy)) {
		if (!(dx == battleAim.dx && dy == battleAim.dy)) {
			battleAim = null;
			battleHints = [];
			return;
		}
	}

	const pick = pickKnightAim(u, battleAim.dx, battleAim.dy, dx, dy);
	battleAim = null;
	battleHints = [];
	if (!pick) return;
	if (pick.kind == 0) playerMove(u, pick.x, pick.y);
	else playerAttack(u, pick.x, pick.y);
}
