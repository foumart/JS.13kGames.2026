function getProbability(unitToMeasure, want) {
	let p = 0;
	for (const battleUnit of battleUnits) {
		if (battleUnit.hp <= 0 || battleUnit.enemy != want) continue;
		p -= Math.abs(battleUnit.x - unitToMeasure.x) + Math.abs(battleUnit.y - unitToMeasure.y);
	}
	return p;
}

function previewTiles(unit, attack, then) {
	const epoch = battleEpoch;
	battleSelect = unit;
	showTiles(unit, attack);
	updateUI();
	waitDelay(()=> {
		if (battleResult || epoch != battleEpoch) return;
		then();
	}, 9);
}

function nextUnitInQueue(list, then) {
	const epoch = battleEpoch;
	let i = 0;
	const next = () => {
		if (battleResult || epoch != battleEpoch) return;
		while (i < list.length && list[i].hp <= 0) i ++;
		if (i >= list.length) {
			then();
			return;
		}
		const unit = list[i++];
		battleSelect = unit;
		battleThink(unit, () => {
			if (battleResult || epoch != battleEpoch) return;
			if (checkForBattleEnd()) return;

			waitDelay(next, 9);
		});
	};
	next();
}

// get highest scoring entry, in case of a tie - pick randomly
function bestByScore(list, scoreFn) {
	let best = -1;
	let bestS = -99;
	for (let i = 0; i < list.length; i++) {
		const s = scoreFn(list[i]);
		if (s >= bestS || s == bestS && RNG(2)) {
			bestS = s;
			best = i;
		}
	}
	return [best, bestS];
}

function battleThink(unit, done) {
	const want = unit.enemy ? 0 : 1;
	const far = unit.atkRay[0][2] > 1;
	const hide = hard || RNG(2);
	const danger = {};
	const ownHp = unit.hp;
	unit.hp = 0;
	for (const battleUnit of battleUnits) {
		if (battleUnit.hp <= 0 || battleUnit.enemy == unit.enemy) continue;
		const from = hard ? battleUnit.moves() : [];
		from.push(battleUnit);
		for (let k = 0; k < from.length; k++) {
			const scan = battleUnit.rayScan(from[k].x, from[k].y);
			for (let i = 0; i < scan.length; i++) {
				const cells = scan[i][0];
				for (let j = 0; j < cells.length; j++) danger[cells[j]] = 1;
			}
		}
	}
	unit.hp = ownHp;
	const safeAt = unitToMeasure => !danger[[unitToMeasure.x, unitToMeasure.y]];
	const getActScore = unitToMeasure => {
		const hp = unit.hp;
		unit.hp = 0;
		const h = unit.hits(unitToMeasure.x, unitToMeasure.y).length;
		unit.hp = hp;
		const safe = far && hide && safeAt(unitToMeasure);
		const p = getProbability(unitToMeasure, want);
		return far ? (safe ? 99 : 0) + h * 99 + (h ? -p : p) : h * 99 + p;
	};
	const retreat = unitToMeasure => (hide && safeAt(unitToMeasure) ? 99 : 0) + getProbability(unitToMeasure, want);
	const stayHits = unit.hits(unit.x, unit.y);
	// smart enemies could either attack/move or move/attack depending on outcome
	let better = 0;
	if (unit.smart) {
		const step = unit.moves();
		const hp = unit.hp;
		unit.hp = 0;
		for (let i = 0; i < step.length; i++) {
			if (unit.hits(step[i].x, step[i].y).length > stayHits.length) better = 1;
		}
		unit.hp = hp;
	}

	if (stayHits.length && !better) {
		previewTiles(unit, 1, () => performAttack(unit, stayHits, () => {
			if (checkForBattleEnd()) return;
			const moves = unit.moves();
			const [best, bestS] = bestByScore(moves, retreat);
			if (best < 0 || retreat(unit) > bestS) {
				unit.moved = 1;
				done();
				return;
			}
			previewTiles(unit, 0, () => performMove(unit, moves[best].x, moves[best].y, done));
		}));
		return;
	}

	const moves = unit.moves();
	const stayS = getActScore(unit);
	const [best, bestS] = bestByScore(moves, getActScore);
	if (best < 0 || stayS > bestS || stayS == bestS && RNG(2)) {
		unit.moved = 1;
		unit.acted = 1;
		done();
	} else {
		previewTiles(unit, 0, () => {
			performMove(unit, moves[best].x, moves[best].y, () => {
				const hits = unit.hits(unit.x, unit.y);
				if (hits.length) previewTiles(unit, 1, () => performAttack(unit, hits, done));
				else {
					unit.acted = 1;
					done();
				}
			});
		});
	}
}
