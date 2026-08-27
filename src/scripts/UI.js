//let uiK, hudK;

function createSpriteIcon(s, fn) {
	const c = document.createElement("canvas");
	c.width = c.height = s;
	iconContext = c.getContext("2d");
	iconContext.imageSmoothingEnabled = 0;
	fn(s);
	iconContext = 0;
	return c;
}

function createSparkAnim(size) {
	return createSpriteIcon(size, s => drawSparkle(0, 0, s, time / 180));
}

function createIcon(unit, size) {
	return createSpriteIcon(size, s => drawUnitIcon(unit, s / 2, s / 2, s))
}

function createUnitStatsText(unit, textAlign = "left", sep = "\n") {
	const txt = document.createElement("div");
	txt.style.textAlign = textAlign || "right";
	txt.style.whiteSpace = "pre";
	txt.textContent = "HP " + Math.max(0, unit.hp) + "/" + unit.hpMax + sep + "Dmg " + unit.dmg
		+ sep + "Move " + unit.range + sep + "Range " + unit.reach;
	return txt;
}

function line(t, c = "l") {
	const d = document.createElement("div");
	d.className = c;
	d.textContent = t;
	return d;
}

function addLineBreak() {
	const b = document.createElement("br");
	return b;
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
	updateHud();
	updateOverlay();
	//pulseSparkles();
	if (showPick || showObjective) showObjectiveButtons();
	else if (showUpgrade || showEnd) showEndButtons();
	else if (battleActive && !battleResult) showBattleTurnButton();
	else hideEndButtons();
}

function updateHud() {
	const sc = currentScore();
	//L.textContent = (sc ? "Score: " + sc : "");
	//L.style.display = sc ? "flex" : "none";
	const briefing = showPick || showObjective;
	const ally = battleActive && !briefing ? getBattleUIAlly() : 0;
	const foe = battleActive && !briefing ? getBattleUIFoe() : 0;
	/*const k = [
		battleActive, briefing, fillCharges, rescuedUnits.join(), leftoverKinds.join(),
		isBossBattle(), levelIndex,
		battleActive ? 0 : countAliveLeprechaunsOfKind(1),
		battleActive ? 0 : countAliveLeprechaunsOfKind(2),
		battleActive ? 0 : countAliveLeprechaunsOfKind(3),
		ally && ally.name, ally && ally.hp, ally && ally.dmg, ally && ally.range, ally && ally.reach,
		foe && foe.name, foe && foe.hp, foe && foe.dmg, foe && foe.range, foe && foe.reach
	].join("|");
	if (k == hudK) return;
	hudK = k;*/
	L.textContent = sc || moveCount ? "Score: " + currentScore() : "Welcome to The Fourth Labyrinth!";
	L.appendChild(addLineBreak());
	R.textContent = sc || moveCount ? "" : "Hi-score: " + hiscore;
	const size = uiSize();
	if (battleActive && !briefing) {
		if (ally) L.appendChild(unitCard(ally, size, 0));
		if (foe && foe.hp > 0) R.appendChild(unitCard(foe, size, 1));
	} else {
		L.appendChild(playerCard(size));
		R.appendChild(enemyCard(size));
	}
	//L.style.display = L.firstChild ? "flex" : "none";
	L.style.display = L.firstChild ? "block" : "none";
	R.style.display = R.firstChild ? "flex" : "none";
}

function unitCard(unit, size, right) {
	const div = row();
	if (right) div.style.flexDirection = "row-reverse";
	div.appendChild(createIcon(unit, size));
	/*const txt = document.createElement("div");
	txt.style.textAlign = right ? "right" : "left";
	txt.style.whiteSpace = "pre";
	txt.textContent = "HP " + Math.max(0, unit.hp) + "/" + unit.hpMax + "\nDmg " + unit.dmg
		+ "\nMove " + unit.range + "\nRange " + unit.reach;*/
	div.appendChild(createUnitStatsText(unit));
	return div;
}

