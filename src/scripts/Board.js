let boardWidth;
let boardHeight;
let cellSize = 1;
let boardOffsetX = 0;
let boardOffsetY = 0;

let enemies = [];
let pathData = [];
let pathStep = [];
let fillData = [];
let player;
let moving = 0;
let gameDirty = 1;
let gameLoop;
let pathCount = 0;
let state = 1; // 1 play, 2 win, 3 lose

// 0 empty, 1 enemy, 2 player — dynamic w/h from rows
const levelData = [
	"000000000",
	"010001000",
	"000010010",
	"000000000",
	"000200100",
	"000000000",
	"001100000",
	"000000001"
];

function inBounds(x, y) {
	return x >= 0 && y >= 0 && x < boardWidth && y < boardHeight;
}

function initBoard() {
	boardHeight = levelData.length;
	boardWidth = levelData[0].length;
	enemies = [];
	pathData = [];
	pathStep = [];
	fillData = [];
	pathCount = 0;
	state = 1;
	moving = 0;

	let startX = 0;
	let startY = 0;

	for (let y = 0; y < boardHeight; y++) {
		enemies[y] = [];
		pathData[y] = [];
		pathStep[y] = [];
		fillData[y] = [];
		for (let x = 0; x < boardWidth; x++) {
			const c = levelData[y].charAt(x);
			enemies[y][x] = c == "1" ? 1 : 0;
			pathData[y][x] = 0;
			pathStep[y][x] = 0;
			fillData[y][x] = 0;
			if (c == "2") {
				startX = x;
				startY = y;
			}
		}
	}

	player = new Player(startX, startY);
	placeStartPath(startX, startY);
	buildRainbowBackdrop();
}

function isPassable(x, y) {
	return inBounds(x, y) && !enemies[y][x] && !pathStep[y][x] && !fillData[y][x];
}

function enemyCount() {
	let n = 0;
	for (let y = 0; y < boardHeight; y++) {
		for (let x = 0; x < boardWidth; x++) {
			if (enemies[y][x]) n ++;
		}
	}
	return n;
}

function hasMove() {
	return isPassable(player.x + 1, player.y)
		|| isPassable(player.x - 1, player.y)
		|| isPassable(player.x, player.y + 1)
		|| isPassable(player.x, player.y - 1);
}

function getClusters() {
	const seen = [];
	const clusters = [];
	for (let y = 0; y < boardHeight; y++) {
		seen[y] = [];
		for (let x = 0; x < boardWidth; x++) seen[y][x] = 0;
	}

	for (let y = 0; y < boardHeight; y++) {
		for (let x = 0; x < boardWidth; x++) {
			if (!enemies[y][x] || seen[y][x]) continue;
			const cluster = [];
			const stack = [[x, y]];
			seen[y][x] = 1;
			while (stack.length) {
				const cur = stack.pop();
				const cx = cur[0];
				const cy = cur[1];
				cluster.push(cur);
				const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
				for (let i = 0; i < 4; i++) {
					const nx = cx + dirs[i][0];
					const ny = cy + dirs[i][1];
					if (inBounds(nx, ny) && enemies[ny][nx] && !seen[ny][nx]) {
						seen[ny][nx] = 1;
						stack.push([nx, ny]);
					}
				}
			}
			clusters.push(cluster);
		}
	}
	return clusters;
}

function isClusterSurrounded(cluster) {
	for (let i = 0; i < cluster.length; i++) {
		const x = cluster[i][0];
		const y = cluster[i][1];
		const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
		for (let d = 0; d < 4; d++) {
			const nx = x + dirs[d][0];
			const ny = y + dirs[d][1];
			if (!inBounds(nx, ny)) continue; // map edge seals that side
			let inCluster = 0;
			for (let j = 0; j < cluster.length; j++) {
				if (cluster[j][0] == nx && cluster[j][1] == ny) inCluster = 1;
			}
			if (inCluster) continue;
			if (!isPath(nx, ny)) return 0;
		}
	}
	return 1;
}

function captureCluster(cluster) {
	for (let i = 0; i < cluster.length; i++) {
		const x = cluster[i][0];
		const y = cluster[i][1];
		enemies[y][x] = 0;
		fillData[y][x] = 1;
	}
}

function checkCaptures() {
	const clusters = getClusters();
	for (let i = 0; i < clusters.length; i++) {
		if (isClusterSurrounded(clusters[i])) captureCluster(clusters[i]);
	}
	if (!enemyCount()) state = 2;
	else if (!hasMove()) state = 3;
}

function drawBoard() {
	gameContext.clearRect(0, 0, gameCanvas.width, gameCanvas.height);

	const size = Math.min(gameCanvas.width / boardWidth, gameCanvas.height / boardHeight);
	cellSize = size;
	boardOffsetX = (gameCanvas.width - boardWidth * size) / 2;
	boardOffsetY = (gameCanvas.height - boardHeight * size) / 2;

	for (let y = 0; y < boardHeight; y++) {
		for (let x = 0; x < boardWidth; x++) {
			const px = boardOffsetX + x * size;
			const py = boardOffsetY + y * size;

			const purified = fillData[y][x] || (pathStep[y][x] && (x != player.x || y != player.y));
			if (purified) {
				drawPurifiedTile(x, y);
			} else {
				gameContext.drawImage(offscreenBitmaps[0], 0, 0, tileWidth, tileWidth, px, py, size, size);
			}

			if (pathStep[y][x]) {
				drawRainbowPath(x, y, pathData[y][x], pathStep[y][x]);
			}

			if (enemies[y][x]) {
				gameContext.drawImage(offscreenBitmaps[1], 0, 0, tileWidth, tileWidth, px, py, size, size);
			}
		}
	}

	player.resize();
	player.draw();

	if (state > 1) {
		gameContext.fillStyle = state == 2 ? "#ffe066cc" : "#00000099";
		gameContext.fillRect(0, 0, gameCanvas.width, gameCanvas.height);
		gameContext.fillStyle = "#fff";
		gameContext.font = (size * 0.8 | 0) + "px sans-serif";
		gameContext.textAlign = "center";
		gameContext.textBaseline = "middle";
		gameContext.fillText(state == 2 ? "CLEAR!" : "STUCK — R", gameCanvas.width / 2, gameCanvas.height / 2);
	}

	gameDirty = 0;
}
