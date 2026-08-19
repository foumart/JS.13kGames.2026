class Fiona extends Unit {

	constructor(x, y) {
		super(x, y, 1, 0, 3, 2, 8, 2);
	}

	attackRays() {
		return Unit.BISHOP;
	}
}
