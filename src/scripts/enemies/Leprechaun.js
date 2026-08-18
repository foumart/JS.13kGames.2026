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
}
