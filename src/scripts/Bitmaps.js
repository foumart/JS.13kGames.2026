const tileWidth = 6;
const unitScale = 0.665;
const offscreenBitmaps = [];

// 0 empty, 1 enemy, 2 unicorn, 3 obstacle, 4 coin, 5 unicorn jump, 6 clouds
const bitmapPixels = [
	// empty / grass
	[
		[1,1,1,1,1,2],
		[1,1,2,1,2,1],
		[1,1,1,1,1,2],
		[1,1,2,1,1,1],
		[2,1,1,1,2,1],
		[1,2,1,2,1,1]
	],
	// enemy
	[
		[0,1,1,1,1,0],
		[1,2,1,1,2,1],
		[1,1,3,3,1,1],
		[1,1,1,1,1,1],
		[0,1,0,0,1,0],
		[0,1,0,0,1,0]
	],
	// unicorn idle
	[
		[0,1,1,0,0,0,0,0,0],
		[0,0,1,1,3,3,0,0,0],
		[0,0,1,2,2,2,3,0,0],
		[0,2,2,1,1,2,2,3,0],
		[2,2,2,2,2,2,2,2,3],
		[2,2,2,2,2,2,2,2,3],
		[0,0,0,3,2,2,2,2,3],
		[0,3,2,2,2,2,2,2,3],
		[0,3,2,2,2,2,2,2,3]
	],
	// obstacle
	[
		[0,1,1,1,1,0],
		[1,2,2,2,2,1],
		[1,2,3,3,2,1],
		[1,2,3,3,2,1],
		[1,2,2,2,2,1],
		[0,1,1,1,1,0]
	],
	// coin pile
	[
		[0,0,0,0,0,0],
		[0,1,2,1,0,0],
		[1,2,3,2,1,0],
		[0,1,2,3,2,1],
		[0,1,3,2,3,1],
		[0,0,1,1,1,0]
	],
	// unicorn jump
	[
		[1,1,0,0,0,0,0,0,0],
		[0,1,1,1,3,3,0,0,0],
		[0,0,1,2,2,2,2,3,0],
		[0,2,2,1,1,2,2,2,3],
		[2,2,2,2,2,2,2,2,3],
		[2,2,2,2,2,2,2,2,3],
		[0,0,0,0,2,2,2,2,0],
		[0,0,3,2,2,2,2,0,0],
		[0,0,3,2,2,2,0,0,0]
	],
	// empty / clouds
	[
		[1,1,2,1,1,1],
		[1,2,3,2,1,2],
		[2,1,1,1,2,1],
		[1,1,2,1,1,1],
		[1,2,1,2,3,2],
		[2,1,1,1,2,1]
	]
];

const bitmapPalettes = [
	["", "3d8c40", "4aa34e", "2e7032"],
	["", "4a2060", "7b3fa0", "e8d4ff"],
	["", "f8f4ff", "ff6eb4", "ffe066"],
	["", "5a5048", "7a7060", "3a3530"],
	["", "c9a000", "ffe066", "fff3a0"],
	["", "f8f4ff", "ff6eb4", "ffe066"],
	["", "e4e7eb", "d5dde6", "b4bec9"]
];

for (let k = 0; k < bitmapPixels.length; k++) {
	const pix = bitmapPixels[k];
	const w = pix[0].length;
	const h = pix.length;
	const c = document.createElement("canvas");
	c.width = w;
	c.height = h;
	const ctx = c.getContext("2d");
	const pal = bitmapPalettes[k];
	for (let y = 0; y < h; y++) {
		for (let x = 0; x < w; x++) {
			const p = pix[y][x];
			if (p) {
				ctx.fillStyle = "#" + pal[p];
				ctx.fillRect(x, y, 1, 1);
			}
		}
	}
	offscreenBitmaps.push(c);
}
