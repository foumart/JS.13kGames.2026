let uiK, hudK;

function createSpriteIcon(s, fn) {
	const c = document.createElement("canvas");
	c.width = c.height = s;
	iconContext = c.getContext("2d");
	iconContext.imageSmoothingEnabled = 0;
	fn(s);
	iconContext = 0;
	return c;
}

function line(t, c) {
	const d = document.createElement("div");
	if (c) d.className = c;
	d.textContent = t;
	return d;
}

function row() {
	const d = document.createElement("div");
	d.className = "g";
	return d;
}

function uiSize() {
	return Math.max(20, Math.min(width, height) * 0.07 | 0);
}

function updateUI() {
	updateHud();
	updateOverlay();
	pulseSparkles();
	if (showPick || showObjective) showObjectiveButtons();
	else if (showUpgrade || showEnd) showEndButtons();
	else if (battleActive && !battleResult) showBattleTurnButton();
	else hideEndButtons();
}

function updateHud() {
	const sc = currentScore();
	S.textContent = sc ? "Score: " + sc : "";
	S.style.display = sc ? "flex" : "none";
	const briefing = showPick || showObjective;
	const ally = battleActive && !briefing ? getBattleUIAlly() : 0;
	const foe = battleActive && !briefing ? getBattleUIFoe() : 0;
	const k = [
		battleActive, briefing, fillCharges, rescuedUnits.join(), leftoverKinds.join(),
		isBossBattle(),
		battleActive ? 0 : countAliveLeprechaunsOfKind(1),
		battleActive ? 0 : countAliveLeprechaunsOfKind(2),
		battleActive ? 0 : countAliveLeprechaunsOfKind(3),
		ally && ally.name, ally && ally.hp, ally && ally.dmg, ally && ally.range, ally && ally.reach,
		foe && foe.name, foe && foe.hp, foe && foe.dmg, foe && foe.range, foe && foe.reach
	].join("|");
	if (k == hudK) return;
	hudK = k;
	L.textContent = "";
	R.textContent = "";
	const U = uiSize();
	if (battleActive && !briefing) {
		if (ally) L.appendChild(unitCard(ally, U, 0));
		if (foe && foe.hp > 0) R.appendChild(unitCard(foe, U, 1));
	} else {
		L.appendChild(playerCard(U));
		R.appendChild(enemyCard(U));
	}
	L.style.display = L.firstChild ? "flex" : "none";
	R.style.display = R.firstChild ? "flex" : "none";
}

function unitCard(unit, U, right) {
	const d = row();
	if (right) d.style.flexDirection = "row-reverse";
	d.appendChild(createSpriteIcon(U, s => drawUnitIcon(unit, s / 2, s / 2, s)));
	const t = document.createElement("div");
	t.style.textAlign = right ? "right" : "left";
	t.style.whiteSpace = "pre";
	t.textContent = "HP " + Math.max(0, unit.hp) + "/" + unit.hpMax + "\nDmg " + unit.dmg
		+ (unit.hero ? "" : "\nMove " + unit.range + "\nRange " + unit.reach);
	d.appendChild(t);
	return d;
}

function playerCard(U) {
	const d = document.createElement("div");
	const top = row();
	top.appendChild(createSpriteIcon(U, s => drawUnitIcon(0, s / 2, s / 2, s)));
	const sp = createSpriteIcon(U / 2 | 0, s => drawSparkle(0, 0, s, time / 180));
	sp.className = "sp";
	top.appendChild(sp);
	top.appendChild(document.createTextNode(":" + fillCharges));
	d.appendChild(top);
	const n = rescuedUnits.length;
	if (n) {
		const r = row();
		const sm = U / 2 | 0;
		for (let i = 0; i < n; i++) r.appendChild(createSpriteIcon(sm, s => drawUnitIcon(rescuedUnits[i], s / 2, s / 2, s)));
		d.appendChild(r);
	}
	return d;
}

function enemyCard(U) {
	const d = document.createElement("div");
	d.style.textAlign = "right";
	d.appendChild(document.createTextNode("Vail " + (levelIndex / 3 | 1)));
	const list = [];
	if (!isBossBattle()) list.push([4, 1]);
	for (let k = 0; k < 3; k++) {
		const n = leftoverKinds[k] + countAliveLeprechaunsOfKind(k + 1);
		if (n) list.push([k + 1, n]);
	}
	for (let i = 0; i < list.length; i++) {
		const sz = i ? U * 0.55 | 0 : U;
		const r = row();
		r.style.justifyContent = "flex-end";
		r.appendChild(document.createTextNode(list[i][1]));
		r.appendChild(createSpriteIcon(sz, s => drawLeprechaunSprite(0, 0, s, 0, 0, 0, list[i][0])));
		d.appendChild(r);
	}
	return d;
}

function pulseSparkles() {
	const list = document.querySelectorAll("#ui canvas.sp");
	for (let i = 0; i < list.length; i++) {
		const c = list[i];
		iconContext = c.getContext("2d");
		iconContext.clearRect(0, 0, c.width, c.height);
		drawSparkle(0, 0, c.width, time / 180);
		iconContext = 0;
	}
}

