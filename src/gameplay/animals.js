function animalState(e, i) {
  const a = e.an[i];
  if (!a.f) return "hungry";
  return NOW - a.f >= BUILD[e.t].time ? "ready" : "busy";
}
function animalCounts(e) {
  const c = { hungry: 0, busy: 0, ready: 0 };
  for (let i = 0; i < e.an.length; i++) c[animalState(e, i)]++;
  return c;
}
function feedAnimals(e, quiet) {
  const b = BUILD[e.t];
  let fed = 0;
  for (const a of e.an) {
    if (a.f) continue;
    if ((S.inv[b.feed] || 0) < 1) break;
    takeItem(b.feed, 1);
    a.f = NOW;
    fed++;
  }
  if (fed) {
    if (!quiet) sfx("plant");
    const p = entWorld(e, 12);
    burst(p[0], p[1], 8, ["#f3d36b", "#d9b44a", "#ffffff"], "dot", 40);
    floatText(p[0], p[1] - 14, `-${fed} ${ITEMS[b.feed].icon}`, "#ffffff", 12);
  } else if (!quiet) {
    if (animalCounts(e).hungry) {
      toastOnce(
        `Need ${ITEMS[b.feed].icon} ${ITEMS[b.feed].name} - make it at the Feed Mill!`,
        "warn",
      );
      sfx("error");
    }
  }
  return fed;
}
function collectAnimals(e, quiet, bonusChance) {
  const b = BUILD[e.t];
  let n = 0;
  for (let i = 0; i < e.an.length; i++) {
    if (animalState(e, i) !== "ready") continue;
    if (spaceFor(b.out) < 1) {
      if (!quiet) {
        toastOnce("Barn is full! 📦", "warn");
        shakeEl("#pill-barn");
      } else return n;
      break;
    }
    addItem(b.out, 1);
    e.an[i].f = 0;
    n++;
    S.stats.animalProducts++;
    addXP(ITEMS[b.out].xp);
    if (bonusChance && Math.random() < bonusChance && spaceFor(b.out) >= 1) {
      addItem(b.out, 1);
      n++;
    }
  }
  if (n && hasPerk("autofeed")) feedAnimals(e, true);
  if (n) {
    const p = entWorld(e, 18);
    floatText(p[0], p[1] - 10, `+${n} ${ITEMS[b.out].icon}`, "#ffffff");
    burst(p[0], p[1], 8, ["#fff6d8", "#ffffff", "#f3d36b"], "spark", 40);
    if (!quiet) {
      sfx("harvest");
      const [sx, sy] = entScreen(e, 18);
      flyIcon(ITEMS[b.out].icon, sx, sy, "#btn-inventory", n);
    }
  }
  return n;
}
function animalClick(e) {
  const c = animalCounts(e),
    b = BUILD[e.t];
  if (c.ready) {
    collectAnimals(e);
    if (animalCounts(e).hungry && (S.inv[b.feed] || 0) > 0) feedAnimals(e);
    return;
  }
  if (c.hungry && (S.inv[b.feed] || 0) > 0) {
    feedAnimals(e);
    return;
  }
  animalPopup(e);
}
const ANIMAL_NAMES = {
  chicken: "chickens",
  cow: "cows",
  sheep: "sheep",
  pig: "pigs",
  bee: "hives",
  goat: "goats",
  fish: "fish tanks",
};
function animalPopup(e) {
  const b = BUILD[e.t];
  showPopup(e, {
    sig: () => {
      const c = animalCounts(e);
      return [
        c.hungry,
        c.ready,
        S.inv[b.feed] || 0,
        lvlOf(e),
        S.coins >= upgradeCost(e),
      ].join("|");
    },
    render: () => {
      const c = animalCounts(e),
        feed = S.inv[b.feed] || 0;
      const rows = e.an
        .map(
          (a, i) =>
            `<div class="an-row"><span>${ITEMS[b.out].icon}</span><span class="an-st" id="pp-a${i}"></span></div>`,
        )
        .join("");
      return `<div class="pp-title">${thumbMini(e.t)} ${b.name}</div>
        <div class="pp-sub">${e.an.length} ${ANIMAL_NAMES[b.animal]} · ${ITEMS[b.out].icon} every ${fmtTime(b.time)} · eats ${ITEMS[b.feed].icon} ${ITEMS[b.feed].name} (you have <b>${feed}</b>)</div>
        <div class="an-list">${rows}</div>${upgradeHTML(e)}
        <div class="pp-btns mt">
          ${c.ready ? `<button class="btn orange small" data-act="p-collectanimals">Collect ${c.ready} ${ITEMS[b.out].icon}</button>` : ""}
          ${c.hungry ? `<button class="btn ${feed ? "green" : "disabled"} small" data-act="p-feed">Feed ${Math.min(c.hungry, feed) || c.hungry} ${ITEMS[b.feed].icon}</button>` : ""}
          ${!feed ? '<button class="btn blue small" data-act="p-gofeed">🏭 Make feed</button>' : ""}
          <button class="btn blue small" data-act="p-move">✋ Move</button><button class="btn red small" data-act="p-sell">Sell</button></div>`;
    },
    live: () => {
      e.an.forEach((a, i) => {
        const el = document.getElementById("pp-a" + i);
        if (!el) return;
        const st = animalState(e, i);
        el.textContent =
          st === "hungry"
            ? "😋 Hungry"
            : st === "ready"
              ? "✅ Ready!"
              : "⏱ " + fmtTime(b.time - (NOW - a.f));
      });
    },
  });
}

