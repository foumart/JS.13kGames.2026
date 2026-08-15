function act(dx, dy) {
	if (moving || state != 1 || clearTimer) return;
	if (!isPassable(player.x + dx, player.y + dy)) return;
	player.moveTo(dx, dy);
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
