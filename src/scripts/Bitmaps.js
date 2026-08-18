const offscreenBitmaps = [];
const unitBitmaps = [];

// ImageEncryptor: 3 pixels per ANSI char, 3-char colors (3 + transparency)
function encode(group, dest) {
	const packed = group[group.length - 1];
	const n = group.length - 1;
	const step = packed.length / n | 0;
	const size = Math.sqrt(step * 3) | 0;
	for (let k = 0; k < n; k++) {
		const pal = group[k];
		const enc = packed.substr(k * step, step);
		const px = [];
		for (let i = 0; i < enc.length; i++) {
			const z = enc.charCodeAt(i);
			px.push(z & 3, (z >> 2) & 3, (z >> 4) & 3);
		}
		const c = document.createElement("canvas");
		c.width = size;
		c.height = size;
		const ctx = c.getContext("2d");
		for (let y = 0; y < size; y++) {
			for (let x = 0; x < size; x++) {
				const p = px[y * size + x];
				if (p) {
					ctx.fillStyle = "#" + pal.substr(3 * (p - 1), 3);
					ctx.fillRect(x, y, 1, 1);
				}
			}
		}
		dest.push(c);
	}
}

const backgroundData = [
	"3844a4273", // grass
	"554776333", // obstacle
	"c90fe6ffa", // coin
	"eeeddebbc", // snow
	"effdeeabc", // cloudH
	"effdeeabc", // cloudV
	"fffeefcdd", // cloudX
	"ffafe6fff", // sparkleA
	"fe6ffafff", // sparkleB
	"554776fe6", // castle
	"44379abbb", // prison
	"UeYYUeeUVYYVTEiZy[y[iZTE@@dAyFd[t^PEeUyfVYeUYnVY@@AP^{iZCp@@dMpBPCpB`C\\F`ApB^{y^`CPB@A`ByGx[PB@A@@DP`KpO`KDPDDYYy[iZm^UUHLLHHLLHHLLH"
];

const unitData = [
	"ec0feff8b", // unicorn idle
	"ec0feff8b", // unicorn jump
	"00673aedf", // leprechaun
	"662899ec7", // corwin
	"763c90fe6", // merlin
	"433834e80", // hydra
	"541752c82", // brand
	"443776ccb", // benedict
	"632c46fdd", // fiona
	"432664eda", // random
	"530c44eaa", // bleys
	"335384eda", // julian
	"433954cbc", // caine
	"215359eda", // gerard
	"J@@hV@`A|rG__`~_t_t_J@@hV@`G|r___@|OPCP@@@@PUAdjFdYFdFdjFP@AP@A@@@PU`T_at{`ppkonkjJ`jBhV@TTA@UpPnqPqdjpx]rjjLZZLTPMD@MAEEEG^[[[izZTnF@^@PjIdnfIUX@U@P}APoc@~`dkVujF`kBPQATPE@jB`wA`KXjff{kbnbPUAPQATQE`Z@xkAxobdZJiZCkjM`IF`H@TT@@Y@`BPAlnNkjzBY`PfAPbAXbI@z@P_CPsdfr^ZzdiaPfBPQAPP@`F@x_@x_Ch[BijFki[XfjPDHXd@@U@P_AP@`jAkjGhjZPQAPQAPP@@U@PApCXIk]zcjrPZBd@IT@E"
];

encode(backgroundData, offscreenBitmaps);
encode(unitData, unitBitmaps);
