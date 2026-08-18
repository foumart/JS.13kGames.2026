class Unit {

	constructor(x, y, type, enemy, hp, dmg, bmp) {
		this.type = type;
		this.enemy = enemy;
		this.x = x;
		this.y = y;
		this.hp = hp;
		this.hpMax = hp;
		this.dmg = dmg;
		this.bmp = bmp;
		this.moved = 0;
		this.acted = 0;
		this.offsetX = 0;
		this.offsetY = 0;
		this.shake = 0;
		this.face = enemy ? 1 : -1;
		this.advance = 0;
	}

	stepMoves(dirs, max) {
		const m = [];
		for (let r = 0; r < dirs.length; r++) {
			for (let i = 1; i <= max; i++) {
				const nx = this.x + dirs[r][0] * i;
				const ny = this.y + dirs[r][1] * i;
				if (!isMapEmptyAt(nx, ny)) break;
				m.push({x: nx, y: ny});
			}
		}
		return m;
	}

	moves() {
		return this.stepMoves(Unit.REAR, 1);
	}

	attackRays() {
		return Unit.DIAGONAL;
	}

	hits(ox, oy) {
		let best = null;
		let bestD = 99;
		const rays = this.attackRays();
		for (let r = 0; r < rays.length; r++) {
			for (let i = 1; i < 9; i++) {
				const nx = ox + rays[r][0] * i;
				const ny = oy + rays[r][1] * i;
				if (nx < 0 || ny < 0 || nx >= battleWidth || ny >= battleHeight) break;
				const t = getUnitAt(nx, ny);
				if (t) {
					if (t.enemy != this.enemy && (i < bestD || (i == bestD && Math.random() < 0.5))) {
						bestD = i;
						best = t;
					}
					break;
				}
			}
		}
		return best ? [best] : [];
	}

	actHits(x, y) {
		const t = rayTarget(this, x, y);
		return t ? [t] : [];
	}

	addAttackTiles(allowClick) {
		if (allowClick == null) allowClick = 1;
		const rays = this.attackRays();
		for (let r = 0; r < rays.length; r++) {
			const cells = [];
			let found = 0;
			for (let i = 1; i < 9; i++) {
				const nx = this.x + rays[r][0] * i;
				const ny = this.y + rays[r][1] * i;
				if (nx < 0 || ny < 0 || nx >= battleWidth || ny >= battleHeight) break;
				const t = getUnitAt(nx, ny);
				if (!t) {
					cells.push({x: nx, y: ny, occ: 0});
				} else {
					if (t.enemy != this.enemy) {
						found = 1;
						cells.push({x: nx, y: ny, occ: 1});
					}
					break;
				}
			}
			for (let i = 0; i < cells.length; i++) {
				battleTiles.push({
					x: cells[i].x, y: cells[i].y, kind: 1,
					live: allowClick && found && !cells[i].occ ? 1 : 0
				});
			}
		}
	}

	draw(size) {
		const px = boardOffsetX + (this.x + this.offsetX) * size + (this.shake ? Math.sin(this.shake * 24) * this.shake * size * 0.16 : 0);
		const py = boardOffsetY + (this.y + this.offsetY) * size + (this.shake ? Math.cos(this.shake * 17) * this.shake * size * 0.08 : 0);
		const bmp = unitBitmaps[this.drawBmp()];
		const scale = size / tileWidth * unitScale;
		const dw = bmp.width * scale;
		const dh = bmp.height * scale;
		const hop = (this.offsetX || this.offsetY)
			? Math.sin(Math.PI * Math.max(Math.abs(this.offsetX), Math.abs(this.offsetY))) * size * 0.22
			: 0;
		gameContext.save();
		gameContext.translate(px + size / 2, py + size / 2 - hop);
		gameContext.scale(this.face, 1);
		gameContext.drawImage(bmp, 0, 0, bmp.width, bmp.height, -dw / 2, -dh / 2, dw, dh);
		gameContext.restore();
	}

	drawBmp() {
		return this.bmp;
	}

	drawPortrait(x, y, pic) {
		drawUnitIcon(this.bmp, x + pic / 2, y + pic / 2, pic);
	}
}

Unit.REAR = [[1, 0], [-1, 0], [0, 1], [0, -1]];
Unit.DIAGONAL = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
Unit.QUEEN = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
Unit.KNIGHT = [[1, -2], [-1, -2], [2, -1], [-2, -1], [1, 2], [-1, 2], [2, 1], [-2, 1]];
