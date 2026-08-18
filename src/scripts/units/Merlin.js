class Merlin extends Unit {

	constructor(x, y) {
		super(x, y, 2, 0, 6, 2, 4);
	}

	moves() {
		return this.stepMoves(Unit.QUEEN, 1);
	}

	attackRays() {
		return Unit.REAR;
	}
}
