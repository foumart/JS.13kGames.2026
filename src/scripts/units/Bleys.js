class Bleys extends Unit {

	constructor(x, y) {
		super(x, y, 1, 0, 7, 3, 7);
	}

	moveRays() {
		return Unit.ROOK;
	}

	attackRays() {
		return Unit.ROOK;
	}
}
