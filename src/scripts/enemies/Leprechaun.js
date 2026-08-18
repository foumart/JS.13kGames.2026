class Leprechaun extends Unit {

	constructor(x, y) {
		super(x, y, 3, 1, 2, 1, 2);
		this.advance = 1;
		this.strikeFirst = 1;
	}

	moves() {
		return this.stepMoves(Unit.REAR, 1);
	}

	attackRays() {
		return Unit.DIAGONAL;
	}

	draw(size) {
		const px = boardOffsetX + (this.x + this.offsetX) * size + (this.shake ? Math.sin(this.shake * 24) * this.shake * size * 0.16 : 0);
		const py = boardOffsetY + (this.y + this.offsetY) * size + (this.shake ? Math.cos(this.shake * 17) * this.shake * size * 0.08 : 0);
		drawLeprechaunSprite(px, py, size, 0.004, this.x, this.y);
	}

	drawPortrait(x, y, pic) {
		drawLeprechaunSprite(x, y, pic, 0.004, 0, 0);
	}
}
