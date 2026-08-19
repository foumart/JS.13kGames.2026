// taken from https://www.foumartgames.com/games/AnimalTactics/
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
let menuHits = [];

const battleWidth = 9;
const battleHeight = 9;

function startBattle() {
	const skip = skipObjective;
	skipObjective = 0;
	battleActive = 1;
	if (endTimer) {
		clearTimeout(endTimer);
		endTimer = 0;
	}
	if (clearTimer) {
		clearTimeout(clearTimer);
		clearTimer = 0;
	}
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
	boardWidth = battleWidth;
	boardHeight = battleHeight;
	battleUnits = [];
	if (!skip) battleParty = [];
	else {
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
		return;
	}
	spawnBattleParty();
	if (!skip) {
		showObjective = 1;
		showObjectiveButtons();
	}
}

function spawnBattleParty() {
	battleUnits = [buffUnicorn(new Unicorn(4, 7))];
	const spots = [[2, 7], [6, 7]];
	for (let i = 0; i < battleParty.length && i < 2; i++) {
		battleUnits.push(makeRescued(battleParty[i], spots[i][0], spots[i][1]));
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

function markBattleDead() {
	for (let i = 0; i < battleUnits.length; i++) {
		const u = battleUnits[i];
		if (u.enemy || u.hero || u.hp > 0) continue;
		if (deadUnits.indexOf(u.bmp) < 0) deadUnits.push(u.bmp);
	}
}

function toggleParty(bmp) {
	const i = rescuedUnits.indexOf(bmp);
	if (i >= 0) pickCursor = i;
	pickPartyBmp(bmp);
}

function battleSurvivors() {
	const list = [];
	for (let i = 0; i < battleUnits.length; i++) {
		const u = battleUnits[i];
		if (u.hp > 0 && !u.enemy) list.push(u);
	}
	return list;
}

function battleRoster() {
	const list = [];
	for (let i = 0; i < battleUnits.length; i++) {
		if (!battleUnits[i].enemy) list.push(battleUnits[i]);
	}
	return list;
}

function upgradeId(u) {
	return u.hero ? 0 : u.bmp;
}

function setUpgrade(id, kind) {
	upgradePicks[id] = upgradePicks[id] == kind ? 0 : kind;
	redraw();
}

function applyUpgradePicks() {
	const list = battleSurvivors();
	for (let i = 0; i < list.length; i++) {
		const u = list[i];
		const k = upgradePicks[upgradeId(u)];
		if (!k) continue;
		if (u.hero) {
			if (k == "hp") uniMods[0] += 2;
			else if (k == "att") uniMods[1] += 1;
		} else {
			const m = allyMod(u.bmp);
			if (k == "hp") m[0] += 2;
			else if (k == "att") m[1] += 1;
			else if (k == "range") m[2] += 1;
			else m[3] += 1;
		}
	}
}

function hitMenu(event) {
	const x = event.clientX;
	const y = event.clientY;
	for (let i = 0; i < menuHits.length; i++) {
		const h = menuHits[i];
		if (x >= h.x && y >= h.y && x < h.x + h.w && y < h.y + h.h) {
			h.fn();
			return 1;
		}
	}
	return 0;
}

function spawnEnemies() {
	const cx = (battleWidth / 2) | 0;
	const taken = {};
	if (worldNumber() > 1) {
		battleUnits.push(new Serpent(cx, 0));
		battleUnits.push(new Hydra(cx - 2, 0));
		battleUnits.push(new Hydra(cx + 2, 0));
		taken[cx] = 1;
		taken[cx - 2] = 1;
		taken[cx + 2] = 1;
	} else {
		battleUnits.push(new Hydra(cx, 0));
		taken[cx] = 1;
	}
	let n = leftoverEnemies || 3;
	const spots = [];
	for (let y = 0; y < 2; y++) {
		for (let x = 2; x < 7; x++) {
			if (!y && taken[x]) continue;
			spots.push([x, y]);
		}
	}
	if (n > spots.length) {
		for (let y = 0; y < 2; y++) {
			spots.push([1, y], [7, y]);
		}
	}
	if (n > spots.length) n = spots.length;
	for (let i = spots.length - 1; i > 0; i--) {
		const j = Math.random() * (i + 1) | 0;
		const t = spots[i];
		spots[i] = spots[j];
		spots[j] = t;
	}
	for (let i = 0; i < n; i++) {
		battleUnits.push(new Leprechaun(spots[i][0], spots[i][1]));
	}
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
	return x >= 0 && y >= 0 && x < battleWidth && y < battleHeight && !getUnitAt(x, y);
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
			if (u.advance && u.y >= battleHeight - 1) breach = 1;
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
		upgradePicks = {};
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

function rayTarget(u, x, y) {
	const sx = Math.sign(x - u.x);
	const sy = Math.sign(y - u.y);
	if (!sx && !sy) return null;
	for (let i = 1; i <= u.reach; i++) {
		const nx = u.x + sx * i;
		const ny = u.y + sy * i;
		if (nx < 0 || ny < 0 || nx >= battleWidth || ny >= battleHeight) return null;
		const t = getUnitAt(nx, ny);
		if (t) return t.enemy != u.enemy ? t : null;
	}
	return null;
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
	TweenFX.to(u, 8, {offsetX: 0, offsetY: 0}, drawBattle, () => {
		animating = 0;
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
		TweenFX.to(hits[i], 12, {shake: 0}, drawBattle, () => {
			if (--n <= 0) then();
		});
	}
}

function performAttack(u, hits, done) {
	animating = 1;
	battleTiles = [];
	battleHints = [];
	const t = hits[0];
	const dx = t ? (t.x - u.x) : 0;
	const dy = t ? (t.y - u.y) : 0;
	const len = Math.max(1, Math.abs(dx) + Math.abs(dy));
	TweenFX.to(u, 5, {offsetX: dx / len * 0.35, offsetY: dy / len * 0.35}, drawBattle, () => {
		for (let i = 0; i < hits.length; i++) hits[i].hp -= u.dmg;
		hitShake(hits, () => {
			TweenFX.to(u, 5, {offsetX: 0, offsetY: 0}, drawBattle, () => {
				u.acted = 1;
				animating = 0;
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
}

function getPosFromEvent(event) {
	if (!cellSize) return null;
	const x = Math.floor((event.clientX - boardOffsetX) / cellSize);
	const y = Math.floor((event.clientY - boardOffsetY) / cellSize);
	if (x < 0 || y < 0 || x >= battleWidth || y >= battleHeight) return null;
	return {x, y};
}

function battleClick(event) {
	if (showPick || showUpgrade) {
		hitMenu(event);
		return;
	}
	if (showObjective) {
		dismissObjective();
		return;
	}
	if (!battleActive || battleResult) return;
	const edx = event.clientX - endTurnX;
	const edy = event.clientY - endTurnY;
	if (!battlePhase && !animating && edx * edx + edy * edy <= endTurnR * endTurnR) {
		battleEndTurn();
		return;
	}
	if (animating) return;
	const cell = getPosFromEvent(event);
	if (!cell) return;
	const occ = getUnitAt(cell.x, cell.y);

	if (!battlePhase && !thinking && occ && !occ.enemy) {
		if (occ.hero && !(occ.moved && occ.acted)) selectUnit(occ);
		else {
			battleSelect = occ;
			activateUnitTiles(occ);
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

	let dx = 0;
	let dy = 0;
	if (k == 38 || k == 87) dy = -1;
	else if (k == 40 || k == 83) dy = 1;
	else if (k == 37 || k == 65) dx = -1;
	else if (k == 39 || k == 68) dx = 1;
	else return;

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
