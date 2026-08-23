function getProbability(x, y, wantEnemy) {
	let p = 0;
	for (let i = 0; i < battleUnits.length; i++) {
		const t = battleUnits[i];
		if (t.hp <= 0 || t.enemy != wantEnemy) continue;
		p += battleWidth - Math.min(battleWidth - 1, Math.abs(t.x - x));
		p += battleHeight - Math.min(battleHeight - 1, Math.abs(t.y - y));
	}
	return p;
}

function previewTiles(unit, attack, then) {
	const epoch = battleEpoch;
	battleSelect = unit;
	showTiles(unit, attack);
	setTimeout(() => {
		if (battleResult || epoch != battleEpoch) return;
		then();
	}, 99);
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
			setTimeout(next, 280);
		});
	};
	next();
}

function battleThink(u, done) {
	const want = u.enemy ? 0 : 1;
	const stayHits = u.hits(u.x, u.y);

	if (stayHits.length) {//u.strikeFirst && 
		previewTiles(u, 1, () => performAttack(u, stayHits, () => {
			if (checkForBattleEnd()) return;
			const moves = u.moves();
			let best = -1;
			let bestS = -999;
			for (let i = 0; i < moves.length; i++) {
				const s = getProbability(moves[i].x, moves[i].y, want);
				if (s > bestS || (s == bestS && Math.random() < 0.5)) {
					bestS = s;
					best = i;
				}
			}
			if (best < 0) {
				u.moved = 1;
				done();
				return;
			}
			previewTiles(u, 0, () => performMove(u, moves[best].x, moves[best].y, done));
		}));
		return;
	}

	const moves = u.moves();
	let stayS = stayHits.length * 10 + getProbability(u.x, u.y, want);
	if (u.advance) stayS = -1;
	let best = -1;
	let bestS = -999;
	for (let i = 0; i < moves.length; i++) {
		const s = u.hits(moves[i].x, moves[i].y).length * 10 + getProbability(moves[i].x, moves[i].y, want);
		if (s > bestS || (s == bestS && Math.random() < 0.5)) {
			bestS = s;
			best = i;
		}
	}
	if (stayS > bestS && stayHits.length) {
		previewTiles(u, 1, () => performAttack(u, stayHits, done));
	} else if (best < 0 || stayS > bestS || (stayS == bestS && Math.random() < 0.5)) {
		if (stayHits.length) previewTiles(u, 1, () => performAttack(u, stayHits, done));
		else {
			u.moved = 1;
			u.acted = 1;
			done();
		}
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
