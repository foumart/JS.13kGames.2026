class Fiona extends Unit {

	constructor(x, y) {
		super(x, y, 1, 0, 3, 2, 5, 0, 2);
	}

	attackRays() {
		return Unit.BISHOP;
	}
}
