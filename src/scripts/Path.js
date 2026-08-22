let rainbowCanvas;
let pathTrail = [];
let rainbowPulse = 0;
let rainbowAnim = 0;
let rainbowStart = 0;
let rainbowDone = 0;

// N=1 E=2 S=4 W=8
function dirMask(dx, dy) {
	if (dy < 0) return 1;
	if (dx > 0) return 2;
	if (dy > 0) return 4;
	if (dx < 0) return 8;
	return 0;
}

function isPath(x, y) {
	return inBounds(x, y) && pathStep[y][x] > 0;
}

function isFill(x, y) {
	return inBounds(x, y) && fillData[y][x] > 0;
}

function placeStartPath(x, y) {
	pathCount = 1;
	pathStep[y][x] = 1;
	pathData[y][x] = 0;
	pathTrail = [[x, y]];
}

function extendPath(ox, oy, nx, ny, dx, dy) {
	pathCount ++;
	pathStep[ny][nx] = pathCount;
	pathData[oy][ox] |= dirMask(dx, dy);
	pathData[ny][nx] |= dirMask(-dx, -dy);
	pathTrail.push([nx, ny]);
}

function canRetract() {
	return pathTrail.length > 1;
}

function isPrevPath(x, y) {
	if (!canRetract()) return 0;
	const p = pathTrail[pathTrail.length - 2];
	return p[0] == x && p[1] == y;
}

// Pull trail + tip floor off immediately so undo never flashes rainbow under the hop
function beginRetractPath() {
	const cur = pathTrail.pop();
	const cx = cur[0];
	const cy = cur[1];
	const prev = pathTrail[pathTrail.length - 1];
	const dx = cx - prev[0];
	const dy = cy - prev[1];
	pathData[prev[1]][prev[0]] &= ~dirMask(dx, dy);
	let still = 0;
	for (let i = 0; i < pathTrail.length; i++) {
		if (pathTrail[i][0] == cx && pathTrail[i][1] == cy) still = 1;
	}
	if (!still) {
		if (fillData[cy][cx]) {
			pathStep[cy][cx] = 1;
		} else {
			pathData[cy][cx] = 0;
			pathStep[cy][cx] = 0;
		}
	} else {
		pathData[cy][cx] &= ~dirMask(-dx, -dy);
	}
	pathCount = pathTrail.length;
}

// Rainbow background: tileWidth*boardW x tileWidth*boardH, 45 degrees gradient
function buildRainbowBackdrop() {
	const bw = tileWidth * boardWidth;
	const bh = tileWidth * boardHeight;
	rainbowCanvas = document.createElement("canvas");
	rainbowCanvas.width = bw;
	rainbowCanvas.height = bh;
	rainbowCanvas.ctx = rainbowCanvas.getContext("2d");
	paintRainbow(0);
}

function paintRainbow(shift) {
	const bw = rainbowCanvas.width;
	const bh = rainbowCanvas.height;
	const ctx = rainbowCanvas.ctx;
	const denom = bw + bh - 2 || 1;
	for (let y = 0; y < bh; y++) {
		for (let x = 0; x < bw; x++) {
			ctx.fillStyle = "hsl(" + ((x + y + shift) / denom * 2520) % 360 + ",85%,58%)";
			ctx.fillRect(x, y, 1, 1);
		}
	}
}

function scrollRainbow() {
	if (!rainbowPulse) rainbowDone = 0;
	if (rainbowPulse && !rainbowAnim && !rainbowDone) {
		rainbowStart = time;
		rainbowAnim = 1;
		rainbowDone = 1;
	}
	if (!rainbowAnim) return;
	const denom = rainbowCanvas.width + rainbowCanvas.height - 2 || 1;
	const t = (time - rainbowStart) / 1000;
	if (t >= 1) {
		paintRainbow(0);
		rainbowAnim = 0;
	} else {
		paintRainbow(t * denom / 7);
	}
}

function pathInk(shift) {
	return state == 2
		? "hsl(" + ((shift == null ? time * 0.1 : shift) % 360) + ",85%,55%)"
		: "hsl(120,85%,55%)";
}

