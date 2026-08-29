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

function createUnitStatsText(unit, textAlign = "left", sep = "\n") {
	const hp = sep ? Math.max(0, unit.hp) + "/" : "";
	if (!sep) sep = " | ";
	const txt = document.createElement("div");
	txt.style.textAlign = textAlign || "right";
	txt.style.whiteSpace = "pre";
	txt.textContent = "HP: " + hp + unit.hpMax + sep + "Dmg: " + unit.dmg
		+ sep + "Move: " + unit.mvMax + sep + "Att: " + unit.atkMax;
	return txt;
}

function line(c = 3, t = 0) {
	if (!t) t = "\xa0";
	const d = row();
	d.className = ["x","e","l","s"][c];
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
	const initial = !sc && briefing;

	L.textContent = initial ? "Welcome to The Fourth Labyrinth!" : "Score: " + currentScore();
	R.textContent = initial ? "Hi-score: " + hiscore : "";
	const size = uiSize();
	if (battleActive && !briefing) {
		// battle UI
		if (ally) L.appendChild(unitCard(ally, size, 0));
		if (foe && foe.hp > 0) R.appendChild(unitCard(foe, size, 1));
	} else if (!initial) {
		// puzzle UI
		L.appendChild(playerCard(size));
		R.appendChild(enemyCard(size));
		
	}
	
	//L.style.display = L.firstChild ? "block" : "none";
	//R.style.display = R.firstChild ? "block" : "none";

	const fade = showPick || showUpgrade || showObjective || (showEnd && (state > 1 || battleResult > 1));
	L.style.background = fade ? "" : "#546d";
	R.style.background = fade ? "" : "#546d";
	ov.style.background = fade ? "#103c" : "";
	if (!fade) {
		msg.textContent = "";
		return;
	}

	// overlay
	msg.style.pointerEvents = showPick || showUpgrade ? "auto" : "none";
	msg.textContent = "";
	if (showPick) fillPick();
	else if (showUpgrade) fillUpgrade();
	else if (showObjective) fillBrief();
	else fillEnd();

	// bottom
	if (showPick || showObjective) showObjectiveButtons();
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

function playerCard(U) {
	const d = row();
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
	const d = row();
	d.style.textAlign = "right";
	d.appendChild(document.createTextNode("Vail " + shadowNumber() + (" sentry")));
	const w = worldNumber();

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

function getTitle(battle) {
	return "World " + worldNumber() + "-" + shadowNumber();
}

function printProgress() {
	msg.appendChild(line(1 - portrait, getTitle()));
	msg.appendChild(line(2 - portrait, battleActive ? "Vail " + battleKind + " battle" : "Puzzle " + stageNumber()));
}

function fillBrief() {
	const size = uiSize() * 1.2 | 0;
	printProgress();

	msg.appendChild(line(portrait ? 1 : 3));
	//msg.appendChild(line(3 - portrait, "Objective:"));

	if (stageCaptive) {
		const r = row();
		r.appendChild(line(2, "Rescue "));
		r.appendChild(createIcon(stageCaptive, size));
		r.appendChild(line(2, stageCaptive));
		r.className = "g in";
		msg.appendChild(r);
		msg.appendChild(line());
	}

	msg.appendChild(line(3, (stageCaptive ? "and g" : "G") + "et to"));
	msg.appendChild(createSparkAnim(size));
}

function fillPick() {
	const size = Math.max(40, Math.min(width / (rescuedUnits.length + 1), height * 0.14) | 0);
	const need = Math.min(2, livingRescueCount());
	printProgress();
	msg.appendChild(line(3, need > 1 ? "Pick " + need + " allies" : "Your ally"));
	const r = row();
	for (let i = 0; i < rescuedUnits.length; i++) {
		const bmp = rescuedUnits[i];
		const dead = isDeadBmp(bmp);
		const wrap = row();
		wrap.className += (battleParty.indexOf(bmp) >= 0 ? " on" : " in") + (i == pickCursor ? " cur" : "");
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
	msg.appendChild(line(2, unit.name));
	msg.appendChild(line(3, createUnitStatsText(unit, 0, 0).textContent));
	const n = ["Rook", "Bishop", "Queen", "Knight", "Around"];
	msg.appendChild(line(3, unit.mv == unit.atk ? n[unit.mv] : n[unit.mv] + " / " + n[unit.atk]));
}

function fillUpgrade() {
	const size = uiSize();
	msg.appendChild(line(1, "VICTORY!"));
	msg.appendChild(line(3, "Choose a bonus"));
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
			col.appendChild(createUnitStatsText(unit, 1, 0));
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
	if (battleActive) {
		msg.appendChild(line(1, battleResult == 2 ? "VICTORY!" : "DEFEAT - R"));
		return;
	}
	if (state == 2) {
		const size = uiSize();
		msg.appendChild(line(1, "STAGE CLEAR!"));

		if (isPerfect()) {
			const row1 = row();
			msg.appendChild(line(2, "Perfect!"));
			row1.appendChild(createSparkAnim(size));
			row1.appendChild(line(1, "+1"));
			msg.appendChild(row1);
		}

		if (stageCaptive && rescuedUnits.indexOf(stageCaptive) >= 0) {
			const row2 = line(3, "");
			const ic = createIcon(stageCaptive, size);
			ic.className = "in";
			row2.appendChild(ic);
			msg.appendChild(line());
			msg.appendChild(row2);
			row2.appendChild(line(3, stageCaptive + " joined!"));
		}

		const row3 = line(3, "");
		let vailed = 0;
		for (let kind = 0; kind < 3; kind++) {
			for (let n = leftUnitsThisLevel[kind]; n--;) {
				row3.appendChild(createSpriteIcon(size, s => drawLeprechaunSprite(0, 0, s, 0, 0, 0, kind + 1)));
				vailed ++;
			}
		}
		if (vailed) {
			msg.appendChild(line());
			msg.appendChild(row3);
			row3.appendChild(line(3, "join the vail!"));
		}
	} else {
		msg.appendChild(line(2, "STUCK - R"));
		msg.appendChild(line(2, "SCORE " + currentScore() + "  MOVES " + moveCount));
	}
}
