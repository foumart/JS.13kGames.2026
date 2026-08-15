class Player {

	constructor(x, y) {
		this.x = x;
		this.y = y;
		this.offsetX = 0;
		this.offsetY = 0;
		this.resize();
	}

	resize() {
		this.width = cellSize;
		this.height = cellSize;
	}

	moveTo(dx, dy) {
		const ox = this.x;
		const oy = this.y;
		this.x += dx;
		this.y += dy;
		extendPath(ox, oy, this.x, this.y, dx, dy);
		flushDyingEnemies();
		checkCaptures();
		this.offsetX = -dx;
		this.offsetY = -dy;
		moving = 1;
		TweenFX.to(this, 6, {offsetX: 0, offsetY: 0}, drawBoard, () => {
			moving = 0;
			drawBoard();
		});
	}

	draw() {
		const w = this.width;
		gameContext.drawImage(
			offscreenBitmaps[2],
			0, 0, tileWidth, tileWidth,
			boardOffsetX + (this.x + this.offsetX) * w,
			boardOffsetY + (this.y + this.offsetY) * w,
			w, w
		);
	}
}
