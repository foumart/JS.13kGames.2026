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
	"eda776433ec049b3592159c6c90392feff8bf59c44834", // color bank
	"ab3ac3", // unicorn idle
	"ab3ac3", // unicorn jump
	"b52", // leprechaun
	"712", // hydra
	"792", // serpent
	"08e", // merlin / julian
	"b56", // fiona / flora
	"be2", // gerard / eric
	"bd2", // bleys / brand
	"8e2", // caine / corwin
	"E@@T}@PjChaNjjzjjzPizljzljzE@@T}@PjNhazjjzjjz@hJpjBpj@@|@`jBljNk{zkUzljNp@Cp@C@@@`OO_MfYyfkjy|fN@v@pjNl^z{pypoB\\UIWUukiu\\VM`UCPgK`\\mPpK@?PpfSrUSlkPXVRjfdzzD|pGL@G`z@XiCXeblyJkzAyjG`kN`b@``@@{``UbpUSdffijJB{@pnC`bBxbK@Z@puApUQlnRvzZlkcpnBpsCpp@@~@`WC@UC`wJlnnfjfhkj@s@`sB"
];

const backgroundsData = [
	"3853954a568d68cfffcdf8cf49b", // color bank
	"348", // swamp
	"012345", // grass
	"674", // clouds
	"yYgm^vg[vmmWnuo{e{~{^Yn?[zfiYffY[f?y"
];

const objectsData = [
	"ffeffafd0867465243deeabc789", // color bank
	"345678", // obstacle
	"124674", // coin
	"064124", // cloudX
	"012435", // sparkleA
	"012435", // sparkleB
	"067123", // prison
	"012", // up
	"012", // right
	"012", // down
	"012", // left
	"UEifywyvUuxoH@fHkfXzlOp@`A`BYffYo~PB@BpC^I\\m`C@B@@Lp`IPE`ILpCLBLAHBDCHCLp@|CsLp@p@@@@C@L|?@L@C@@@@p@p@sL|Cp@p@L@?OL@p@@@"
];

encodeBitmap(unitData, unitBitmaps);
encodeBitmap(backgroundsData, backgroundsBitmaps);
encodeBitmap(objectsData, objectBitmaps);

function drawPalettedBitmap(src, ref) {
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

// Shared palette variations, 3 slots each, indexed after a tile's own ones
//const PALS = "0120463560793920de3823e2abe";

function drawPaletted(src, i, dx, dy, dw, dh, ctx) {
	//const w = src.palW || 3;
	// index 0 is the tile's main palette; once its own run out, continue into PALS
	//const o = (i || 0) * w;
	const ref = i.length > 1 ? i : src.pal;//src.pal.substr(o, w) || PALS.substr(o - src.pal.length, w) || "012";
	const bmp = drawPalettedBitmap(src, ref);
	ctx.drawImage(bmp, 0, 0, bmp.width, bmp.height, dx, dy, dw, dh);
}
