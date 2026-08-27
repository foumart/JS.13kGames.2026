const gameContext = gameCanvas.getContext("2d");

let width;
let height;

function init() {
	window.addEventListener("resize", resize);
	document.addEventListener("keydown", onKeyDown, true);
	gameCanvas.addEventListener("pointerdown", battleClick);
	gameCanvas.addEventListener("pointermove", battleHover);
	gameCanvas.addEventListener("pointerleave", battleHover);
	document.oncontextmenu = e => { e.preventDefault(); };

	initBoard();
	resize();
	gameStart();
}

function resize() {
	width = window.innerWidth;
	height = window.innerHeight;
	mainDiv.style.width = width + "px";
	mainDiv.style.height = height + "px";
	mainDiv.style.left = "0";
	mainDiv.style.top = "0";
	gameCanvas.width = width;
	gameCanvas.height = height;
	gameContext.imageSmoothingEnabled = false;
	redraw();
}