function updateOverlay() {
	const fade = showPick || showUpgrade || showObjective || (showEnd && (state > 1 || battleResult > 1));
	ov.style.display = fade ? "block" : "none";
	if (!fade) {
		uiK = "";
		return;
	}
	const dark = (state == 3 || battleResult == 3) && !showUpgrade && !showPick && !showObjective;
	ov.style.background = dark ? "#0009" : "#103c";
	msg.style.pointerEvents = showPick || showUpgrade ? "auto" : "none";
	const k = [
		showPick, showUpgrade, showObjective, showEnd, state, battleResult,
		pickCursor, battleParty.join(), JSON.stringify(upgradePicks),
		upgradeCurUnit, upgradeCurOpt, rescuedUnits.join(), stageCaptive,
		isPerfect(), moveCount, currentScore()
	].join("|");
	if (k == uiK) return;
	uiK = k;
	msg.textContent = "";
	if (showPick) fillPick();
	else if (showUpgrade) fillUpgrade();
	else if (showObjective) fillBrief();
	else fillEnd();
}

function fillBrief() {
	const U = uiSize() * 1.2 | 0;
	if (battleActive) {
		msg.appendChild(line(battleTitle()));
		msg.appendChild(line("Destroy all enemies", "s"));
		return;
	}
	msg.appendChild(line("World: " + worldNumber() + "-" + shadowNumber()));
	msg.appendChild(line("Stage: " + stageNumber()));
	if (stageCaptive) {
		const r = row();
		r.appendChild(document.createTextNode("Rescue "));
		r.appendChild(createSpriteIcon(U, s => drawUnitIcon(stageCaptive, s / 2, s / 2, s)));
		r.appendChild(document.createTextNode(stageCaptive));
		msg.appendChild(r);
	}
	const p = row();
	p.appendChild(document.createTextNode("Proceed to "));
	const sp = createSpriteIcon(U, s => drawSparkle(0, 0, s, time / 180));
	sp.className = "sp";
	p.appendChild(sp);
	msg.appendChild(p);
}

function fillPick() {
	const U = Math.max(40, Math.min(width / (rescuedUnits.length + 1), height * 0.14) | 0);
	const need = Math.min(2, livingRescueCount());
	msg.appendChild(line(battleTitle()));
	msg.appendChild(line("Destroy all enemies", "s"));
	msg.appendChild(line(need > 1 ? "Pick " + need + " allies" : "Your ally", "s"));
	const r = row();
	for (let i = 0; i < rescuedUnits.length; i++) {
		const bmp = rescuedUnits[i];
		const dead = isDeadBmp(bmp);
		const wrap = document.createElement("div");
		wrap.className = "g" + (battleParty.indexOf(bmp) >= 0 ? " on" : "") + (i == pickCursor ? " cur" : "");
		const c = createSpriteIcon(U, s => drawUnitIcon(bmp, s / 2, s / 2, s));
		if (dead) {
			c.style.opacity = "0.45";
			const g = c.getContext("2d");
			g.strokeStyle = "#e22";
			g.lineWidth = Math.max(3, U * 0.08);
			g.beginPath();
			g.moveTo(4, 4);
			g.lineTo(U - 4, U - 4);
			g.moveTo(U - 4, 4);
			g.lineTo(4, U - 4);
			g.stroke();
			wrap.onclick = () => { pickCursor = i; redraw(); };
		} else wrap.onclick = toggleParty.bind(null, bmp);
		wrap.appendChild(c);
		r.appendChild(wrap);
	}
	msg.appendChild(r);
	const name = rescuedUnits[pickCursor];
	if (!name) return;
	const u = makeUnit(getUnitDefinition(name), 0, 0);
	msg.appendChild(line(u.name));
	msg.appendChild(line("HP:" + u.hpMax + "  Dmg:" + u.dmg, "s"));
	msg.appendChild(line("Move:" + u.range + " " + rayStyle(u.moveRays()), "s"));
	msg.appendChild(line("Range:" + (u.around || u.reach) + " " + rayStyle(u.attackRays()), "s"));
}

function fillUpgrade() {
	const U = uiSize();
	msg.appendChild(line("VICTORY!"));
	msg.appendChild(line("Choose a bonus", "s"));
	const list = battleRoster();
	let live = 0;
	for (let i = 0; i < list.length; i++) {
		const u = list[i];
		const fallen = u.hp <= 0;
		const id = upgradeId(u);
		const pick = upgradePicks[id];
		const kinds = upgradeKinds(u);
		const r = row();
		const ic = createSpriteIcon(U, s => drawUnitIcon(u, s / 2, s / 2, s));
		if (fallen) ic.style.opacity = "0.5";
		r.appendChild(ic);
		const col = document.createElement("div");
		col.style.textAlign = "left";
		if (fallen) col.textContent = "fallen";
		else {
			col.appendChild(line(
				"HP " + u.hpMax + "  Dmg " + u.dmg + (u.hero ? "" : "  Move " + u.range + "  Range " + u.reach),
				"s"
			));
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
		msg.appendChild(r);
	}
}

function fillEnd() {
	if (battleActive) {
		msg.appendChild(line(battleResult == 2 ? "VICTORY!" : "DEFEAT - R"));
		return;
	}
	if (state == 2) {
		const U = uiSize();
		msg.appendChild(line("STAGE CLEAR!"));
		if (isPerfect()) msg.appendChild(line("Perfect!", "s"));
		const r = row();
		const sp = createSpriteIcon(U, s => drawSparkle(0, 0, s, time / 180));
		sp.className = "sp";
		r.appendChild(sp);
		r.appendChild(document.createTextNode("+1"));
		for (let i = 0; i < rescuedUnits.length; i++) {
			r.appendChild(createSpriteIcon(U, s => drawUnitIcon(rescuedUnits[i], s / 2, s / 2, s)));
		}
		msg.appendChild(r);
	} else {
		msg.appendChild(line("STUCK - R"));
		msg.appendChild(line("SCORE " + currentScore() + "  MOVES " + moveCount, "s"));
	}
}
