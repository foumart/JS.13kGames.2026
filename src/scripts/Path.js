let rainbowCanvas;
let pathTrail = [];

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

// Rainbow background: tileWidth*boardW × tileWidth*boardH, 45 degrees gradient
function buildRainbowBackdrop() {
	const bw = tileWidth * boardWidth;
	const bh = tileWidth * boardHeight;
	rainbowCanvas = document.createElement("canvas");
	rainbowCanvas.width = bw;
	rainbowCanvas.height = bh;
	const ctx = rainbowCanvas.getContext("2d");
	const cycles = 7;
	const denom = bw + bh - 2 || 1;

	for (let y = 0; y < bh; y++) {
		for (let x = 0; x < bw; x++) {
			const t = (x + y) / denom;
			const hue = (t * 360 * cycles) % 360;
			ctx.fillStyle = "hsl(" + hue + ",85%,58%)";
			ctx.fillRect(x, y, 1, 1);
		}
	}
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

// Rainbow along path - hue shift over time
function drawFlowingPath() {
	const n = pathTrail.length;
	if (!n) return;

	const w = cellSize;
	const thick = w * 0.33;
	const border = w * 0.08;
	const band = w * 0.45;
	const shift = Date.now() * 0.12;
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
		gameContext.fillStyle = "hsl(" + (shift % 360) + ",85%,55%)";
		gameContext.beginPath();
		gameContext.arc(pts[0].x, pts[0].y, thick / 2, 0, Math.PI * 2);
		gameContext.fill();
		return;
	}

	// White border under the rainbow
	gameContext.strokeStyle = "#fff";
	gameContext.lineWidth = thick + border * 2;
	gameContext.beginPath();
	gameContext.moveTo(pts[0].x, pts[0].y);
	for (let i = 1; i < n; i++) {
		gameContext.lineTo(pts[i].x, pts[i].y);
	}
	gameContext.stroke();

	let s = 0;
	gameContext.lineWidth = thick;
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
