const unitBitmaps = [];
const backgroundsBitmaps = [];
const objectBitmaps = [];

// ImageEncryptor: 3 px/char, 3-char, transparent
function encodeBitmap(group, dest) {
	const packed = group[group.length - 1];
	const bank = group[0];
	const n = group.length - 2;
	const step = packed.length / n | 0;
	for (let k = 0; k < n; k++) {
		const enc = packed.substr(k * step, step);
		const px = [];
		for (let i = 0; i < enc.length; i++) {
			const z = enc.charCodeAt(i);
			px.push(z & 3, (z >> 2) & 3, (z >> 4) & 3);
		}
		const pal = group[k + 1] || "";
		const palW = 3;
		dest.push(drawPalettedBitmap([px, bank, pal, palW], pal.substr(0, palW)));
	}
}

const unitData = [
	"eda776433fd049b3592159c6e90392feff8bf59c44834", // color bank
	"ab3ac3", // unicorn idle
	"ab3ac3", // unicorn jump
	"b52", // leprechaun
	"712", // hydra
	"792", // serpent
	"b56", // fiona / flora
	"be2", // gerard / eric
	"bd2", // bleys / brand
	"be6", // caine / corwin
	"E@@T}@PjChdNjjzjjz@jzhjzhjzE@@T}@PjNhazjjzjjz@hJpjBpj@@@@@|@`jBljNk{zkUzljNp@Cp@C`OO_MfYyfkjy|fN@v@pjNl^z{pypoB\\UIWUukiu\\VM`UCPgK`\\mPpK`z@XiCXeblyJkzAyjG`kN`b@``@@{``UbpUSdffijJB{@pnC`bBxbK@Z@puApUQlnRvzZlkcpnBpsCpp@@~@`WC@UC`wJxnnfjwh{j@bC`sC"
];

const backgroundsData = [
	"4a5395385264001022133", // color bank
	"012654", // grass
	"023", // tile top
	"023", // tile right
	"023", // tile bottom
	"023", // tile left
	"023", // tile bottom right
	"023", // tile bottom left
	"023", // tile top left
	"023", // tile top right
	"023", // tile bay top
	"023", // tile bay left
	"023", // tile bay bottom
	"023", // tile bay right
	"023", // tile hole
	"012", // tile vertical
	"012", // tile horizontal
	"f_eYoYVYv{fU@@@@@CLB{}fU@@O@@@E@N@C@fZWm|q@B@C@@@k@P@PpV@\\@[fyuNOCI@O@@@DZH_LP@T@h@|@@@P@p@@LTD\\L@I@CCeCG@GoVie^zSO`BpC@GAEBJC@@K@G|@@@@@@E`GagUki|^@S@`TpdVuZJ_O`@pLDtW@@AP@PA@AP@@TD@@@@@@@@DE"
];

const objectsData = [
	"ffeffafd0deeabc465f44d33833", // color bank
	"678", // tile 10
	"125345", // coin
	"035125", // cloudX
	"012533", // sparkleA
	"012533", // sparkleB
	"034123", // prison
	"012", // up
	"012", // right
	"012", // down
	"012", // left
	"@@pC\\NlMlNpCH@fHkfXzlOp@`A`BYffYo~PB@BpC^I\\m`C@B@@Lp`IPE`ILpCLBLAHBDCHCLp@|CsLp@p@@@@C@L|?@L@C@@@@p@p@sL|Cp@p@L@?OL@p@@@"
];

encodeBitmap(unitData, unitBitmaps);
encodeBitmap(backgroundsData, backgroundsBitmaps);
encodeBitmap(objectsData, objectBitmaps);

// bitmap: [px, bank, pal, palW, cache]
function drawPalettedBitmap(src, ref) {
	if (!src[4]) src[4] = {};
	if (src[4][ref]) return src[4][ref];
	const bank = src[1];
	const palette = ref.replace(/./g, c => bank.substr(parseInt(c, 16) * 3, 3));
	const c = document.createElement("canvas");
	const ctx = c.getContext("2d");
	const size = Math.sqrt(src[0].length) | 0;
	c.width = size;
	c.height = size;
	for (let i = 5; i--;) c[i] = src[i];
	for (let y = 0; y < size; y++) {
		for (let x = 0; x < size; x++) {
			const p = src[0][y * size + x];
			if (p) {
				ctx.fillStyle = "#" + palette.substr(3 * (p - 1), 3);
				ctx.fillRect(x, y, 1, 1);
			}
		}
	}
	return src[4][ref] = c;
}

function drawPaletted(src, i, dx, dy, dw, dh, ctx) {
	const w = src[3] || 3;
	const ref = typeof i == "string" ? i : src[2].substr((i || 0) * w, w) || "012";
	const bmp = drawPalettedBitmap(src, ref);
	ctx.drawImage(bmp, 0, 0, bmp.width, bmp.height, dx, dy, dw, dh);
}
