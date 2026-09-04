let audio;

function sfx(tune, vol = .3, step = .05) {
	if (!audio) return;
	for (let i = 0; i < tune.length; i ++) {
		const t = audio.currentTime + i * step;
		const o = audio.createOscillator();
		const g = audio.createGain();
		o.type = "square";
		o.frequency.value = 440 * 1.06 ** (tune.charCodeAt(i) - 73);
		g.gain.setValueAtTime(vol, t);
		g.gain.linearRampToValueAtTime(0, t + step);
		o.connect(g).connect(audio.destination);
		o.start(t);
		o.stop(t + step);
	}
}

function initSound() {
	audio = audio || new AudioContext();
}
