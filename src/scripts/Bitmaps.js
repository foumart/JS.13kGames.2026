const unitBitmaps = [];
const backgroundsBitmaps = [];
const objectBitmaps = [];

// ImageEncryptor: 3 px/char, 3-char, transparent
function encodeBitmap(group, dest) {
	const packed = group[group.length - 1];
	const bank = group[0];
	const n = group.length - 2;
	const step = packed.length / n | 0;
	const size = Math.sqrt(step * 3) | 0;
	for (let k = 0; k < n; k++) {
		const enc = packed.substr(k * step, step);
		const px = [];
		for (let i = 0; i < enc.length; i++) {
			const z = enc.charCodeAt(i);
			px.push(z & 3, (z >> 2) & 3, (z >> 4) & 3);
		}
		const pal = group[k + 1] || "";
		const palW = 3;
		dest.push(drawPalettedBitmap({ width: size, height: size, px, bank, pal, palW }, pal.substr(0, palW)));
	}
}

const unitData = [
	"feff8bec0776433edac9054149b3592159c6392c44834", // color bank
	, // unicorn idle
	, // unicorn jump
	"09a0ba0da01a", // leprechaun
	"6e419a1d42b3", // hydra
	"bc489ade41de", // serpent
	"267bc72872de", // merlin
	"5d75c4", // fiona
	"5345c759a", // random
	"1d46ea", // bleys
	"29a537", // caine
	"E@@T}@PjChaNjjzjjzPizljzljzE@@T}@PjNhazjjzjjz@hJpjBpj@@|@`jBljNk{zkUzljNp@Cp@C@@@`OO_MfYyfkjy|fN@v@pjNl^z{pypoB\\UIWUukiu\\VM`UCPgK`\\mPpK@PpfSrUSlkPXVRjfdzzD|pGL@G`z@XiCXeblyJkzAyjG`kN`b@``@@{``UbpUSdffijJB{@pnC`bBxbK@Z@puApUQlnRvzZlkcpnBpsCpp@@~@`WC@UC`wJlnnfjfhkj@s@`sB"
];

const backgroundsData = [
	"3853954a568d68cfffcdf8cf49b", // color bank
	"348", // swamp
	, // grass
	"674", // clouds
	"yYgm^vg[vmmWnuo{e{~{^Yn[zfiYffY[fy"
];

const objectsData = [
	"fffffafd0867465243deeabc", // color bank
	"345", // obstacle
	"124", // coin
	"064", // cloudX
	, // sparkleA
	, // sparkleB
	"067", // prison
	, // up
	, // right
	, // down
	, // left
	"UEifywyvUuxoH@fHkfXzlOp@`A`BYffYo~PB@BpC^I\\m`C@B@@Lp`IPE`ILpCLBLAHBDCHCLp@|CsLp@p@@@@C@L|@L@C@@@@p@p@sL|Cp@p@L@OL@p@@@"
];

encodeBitmap(unitData, unitBitmaps);
encodeBitmap(backgroundsData, backgroundsBitmaps);
encodeBitmap(objectsData, objectBitmaps);

function drawPalettedBitmap(src, ref) {
	ref = ref || "012";
	if (!src.palettes) src.palettes = {};
	if (src.palettes[ref]) return src.palettes[ref];
	const bank = src.bank;
	const palette = ref.replace(/./g, c => bank.substr(parseInt(c, 16) * 3, 3));
	const c = document.createElement("canvas");
	const ctx = c.getContext("2d");
	const size = src.width;
	c.width = size;
	c.height = size;
	c.px = src.px;
	c.bank = bank;
	c.palettes = src.palettes;
	c.pal = src.pal;
	c.palW = src.palW;
	for (let y = 0; y < size; y++) {
		for (let x = 0; x < size; x++) {
			const p = src.px[y * size + x];
			if (p) {
				ctx.fillStyle = "#" + palette.substr(3 * (p - 1), 3);
				ctx.fillRect(x, y, 1, 1);
			}
		}
	}
	return src.palettes[ref] = c;
}

function drawPaletted(src, i, dx, dy, dw, dh, ctx) {
	const w = src.palW || 3;
	const ref = typeof i == "string" ? i : (src.pal || "012").substr((i || 0) * w, w) || "012";
	const bmp = drawPalettedBitmap(src, ref);
	ctx.drawImage(bmp, 0, 0, bmp.width, bmp.height, dx, dy, dw, dh);
}