function drawPurifiedTile(x, y) {
	const w = cellSize;
	const px = boardOffsetX + x * w;
	const py = boardOffsetY + y * w;
	gameContext.imageSmoothingEnabled = false;
	gameContext.drawImage(
		rainbowCanvas,
		x * tileWidth, y * tileWidth, tileWidth, tileWidth,
		px, py, w, w
	);
}

// Path trail: green while playing, rainbow when the stage is cleared
function drawFlowingPath() {
	const n = pathTrail.length;
	if (!n) return;

	const w = cellSize;
	const thick = w * 0.33;
	const border = w * 0.12;
	const band = w * 0.45;
	const rainbow = state == 2;
	const shift = time * 0.1;
	const pts = [];

	for (let i = 0; i < n; i++) {
		pts.push({
			x: boardOffsetX + pathTrail[i][0] * w + w / 2,
			y: boardOffsetY + pathTrail[i][1] * w + w / 2
		});
	}

	gameContext.lineCap = "round";
	gameContext.lineJoin = "round";

	if (n == 1) {
		gameContext.fillStyle = "#fff";
		gameContext.beginPath();
		gameContext.arc(pts[0].x, pts[0].y, thick / 2 + border, 0, Math.PI * 2);
		gameContext.fill();
		gameContext.fillStyle = pathInk(shift);
		gameContext.beginPath();
		gameContext.arc(pts[0].x, pts[0].y, thick / 2, 0, Math.PI * 2);
		gameContext.fill();
		return;
	}

	gameContext.strokeStyle = "#fff";
	gameContext.lineWidth = thick + border * 2;
	gameContext.beginPath();
	gameContext.moveTo(pts[0].x, pts[0].y);
	for (let i = 1; i < n; i++) {
		gameContext.lineTo(pts[i].x, pts[i].y);
	}
	gameContext.stroke();

	gameContext.lineWidth = thick;
	if (!rainbow) {
		gameContext.strokeStyle = pathInk();
		gameContext.beginPath();
		gameContext.moveTo(pts[0].x, pts[0].y);
		for (let i = 1; i < n; i++) {
			gameContext.lineTo(pts[i].x, pts[i].y);
		}
		gameContext.stroke();
		return;
	}

	let s = 0;
	for (let i = 0; i < n - 1; i++) {
		const a = pts[i];
		const b = pts[i + 1];
		const dx = b.x - a.x;
		const dy = b.y - a.y;
		const len = Math.abs(dx) + Math.abs(dy);
		const steps = Math.max(1, len / 3 | 0);

		for (let k = 0; k < steps; k++) {
			const t0 = k / steps;
			const t1 = (k + 1) / steps;
			const hue = ((s + t0 * len) / band * 60 + shift) % 360;
			gameContext.strokeStyle = "hsl(" + hue + ",85%,55%)";
			gameContext.beginPath();
			gameContext.moveTo(a.x + dx * t0, a.y + dy * t0);
			gameContext.lineTo(a.x + dx * t1, a.y + dy * t1);
			gameContext.stroke();
		}
		s += len;
	}
}

function drawFillNiches() {
	const w = cellSize;
	const r = w * 0.19;
	const border = w * 0.12;
	const shift = time * 0.1;
	for (let y = 0; y < boardHeight; y++) {
		for (let x = 0; x < boardWidth; x++) {
			if (fillData[y][x] != 2 || (player.x == x && player.y == y)) continue;
			const x0 = boardOffsetX + x * w + w / 2;
			const y0 = boardOffsetY + y * w + w / 2;
			gameContext.fillStyle = "#fff";
			gameContext.beginPath();
			gameContext.arc(x0, y0, r + border, 0, Math.PI * 2);
			gameContext.fill();
			gameContext.fillStyle = "hsl(" + (shift % 360) + ",85%,55%)";
			gameContext.beginPath();
			gameContext.arc(x0, y0, r, 0, Math.PI * 2);
			gameContext.fill();
		}
	}
}
