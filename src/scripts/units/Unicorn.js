class Unicorn extends Unit {

	constructor(x, y) {
		super(x, y, 0, 0, 5, 2, 0);
		this.hero = 1;
		this.around = 1;
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

	attackRays() {
		return Unit.ROOK;
	}

	drawBmp() {
		return this.offsetX || this.offsetY ? 1 : this.bmp;
	}
}
