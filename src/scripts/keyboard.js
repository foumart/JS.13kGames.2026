let debugKeys = 1; // 0 for release zip

// arrow keys / WASD -> [dx, dy], else 0
function arrowDXY(k) {
	if (k == 38 || k == 87) return UP;
	if (k == 40 || k == 83) return DOWN;
	if (k == 37 || k == 65) return LEFT;
	if (k == 39 || k == 68) return RIGHT;
	return 0;
}

// R - restart whatever is running
function resetHere() {
	if (battleActive) resetBattle();
	else {
		skipObjective = 1;
		resetLevel();
	}
}

function onKeyDown(event) {
	const k = event.keyCode;
	const d = arrowDXY(k);
	if (debugKeys && (k == 78 || event.key == "n" || event.key == "N")) {
		event.preventDefault();
		if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
		debugAdvance();
		return;
	}
	if (debugKeys && k == 66 && !battleActive) {
		debugSkipToBattle();
		return;
	}
	if (k == 27) {
		event.preventDefault();
		togglePause();
		return;
	}
	if (showPick) {
		if (d && d[0]) movePickCursor(d[0]);
		else if (k == 32) pickCursorUnit();
		else if (k == 13) confirmParty();
		else if (k == 82) {
			resetBattle();
		}
		return;
	}
	if (showUpgrade) {
		if (d) moveUpgradeCursor(d[0], d[1]);
		else if (k == 32) {
			event.preventDefault();
			pickUpgradeCursor();
		}
		else if (k == 13) afterBattleWin();
		else if (k == 82) resetBattle();
		return;
	}
	if (showObjective) {
		if (k == 13 || k == 32) dismissObjective();
		else if (k == 82) resetHere();
		return;
	}
	if (menu || showEnd) {
		if (d) moveEndCursor(d[0] || d[1]);
		else if (k == 13 || k == 32) {
			event.preventDefault();
			activateEndButton();
		}
		else if (k == 82 && !menu) Y.onclick();
		return;
	}
	if (battleActive) {
		if (k == 82) { // R reset battle
			resetBattle();
			return;
		}

		battleKey(event);
	}
	else if (k == 82) resetHere();
	else if (d) act(d[0], d[1]);
}
