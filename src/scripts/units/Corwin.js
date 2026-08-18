class Corwin extends Unit {

	constructor(x, y) {
		super(x, y, 1, 0, 3, 1, 3);
	}

	moves() {
		return this.stepMoves(Unit.REAR, 1);
	}

	attackRays() {
		return Unit.DIAGONAL;
	}
}
