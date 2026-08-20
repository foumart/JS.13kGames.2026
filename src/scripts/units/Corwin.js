class Corwin extends Unit {

	constructor(x, y) {
		super(x, y, 1, 0, 9, 3, 11, 2, unitPalettes[11]);
	}

	attackRays() {
		return Unit.KNIGHT;
	}
}
