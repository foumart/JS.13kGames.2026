let debugKeys = 1; // 0 for release zip

function onKeyDown(event) {
	const k = event.keyCode;
	if (debugKeys && k == 78) {
		debugAdvance();
		return;
	}
	if (debugKeys && k == 66 && !battleActive) {
		debugSkipToBattle();
		return;
	}
	if (showPick) {
		if (k == 37 || k == 65) movePickCursor(-1);
		else if (k == 39 || k == 68) movePickCursor(1);
		else if (k == 32) pickCursorUnit();
		else if (k == 13) confirmParty();
		else if (k == 82) {
			resetBattle();
		}
		return;
	}
	if (showUpgrade) {
		if (k == 37 || k == 65) moveUpgradeCursor(-1, 0);
		else if (k == 39 || k == 68) moveUpgradeCursor(1, 0);
		else if (k == 38 || k == 87) moveUpgradeCursor(0, -1);
		else if (k == 40 || k == 83) moveUpgradeCursor(0, 1);
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
		else if (k == 82) {
			if (battleActive) resetBattle();
			else {
				skipObjective = 1;
				resetLevel();
			}
		}
		return;
	}
	if (battleActive) {
		if (k == 82) { // R reset battle
			resetBattle();
			return;
		}

		battleKey(event);
	}
	else if (k == 82) { // R reset current stage
		skipObjective = 1;
		resetLevel();
	}
	else if (k == 32) {
		event.preventDefault();
		if (showEnd && state == 2) nextLevel();
		else useSparkAbility();
	}
	else if (k == 13) {
		if (showEnd && state == 2) nextLevel();
	}
	else if (k == 38 || k == 87) { // up / W
		act(0, -1);
	}
	else if (k == 40 || k == 83) { // down / S
		act(0, 1);
	}
	else if (k == 37 || k == 65) { // left / A
		act(-1, 0);
	}
	else if (k == 39 || k == 68) { // right / D
		act(1, 0);
	}
}
