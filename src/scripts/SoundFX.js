let audio;

function sfx(tune, step = .05, /*type = 0, */vol = .2) {
	if (!audio) return;
	for (let i = 0; i < tune.length; i ++) {
		const t = audio.currentTime + i * step;
		const o = audio.createOscillator();
		const g = audio.createGain();
		o.type = "square";//["square", "sawtooth", "triangle", "sine"][type]; // "square", "sawtooth", "triangle", "sine"
		o.frequency.value = 440 * 1.06 ** (tune.charCodeAt(i) - 73);
		g.gain.setValueAtTime(vol, t);
		g.gain.linearRampToValueAtTime(0, t + step);
		o.connect(g).connect(audio.destination);
		o.start(t);
		o.stop(t + step);
	}
}

// !"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\]^_abcdefghijklmnopqrstuvwxyz{|}~
