const boardWidth = 9;
let field = [];
let mapData = [];
let player;
let moving = 0;
let gameDirty = 1;
let gameLoop;

// 0 water, 1 land, 2 wall
mapData = [
	[0,0,0,0,0,0,0,0,0],
	[0,2,2,1,1,1,2,2,0],
	[0,2,1,1,1,1,1,2,0],
	[0,1,1,1,1,1,1,1,0],
	[0,1,1,1,1,1,1,1,0],
	[0,1,1,1,1,1,1,1,0],
	[0,2,1,1,1,1,1,2,0],
	[0,2,2,1,1,1,2,2,0],
	[0,0,0,0,0,0,0,0,0]
];

function initBoard() {
	field = [];
	for (let y = 0; y < boardWidth; y++) {
		field[y] = [];
		for (let x = 0; x < boardWidth; x++) {
			field[y][x] = new Tile(x, y, mapData[y][x]);
		}
	}
	player = new Player(4, 4);
}

function isPassable(x, y) {
	return x >= 0 && y >= 0 && x < boardWidth && y < boardWidth && mapData[y][x] == 1;
}

function drawBoard() {
	gameContext.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
	for (let y = 0; y < boardWidth; y++) {
		for (let x = 0; x < boardWidth; x++) {
			field[y][x].resize();
			field[y][x].draw();
		}
	}
	player.resize();
	player.draw();
	gameDirty = 0;
}
