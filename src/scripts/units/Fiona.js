class Fiona extends Unit {

	constructor(x, y) {
		super(x, y, 1, 0, 3, 3, 8);
	}

	moves() {
		return this.stepMoves(Unit.QUEEN, 1);
	}

	attackRays() {
		return Unit.DIAGONAL;
	}
}
