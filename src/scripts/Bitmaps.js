const tileWidth = 6;
const offscreenBitmaps = [];

// Generate water, land, wall, player as 6x6 offscreen canvases
const bitmapPixels = [
	// water
	[
		[1,1,2,2,1,1],
		[1,2,2,1,1,2],
		[2,2,1,1,2,2],
		[2,1,1,2,2,1],
		[1,1,2,2,1,1],
		[1,2,2,1,1,2]
	],
	// land
	[
		[1,1,1,1,1,1],
		[1,2,1,1,2,1],
		[1,1,1,2,1,1],
		[1,1,2,1,1,1],
		[1,2,1,1,2,1],
		[1,1,1,1,1,1]
	],
	// wall
	[
		[1,1,1,1,1,1],
		[1,2,2,2,2,1],
		[1,2,3,3,2,1],
		[1,2,3,3,2,1],
		[1,2,2,2,2,1],
		[1,1,1,1,1,1]
	],
	// player
	[
		[0,0,1,1,0,0],
		[0,0,1,1,0,0],
		[0,1,2,2,1,0],
		[0,0,1,1,0,0],
		[0,1,1,1,1,0],
		[0,1,0,0,1,0]
	]
];

const bitmapPalettes = [
	["","075992","1066a4","176fb0"],
	["","2db22d","3d963d","2bc82b"],
	["","323232","5a605b","899589"],
	["","2bff00","26c906","ffffff"]
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
