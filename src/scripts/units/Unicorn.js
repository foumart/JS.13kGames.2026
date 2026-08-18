class Unicorn extends Unit {

	constructor(x, y) {
		super(x, y, 0, 0, 5, 2, 0);
		this.hero = 1;
	}

	moves() {
		const m = [];
		for (let i = 0; i < 8; i++) {
			const nx = this.x + Unit.KNIGHT[i][0];
			const ny = this.y + Unit.KNIGHT[i][1];
			if (isMapEmptyAt(nx, ny)) m.push({x: nx, y: ny});
		}
		return m;
	}

	hits(ox, oy) {
		const hits = [];
		for (let i = 0; i < 4; i++) {
			const t = getUnitAt(ox + Unit.REAR[i][0], oy + Unit.REAR[i][1]);
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
		for (let i = 0; i < 4; i++) {
			const nx = this.x + Unit.REAR[i][0];
			const ny = this.y + Unit.REAR[i][1];
			if (nx < 0 || ny < 0 || nx >= battleWidth || ny >= battleHeight) continue;
			battleTiles.push({
				x: nx, y: ny, kind: 1,
				live: allowClick && found.length && !getUnitAt(nx, ny) ? 1 : 0
			});
		}
	}

	drawBmp() {
		return this.offsetX || this.offsetY ? 1 : this.bmp;
	}
}
