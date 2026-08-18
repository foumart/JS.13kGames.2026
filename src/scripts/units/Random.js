class Random extends Unit {

	constructor(x, y) {
		super(x, y, 1, 0, 5, 2, 9);
	}

	moves() {
		return this.stepMoves(Unit.REAR, 1);
	}

	attackRays() {
		return Unit.DIAGONAL;
	}
}
