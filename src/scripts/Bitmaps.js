const offscreenBitmaps = [];
const objectBitmaps = [];
const unitBitmaps = [];
const backgroundsBitmaps = [];
const objectsBitmaps = [];

// ImageEncryptor: color bank, empty pal = 012, pixel 0 = trans; auto 2/3 px
function encode(group, dest) {
	const packed = group[group.length - 1];
	const bank = group[0];
	const n = group.length - 2;
	const step = packed.length / n | 0;
	const ppc = Math.sqrt(step * 3) % 1 ? 2 : 3;
	const size = Math.sqrt(step * ppc) | 0;
	const mask = ppc === 3 ? 3 : 7;
	const sh = ppc === 3 ? 2 : 3;
	for (let k = 0; k < n; k++) {
		const enc = packed.substr(k * step, step);
		const px = [];
		for (let i = 0; i < enc.length; i++) {
			const z = enc.charCodeAt(i);
			for (let p = 0; p < ppc; p++) px.push((z >> (p * sh)) & mask);
		}
		dest.push(palBmp({ width: size, height: size, px, bank }, group[k + 1] || (ppc === 2 ? "0123456" : "012")));
	}
}

const unitData = [
	"fef776433edaec0c90541359215f8b9c6c44834", // color bank
	"409", // unicorn idle
	"409", // unicorn jump
	"870", // leprechaun
	"2c5", // hydra
	"2ab", // serpent
	"654", // merlin
	"6b3", // fiona
	"213", // random
	"6b9", // bleys
	"674", // caine
	"J@@hV@`A|rG__`~_t_t_J@@hV@`G|r___@|OPCP@@T@`jBdjFiYZiZdjFP@AP@A@@@`EEuGn{[nij[TnF@^@PjFdvZYP[P]CdjNijZ}~ZdUFpjA`YMpdF`PE@UpPnqRqdjpx]rjjlZZLTPMD@M`Z@xkAxobd[JiZC[jM`iF`b@``@@Y@`BPAlnNkjzBY`PfA`bBXbI@z@P_CPsdfr^ZzdiaPfBPQAPP@@Y@PAPAh]Jdffnjnhij@Q@`QB"
];

const backgroundsData = [
	"3091413d995500aa553b9151808980acb9b3ffffffc1dffbb2d1f088ccffee8844d26256947357776655", // color bank
	"0123", // grass
	"4520", // swamp
	"9687", // clouds
	"bdca", // desert
	"cbda", // volcano
	"dabc", // castle
	"c4d5", // dungeon
	"uaKYQgmqRXXvumKY]gmqR[yvTEm^IX}^TGPAIFdXRcIIddRR]Ebs@]sf]Qd{fYLsYfsLfYLsWu]]aXM^WtQQ"
];

const objectsData = [
	"fffffafd0776554333deeabc", // color bank
	"435", // obstacle
	"321", // coin
	"036", // cloudX
	"210", // sparkleA
	"210", // sparkleB
	"432", // castle
	"607", // prison
	"254", // up
	"254", // right
	"254", // down
	"254", // left
	"hJVYv{vyjztOH@nHinxZdAP@pApC]ww]zkPC@BPAvKtg`A@B@@DP`KpO`KDPbHfYjZn[jZTUDLLDDLLDDLLDP@TAQDP@P@@@P@@AUE@AP@@@P@P@QDTAP@@@P@D@UED@P@@@"
];

encode(backgroundsData, offscreenBitmaps);
encode(objectsData, objectBitmaps);
encode(unitData, unitBitmaps);

function palBmp(src, ref) {
	ref = ref || "012";
	if (ref.length != 4) while (ref.length < 7) ref += ref.length.toString(16);
	if (!src.pals) src.pals = {};
	if (src.pals[ref]) return src.pals[ref];
	const bank = src.bank;
	const cw = bank.length > 48 ? 6 : 3;
	const pal = ref.replace(/./g, c => bank.substr(parseInt(c, 16) * cw, cw));
	const c = document.createElement("canvas");
	c.width = src.width;
	c.height = src.height;
	c.px = src.px;
	c.bank = bank;
	c.pals = src.pals;
	const ctx = c.getContext("2d");
	const size = src.width;
	const px = src.px;
	const solid = ref.length == 4;
	for (let y = 0; y < size; y++) {
		for (let x = 0; x < size; x++) {
			const p = px[y * size + x];
			if (solid) {
				ctx.fillStyle = "#" + pal.substr(cw * p, cw);
				ctx.fillRect(x, y, 1, 1);
			} else if (p) {
				ctx.fillStyle = "#" + pal.substr(cw * (p - 1), cw);
				ctx.fillRect(x, y, 1, 1);
			}
		}
	}
	return src.pals[ref] = c;
}

function drawPaletted(src, ref, dx, dy, dw, dh) {
	const bmp = palBmp(src, ref);
	gameContext.drawImage(bmp, 0, 0, bmp.width, bmp.height, dx, dy, dw, dh);
}
