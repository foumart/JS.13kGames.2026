class Benedict extends Unit {

	constructor(x, y) {
		super(x, y, 1, 0, 10, 3, 7);
	}

	moves() {
		return this.stepMoves(Unit.DIAGONAL, 2);
	}

	attackRays() {
		return Unit.QUEEN;
	}
}
