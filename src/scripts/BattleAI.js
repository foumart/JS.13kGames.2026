function getProbability(x, y, wantEnemy) {
	let p = 0;
	for (const t of battleUnits) {
		if (t.hp <= 0 || t.enemy != wantEnemy) continue;
		p += boardWidth - Math.min(boardWidth - 1, Math.abs(t.x - x));
		p += boardHeight - Math.min(boardHeight - 1, Math.abs(t.y - y));
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
		const u = list[i++];
		battleSelect = u;
		battleThink(u, () => {
			if (battleResult || epoch != battleEpoch) return;
			if (checkForBattleEnd()) return;

			waitDelay(next, 20);
		});
	};
	next();
}

// get highest scoring entry, in case of a tie - pick randomly
function bestByScore(list, scoreFn) {
	let best = -1;
	let bestS = -999;
	for (let i = 0; i < list.length; i++) {
		const s = scoreFn(list[i]);
		if (s > bestS || s == bestS && RNG(2)) {
			bestS = s;
			best = i;
		}
	}
	return [best, bestS];
}

function battleThink(u, done) {
	const want = u.enemy ? 0 : 1;
	const far = u.atkRay[0][2] > 1;
	const danger = {};
	const ownHp = u.hp;
	u.hp = 0;
	for (const t of battleUnits) {
		if (t.hp <= 0 || t.enemy == u.enemy) continue;
		const from = t.moves();
		from.push(t);
		for (let k = 0; k < from.length; k++) {
			const scan = t.rayScan(from[k].x, from[k].y);
			for (let i = 0; i < scan.length; i++) {
				const cells = scan[i][0];
				for (let j = 0; j < cells.length; j++) danger[cells[j]] = 1;
			}
		}
	}
	u.hp = ownHp;
	const safeAt = m => !danger[[m.x, m.y]];
	const score = m => {
		const hp = u.hp;
		u.hp = 0;
		const h = u.hits(m.x, m.y).length;
		u.hp = hp;
		const safe = far && safeAt(m);
		const p = getProbability(m.x, m.y, want);
		return far ? (safe ? 2000 : 0) + h * 999 + (h ? -p : p) : h * 999 + p;
	};
	const retreat = m => (safeAt(m) ? 2000 : 0) + getProbability(m.x, m.y, want);
	const stayHits = u.hits(u.x, u.y);
	// smart enemies could either attack/move or move/attack depending on outcome
	let better = 0;
	if (u.smart) {
		const step = u.moves();
		const hp = u.hp;
		u.hp = 0;
		for (let i = 0; i < step.length; i++) {
			if (u.hits(step[i].x, step[i].y).length > stayHits.length) better = 1;
		}
		u.hp = hp;
	}

	if (stayHits.length && !better) {
		previewTiles(u, 1, () => performAttack(u, stayHits, () => {
			if (checkForBattleEnd()) return;
			const moves = u.moves();
			const [best, bestS] = bestByScore(moves, retreat);
			if (best < 0 || retreat(u) > bestS) {
				u.moved = 1;
				done();
				return;
			}
			previewTiles(u, 0, () => performMove(u, moves[best].x, moves[best].y, done));
		}));
		return;
	}

	const moves = u.moves();
	let stayS = score(u);
	if (u.advance) stayS = -9999;
	const [best, bestS] = bestByScore(moves, score);
	if (best < 0 || stayS > bestS || stayS == bestS && RNG(2)) {
		u.moved = 1;
		u.acted = 1;
		done();
	} else {
		previewTiles(u, 0, () => {
			performMove(u, moves[best].x, moves[best].y, () => {
				const hits = u.hits(u.x, u.y);
				if (hits.length) previewTiles(u, 1, () => performAttack(u, hits, done));
				else {
					u.acted = 1;
					done();
				}
			});
		});
	}
}
