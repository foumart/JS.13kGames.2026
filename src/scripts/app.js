const gameContext = gameCanvas.getContext("2d");

let width;
let height;
let portrait
//let pinch;

setLayout();

function init() {
	window.addEventListener("resize", resize);
	document.addEventListener("keydown", onKeyDown, true);
	document.addEventListener("pointerup", pointerUp);
	document.addEventListener("pointercancel", e => swipe = 0);
	gameCanvas.addEventListener("pointerdown", battleClick);
	gameCanvas.addEventListener("pointermove", battleHover);
	gameCanvas.addEventListener("pointerleave", battleHover);
	document.oncontextmenu = e => { e.preventDefault(); };

	/*gameCanvas.addEventListener("touchstart", e => { if (e.touches.length == 2) pinch = pinchGap(e); });

	gameCanvas.addEventListener("touchmove", e => {
		//if (e.touches.length != 2) return;
		//e.preventDefault();
		const gap = pinchGap(e);
		if (pinch) zoomBoard(-(gap - pinch) / 99);
		pinch = gap;
	}, {passive: 0});

	gameCanvas.addEventListener("wheel", e => {
		//e.preventDefault();
		zoomBoard(e.deltaY > 0 ? .2 : -.2);
	}, {passive: 0});*/

	/*const p = new CPlayer();
	p.init(song);
	(function step() {
		if (p.generate() < 1) return setTimeout(step, 0);
		const a = new Audio(URL.createObjectURL(new Blob([p.createWave()], {type: "audio/wav"})));
		a.loop = 1;
		const go = () => a.play();
		go();
		gameCanvas.addEventListener("pointerdown", go, {once: 1});
	})();*/

	initBoard();
	resize();
	gameStart();
}

/*function zoomBoard(z) {
	zoom = Math.max(0, Math.min(3, ((zoom + z) * 10 + .5 | 0) / 10));
}*/

/*function pinchGap(e) {
	const a = e.touches[0], b = e.touches[1];
	return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
}*/

function resize() {
	setLayout();
	mainDiv.style.width = width + "px";
	mainDiv.style.height = height + "px";
	mainDiv.style.left = "0";
	mainDiv.style.top = "0";
	redraw();
}

function setLayout() {
	width = window.innerWidth;
	height = window.innerHeight;
	portrait = width < height;
}
