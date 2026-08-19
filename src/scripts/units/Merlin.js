class Merlin extends Unit {

	constructor(x, y) {
		super(x, y, 2, 0, 5, 3, 4);
	}

	attackRays() {
		return Unit.ROOK;
	}
}
