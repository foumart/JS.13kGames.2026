class Unit {

	constructor(d, x, y, type) {
		let i = 0;
		this.name = d[i++];
		this.hp = d[i++];
		this.dmg = d[i++];
		this.mv = d[i++];
		this.atk = d[i++];
		this.bgr = d[i++];
		this.palette = typeof d[i] == "number" || typeof d[i] == "string" ? d[i++] : 0;
		this.x = x;
		this.y = y;
		this.type = type || (UNITS.indexOf(d) ? 1 : 0);
		this.hpMax = this.hp;
		this.bmp = this.bgr;
		this.enemy = this.type > 2;
		this.hero = !this.type;
		this.around = this.hero || this.type == 4;
		this.advance = this.type == 3;
		this.lockRange = d[i] == 0;
		this.lockReach = d[i + 1] == 0;
		this.range = d[i] || 1;
		this.reach = d[i + 1] || 1;
		this.moved = 0;
		this.acted = 0;
		this.offsetX = 0;
		this.offsetY = 0;
		this.shake = 0;
		this.face = this.enemy ? 1 : -1;
	}

	stepMoves(dirs, max) {
		if (max == null) max = this.range;
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
		return this.stepMoves(this.moveRays());
	}

	attackRays() {
		return Unit.RAY[this.atk] || Unit.QUEEN;
	}

	moveRays() {
		return Unit.RAY[this.mv] || Unit.QUEEN;
	}

	hits(ox, oy) {
		const rays = this.attackRays();
		if (this.around) {
			const hits = [];
			for (let r = 0; r < rays.length; r++) {
				for (let i = 1; i <= this.around; i++) {
					const nx = ox + rays[r][0] * i;
					const ny = oy + rays[r][1] * i;
					if (!inBounds(nx, ny)) break;
					if (hasObstacle(nx, ny)) break;
					const t = getUnitAt(nx, ny);
					if (t) {
						if (t.enemy != this.enemy) hits.push(t);
						break;
					}
				}
			}
			return hits;
		}
		let best = null;
		let bestD = 99;
		for (let r = 0; r < rays.length; r++) {
			for (let i = 1; i <= this.reach; i++) {
				const nx = ox + rays[r][0] * i;
				const ny = oy + rays[r][1] * i;
				if (!inBounds(nx, ny)) break;
				if (hasObstacle(nx, ny)) break;
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
		if (this.around) return this.hits(this.x, this.y);
		const t = rayTarget(this, x, y);
		return t ? [t] : [];
	}

	addAttackTiles(allowClick) {
		if (allowClick == null) allowClick = 1;
		const rays = this.attackRays();
		if (this.around) {
			const found = this.hits(this.x, this.y);
			for (let r = 0; r < rays.length; r++) {
				for (let i = 1; i <= this.around; i++) {
					const nx = this.x + rays[r][0] * i;
					const ny = this.y + rays[r][1] * i;
					if (!inBounds(nx, ny)) break;
					if (hasObstacle(nx, ny)) break;
					const t = getUnitAt(nx, ny);
					if (t && t.enemy == this.enemy) break;
					battleTiles.push({
						x: nx, y: ny, kind: 1,
						live: allowClick && found.length && !t ? 1 : 0
					});
					if (t) break;
				}
			}
			return;
		}
		for (let r = 0; r < rays.length; r++) {
			const cells = [];
			let found = 0;
			for (let i = 1; i <= this.reach; i++) {
				const nx = this.x + rays[r][0] * i;
				const ny = this.y + rays[r][1] * i;
				if (!inBounds(nx, ny)) break;
				if (hasObstacle(nx, ny)) break;
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
		const bmp = unitBitmaps[(this.offsetX || this.offsetY) && !this.bgr ? 1 : this.bgr];
		const scale = size / tileWidth * unitScale;
		const dw = bmp.width * scale;
		const dh = bmp.height * scale;
		const hop = (this.offsetX || this.offsetY)
			? Math.sin(Math.PI * Math.max(Math.abs(this.offsetX), Math.abs(this.offsetY))) * size * 0.22
			: 0;
		gameContext.save();
		gameContext.translate(px + size / 2, py + size / 2 - hop);
		gameContext.scale(this.face, 1);
		//if (this.palette) drawPaletted(bmp, this.palette, -dw / 2, -dh / 2, dw, dh, gameContext);
		//else gameContext.drawImage(bmp, 0, 0, bmp.width, bmp.height, -dw / 2, -dh / 2, dw, dh);
		drawPaletted(bmp, this.palette, -dw / 2, -dh / 2, dw, dh, gameContext);
		gameContext.restore();
	}

	drawPortrait(x, y, pic) {
		drawUnitIcon(this, x + pic / 2, y + pic / 2, pic);
	}
}

Unit.ROOK = [[1, 0], [-1, 0], [0, 1], [0, -1]];
Unit.BISHOP = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
Unit.QUEEN = [...Unit.ROOK, ...Unit.BISHOP];
Unit.KNIGHT = [[1, -2], [-1, -2], [2, -1], [-2, -1], [1, 2], [-1, 2], [2, 1], [-2, 1]];
Unit.RAY = [Unit.QUEEN, Unit.ROOK, Unit.BISHOP, Unit.KNIGHT];
