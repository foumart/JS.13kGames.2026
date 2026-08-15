function onKeyDown(event) {
	if (event.keyCode == 82) { // R reset current stage
		resetLevel();
		return;
	}

	if (event.keyCode == 13 || event.keyCode == 32) { // Enter / Space next
		if (showEnd && state == 2) nextLevel();
		return;
	}

	if (event.keyCode == 38 || event.keyCode == 87) { // up / W
		act(0, -1);
	} else
	if (event.keyCode == 40 || event.keyCode == 83) { // down / S
		act(0, 1);
	} else
	if (event.keyCode == 37 || event.keyCode == 65) { // left / A
		act(-1, 0);
	} else
	if (event.keyCode == 39 || event.keyCode == 68) { // right / D
		act(1, 0);
	}
}
