const gameContext = gameCanvas.getContext("2d");

let width;
let height;
let portrait
setLayout();
let pinch;

function init() {
	window.addEventListener("resize", resize);
	document.addEventListener("keydown", onKeyDown, true);
	document.addEventListener("keydown", initSound);
	document.addEventListener("pointerdown", initSound);
	gameCanvas.addEventListener("pointerdown", battleClick);
	gameCanvas.addEventListener("pointermove", battleHover);
	gameCanvas.addEventListener("pointerleave", battleHover);
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

	document.oncontextmenu = e => { e.preventDefault(); };

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
	//console.log(showPick, showObjective, showUpgrade, showEnd, stageCaptive, battleActive, battleResult);
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
