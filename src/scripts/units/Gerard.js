class Gerard extends Unit {

	constructor(x, y) {
		super(x, y, 1, 0, 12, 4, 13, unitPalettes[13]);
	}

	moveRays() {
		return Unit.ROOK;
	}

	attackRays() {
		return Unit.ROOK;
	}
}
