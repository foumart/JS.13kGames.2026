function createSpriteIcon(s, fn) {
	const c = document.createElement("canvas");
	c.width = c.height = s;
	iconContext = c.getContext("2d");
	iconContext.imageSmoothingEnabled = 0;
	if (fn) fn(s);
	iconContext = 0;
	return c;
}

function createSparkAnim(size) {
	const d = line();
	d.id = "spr";
	d.s = size;
	d.t = 0;
	return d;
}

function pulseSparkles() {
	const t = time / 180 | 0;
	if (self.spr && spr.parentNode && spr.t != t) {
		spr.innerHTML = "";
		spr.appendChild(createSpriteIcon(spr.s, s => drawSparkle(0, 0, s, t)));
		spr.t = t;
	}
}

function createIcon(unit, size) {
	return createSpriteIcon(size, s => drawUnitIcon(unit, s / 2, s / 2, s))
}

function createUnitStatsText(unit, sep = "\n") {
	const hp = sep ? Math.max(0, unit.hp) + "/" : "";
	if (!sep) sep = " | ";
	const txt = document.createElement("div");
	txt.style.whiteSpace = "pre";
	txt.textContent = "HP: " + hp + unit.hpMax + sep + "Dmg: " + unit.dmg
		+ sep + "Move: " + unit.mvMax + sep + "Att: " + unit.atkMax;
	return txt;
}

function appendLine(c, t) {
	msg.appendChild(line(c, t));
}

function line(c = 3, t = "\xa0") {
	//if (!t) t = "\xa0";
	const d = row();
	d.className = ["x","e","l","s","m"][c];
	d.textContent = t;
	return d;
}

function row() {
	const d = document.createElement("div");
	d.className = "g";
	return d;
}

function uiSize() {
	return Math.max(20, Math.min(width, height) * 0.1 | 0);
}

function updateUI() {
	// top left and right panels
	const sc = currentScore();
	const briefing = showPick || showObjective;
	const ally = battleActive && !briefing ? getBattleUIAlly() : 0;
	const foe = battleActive && !briefing ? getBattleUIFoe() : 0;
	const size = uiSize();

	if (menu == 1) L.textContent = R.textContent = "";
	else {
		L.textContent = "Score: " + sc;
		L.appendChild(document.createElement("hr"));
		R.textContent = puzzleMode ? "Hi-score: " + hiscore : "Vail " + shadowNumber();
		R.appendChild(document.createElement("hr"));
		L.appendChild(playerCard(size));
		if (battleActive && !battleResult && !briefing) {
			if (ally) L.appendChild(unitCard(ally, size, 0));
			if (foe && foe.hp > 0) R.appendChild(unitCard(foe, size, 1));
		} else if (!puzzleMode && !battleResult) {
			R.appendChild(enemyCard(size));
		}
	}

	const fade = menu || showPick || showUpgrade || showObjective || (showEnd && (state > 1 || battleResult > 1));
	ov.style.background = fade ? "#103c" : "";
	if (!fade) {
		msg.textContent = "";
		return;
	}

	// overlay
	msg.style.pointerEvents = showPick || showUpgrade ? "auto" : "none";
	msg.textContent = "";
	if (menu == 1) {
		appendLine(2, "The Fourth");
		appendLine(0, "Labyrinth");
	} else if (menu == 2) appendLine(1, "PAUSED");
	else if (showPick) fillPick();
	else if (showUpgrade) fillUpgrade();
	else if (showObjective) fillBrief();
	else fillEnd();

	// bottom
	if (menu) showMenuButtons();
	else if (showPick || showObjective) showObjectiveButtons();
	else if (showUpgrade || showEnd) showEndButtons();
	else if (battleActive && !battleResult) showBattleTurnButton();
	else hideEndButtons();
}

function unitCard(unit, size, right) {
	const div = row();
	if (right) div.style.flexDirection = "row-reverse";
	div.appendChild(createIcon(unit, size));
	div.appendChild(createUnitStatsText(unit));
	return div;
}

function playerCard(size) {
	if (puzzleMode) return line(3, "Perfect: " + perfects);
	const d = row();
	d.appendChild(createSpriteIcon(size * .75, s => drawUnitIcon(0, s / 2, s / 2, s)));
	d.appendChild(line(3, ": " + lives));
	return d;
}

function foeThumb(v, s) {
	const k = v / 10 | 0, e = k > 2 && ENEMIES[k - 3];
	return createSpriteIcon(s, z => drawUnitIcon(
		e ? {bgr: e[5], palette: e[6]} : {bgr: 2 + k, palette: getEnemyPalette(k, v % 10)},
		z / 2, z / 2, z));
}

function enemyCard(size) {
	const d = row();
	d.style.display = "block";
	if (!showPick) {
		d.appendChild(line(4, "upcoming in"));
		d.appendChild(line(4, (4-stageNumber()) + " puzzles"));
	}
	const add = (n, v, s) => {
		if (!n) return;
		const r = row();
		//if (v == 2 && !showPick) r.appendChild(line(3, "!"));
		r.appendChild(foeThumb(v, s));
		//if (v != 2) r.appendChild(line(4, ": " + n));
		d.appendChild(r);
	};
	const w = BATTLES[levelIndex / 3 | 0];
	for (let i = 0; i < w.length;) {
		let n = 1;
		while (w[i + n] == w[i]) n++;
		add(n, w[i], size * .75);
		i += n;
	}
	for (let k = 0; k < 3; k++) add(leftoverKinds[k], k + 1, size / 2);
	return d;
}

