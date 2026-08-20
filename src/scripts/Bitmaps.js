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

const backgroundsData = [
	"3091413d995500aa553b915122332233554488ccffffffffb2d1f0947357776655d262566d2a26ee88449898b9", // color bank
	"0123", // grass
	"4520", // swamp
	"678e", // clouds
	, // desert
	"cbad", // volcano
	"3dbe", // castle
	"c4a5", // dungeon
	"uaKYQgmqRXXvumKY]gmqR[yvTEmZIXi^TFPAIFdXRcIIddRR]Ebs@]sf]Qd{fYLsYfsLfYLsWu]]aXM^WtQQ"
];

const objectsData = [
	"fd0dee776ffaabcfff554eeeeff3843333954430a579a", // color bank
	"62a", // obstacle
	"203", // coin
	"571", // cloudX
	"035", // sparkleA
	"035", // sparkleB
	"620", // castle
	"1e4", // prison
	, // tile 7
	, // tile 8
	"hJVYv{vyjztOH@nHinxZdAP@`ApB^{y^`CPB@BPAvKtg`A@B@@DP`KpO`KDPUTYYy[iZm^UUHLLHHLLHHLLH@APETUUUPEPEP@PAUEUUUEPA"
];

const unitData = [
	"433651fef2159c6541f8bc90edac44359776834ec0ec7", // color bank
	"d26", // unicorn idle
	"d26", // unicorn jump
	"3a2", // leprechaun
	"17e", // merlin
	"0c7", // hydra
	"598", // fiona
	"0b8", // random
	"596", // bleys
	"148", // julian
	"0ce", // caine
	"049", // serpent
	"J@@hV@`A|rG__`~_t_t_J@@hV@`G|r___@|OPCP@@T@`jBdjFiYZiZdjFP@AP@A@@@@UpPnqPqdjpx]rjjLZZLTPMD@M`EEuG^{[[izZTnF@^@PjIdnfYpY`Z@xkAxobdZJiZCkjM`IF`H@TT@@Y@`BPAlnNkjzBY`PfA`bBXbI@z@P_CPsdfr^ZzdiaPfBPQAPP@PE@t_@t_CXgBiiIkj[ZfZPFDXd@@U@P_AP@`jAkjGhjZPQAPQAPP@PUFdYFijZ}~ZdUFpjA`YMpdF`PE"
];

encode(backgroundsData, offscreenBitmaps);
encode(objectsData, objectBitmaps);
encode(unitData, unitBitmaps);

function palBmp(src, ref) {
	ref = ref || "012";
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
