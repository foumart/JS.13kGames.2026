function act(dx, dy) {
	if (moving || state != 1 || clearTimer) return;
	const nx = player.x + dx;
	const ny = player.y + dy;
	if (isPassable(nx, ny, dx, dy)) player.moveTo(dx, dy);
	else if (isPrevPath(nx, ny)) player.retractTo(dx, dy);
}

function gameStart() {
	cancelAnimationFrame(gameLoop);
	doAnimationFrame();
}

function doAnimationFrame() {
	drawBoard();
	gameLoop = requestAnimationFrame(doAnimationFrame);
}

function resetLevel() {
	initBoard();
	gameDirty = 1;
	drawBoard();
}
