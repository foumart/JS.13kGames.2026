const tileWidth = 6;
const offscreenBitmaps = [];

// 0 empty, 1 enemy, 2 unicorn
const bitmapPixels = [
	// empty / grass
	[
		[1,1,1,1,1,1],
		[1,2,1,1,2,1],
		[1,1,1,2,1,1],
		[1,1,2,1,1,1],
		[1,2,1,1,2,1],
		[1,1,1,1,1,1]
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
	// unicorn
	[
		[0,0,3,0,0,0],
		[0,0,1,1,0,0],
		[0,1,1,1,1,0],
		[0,0,2,2,0,0],
		[0,1,1,1,1,0],
		[0,1,0,0,1,0]
	]
];

const bitmapPalettes = [
	["", "3d8c40", "4aa34e", "2e7032"],
	["", "4a2060", "7b3fa0", "e8d4ff"],
	["", "f5f5f5", "ff69b4", "ffe066"]
];

for (let k = 0; k < bitmapPixels.length; k++) {
	const c = document.createElement("canvas");
	c.width = c.height = tileWidth;
	const ctx = c.getContext("2d");
	const pix = bitmapPixels[k];
	const pal = bitmapPalettes[k];
	for (let y = 0; y < tileWidth; y++) {
		for (let x = 0; x < tileWidth; x++) {
			const p = pix[y][x];
			if (p) {
				ctx.fillStyle = "#" + pal[p];
				ctx.fillRect(x, y, 1, 1);
			}
		}
	}
	offscreenBitmaps.push(c);
}
