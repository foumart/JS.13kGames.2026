class Corwin extends Unit {

	constructor(x, y) {
		super(x, y, 1, 0, 9, 3, 11, unitPalettes[11], 2);
	}

	attackRays() {
		return Unit.KNIGHT;
	}
}
