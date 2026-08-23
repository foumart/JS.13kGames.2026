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
		dest.push(drawPalettedBitmap({ width: size, height: size, px, bank }, group[k + 1]));
	}
}

const unitData = [
	"feff8bec0776433edac905413592159c6c44834", // color bank
	, // unicorn idle
	, // unicorn jump
	"980", // leprechaun
	"4c6", // hydra
	"4ab", // serpent
	"762", // merlin
	"7b5", // fiona
	"435", // random
	"7b1", // bleys
	"782", // caine
	"E@@T}@PjChaNjjzjjzPizljzljzE@@T}@PjNhazjjzjjz@hJpjBpj@@T@`jBdjFiYZiZdjFP@AP@A@@@`EEuGn{[nij[TnF@^@PjFdvZYP[P]CdjNijZ}~ZdUFpjA`YMpdF`PE@UpPnqRqdipx~rjnlZZLTPMD@M`Z@xkAxobd[JiZC[jM`iF`b@``@@Y``bPqlnnkjJBY@PfA`bBXbI@z@P_CPsdfr^ZzdiaPfBPQAPP@@V@`~A@A`]Jdffnjnhij@Q@`QB"
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

function drawPaletted(src, ref, dx, dy, dw, dh, ctx) {
	const bmp = drawPalettedBitmap(src, ref);
	ctx.drawImage(bmp, 0, 0, bmp.width, bmp.height, dx, dy, dw, dh);
}
