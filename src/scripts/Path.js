let rainbowCanvas;

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
}

function extendPath(ox, oy, nx, ny, dx, dy) {
	pathCount ++;
	pathStep[ny][nx] = pathCount;
	pathData[oy][ox] |= dirMask(dx, dy);
	pathData[ny][nx] |= dirMask(-dx, -dy);
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

function drawRainbowPath(x, y, mask, step) {
	const w = cellSize;
	const cx = boardOffsetX + x * w + w / 2;
	const cy = boardOffsetY + y * w + w / 2;
	const hue = (step * 28) % 360;
	const thick = w * 0.62;
	const arm = w * 0.5;

	gameContext.strokeStyle = "hsl(" + hue + ",85%,55%)";
	gameContext.fillStyle = "hsl(" + hue + ",90%,65%)";
	gameContext.lineWidth = thick;
	gameContext.lineCap = "butt";
	gameContext.lineJoin = "round";

	gameContext.beginPath();
	if (mask & 1) {
		gameContext.moveTo(cx, cy);
		gameContext.lineTo(cx, cy - arm);
	}
	if (mask & 2) {
		gameContext.moveTo(cx, cy);
		gameContext.lineTo(cx + arm, cy);
	}
	if (mask & 4) {
		gameContext.moveTo(cx, cy);
		gameContext.lineTo(cx, cy + arm);
	}
	if (mask & 8) {
		gameContext.moveTo(cx, cy);
		gameContext.lineTo(cx - arm, cy);
	}
	gameContext.stroke();

	gameContext.beginPath();
	gameContext.arc(cx, cy, thick * 0.5, 0, Math.PI * 2);
	gameContext.fill();
}
