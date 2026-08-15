function act(dx, dy) {
	if (moving) return;
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
