class Leprechaun extends Unit {

	constructor(x, y) {
		super(x, y, 3, 1, 2, 1, 2);
		this.advance = 1;
		this.strikeFirst = 1;
	}

	moveRays() {
		return Unit.ROOK;
	}

	attackRays() {
		return Unit.BISHOP;
	}
}