function fenceSeg(x0, y0, x1, y1) {
  const n = Math.max(2, Math.round(Math.hypot(x1 - x0, y1 - y0) * 4));
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const p = P(lerp(x0, x1, t), lerp(y0, y1, t));
    rr(p[0] - 1.1, p[1] - 10, 2.2, 10, 0.8, "#cdb489");
  }
  for (const z of [4, 8.5]) line(P(x0, y0, z), P(x1, y1, z), "#f1e3c4", 1.7);
}
function animalPos(e, i, st) {
  const homes = [
    [0.95, 1.3],
    [1.4, 1.0],
    [1.45, 1.5],
    [0.7, 1.6],
    [1.6, 1.25],
  ];
  const h = homes[i % 5];
  const amp = st === "busy" ? 0.2 : st === "ready" ? 0.06 : 0;
  const ph = T * 0.45 + i * 2.1 + (e.id || 0);
  return {
    x: e.x + h[0] + Math.sin(ph) * amp,
    y: e.y + h[1] + Math.cos(ph * 0.8) * amp * 0.8,
    dir: Math.cos(ph) >= 0 ? 1 : -1,
    ph,
  };
}
function drawChicken(p, st) {
  const [sx, sy] = P(p.x, p.y);
  const peck =
    st === "busy" ? Math.max(0, Math.sin(T * 6 + p.ph * 3)) * 2.5 : 0;
  const hop = st === "ready" ? Math.abs(Math.sin(T * 5 + p.ph)) * 2 : 0;
  ellipse(sx, sy, 4.5, 1.8, "rgba(0,0,0,.22)");
  if (st === "ready") ellipse(sx - 5 * p.dir, sy - 1.5, 1.9, 2.5, "#fff1d6");
  ctx.save();
  ctx.translate(sx, sy - hop);
  ctx.scale(p.dir, 1);
  line([-1, -2], [-1.5, 0], "#e8962e", 1);
  line([1, -2], [1.5, 0], "#e8962e", 1);
  poly(
    [
      [-4, -6],
      [-7, -9],
      [-5, -4],
    ],
    "#f2f2f2",
  );
  ellipse(0, -5, 4.6, 3.5, "#ffffff");
  ellipse(-0.5, -5, 2.4, 1.7, "#ececec");
  circle(3.2, -8.5 + peck, 2.2, "#ffffff");
  poly(
    [
      [5, -8.8 + peck],
      [7, -8.2 + peck],
      [5, -7.6 + peck],
    ],
    "#f0a030",
  );
  circle(2.8, -10.7 + peck, 1.1, "#e53935");
  circle(3.8, -10.4 + peck, 0.9, "#e53935");
  circle(3.8, -8.9 + peck, 0.5, "#222");
  ctx.restore();
}
function drawCow(p, st) {
  const [sx, sy] = P(p.x, p.y);
  const chew = st === "busy" ? Math.sin(T * 4 + p.ph) * 0.8 : 0;
  ellipse(sx, sy, 10, 3.5, "rgba(0,0,0,.22)");
  ctx.save();
  ctx.translate(sx, sy);
  ctx.scale(p.dir, 1);
  for (const lx of [-6, -3, 3, 6]) rr(lx - 0.9, -6, 1.8, 6, 0.6, "#efefef");
  line([-8.5, -10], [-10.5, -5], "#444", 1);
  ellipse(0, -9.5, 9, 5.2, "#ffffff");
  ellipse(-3, -10.5, 2.6, 1.8, "#333");
  ellipse(3.5, -8, 2, 1.5, "#333");
  ellipse(-6, -8, 1.6, 1.3, "#333");
  if (st === "ready") ellipse(1, -4.6, 2.4, 1.4, "#f6a5b5");
  ctx.save();
  ctx.translate(8.5, -11 + chew);
  ellipse(0, 0, 3.4, 3, "#ffffff");
  ellipse(1.8, 1.2, 2.2, 1.6, "#f6b8c4");
  line([-1.5, -2.4], [-2.6, -4.2], "#d9c7a0", 1.2);
  line([1, -2.6], [1.6, -4.4], "#d9c7a0", 1.2);
  circle(0.2, -0.8, 0.6, "#222");
  ctx.restore();
  ctx.restore();
}
function drawSheep(p, st, e, i) {
  const [sx, sy] = P(p.x, p.y);
  const a = e.an[i];
  const g = !a.f ? 0.1 : clamp((NOW - a.f) / BUILD[e.t].time, 0, 1);
  const r = 2.4 + g * 1.8;
  ellipse(sx, sy, 7.5, 2.8, "rgba(0,0,0,.22)");
  ctx.save();
  ctx.translate(sx, sy);
  ctx.scale(p.dir, 1);
  for (const lx of [-4, -1.5, 1.5, 4]) rr(lx - 0.7, -5, 1.4, 5, 0.5, "#2b2b2b");
  const wool = st === "ready" ? "#ffffff" : "#f3efe6";
  for (const [dx, dy] of [
    [-3.5, -7],
    [0, -8.5],
    [3.5, -7],
    [-1.5, -5.5],
    [2, -5.5],
    [0, -6.5],
  ])
    circle(dx, dy, r, wool);
  ellipse(6, -8.5, 2.2, 2.6, "#2f2f2f");
  ellipse(5, -10, 1.4, 0.8, "#2f2f2f");
  circle(6.8, -9, 0.5, "#fff");
  ctx.restore();
}
function drawPen(e, ground, shelter, drawAnimal) {
  const x = e.x + 0.08,
    y = e.y + 0.08,
    w = e.w - 0.16,
    h = e.h - 0.16;
  poly(diamond(x, y, w, h), ground);
  fenceSeg(x, y, x + w, y);
  fenceSeg(x, y, x, y + h);
  shelter(x, y, w, h);
  const list = e.an.map((a, i) => {
    const st = animalState(e, i);
    return { i, st, p: animalPos(e, i, st) };
  });
  list.sort((a, b) => a.p.x + a.p.y - (b.p.x + b.p.y));

  const anyFed = e.an.some((a) => a.f);
  prism(
    x + 1.15,
    y + 0.22,
    0.55,
    0.16,
    0,
    4,
    anyFed ? "#e6c35c" : "#7a5534",
    "#8a5a34",
    "#6e4527",
  );
  for (const it of list) drawAnimal(it.p, it.st, e, it.i);
  fenceSeg(x, y + h, x + w * 0.38, y + h);
  fenceSeg(x + w * 0.62, y + h, x + w, y + h);
  fenceSeg(x + w, y, x + w, y + h);
  if (THUMB) return;
  const c = animalCounts(e),
    b = BUILD[e.t];
  if (c.ready)
    bubbleAt(e, b.ht + 8, { icon: ITEMS[b.out].icon, count: c.ready });
  else if (c.hungry === e.an.length)
    bubbleAt(e, b.ht + 4, { icon: ITEMS[b.feed].icon, small: true });
}
Object.assign(DRAW, {
  coop: (e) =>
    drawPen(
      e,
      "#d8c08a",
      (x, y) => {
        prism(x + 0.1, y + 0.1, 0.75, 0.6, 0, 15, null, "#d65a3c", "#b4462c");
        faceL(x + 0.1, y + 0.1, 0.75, 0.6, 0.35, 0.65, 2, 9, "#4a2416");
        gableRoofY(
          x + 0.1,
          y + 0.1,
          0.75,
          0.6,
          15,
          10,
          "#7a4a2c",
          "#6a3f25",
          "#d65a3c",
          0.06,
        );
        poly(
          [
            P(x + 0.4, y + 0.7, 2),
            P(x + 0.55, y + 0.7, 2),
            P(x + 0.55, y + 1.05, 0),
            P(x + 0.4, y + 1.05, 0),
          ],
          "#b98b55",
        );
      },
      drawChicken,
    ),
  cowshed: (e) =>
    drawPen(
      e,
      "#9fcd68",
      (x, y) => {
        groundShadow(x + 0.05, y + 0.05, 1.2, 0.7, 0.3);
        prism(x + 0.05, y + 0.05, 1.2, 0.7, 0, 24, null, "#c9a06a", "#a9824f");
        faceL(x + 0.05, y + 0.05, 1.2, 0.7, 0.3, 0.7, 0, 16, "#5a3a22");
        line(
          P(x + 0.05 + 0.36, y + 0.75, 0),
          P(x + 0.05 + 0.84, y + 0.75, 16),
          "#e9dcc0",
          1.5,
        );
        gableRoofX(
          x + 0.05,
          y + 0.05,
          1.2,
          0.7,
          24,
          14,
          "#5d8a3a",
          "#4e7731",
          "#a9824f",
          0.08,
        );
        ellipse(...P(x + 0.3, y + 1.0), 7, 3.5, "#e6c35c");
      },
      drawCow,
    ),
  sheepfarm: (e) =>
    drawPen(
      e,
      "#a9d474",
      (x, y) => {
        prism(x + 0.08, y + 0.08, 0.9, 0.7, 0, 17, null, "#b98b55", "#9a7040");
        faceL(x + 0.08, y + 0.08, 0.9, 0.7, 0.25, 0.75, 0, 12, "#4a3020");
        gableRoofY(
          x + 0.08,
          y + 0.08,
          0.9,
          0.7,
          17,
          12,
          "#6b7f95",
          "#5b6d82",
          "#b98b55",
          0.06,
        );
      },
      drawSheep,
    ),
});
