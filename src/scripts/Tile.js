class Tile {

	constructor(x, y, type) {
		this.x = x;
		this.y = y;
		this.type = type;
		this.resize();
	}

	resize() {
		this.width = gameCanvas.width / boardWidth;
		this.height = this.width;
	}

	getX() {
		return this.x * this.width;
	}

	getY() {
		return this.y * this.height;
	}

	draw() {
		gameContext.drawImage(
			offscreenBitmaps[this.type],
			0, 0, tileWidth, tileWidth,
			this.getX(),
			this.getY(),
			this.width,
			this.height
		);
	}
}
