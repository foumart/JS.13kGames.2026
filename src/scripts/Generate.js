// Random puzzle map generator

// Cache per slot so retrying a stage keeps the same layout
let generatedLevels = [];
const genDirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// World-boss puzzle: last of each 9-map world (3 shadows × 3 stages)
function isBossStage(slot) {
	return slot % 9 == 8;
}

// Rescue on the 3rd stage of shadows 1 and 2, not on the world-boss map
function hasRescue(slot) {
	const n = slot % 9;
	return n == 2 || n == 5;
}

// Boss battle after the last puzzle of a world
function isBossBattle() {
	return isBossStage(levelIndex);
}

function getLevelData(slot) {
	return generatedLevels[slot] || (generatedLevels[slot] = makeRandomLevel(slot));
}

// Replace one spawned enemy with a jailed hero
function jailEnemy(grid, enemies, slot) {
	if (!hasRescue(slot) || !enemies.length) return;
	const i = Math.random() * enemies.length | 0;
	grid[enemies[i][1]][enemies[i][0]] = "A";
}

function makeRandomLevel(slot) {
	const D = genDirs;
	const progress = slot || 0;
	let grow = (progress - 3) / 27;
	if (grow < 0) grow = 0;
	if (grow > 1) grow = 1;
	let width;
	let height;
	let grid;
	let enemies;
	let reserved;

	function R(n) { return Math.random() * n | 0; }
	function inMap(x, y) { return (x | y) >= 0 && x < width && y < height; }
	function id(x, y) { return x + y * width; }
	// Obstacle, enemy, or captive - not walkable
	function solid(t) { return "13A".indexOf(t) >= 0; }
	function isOf(x, y, s, oob) { return inMap(x, y) ? s.indexOf(grid[y][x]) >= 0 : oob; }
	function isLeprechaun(t) { return t == "1" || t == "A"; }

	// Count walkable adjacent neighbors
	function walkOpen(x, y) {
		let n = 0;
		for (let d = 4; d--;) {
			const nx = x + D[d][0];
			const ny = y + D[d][1];
			if (inMap(nx, ny) && !solid(grid[ny][nx])) n ++;
		}
		return n;
	}

	// Flood tiles matching ok; fills seen; returns size
	function flood(sx, sy, ok, seen) {
		const stack = [[sx, sy]];
		seen[id(sx, sy)] = 1;
		let n = 0;
		while (stack.length) {
			const c = stack.pop();
			n ++;
			for (let d = 4; d--;) {
				const x = c[0] + D[d][0];
				const y = c[1] + D[d][1];
				const k = id(x, y);
				if (seen[k] || !inMap(x, y) || !ok(grid[y][x])) continue;
				seen[k] = 1;
				stack.push([x, y]);
			}
		}
		return n;
	}

	// Try tile - if a neighbor would be pinned (or leprechaun cluster > 3)
	function wouldPin(x, y, tile) {
		grid[y][x] = tile;
		let bad = 0;
		for (let d = 4; d--;) {
			const nx = x + D[d][0];
			const ny = y + D[d][1];
			if (inMap(nx, ny) && !solid(grid[ny][nx]) && walkOpen(nx, ny) < 2) bad = 1;
		}
		if (tile == "1" && flood(x, y, isLeprechaun, {}) > 3) bad = 1;
		grid[y][x] = "0";
		return bad;
	}

	// Empty cell that won't pin
	function canAdd(x, y, allowNeighbor) {
		if (!inMap(x, y) || grid[y][x] != "0") return 0;
		if (!allowNeighbor) for (let d = 4; d--;) {
			const nx = x + D[d][0];
			const ny = y + D[d][1];
			if (!inMap(nx, ny) || isOf(nx, ny, "3", 1)) return 0;
		}
		return !wouldPin(x, y, "1");
	}

	// Gap fill: pin is sealed after; skip fills that would make a cluster > 3
	function canGap(x, y) {
		if (!inMap(x, y) || grid[y][x] != "0") return 0;
		grid[y][x] = "1";
		const big = flood(x, y, isLeprechaun, {}) > 3;
		grid[y][x] = "0";
		return !big;
	}

	function putLeprechaun(x, y) {
		grid[y][x] = "1";
		enemies.push([x, y]);
	}

	function tryRock(x, y) {
		if (grid[y][x] != "0" || reserved[id(x, y)] || wouldPin(x, y, "3")) return;
		grid[y][x] = "3";
		return 1;
	}

	// Turn leftover 1-exit empties into rocks
	function sealDead() {
		let hit = 1;
		while (hit) {
			hit = 0;
			for (let y = height; y--;) {
				for (let x = width; x--;) {
					if (grid[y][x] == "0" && walkOpen(x, y) < 2) {
						grid[y][x] = "3";
						hit = 1;
					}
				}
			}
		}
	}

	// Cloud-cross: empty plus, 3+ blocked corners
	function isCrossSite(cx, cy) {
		if ((cx < 3 || cx >= width - 3) && (cy < 3 || cy >= height - 3)) return 0;
		const t = grid[cy][cx];
		if (t != "0" && t != "4") return 0;
		let corners = 0;
		let plus = 1;
		for (let d = 4; d--;) {
			const dx = D[d][0];
			const dy = D[d][1];
			if (isOf(cx + dx, cy + dy, "13A", 0)) plus = 0;
			if (isOf(cx + dx - dy, cy + dy + dx, "13A", 0)) corners ++;
		}
		return plus && corners >= 3;
	}

	// Any cloud-cross; stamp 7 on later stages. Returns how many sites.
	function eachCross(stamp) {
		let hit = 0;
		for (let y = 1; y < height - 1; y++) {
			for (let x = 1; x < width - 1; x++) {
				if (!isCrossSite(x, y)) continue;
				hit ++;
				if (stamp) grid[y][x] = "7";
			}
		}
		return hit;
	}

	function near(x, y, a, b) {
		return Math.abs(x - a) < 2 && Math.abs(y - b) < 2;
	}

	function pocketGap(x, y) {
		if (x < 2 || y < 2 || x >= width - 2 || y >= height - 2) return 1;
		for (let d = 4; d--;) {
			const nx = x + D[d][0];
			const ny = y + D[d][1];
			if (!inMap(nx, ny) || grid[ny][nx] == "3") return 1;
		}
		return 0;
	}

	// First maps are 9x8; later maps grow
	width = 9;
	height = 8;
	if (progress >= 3) {
		const widthMin = 9 + (grow * 1 | 0);
		const heightMin = 8 + (grow * 1 | 0);
		width = widthMin + R(11 + (grow * 4 | 0) - widthMin + 1);
		height = heightMin + R(10 + (grow * 3 | 0) - heightMin + 1);
	}

	// Spawn count from progress, not area - growing a row/column loosens the map
	let enemyMin = 6 + (progress / 21 | 0);
	let enemyMax = progress < 6 ? 6 : 7 + (progress / 14 | 0);
	if (enemyMax < enemyMin) enemyMax = enemyMin;
	if (enemyMax > 12) enemyMax = 12;
	const enemyNeed = enemyMin + R(enemyMax - enemyMin + 1);

	// 100 tries at this size, then add a row or column and try again
	for (;;) {
	for (let attempt = 100; attempt--;) {
		grid = [];
		for (let y = 0; y < height; y++) {
			grid[y] = [];
			for (let x = 0; x < width; x++) grid[y][x] = "0";
		}

		// Place Player and exit
		const playerX = 1 + R(width - 2);
		const playerY = height - 1 - R(height / 2);
		let exitX;
		let exitY;
		let exitTries = 0;
		do {
			exitX = 1 + R(width - 2);
			exitY = R(height / 2);
		} while (++exitTries < 24 && Math.abs(exitX - playerX) + Math.abs(exitY - playerY) < width);
		grid[playerY][playerX] = "2";
		grid[exitY][exitX] = "8";

		// Enemies stay off the edge and at 2 squares from the player, exit, and each other
		enemies = [];
		for (let tryPlace = enemyNeed * 32; tryPlace-- && enemies.length < enemyNeed;) {
			const x = 1 + R(width - 2);
			const y = 1 + R(height - 2);
			if (grid[y][x] != "0" || near(x, y, playerX, playerY) || near(x, y, exitX, exitY)) continue;
			let tooClose = 0;
			for (let n = enemies.length; n--;) if (near(x, y, enemies[n][0], enemies[n][1])) tooClose = 1;
			if (tooClose) continue;
			putLeprechaun(x, y);
		}
		if (enemies.length < enemyNeed) continue;

		// Keep start, exit, enemies, and the four surround tiles beside each enemy
		reserved = {};
		reserved[id(playerX, playerY)] = 1;
		reserved[id(exitX, exitY)] = 1;
		for (let n = enemies.length; n--;) {
			reserved[id(enemies[n][0], enemies[n][1])] = 1;
			for (let d = 4; d--;) reserved[id(enemies[n][0] + D[d][0], enemies[n][1] + D[d][1])] = 1;
		}

		// Place more edge rocks on large sparse maps - avoid blocking walkable cells
		let obstacleCount = 4 + ((width * height - enemies.length * 8) / 8 | 0);
		if (obstacleCount < 3) obstacleCount = 3;
		const obsCap = 8 + (width * height / 12 | 0);
		if (obstacleCount > obsCap) obstacleCount = obsCap;
		for (let tries = obstacleCount * 6; tries-- && obstacleCount;) {
			const e = R(4);
			if (tryRock(e < 2 ? R(width) : e == 2 ? 0 : width - 1, e < 2 ? (e ? height - 1 : 0) : R(height))) obstacleCount --;
		}
		for (let extra = 1 + (width * height / 48 | 0) + R(2); extra--;) {
			tryRock(1 + R(width - 2), 1 + R(height - 2));
		}
		sealDead();

		// Levels 1-5 reject cloud-cross; later maps use tile 7
		if (progress < 5 && eachCross()) continue;

		// Fill 1 0 1 only in a pocket (map rim or against a wall)
		for (let y = height; y--;) {
			for (let x = width; x--;) {
				if (isCrossSite(x, y)) continue;
				const gaps = [];
				for (let d = 4; d--;) {
					const dx = D[d][0];
					const dy = D[d][1];
					const mx = x + dx;
					const my = y + dy;
					if (isOf(x + dx - dy, y + dy + dx, "1", 0)
						&& isOf(x + dx + dy, y + dy - dx, "1", 0)
						&& inMap(mx, my) && grid[my][mx] == "0" && pocketGap(mx, my) && canGap(mx, my)) gaps.push([mx, my]);
				}
				if (gaps.length) {
					const p = gaps[R(gaps.length)];
					putLeprechaun(p[0], p[1]);
				}
			}
		}
		sealDead();

		// Wall hug: every other 300/301/300 in the center band (4th-5th on a 9-wide map)
		/*let hugN = 0;
		const hugFrom = enemies.length;
		for (let i = 0; i < hugFrom; i++) {
			const ex = enemies[i][0];
			const ey = enemies[i][1];
			for (let d = 4; d--;) {
				const dx = D[d][0];
				const dy = D[d][1];
				const gx = ex + dx;
				const gy = ey + dy;
				const wx = ex + dx * 2;
				const wy = ey + dy * 2;
				const mid = dx ? gy : gx;
				const span = dx ? height : width;
				if (!isOf(wx, wy, "3", 1) || !isOf(wx - dy, wy + dx, "3", 1) || !isOf(wx + dy, wy - dx, "3", 1)) continue;
				if (mid < (span >> 1) - 1 || mid > span >> 1 || !canAdd(gx, gy, 1)) continue;
				if (++hugN & 1) putLeprechaun(gx, gy);
			}
		}*/

		if (progress < 5) {
			if (eachCross()) continue;
		} else if (eachCross(1) > 1 + (progress / 27 | 0)) continue;

		// place coins
		for (let coins = 2 + R(3); coins--;) {
			const x = R(width);
			const y = R(height);
			if (grid[y][x] == "0") grid[y][x] = "4";
		}

		// Ensure Player can reach the exit
		const reachable = {};
		flood(playerX, playerY, function(t) { return !solid(t); }, reachable);
		if (!reachable[id(exitX, exitY)]) continue;

		// Avoid 1-exit cells, keep enemies walkable from all four sides, clusters max 3
		let valid = 1;
		const seen = {};
		for (let y = height; y-- && valid;) {
			for (let x = width; x--;) {
				const t = grid[y][x];
				if (!solid(t) && t != "2" && t != "8" && walkOpen(x, y) < 2) valid = 0;
				if (isLeprechaun(t) && !seen[id(x, y)] && flood(x, y, isLeprechaun, seen) > 3) valid = 0;
			}
		}
		for (let n = enemies.length; n-- && valid;) {
			for (let d = 4; d--;) {
				const x = enemies[n][0] + D[d][0];
				const y = enemies[n][1] + D[d][1];
				if (!inMap(x, y) || isOf(x, y, "13A", 0)) continue;
				if (!reachable[id(x, y)]) valid = 0;
			}
		}
		if (!valid) continue;

		jailEnemy(grid, enemies, progress);
		const rows = [];
		for (let y = 0; y < height; y++) rows[y] = grid[y].join("");
		return rows;
	}
	width <= height ? width ++ : height ++;
	}
}
