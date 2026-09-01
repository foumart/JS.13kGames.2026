function dropShadow(s) {
	gameContext.shadowColor = "#534";
	gameContext.shadowOffsetX = -s;
	//gameContext.shadowOffsetY = s;
}

class Player {

	constructor(x, y) {
		this.x = x;
		this.y = y;
		this.offsetX = 0;
		this.offsetY = 0;
		this.face = 1; // 1 = face left, -1 = face right
		this.resize();
	}

	resize() {
		this.width = cellSize;
		this.height = cellSize;
	}

	moveTo(dx, dy) {
		if (dx < 0 || dy < 0) this.face = 1;
		if (dx > 0 || dy > 0) this.face = -1;

		const ox = this.x;
		const oy = this.y;
		this.x += dx;
		this.y += dy;
		this.offsetX = -dx;
		this.offsetY = -dy;
		moving = 1;
		const hopped = collectRescue(this.x, this.y);
		TweenFX.to(this, 6, {offsetX: 0, offsetY: 0}, drawBoard, () => {
			extendPath(ox, oy, this.x, this.y, dx, dy);
			const gold = collectCoin(this.x, this.y);
			moveCount ++;
			const flushed = flushDyingEnemies();
			if (hopped) flushed.push(hopped);
			if (gold) flushed.push(gold);
			checkCaptures(flushed);
			moveLog.push(flushed);
			moving = 0;
			redraw();
		});
	}

	retractTo(dx, dy) {
		if (dx < 0 || dy < 0) this.face = 1;
		if (dx > 0 || dy > 0) this.face = -1;

		const ox = this.x;
		const oy = this.y;
		beginRetractPath();
		this.x += dx;
		this.y += dy;
		this.offsetX = -dx;
		this.offsetY = -dy;
		moving = 1;
		TweenFX.to(this, 6, {offsetX: 0, offsetY: 0}, drawBoard, () => {
			moveCount ++;
			restoreFlushed(moveLog.pop() || []);
			reviveDyingEnemies();
			checkCaptures();
			moving = 0;
			redraw();
		});
	}

	hopBack(dx, dy) {
		if (dx < 0 || dy < 0) this.face = 1;
		if (dx > 0 || dy > 0) this.face = -1;

		beginRetractPath();
		this.x += dx;
		this.y += dy;
		moveCount ++;
		restoreFlushed(moveLog.pop() || []);
		reviveDyingEnemies();
		checkCaptures();
	}

	draw() {
		const cell = this.width;
		const bmp = unitBitmaps[moving ? 1 : 0];
		const scale = cell / tileWidth * unitScale;
		const dw = bmp.width * scale;
		const dh = bmp.height * scale;
		const cx = boardOffsetX + (this.x + this.offsetX) * cell + cell / 2;
		const cy = boardOffsetY + (this.y + this.offsetY) * cell + cell / 2;
		const hop = moving
			? (hopping ? 1 : Math.sin(Math.PI * Math.max(Math.abs(this.offsetX), Math.abs(this.offsetY)))) * cell * 0.22
			: 0;

		gameContext.save();
		gameContext.translate(cx, cy - hop);
		gameContext.scale(this.face, 1);
		dropShadow(scale);
		gameContext.drawImage(bmp, 0, 0, bmp.width, bmp.height, -dw / 2, -dh / 2, dw, dh);
		gameContext.restore();
	}
}
