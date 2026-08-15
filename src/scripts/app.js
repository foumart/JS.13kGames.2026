const gameContext = gameCanvas.getContext("2d");

let width;
let height;

function init() {
	window.addEventListener("resize", resize);
	document.addEventListener("keydown", onKeyDown);
	document.oncontextmenu = e => { e.preventDefault(); };

	initBoard();
	resize();
	gameStart();
}

function resize() {
	const size = Math.min(window.innerWidth, window.innerHeight);
	width = height = size;
	mainDiv.style.width = width + "px";
	mainDiv.style.height = height + "px";
	mainDiv.style.left = ((window.innerWidth - width) / 2 | 0) + "px";
	mainDiv.style.top = ((window.innerHeight - height) / 2 | 0) + "px";
	gameCanvas.width = width;
	gameCanvas.height = height;
	gameContext.imageSmoothingEnabled = false;
	gameDirty = 1;
	drawBoard();
}
