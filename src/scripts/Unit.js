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
		this.around = this.hero || this.type == 4 || this.atk == 4;
		this.advance = this.type == 3;
		this.lockRange = d[i] == 0;
		this.lockReach = d[i + 1] == 0;
		this.range = d[i] || 1;
		this.reach = d[i + 1] || 1;
		// move and attack rays grow apart, so each carries its own reach per direction
		const up = this.enemy ? [0, 0, 0, 0] : allyMod(this.name);
		const gm = growRay(this.mv, this.range, up[2], 0);
		const ga = growRay(this.atk, this.reach, up[3], 1);
		this.mvRay = rayList(gm);
		this.atkRay = rayList(ga);
		this.mvMax = Math.max(gm[0], gm[1]) || 1;
		this.atkMax = Math.max(ga[0], ga[1]) || 1;
		this.moved = 0;
		this.acted = 0;
		this.offsetX = 0;
		this.offsetY = 0;
		this.shake = 0;
		this.face = this.enemy ? 1 : -1;
	}

	moves() {
		const m = [];
		const rays = this.mvRay;
		for (let r = 0; r < rays.length; r++) {
			for (let i = 1; i <= rays[r][2]; i++) {
				const nx = this.x + rays[r][0] * i;
				const ny = this.y + rays[r][1] * i;
				if (!isMapEmptyAt(nx, ny)) break;
				m.push({x: nx, y: ny});
			}
		}
		return m;
	}

	// One pass over the attack rays: per ray, the empty tiles crossed and the first foe
	rayScan(ox, oy) {
		const out = [];
		const rays = this.atkRay;
		for (let r = 0; r < rays.length; r++) {
			const cells = [];
			let foe = null;
			for (let i = 1; i <= rays[r][2]; i++) {
				const nx = ox + rays[r][0] * i;
				const ny = oy + rays[r][1] * i;
				if (!inBounds(nx, ny) || hasObstacle(nx, ny)) break;
				const t = getUnitAt(nx, ny);
				if (t) {
					if (t.enemy != this.enemy) foe = t;
					break;
				}
				cells.push([nx, ny]);
			}
			out.push([cells, foe]);
		}
		return out;
	}

	hits(ox, oy) {
		const scan = this.rayScan(ox, oy);
		const out = [];
		let bestD = 99;
		for (let i = 0; i < scan.length; i++) {
			const foe = scan[i][1];
			if (!foe) continue;
			// an "around" unit strikes every ray at once, the rest pick the nearest
			if (this.around) out.push(foe);
			else {
				const d = scan[i][0].length;
				if (d < bestD || (d == bestD && Math.random() < 0.5)) {
					bestD = d;
					out[0] = foe;
				}
			}
		}
		return out;
	}

	// the aimed tile picks the ray - a knight leap has no line to walk back along
	actHits(x, y) {
		if (this.around) return this.hits(this.x, this.y);
		const scan = this.rayScan(this.x, this.y);
		for (let i = 0; i < scan.length; i++) {
			const cells = scan[i][0];
			const foe = scan[i][1];
			if (!foe) continue;
			if (foe.x == x && foe.y == y) return [foe];
			for (let j = 0; j < cells.length; j++) {
				if (cells[j][0] == x && cells[j][1] == y) return [foe];
			}
		}
		return [];
	}

	addAttackTiles(allowClick) {
		if (allowClick == null) allowClick = 1;
		const scan = this.rayScan(this.x, this.y);
		let any = 0;
		for (let i = 0; i < scan.length; i++) if (scan[i][1]) any = 1;
		for (let i = 0; i < scan.length; i++) {
			const cells = scan[i][0];
			const foe = scan[i][1];
			const live = allowClick && (this.around ? any : foe) ? 1 : 0;
			for (let j = 0; j < cells.length; j++) {
				battleTiles.push({x: cells[j][0], y: cells[j][1], kind: 1, live});
			}
			if (foe) battleTiles.push({x: foe.x, y: foe.y, kind: 1, live: 0});
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
