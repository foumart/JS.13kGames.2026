class Random extends Unit {

	constructor(x, y) {
		super(x, y, 1, 0, 8, 2, 6, 0, 2);
	}

	moveRays() {
		return Unit.ROOK;
	}

	attackRays() {
		return Unit.ROOK;
	}
}
