// Random puzzle maps generator

// Cache levels to allow level retrying
let generatedLevels = [];

// Each third map is one of the predefined levels
function predefinedIndex(slot) {
	return slot / 3 | 0;
}

// Boss fight comes after a predefined stage (3, 6, 9, 12 - predefined index: 2, 5, 8, 11).
function isBossBattle() {
	return predefinedIndex(levelIndex) % 3 == 2;
}

function getLevelData(slot) {
	if (slot % 3 == 2) return levels[predefinedIndex(slot)];
	return generatedLevels[slot] || (generatedLevels[slot] = makeRandomLevel(slot));
}

function makeRandomLevel(slot) {
	const directions = [[1, 0], [-1, 0], [0, 1], [0, -1]];
	const progress = slot || 0;
	const growRaw = progress < 3 ? 0 : (progress - 3) / 27;
	const grow = growRaw > 1 ? 1 : growRaw;
	const enemyMin = 5 + (progress * 5 / 30 | 0);
	const enemyMax = 6 + (progress * 9 / 30 | 0);
	let width;
	let height;
	let grid;

	// Count walkable adjacent neighbors (except obstacle 3, enemy 1, or out of bounds)
	function walkOpen(x, y) {
		let open = 0;
		for (let d = 4; d--;) {
			const nx = x + directions[d][0];
			const ny = y + directions[d][1];
			if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
			const tile = grid[ny][nx];
			if (tile != "3" && tile != "1") open ++;
		}
		return open;
	}

	// Check if putting an obstacle here would leave a neighbor with only one exit
	function wouldPin(x, y) {
		grid[y][x] = "3";
		let pin = 0;
		for (let d = 4; d--;) {
			const nx = x + directions[d][0];
			const ny = y + directions[d][1];
			if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
			const tile = grid[ny][nx];
			if (tile != "3" && tile != "1" && walkOpen(nx, ny) < 2) pin = 1;
		}
		grid[y][x] = "0";
		return pin;
	}

	for (let attempt = 99; attempt--;) {
		// First maps are 9x8; later maps grow up to 10-15 x 9-13.
		width = 9;
		height = 8;
		if (progress >= 3) {
			const widthMin = 9 + (grow * 1 | 0);
			const widthMax = 11 + (grow * 4 | 0);
			const heightMin = 8 + (grow * 1 | 0);
			const heightMax = 10 + (grow * 3 | 0);
			width = widthMin + (Math.random() * (widthMax - widthMin + 1) | 0);
			height = heightMin + (Math.random() * (heightMax - heightMin + 1) | 0);
		}
		grid = [];
		for (let y = 0; y < height; y++) {
			grid[y] = [];
			for (let x = 0; x < width; x++) grid[y][x] = "0";
		}

		// Place Player and exit
		const playerX = 1 + (Math.random() * (width - 2) | 0);
		const playerY = height - 1 - (Math.random() * (height / 2) | 0);
		let exitX;
		let exitY;
		let exitTries = 0;
		do {
			exitX = 1 + (Math.random() * (width - 2) | 0);
			exitY = Math.random() * (height / 2) | 0;
		} while (++exitTries < 24 && Math.abs(exitX - playerX) + Math.abs(exitY - playerY) < width);
		grid[playerY][playerX] = "2";
		grid[exitY][exitX] = "8";

		// Enemies stay off the edge and at 2 squares from the player and each other
		const enemies = [];
		const enemyNeed = enemyMin + (Math.random() * (enemyMax - enemyMin + 1) | 0);
		for (let tryPlace = enemyNeed * 16; tryPlace-- && enemies.length < enemyNeed;) {
			const x = 1 + (Math.random() * (width - 2) | 0);
			const y = 1 + (Math.random() * (height - 2) | 0);
			if (grid[y][x] != "0"
				|| Math.abs(x - playerX) < 2 && Math.abs(y - playerY) < 2
				|| Math.abs(x - exitX) < 2 && Math.abs(y - exitY) < 2) continue;
			let tooClose = 0;
			for (let n = enemies.length; n--;) {
				if (Math.abs(enemies[n][0] - x) < 2 && Math.abs(enemies[n][1] - y) < 2) tooClose = 1;
			}
			if (tooClose) continue;
			grid[y][x] = "1";
			enemies.push([x, y]);
		}
		if (enemies.length < enemyNeed) continue;

		// Keep start, exit, enemies, or the four surround tiles beside each enemy
		const reserved = {};
		reserved[playerX + playerY * width] = 1;
		reserved[exitX + exitY * width] = 1;
		for (let n = enemies.length; n--;) {
			reserved[enemies[n][0] + enemies[n][1] * width] = 1;
			for (let d = 4; d--;) {
				reserved[enemies[n][0] + directions[d][0] + (enemies[n][1] + directions[d][1]) * width] = 1;
			}
		}

		// Place more edge rocks on large sparse maps - avoid blocking walkable cells
		let obstacleCount = 4 + ((width * height - enemies.length * 8) / 8 | 0);
		if (obstacleCount < 3) obstacleCount = 3;
		if (obstacleCount > 14) obstacleCount = 14;
		for (let tries = obstacleCount * 6; tries-- && obstacleCount;) {
			const edge = Math.random() * 4 | 0;
			const x = edge < 2 ? Math.random() * width | 0 : edge == 2 ? 0 : width - 1;
			const y = edge < 2 ? (edge ? height - 1 : 0) : Math.random() * height | 0;
			if (grid[y][x] != "0" || reserved[x + y * width] || wouldPin(x, y)) continue;
			grid[y][x] = "3";
			obstacleCount --;
		}
		for (let extra = 1 + (Math.random() * 2 | 0); extra--;) {
			const x = 1 + (Math.random() * (width - 2) | 0);
			const y = 1 + (Math.random() * (height - 2) | 0);
			if (grid[y][x] == "0" && !reserved[x + y * width] && !wouldPin(x, y)) grid[y][x] = "3";
		}

		// Cross if 3 or 4 corners are blocked and all 4 sides are open
		for (let y = 1; y < height - 1; y++) {
			for (let x = 1; x < width - 1; x++) {
				if (grid[y][x] != "0" && grid[y][x] != "4") continue;
				let corners = 0;
				let plus = 1;
				for (let oy = -1; oy <= 1; oy++) {
					for (let ox = -1; ox <= 1; ox++) {
						if (!ox && !oy) continue;
						const t = grid[y + oy][x + ox];
						const blocked = t == "1" || t == "3";
						if (ox && oy) {
							if (blocked) corners ++;
						} else if (blocked) plus = 0;
					}
				}
				if (plus && corners >= 3) grid[y][x] = "7";
			}
		}

		for (let coins = 2 + (Math.random() * 3 | 0) + (width * height > 90 ? 1 : 0); coins--;) {
			const x = Math.random() * width | 0;
			const y = Math.random() * height | 0;
			if (grid[y][x] != "0") continue;
			grid[y][x] = "4";
		}

		// Ensure Player can reach the exit
		const reachable = {};
		const flood = [[playerX, playerY]];
		reachable[playerX + playerY * width] = 1;
		while (flood.length) {
			const cell = flood.pop();
			for (let d = 4; d--;) {
				const x = cell[0] + directions[d][0];
				const y = cell[1] + directions[d][1];
				if (x < 0 || y < 0 || x >= width || y >= height) continue;
				const tile = grid[y][x];
				if (tile == "3" || tile == "1" || reachable[x + y * width]) continue;
				reachable[x + y * width] = 1;
				flood.push([x, y]);
			}
		}
		if (!reachable[exitX + exitY * width]) continue;

		// Avoid 1-exit cells, keep enemies walkable from all four sides
		let valid = 1;
		for (let y = height; y-- && valid;) {
			for (let x = width; x--;) {
				const tile = grid[y][x];
				if (tile != "3" && tile != "1" && walkOpen(x, y) < 2) { valid = 0; break; }
			}
		}
		for (let n = enemies.length; n-- && valid;) {
			let sides = 0;
			for (let d = 4; d--;) {
				const x = enemies[n][0] + directions[d][0];
				const y = enemies[n][1] + directions[d][1];
				if (x < 0 || y < 0 || x >= width || y >= height || grid[y][x] == "3") continue;
				if (grid[y][x] == "1" || !reachable[x + y * width]) { valid = 0; break; }
				sides ++;
			}
			if (!valid || sides < 4) { valid = 0; break; }
		}
		if (!valid) continue;

		const rows = [];
		for (let y = 0; y < height; y++) rows[y] = grid[y].join("");
		return rows;
	}

	// If generation never passes, use a 90-degree turn of the previous authored map.
	return rotateLevel(levels[predefinedIndex(progress) - 1]);
}

// 90 degrees clockwise. Uneven rows are padded as empty when reading past their end.
function rotateLevel(source) {
	const srcHeight = source.length;
	let srcWidth = 0;
	for (let y = 0; y < srcHeight; y++) {
		if (source[y].length > srcWidth) srcWidth = source[y].length;
	}
	const rotated = [];
	for (let x = 0; x < srcWidth; x++) {
		let row = "";
		for (let y = 0; y < srcHeight; y++) {
			let tile = source[srcHeight - 1 - y].charAt(x) || "0";
			//if (tile == "5") tile = "6";
			//else if (tile == "6") tile = "5";
			row += tile;
		}
		rotated[x] = row;
	}
	return rotated;
}
