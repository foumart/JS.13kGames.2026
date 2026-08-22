// Random puzzle maps generator

// Cache per slot so retrying a stage keeps the same layout
let generatedLevels = [];

// World-boss puzzle: last of each 9-map world (3 shadows × 3 stages)
function isBossStage(slot) {
	return slot % 9 == 8;
}

// Rescue on the 3rd stage of shadows 1 and 2, not on the world-boss map
function hasRescue(slot) {
	const n = slot % 9;
	return n == 2 || n == 5;
}

// Castle battle after the world-boss puzzle
function isBossBattle() {
	return isBossStage(levelIndex);
}

function getLevelData(slot) {
	return generatedLevels[slot] || (generatedLevels[slot] = makeRandomLevel(slot));
}

// World-boss: castle on 3 sides of the exit, opening toward the player
function addBossCastle(grid, width, height, exitX, exitY, playerX, playerY) {
	const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
	let open = 0;
	let best = 99;
	for (let d = 0; d < 4; d++) {
		const x = exitX + dirs[d][0];
		const y = exitY + dirs[d][1];
		const dist = Math.abs(x - playerX) + Math.abs(y - playerY);
		if (dist < best) {
			best = dist;
			open = d;
		}
	}
	for (let d = 0; d < 4; d++) {
		if (d == open) continue;
		const x = exitX + dirs[d][0];
		const y = exitY + dirs[d][1];
		if (x < 0 || y < 0 || x >= width || y >= height) continue;
		if (grid[y][x] == "2" || grid[y][x] == "8") continue;
		grid[y][x] = "9";
	}
}

// Replace one spawned enemy with a jailed hero
function jailEnemy(grid, enemies, slot) {
	if (!hasRescue(slot) || !enemies.length) return;
	const i = Math.random() * enemies.length | 0;
	grid[enemies[i][1]][enemies[i][0]] = "A";
}

function makeRandomLevel(slot) {
	const directions = [[1, 0], [-1, 0], [0, 1], [0, -1]];
	const progress = slot || 0;
	const growRaw = progress < 3 ? 0 : (progress - 3) / 27;
	const grow = growRaw > 1 ? 1 : growRaw;
	const enemyMin = 6 + (progress * 5 / 30 | 0);
	const enemyMax = progress < 6 ? 6 : 7 + (progress * 9 / 30 | 0);
	let width;
	let height;
	let grid;

	// Obstacle, enemy, castle, or captive — not walkable
	function solid(tile) {
		return tile == "3" || tile == "1" || tile == "9" || tile == "A";
	}

	// Count walkable adjacent neighbors (except solid tiles or out of bounds)
	function walkOpen(x, y) {
		let open = 0;
		for (let d = 4; d--;) {
			const nx = x + directions[d][0];
			const ny = y + directions[d][1];
			if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
			if (!solid(grid[ny][nx])) open ++;
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
			if (!solid(tile) && walkOpen(nx, ny) < 2) pin = 1;
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

		// Place Player and exit. Boss maps keep the exit in the top half so the castle has room.
		const playerX = 1 + (Math.random() * (width - 2) | 0);
		const playerY = height - 1 - (Math.random() * (height / 2) | 0);
		let exitX;
		let exitY;
		let exitTries = 0;
		do {
			exitX = 1 + (Math.random() * (width - 2) | 0);
			exitY = isBossStage(progress)
				? 1 + (Math.random() * Math.max(1, (height / 2 | 0) - 1) | 0)
				: Math.random() * (height / 2) | 0;
		} while (++exitTries < 24 && Math.abs(exitX - playerX) + Math.abs(exitY - playerY) < width);
		grid[playerY][playerX] = "2";
		grid[exitY][exitX] = "8";
		if (isBossStage(progress)) addBossCastle(grid, width, height, exitX, exitY, playerX, playerY);

		// Enemies stay off the edge and at 2 squares from the player, exit, and each other
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

		// Keep start, exit, castle, enemies, and the four surround tiles beside each enemy
		const reserved = {};
		reserved[playerX + playerY * width] = 1;
		reserved[exitX + exitY * width] = 1;
		for (let n = enemies.length; n--;) {
			reserved[enemies[n][0] + enemies[n][1] * width] = 1;
			for (let d = 4; d--;) {
				reserved[enemies[n][0] + directions[d][0] + (enemies[n][1] + directions[d][1]) * width] = 1;
			}
		}
		for (let y = height; y--;) {
			for (let x = width; x--;) {
				if (grid[y][x] == "9") reserved[x + y * width] = 1;
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
						const blocked = t == "1" || t == "3" || t == "9" || t == "A";
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
				if (solid(grid[y][x]) || reachable[x + y * width]) continue;
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
				if (!solid(tile) && walkOpen(x, y) < 2) { valid = 0; break; }
			}
		}
		for (let n = enemies.length; n-- && valid;) {
			let sides = 0;
			for (let d = 4; d--;) {
				const x = enemies[n][0] + directions[d][0];
				const y = enemies[n][1] + directions[d][1];
				if (x < 0 || y < 0 || x >= width || y >= height || grid[y][x] == "3" || grid[y][x] == "9") continue;
				if (grid[y][x] == "1" || grid[y][x] == "A" || !reachable[x + y * width]) { valid = 0; break; }
				sides ++;
			}
			if (!valid || sides < 4) { valid = 0; break; }
		}
		if (!valid) continue;

		jailEnemy(grid, enemies, progress);
		const rows = [];
		for (let y = 0; y < height; y++) rows[y] = grid[y].join("");
		return rows;
	}

	// If generation never passes, use a small hand-built map
	return fallbackLevel(progress);
}

function fallbackLevel(slot) {
	const width = 9;
	const height = 8;
	const grid = [];
	for (let y = 0; y < height; y++) {
		grid[y] = [];
		for (let x = 0; x < width; x++) grid[y][x] = "0";
	}
	const playerX = 4;
	const playerY = 6;
	const exitX = 4;
	const exitY = 1;
	grid[playerY][playerX] = "2";
	grid[exitY][exitX] = "8";
	const enemies = [[2, 3], [6, 3], [4, 4], [1, 5], [7, 5], [3, 2]];
	for (let n = 0; n < enemies.length; n++) grid[enemies[n][1]][enemies[n][0]] = "1";
	if (isBossStage(slot)) addBossCastle(grid, width, height, exitX, exitY, playerX, playerY);
	jailEnemy(grid, enemies, slot);
	const rows = [];
	for (let y = 0; y < height; y++) rows[y] = grid[y].join("");
	return rows;
}
