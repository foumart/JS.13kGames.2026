class Benedict extends Unit {

	constructor(x, y) {
		super(x, y, 1, 0, 10, 4, 12, unitPalettes[12], 1, 2);
	}

	moveRays() {
		return Unit.BISHOP;
	}

}
