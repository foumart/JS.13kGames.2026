function RNG(n) { return Math.random() * n | 0 }

function act(dx, dy) {
	if (moving || state != 1 || menu || showObjective) return;
	const nx = player.x + dx;
	const ny = player.y + dy;
	if (isPassable(nx, ny, dx, dy)) player.moveTo(dx, dy);
	else if (isPrevPath(nx, ny)) player.retractTo(dx, dy);
	else startRetract(nx, ny);
}

function puzzleMoveAt(x, y) {
	if (!player || moving || state != 1 || menu || showObjective || showEnd) return 0;
	const dx = x - player.x;
	const dy = y - player.y;
	if (Math.abs(dx) + Math.abs(dy) != 1) return 0;
	return isPassable(x, y, dx, dy) || isPrevPath(x, y) ? [dx, dy] : 0;
}

function puzzleClick(event) {
	const cell = getPosFromEvent(event);
	if (!cell || cell.x == player.x && cell.y == player.y) return;
	const dir = puzzleMoveAt(cell.x, cell.y);
	if (dir) act(dir[0], dir[1]);
	else startRetract(cell.x, cell.y);
}

function gameStart() {
	cancelAnimationFrame(gameLoop);
	doAnimationFrame();
}

function doAnimationFrame() {
	if (menu == 2) return;
	time = Date.now();
	drawBoard();
	pulseSparkles();
	gameLoop = requestAnimationFrame(doAnimationFrame);
}

function redraw() {
	gameContext.clearRect(0, 0, width, height);
	drawBoard();
	updateUI();
}

function resetLevel() {
	initBoard();
	redraw();
}
