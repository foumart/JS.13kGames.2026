function act(dx, dy) {
	if (moving || state != 1) return;
	if (!isPassable(player.x + dx, player.y + dy)) return;
	player.moveTo(dx, dy);
}

function gameStart() {
	cancelAnimationFrame(gameLoop);
	doAnimationFrame();
}

function doAnimationFrame() {
	if (gameDirty) drawBoard();
	gameLoop = requestAnimationFrame(doAnimationFrame);
}

function resetLevel() {
	initBoard();
	gameDirty = 1;
	drawBoard();
}
