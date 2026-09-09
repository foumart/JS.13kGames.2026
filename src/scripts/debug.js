let debugKeys = 1; // 0 for release zip

function debugOnKey(event) {
	if (!debugKeys) return;
	const k = event.keyCode;
	if (k == 78 || event.key == "n" || event.key == "N") {
		event.preventDefault();
		if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
		debugAdvance();
		return 1;
	}
	if (k == 66 && !battleActive) {
		debugSkipToBattle();
		return 1;
	}
}

function debugAdvance() {
	if (menu) return;
	if (battleActive) {
		if (showUpgrade || battleResult == 2) {
			afterBattleWin();
			return;
		}
		if (showPick) {
			const need = Math.min(2, rescuedUnits.length);
			for (let i = 0; i < rescuedUnits.length && battleParty.length < need; i++) {
				if (battleParty.indexOf(rescuedUnits[i]) < 0) {
					battleParty.push(rescuedUnits[i]);
				}
			}
			confirmParty();
		}
		showObjective = 0;
		hideEndButtons();
		for (let i = 0; i < battleUnits.length; i++) {
			if (battleUnits[i].enemy) battleUnits[i].hp = 0;
		}
		battleFinish(2);
		return;
	}
	if (showEnd && state == 2) {
		nextLevel();
		return;
	}
	if (moving) return;
	showObjective = 0;
	hideEndButtons();
	for (let y = 0; y < enemies.length; y++) {
		for (let x = 0; x < enemies[y].length; x++) {
			if (enemies[y][x]) {
				enemies[y][x] = 0;
				if (fillData[y]) fillData[y][x] = 1;
			}
			if (coins[y] && coins[y][x]) {
				coins[y][x] = 0;
				coinsCollected ++;
			}
			const k = rescues[y] && rescues[y][x];
			if (k) {
				rescues[y][x] = 0;
				if (rescueDying[y]) rescueDying[y][x] = 0;
				if (fillData[y]) fillData[y][x] = 1;
				if (k != 1 && rescuedUnits.indexOf(k) < 0) rescuedUnits.push(k);
			}
		}
	}
	enemiesCleared = enemiesTotal;
	countEnemiesAndCoinsLeft();
	revealPlayerTile = 1;
	state = 2;
	scheduleEndScreen();
}

function debugClearLevel() {
	if (state != 1 || moving || showObjective) return;
	for (let y = 0; y < boardHeight; y++) {
		for (let x = 0; x < boardWidth; x++) {
			if (enemies[y][x]) {
				enemies[y][x] = 0;
				fillData[y][x] = 1;
			}
		}
	}
	enemiesCleared = enemiesTotal;
	countEnemiesAndCoinsLeft();
	revealPlayerTile = 1;
	state = 2;
	scheduleEndScreen();
	redraw();
}

function debugSkipToBattle() {
	if (moving || menu || puzzleMode) return;
	rescuedUnits = [];
	const pool = [];
	for (let i = 0; i < UNITS.length; i++) pool.push(UNITS[i][0]);
	for (let i = 0; i < 4 && pool.length; i++) {
		const j = RNG(pool.length);
		rescuedUnits.push(pool.splice(j, 1)[0]);
	}
	if (!leftoverEnemies) leftoverEnemies = leftTotalThisLevel || 3;
	startBattle();
}
