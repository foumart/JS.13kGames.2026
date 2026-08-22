class Leprechaun extends Unit {

	constructor(x, y, kind) {
		kind = kind || 1;
		const hp = kind == 4 ? 6 : kind == 3 ? 5 : 2;
		const dmg = kind > 2 ? 2 : 1;
		const reach = kind == 4 ? 2 : kind == 2 ? 5 : 1;
		super(x, y, 3, 1, hp, dmg, 2, leprechaunPalettes[kind - 1], 1, reach);
		this.advance = 1;
		this.strikeFirst = 1;
		this.level = kind;
	}

	moveRays() {
		return Unit.ROOK;
	}

	attackRays() {
		return Unit.BISHOP;
	}
}
