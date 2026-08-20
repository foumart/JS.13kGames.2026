class Caine extends Unit {

	constructor(x, y) {
		super(x, y, 1, 0, 9, 2, 9, 1, 2);
	}

	moveRays() {
		return Unit.BISHOP;
	}

	attackRays() {
		return Unit.BISHOP;
	}
}