function playerCard(U) {
	const d = document.createElement("div");
	/*const top = row();
	top.appendChild(createSpriteIcon(U, s => drawUnitIcon(0, s / 2, s / 2, s)));
	const sp = createSpriteIcon(U / 2 | 0, s => drawSparkle(0, 0, s, time / 180));
	top.appendChild(sp);
	top.appendChild(document.createTextNode(":" + fillCharges));
	d.appendChild(top);
	const n = rescuedUnits.length;
	if (n) {
		const r = row();
		const sm = U / 2 | 0;
		for (let i = 0; i < n; i++) r.appendChild(createSpriteIcon(sm, s => drawUnitIcon(rescuedUnits[i], s / 2, s / 2, s)));
		d.appendChild(r);
	}*/
	return d;
}

function enemyCard(U) {
	const d = document.createElement("div");
	/*d.style.textAlign = "right";
	d.appendChild(document.createTextNode("Vail " + shadowNumber()));
	const w = worldNumber();
	const boss = shadowNumber() == 3;
	const cap = n => n > 3 ? 3 : n;
	const type = boss ? w < 3 ? 1 : 2 : w > 3 ? 2 : w > 1 ? 1 : 0;
	const lvl = boss ? w < 3 ? w : levelIndex >= campaignLength - 3 ? 4 : cap(w - 2)
		: type ? cap(type > 1 ? w - 3 : w - 1) : shadowNumber() > 1 ? 4 : 2;
	const lead = row();
	lead.style.justifyContent = "flex-end";
	lead.appendChild(document.createTextNode(1));
	lead.appendChild(createSpriteIcon(U, s => drawUnitIcon(
		{ bgr: 2 + type, palette: getEnemyPalette(type, lvl) }, s / 2, s / 2, s)));
	d.appendChild(lead);
	for (let k = 0; k < 3; k++) {
		const n = leftoverKinds[k] + countAliveLeprechaunsOfKind(k + 1);
		if (!n) continue;
		const r = row();
		r.style.justifyContent = "flex-end";
		r.appendChild(document.createTextNode(n));
		r.appendChild(createSpriteIcon(U * 0.5, s => drawLeprechaunSprite(0, 0, s, 0, 0, 0, k + 1)));
		d.appendChild(r);
	}*/
	return d;
}

/*function pulseSparkles() {
	const list = document.querySelectorAll("#ui canvas.sp");
	for (let i = 0; i < list.length; i++) {
		const c = list[i];
		iconContext = c.getContext("2d");
		iconContext.clearRect(0, 0, c.width, c.height);
		drawSparkle(0, 0, c.width, time / 180);
		iconContext = 0;
	}
}*/

function updateOverlay() {
	const fade = showPick || showUpgrade || showObjective || (showEnd && (state > 1 || battleResult > 1));
	ov.style.display = fade ? "block" : "none";
	if (!fade) {
		//uiK = "";
		return;
	}
	//const dark = (state == 3 || battleResult == 3) && !showUpgrade && !showPick && !showObjective;
	//ov.style.background = dark ? "#0009" : "#103c";
	msg.style.pointerEvents = showPick || showUpgrade ? "auto" : "none";
	/*const k = [
		showPick, showUpgrade, showObjective, showEnd, state, battleResult,
		pickCursor, battleParty.join(), JSON.stringify(upgradePicks),
		upgradeCurUnit, upgradeCurOpt, rescuedUnits.join(), stageCaptive,
		isPerfect(), moveCount, currentScore()
	].join("|");
	if (k == uiK) return;
	uiK = k;*/
	msg.textContent = "";
	if (showPick) fillPick();
	else if (showUpgrade) fillUpgrade();
	else if (showObjective) fillBrief();
	else fillEnd();
}

function fillBrief() {
	const size = uiSize() * 1.2 | 0;
	if (battleActive) {
		msg.appendChild(line(battleTitle()));
		msg.appendChild(line("Destroy all enemies", "s"));
		return;
	}
	msg.appendChild(line("World: " + worldNumber() + "-" + shadowNumber(), "e"));
	msg.appendChild(line("Stage: " + stageNumber()));
	//msg.appendChild(addLineBreak());
	if (stageCaptive) {
		const r = row();
		r.appendChild(addLineBreak());
		r.appendChild(line("Rescue "));
		r.appendChild(createIcon(stageCaptive, size));
		r.appendChild(line(stageCaptive));
		r.appendChild(addLineBreak());
		msg.appendChild(r);
	}

	const p = row();
	p.appendChild(createSparkAnim(size)).style.marginTop = "9vmin";
	msg.appendChild(p);
}

