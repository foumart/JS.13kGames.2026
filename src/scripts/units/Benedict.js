class Benedict extends Unit {

	constructor(x, y) {
		super(x, y, 1, 0, 10, 4, 12, 1, 2, unitPalettes[12]);
	}

	moveRays() {
		return Unit.BISHOP;
	}

}
