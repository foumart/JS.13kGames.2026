class Player {

	constructor(x, y) {
		this.x = x;
		this.y = y;
		this.offsetX = 0;
		this.offsetY = 0;
		this.resize();
	}

	resize() {
		this.width = gameCanvas.width / boardWidth;
		this.height = this.width;
	}

	moveTo(dx, dy) {
		this.x += dx;
		this.y += dy;
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
			offscreenBitmaps[3],
			0, 0, tileWidth, tileWidth,
			(this.x + this.offsetX) * w,
			(this.y + this.offsetY) * w,
			w, w
		);
	}
}