function fillPick() {
	const size = Math.max(40, Math.min(width / (rescuedUnits.length + 1), height * 0.14) | 0);
	const need = Math.min(2, livingRescueCount());
	msg.appendChild(line(battleTitle()));
	msg.appendChild(line("Destroy all enemies"));
	msg.appendChild(line(need > 1 ? "Pick " + need + " allies" : "Your ally", "s"));
	const r = row();
	for (let i = 0; i < rescuedUnits.length; i++) {
		const bmp = rescuedUnits[i];
		const dead = isDeadBmp(bmp);
		const wrap = document.createElement("div");
		wrap.className = "g" + (battleParty.indexOf(bmp) >= 0 ? " on" : "") + (i == pickCursor ? " cur" : "");
		const c = createIcon(rescuedUnits[i], size);
		if (dead) {
			c.style.opacity = "0.5";
			/*const g = c.getContext("2d");
			g.strokeStyle = "#e22";
			g.lineWidth = Math.max(3, U * 0.08);
			g.beginPath();
			g.moveTo(4, 4);
			g.lineTo(U - 4, U - 4);
			g.moveTo(U - 4, 4);
			g.lineTo(4, U - 4);
			g.stroke();*/
			//wrap.onclick = () => { pickCursor = i; drawBoard(); };
		} else wrap.onclick = toggleParty.bind(null, bmp);
		wrap.appendChild(c);
		r.appendChild(wrap);
	}
	msg.appendChild(r);
	const name = rescuedUnits[pickCursor];
	if (!name) return;
	const unit = makeUnit(getUnitDefinition(name), 0, 0);
	msg.appendChild(line(unit.name, "s"));
	msg.appendChild(line(createUnitStatsText(unit).textContent, "s"));
	//msg.appendChild(line("HP:" + u.hpMax + "  Dmg:" + u.dmg));
	//msg.appendChild(line("Move:" + u.range/* + " " + rayStyle(u.moveRays())*/));
	//msg.appendChild(line("Range:" + (u.around || u.reach)/* + " " + rayStyle(u.attackRays())*/));
}

function fillUpgrade() {
	const size = uiSize();
	msg.appendChild(line("VICTORY!"));
	msg.appendChild(line("Choose a bonus", "s"));
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
		const col = document.createElement("div");
		col.style.textAlign = "left";
		col.style.fontSize = "3vmin";
		if (fallen) col.textContent = "fallen";
		else {
			col.appendChild(createUnitStatsText(unit, 0, " "));
			const btns = row();
			const curRow = live == upgradeCurUnit;
			for (let k = 0; k < kinds.length; k++) {
				const b = document.createElement("button");
				b.textContent = upgradeLabel(kinds[k]);
				b.className = (pick == kinds[k] ? "on" : "") + (curRow && k == upgradeCurOpt ? " cur" : "");
				b.onclick = setUpgrade.bind(null, id, kinds[k]);
				btns.appendChild(b);
			}
			col.appendChild(btns);
			live++;
		}
		r.appendChild(col);
		//r.appendChild(addLineBreak());
		msg.appendChild(r);
	}
}

function fillEnd() {
	if (battleActive) {
		msg.appendChild(line(battleResult == 2 ? "VICTORY!" : "DEFEAT - R"));
		return;
	}
	if (state == 2) {
		const size = uiSize();
		msg.appendChild(line("STAGE CLEAR!", "e"));

		const row1 = row();
		if (isPerfect()) {
			msg.appendChild(line("Perfect!"));
			msg.appendChild(addLineBreak());
			row1.appendChild(createSparkAnim(size));
			row1.appendChild(line("+1", "e"));
		}
		msg.appendChild(row1);

		const row2 = row();
		for (let i = 0; i < rescuedUnits.length; i++) {
			row2.appendChild(createIcon(rescuedUnits[i], size));
		}
		msg.appendChild(row2);

		const row3 = row();
		for (let k = 0; k < 3; k++) {
			for (let n = leftUnitsThisLevel[k]; n--;) {
				row3.appendChild(createSpriteIcon(size, s => drawLeprechaunSprite(0, 0, s, 0, 0, 0, k + 1)));
			}
		}
		if (row3.firstChild) msg.appendChild(row3);
	} else {
		msg.appendChild(line("STUCK - R"));
		msg.appendChild(line("SCORE " + currentScore() + "  MOVES " + moveCount));
	}
}
