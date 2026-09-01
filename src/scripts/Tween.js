function tween(el, dur, to, done) {
	let n = 0;
	const step = () => {
		if (n ++ < dur) {
			for (const k in to) el[k] += (to[k] - el[k]) / (dur - n + 1);
			requestAnimationFrame(step);
		} else if (done) requestAnimationFrame(done);
	};
	requestAnimationFrame(step);
}
