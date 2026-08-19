function onKeyDown(event) {
	if (showPick) {
		const k = event.keyCode;
		if (k == 37 || k == 65) movePickCursor(-1);
		else if (k == 39 || k == 68) movePickCursor(1);
		else if (k == 32) pickCursorUnit();
		else if (k == 13) confirmParty();
		else if (k == 82) {
			skipObjective = 1;
			resetBattle();
		}
		return;
	}
	if (showUpgrade) {
		if (event.keyCode == 13 || event.keyCode == 32) afterBattleWin();
		else if (event.keyCode == 82) {
			skipObjective = 1;
			resetBattle();
		}
		return;
	}
	if (showObjective) {
		if (event.keyCode == 13 || event.keyCode == 32) dismissObjective();
		else if (event.keyCode == 82) {
			skipObjective = 1;
			if (battleActive) resetBattle();
			else resetLevel();
		}
		return;
	}
	if (battleActive) {
		if (event.keyCode == 82) { // R reset battle
			skipObjective = 1;
			resetBattle();
			return;
		}

		battleKey(event);
	}
	else if (event.keyCode == 78) { // N debug clear stage
		debugClearLevel();
	}
	else if (event.keyCode == 66) { // B debug skip to battle
		debugSkipToBattle();
	}
	else if (event.keyCode == 82) { // R reset current stage
		skipObjective = 1;
		resetLevel();
	}
	else if (event.keyCode == 13 || event.keyCode == 32) { // Enter / Space next
		if (showEnd && state == 2) {
			if (battleActive) afterBattleWin();
			else nextLevel();
		}
	}
	else if (event.keyCode == 38 || event.keyCode == 87) { // up / W
		act(0, -1);
	}
	else if (event.keyCode == 40 || event.keyCode == 83) { // down / S
		act(0, 1);
	}
	else if (event.keyCode == 37 || event.keyCode == 65) { // left / A
		act(-1, 0);
	}
	else if (event.keyCode == 39 || event.keyCode == 68) { // right / D
		act(1, 0);
	}
}
