class Hydra extends Unit {

	constructor(x, y) {
		super(x, y, 4, 1, 5, 2, 5);
	}

	moves() {
		return this.stepMoves(Unit.QUEEN, 1);
	}

	hits(ox, oy) {
		const hits = [];
		for (let i = 0; i < 8; i++) {
			const t = getUnitAt(ox + Unit.QUEEN[i][0], oy + Unit.QUEEN[i][1]);
			if (t && t.enemy != this.enemy) hits.push(t);
		}
		return hits;
	}

	actHits() {
		return this.hits(this.x, this.y);
	}

	addAttackTiles(allowClick) {
		if (allowClick == null) allowClick = 1;
		const found = this.hits(this.x, this.y);
		for (let i = 0; i < 8; i++) {
			const nx = this.x + Unit.QUEEN[i][0];
			const ny = this.y + Unit.QUEEN[i][1];
			if (nx < 0 || ny < 0 || nx >= battleWidth || ny >= battleHeight) continue;
			battleTiles.push({
				x: nx, y: ny, kind: 1,
				live: allowClick && found.length && !getUnitAt(nx, ny) ? 1 : 0
			});
		}
	}
}
