// Random puzzle map generator

let generatedLevels = [];
const genDirs = ROOK;

function isBossStage(stage) {
	return stage % 9 == 8;
}

function hasRescue(stage) {
	return stage < 9 ? stage % 3 == 2 : stage % 9 == 8;
}

function isBossBattle() {
	return isBossStage(levelIndex);
}

function getLevelData(stage) {
	return generatedLevels[stage] || (generatedLevels[stage] = makeRandomLevel(stage));
}

// the trail the generator walks is the solution - pockets are filled with enemies
function makeRandomLevel(stage) {
	const progress = stage || 0;

	function RNG(n) { return Math.random() * n | 0; }

	let width = progress < 2 ? 7 : 7 + RNG(2 + (progress / 9 | 0));
	let height = progress < 2 ? 6 : 6 + RNG(2 + (progress / 9 | 0));
	if (portrait && width > height || !portrait && width < height) {
		const w = width;
		width = height;
		height = w;
	}
	const area = width * height;
	let want = progress < 3 ? 3 + progress : 6 + RNG(3 + (progress / 9 | 0));
	//if (want > 16) want = 16;
	if (hasRescue(progress)) want += 2;

	function inMap(x, y) { return (x | y) >= 0 && x < width && y < height; }
	function id(x, y) { return x + y * width; }

	// keep seeds a tile apart so each one becomes its own pocket
	function hasRoom(seed, x, y) {
		for (let d = 9; d--;) {
			const ax = x + d % 3 - 1;
			const ay = y + (d / 3 | 0) - 1;
			if (inMap(ax, ay) && seed[id(ax, ay)]) return 0;
		}
		return 1;
	}

	function scatterSeeds() {
		const seed = [];
		let tint = 0;
		function plant(x, y, kind) {
			const shade = (x + y & 1) * 2 - 1;
			if (tint * shade > 0 || !hasRoom(seed, x, y)) return 0;
			seed[id(x, y)] = kind;
			tint += shade;
			return 1;
		}
		for (let n = want * 30, left = want; n -- && left;) {
			if (plant(1 + RNG(width - 2), 1 + RNG(height - 2), 1)) left --;
		}
		for (let n = 12, left = 1 + RNG(3); n -- && left;) {
			const x = 2 + RNG(width - 4);
			const y = 2 + RNG(height - 4);
			if (!hasRoom(seed, x, y)) continue;
			seed[id(x, y)] = 3;
			left --;
		}
		let blockTiles = 2 + RNG(3) + ((area - 56) / 16 | 0) + (progress / 16 | 0);
		for (let n = blockTiles * 8; n -- && blockTiles;) {
			const rim = progress < 5 || RNG(2);
			const e = RNG(4);
			const x = rim ? (e < 2 ? RNG(width) : e == 2 ? 0 : width - 1) : 1 + RNG(width - 2);
			const y = rim ? (e < 2 ? (e ? height - 1 : 0) : RNG(height)) : 1 + RNG(height - 2);
			if (plant(x, y, 2)) blockTiles --;
		}
		return seed;
	}

	// never crosses the trail itself, keeps walking through free tiles
	function carveTrail(seed) {
		const at = [];
		let head;
		do {
			head = RNG(area);
		} while (seed[head]);
		const trail = [head];
		at[head] = 0;
		for (let n = area * 40; n --;) {
			if (RNG(2)) {
				trail.reverse();
				for (let i = trail.length; i --;) at[trail[i]] = i;
			}
			const last = trail.length - 1;
			const p = trail[last];
			const c = p % area;
			const d = genDirs[RNG(4)];
			if (seed[c] == 3 && (p < area) != !d[1]) continue;
			const x = c % width + d[0];
			const y = (c / width | 0) + d[1];
			if (!inMap(x, y)) continue;
			const k = id(x, y);
			if (seed[k] && seed[k] != 3) continue;
			const lane = seed[k] == 3 && d[1] ? k + area : k;
			const j = at[lane];
			if (j == null) {
				at[lane] = trail.length;
				trail.push(lane);
			} else if (j < last - 1) {
				for (let a = j + 1, b = last; a < b; a ++, b --) {
					const t = trail[a];
					trail[a] = trail[b];
					trail[b] = t;
					at[trail[a]] = a;
					at[trail[b]] = b;
				}
			}
		}
		for (let i = trail.length; i --;) trail[i] %= area;
		const hits = [];
		for (let i = trail.length; i --;) hits[trail[i]] = (hits[trail[i]] || 0) + 1;
		while (hits[trail[0]] > 1) hits[trail.shift()] --;
		for (let gap; hits[trail[trail.length - 1]] > 1
			|| (gap = Math.abs(trail[0] - trail[trail.length - 1]), gap == 1 || gap == width);) {
			hits[trail.pop()] --;
		}
		return trail;
	}

	// pocket - sealed tile where every tile around it is trail
	function floodPocket(k, on, seen) {
		const stack = [k];
		const cells = [];
		seen[k] = 1;
		while (stack.length) {
			const c = stack.pop();
			cells.push(c);
			for (let d = 4; d --;) {
				const x = c % width + genDirs[d][0];
				const y = (c / width | 0) + genDirs[d][1];
				const n = id(x, y);
				if (!inMap(x, y) || on[n] || seen[n]) continue;
				seen[n] = 1;
				stack.push(n);
			}
		}
		return cells;
	}

	// Best carve: the one that fills the map and leaves the most spawns
	// seed array holds what's pre-placed on each tile before the carve
	// (1:leprechaun, 2:block, 3 cross)
	let trail;
	let seed;
	let holes;
	let best = 0;
	for (let tries = 9; tries --;) {
		const s = scatterSeeds();
		const t = carveTrail(s);
		const on = [];
		const rows = [];
		const cols = [];
		let cross = 0;
		for (let i = t.length; i --;) {
			if (on[t[i]]) cross ++;
			on[t[i]] = 1;
			rows[t[i] / width | 0] = 1;
			cols[t[i] % width] = 1;
		}
		let walls = 0;
		for (let y = height; y --;) if (!rows[y]) walls ++;
		for (let x = width; x --;) if (!cols[x]) walls ++;
		const seen = [];
		const p = [];
		let spawns = 0;
		let waste = 0;
		for (let k = area; k --;) {
			if (on[k] || seen[k]) continue;
			const cells = floodPocket(k, on, seen);
			p.push(cells);
			if (cells.length > 3) waste += cells.length * cells.length;
			else if (s[cells[0]] != 2) spawns += cells.length;
		}
		const score = (spawns < want ? spawns : want) * 9 + cross * 300 - waste - walls * 9999;
		if (!holes || score > best) {
			best = score;
			trail = t;
			seed = s;
			holes = p;
		}
		if (spawns >= want && !waste) break;
	}

	const grid = [];
	for (let y = 0; y < height; y++) {
		grid[y] = [];
		for (let x = 0; x < width; x++) grid[y][x] = 0;
	}

	// The trail runs from the Player to the exit - start at its lower end
	const tail = trail[trail.length - 1];
	const from = trail[0] > tail ? trail[0] : tail;
	const to = trail[0] > tail ? tail : trail[0];
	const exitX = to % width;
	const exitY = to / width | 0;

	// Pockets of 3 or less spawn leprechauns, the rest turn to blocks.
	// Tiles touching the exit turn to blocks too.
	const enemies = [];
	for (let i = holes.length; i --;) {
		const cells = holes[i];
		let rock = cells.length > 3 || enemies.length + cells.length > want;
		for (let j = cells.length; j --;) if (seed[cells[j]] == 2) rock = 1;
		for (let j = cells.length; j --;) {
			const x = cells[j] % width;
			const y = cells[j] / width | 0;
			const beside = Math.abs(x - exitX) + Math.abs(y - exitY) < 2;
			const stone = rock || beside;
			grid[y][x] = stone ? (cells.length == 1 && !RNG(4) ? 4 : 3) : 1;
			if (!stone) enemies.push([x, y]);
		}
	}

	const twice = [];
	for (let i = trail.length; i --;) {
		if (twice[trail[i]]) grid[trail[i] / width | 0][trail[i] % width] = 7;
		twice[trail[i]] = 1;
	}

	grid[from / width | 0][from % width] = 2;
	grid[to / width | 0][to % width] = 8;

	for (let drops = 2 + RNG(2); drops --;) {
		const k = trail[RNG(trail.length)];
		const x = k % width;
		const y = k / width | 0;
		if (grid[y][x] == 0) grid[y][x] = 4;
	}

	if (hasRescue(progress) && enemies.length) {
		const prison = enemies[RNG(enemies.length)];
		/*const px = from % width;
		const py = from / width | 0;
		let prison = enemies[0];
		for (let i = enemies.length, k = RNG(i); i --; k = (k + 1) % enemies.length) {
			const e = enemies[k];
			if (Math.abs(e[0] - px) + Math.abs(e[1] - py) > 1) {
				prison = e;
				break;
			}
		}*/
		grid[prison[1]][prison[0]] = 9;
	}
	return grid;
}
