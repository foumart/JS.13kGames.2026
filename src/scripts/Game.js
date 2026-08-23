function act(dx, dy) {
	if (moving || state != 1 || showObjective) return;
	const nx = player.x + dx;
	const ny = player.y + dy;
	if (isPassable(nx, ny, dx, dy)) player.moveTo(dx, dy);
	else if (isPrevPath(nx, ny)) player.retractTo(dx, dy);
}

function puzzleMoveAt(x, y) {
	if (!player || moving || state != 1 || showObjective || showEnd) return 0;
	const dx = x - player.x;
	const dy = y - player.y;
	if (Math.abs(dx) + Math.abs(dy) != 1) return 0;
	return isPassable(x, y, dx, dy) || isPrevPath(x, y) ? [dx, dy] : 0;
}

function puzzleClick(event) {
	const cell = getPosFromEvent(event);
	if (!cell) return;
	const dir = puzzleMoveAt(cell.x, cell.y);
	if (dir) act(dir[0], dir[1]);
}

function redraw() {
	//if (battleActive) drawBattle();
	//else
	drawBoard();
}

function gameStart() {
	cancelAnimationFrame(gameLoop);
	doAnimationFrame();
}

function doAnimationFrame() {
	time = Date.now();
	redraw();
	gameLoop = requestAnimationFrame(doAnimationFrame);
}

function resetLevel() {
	initBoard();
	drawBoard();
}