function getTitle(battle) {
	return "World " + worldNumber() + "-" + shadowNumber();
}

function printProgress() {
	appendLine(1 - portrait, puzzleMode ? "Puzzle " + (levelIndex + 1) : getTitle());
	if (!puzzleMode) appendLine(2 - portrait, battleActive ? "Vail " + battleKind + " - battle" : "Puzzle " + stageNumber());
}

function fillBrief() {
	const size = uiSize() * 1.2 | 0;
	printProgress();

	appendLine(portrait ? 1 : 3);

	if (stageCaptive) {
		const r = row();
		r.appendChild(line(2, "Rescue "));
		const c = createIcon(stageCaptive, size);
		r.appendChild(c);
		r.appendChild(line(2, stageCaptive));
		r.className = "g";
		c.className = "if";
		msg.appendChild(r);
		appendLine();
	}

	appendLine(3, (stageCaptive ? "and g" : "G") + "et to");
	msg.appendChild(createSparkAnim(size));
}

function fillPick() {
	const size = Math.max(40, Math.min(width / (rescuedUnits.length + 1), height * 0.14) | 0);
	const need = Math.min(2, livingRescueCount());
	printProgress();
	appendLine(3, need > 1 ? "Pick " + need + " allies" : "Your ally");
	const r = row();
	for (let i = 0; i < rescuedUnits.length; i++) {
		const bmp = rescuedUnits[i];
		const dead = isDeadBmp(bmp);
		const wrap = row();
		wrap.className = "g" + (battleParty.indexOf(bmp) >= 0 ? " on" : " in") + (i == pickCursor ? " cur" : "");
		const c = createIcon(rescuedUnits[i], size);
		if (dead) {
			c.style.opacity = "0.5";
		} else wrap.onclick = toggleParty.bind(null, bmp);
		wrap.appendChild(c);
		r.appendChild(wrap);
	}
	msg.appendChild(r);
	const name = rescuedUnits[pickCursor];
	if (!name) return;
	const unit = makeUnit(getUnitDefinition(name), 0, 0);
	appendLine(2, unit.name);
	appendLine(3, createUnitStatsText(unit).textContent);
	const n = ["Rook", "Bishop", "Queen", "Knight", "Around"];
	appendLine(3, unit.mv == unit.atk ? n[unit.mv] : n[unit.mv] + " / " + n[unit.atk]);
}

function fillUpgrade() {
	const size = uiSize();
	appendLine(1, "VICTORY!");
	appendLine(3, "Choose a bonus");
	const list = battleRoster();
	let live = 0;
	for (let i = 0; i < list.length; i++) {
		const unit = list[i];
		const fallen = unit.hp <= 0;
		const id = upgradeId(unit);
		const pick = upgradePicks[id];
		const kinds = upgradeKinds(unit);
		const r = row();
		const ic = createSpriteIcon(size, s => drawUnitIcon(unit, s / 2, s / 2, s));
		if (fallen) ic.style.opacity = "0.5";
		r.appendChild(ic);
		const col = line(3);
		if (fallen) col.textContent = "fallen";
		else {
			col.appendChild(createUnitStatsText(unit, ""));
			const btns = row();
			const curRow = live == upgradeCurUnit;
			for (let k = 0; k < kinds.length; k++) {
				const b = document.createElement("button");
				b.textContent = upgradeLabel(kinds[k], unit);
				b.className = (pick == kinds[k] ? "on" : "") + (curRow && k == upgradeCurOpt ? " cur" : "");
				b.onclick = setUpgrade.bind(null, id, kinds[k]);
				btns.appendChild(b);
			}
			col.appendChild(btns);
			live++;
		}
		r.appendChild(col);
		msg.appendChild(r);
	}
}

function fillEnd() {
	if (!lives) {
		appendLine(1, "GAME OVER");
		appendLine(2, "SCORE " + currentScore());
		appendLine(2, "HI-SCORE " + hiscore);
		return;
	}
	if (battleActive) {
		appendLine(1, battleResult == 2 ? "VICTORY!" : "DEFEAT");
		return;
	}
	if (state == 2) {
		const size = uiSize();
		appendLine(1, "STAGE CLEAR!");

		if (isPerfect()) {
			const row1 = row();
			appendLine(2, "Perfect!");
			appendLine(3, "Bonus: 100");
			//row1.appendChild(createSparkAnim(size));
			//row1.appendChild(line(1, "+1"));
			msg.appendChild(row1);
		}

		const row3 = line(3, "");
		if (stageCaptive && rescuedUnits.indexOf(stageCaptive) >= 0) {
			const row2 = line(3, "");
			const ic = createIcon(stageCaptive, size);
			ic.className = "if";
			row2.appendChild(ic);
			appendLine();
			msg.appendChild(row2);
			row2.appendChild(line(3, stageCaptive + " joined!"));
			row3.appendChild(line(4, "but"));
		}
		
		let vailed = 0;
		for (let kind = 0; kind < 3; kind++) {
			for (let n = leftUnitsThisLevel[kind]; n--;) {
				const enemy = foeThumb(kind + 1, size);
				row3.appendChild(enemy);
				enemy.className = "if";
				vailed ++;
			}
		}
		if (vailed && !puzzleMode) {
			appendLine();
			msg.appendChild(row3);
			row3.appendChild(line(3, "enter the Vail"));
		}
	}/* else {
		appendLine(2, "STUCK - R");
		appendLine(2, "SCORE " + currentScore() + "  MOVES " + moveCount);
	}*/
}
