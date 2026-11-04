// 场景 A：岛屿航线、信任仪表盘、关卡漏斗、三个厨房、左右对决
import { P, makeFig, bot, you, at, chip, panel, star4, check, cross, wrap, stamp, burst, ping, gt, gw, tx, txc, tw,
  loopT, loopO, loopS, loopR, bob, jitter, twinkle, rot, growX, growY, flipIn, rect, circle, line, pathEl } from './core.mjs';

const CYC = [P.rose, P.org, P.yel, P.sky, P.lilac];
// 跳跃路径：pts = [[t, x, y]]，每段之间加一个腾空点
export function hopFrames(pts, { peak = 60, travel = 0.5 } = {}) {
  const fr = [[0, pts[0][1], pts[0][2]]];
  for (let i = 1; i < pts.length; i++) {
    const [t, x, y] = pts[i], [, px, py] = pts[i - 1];
    fr.push([t - travel, px, py], [t - travel / 2, (px + x) / 2, Math.min(py, y) - peak, 'out'], [t, x, y, 'inout']);
  }
  return fr;
}

// 1. 岛屿航线：系列 4 期
export function islands(meta, { items }) {
  const n = items.length, T0 = 0.9, step = 1.15, dur = T0 + step * (n - 1) + 2.6;
  const f = makeFig(meta, dur);
  const xs = items.map((_, i) => 110 + i * (530 / (n - 1)));
  const ys = items.map((_, i) => (i % 2 ? 330 : 440));
  let road = '';
  for (let i = 0; i < n - 1; i++) road += pathEl(`M${xs[i]} ${ys[i] - 10}Q${(xs[i] + xs[i + 1]) / 2} ${Math.min(ys[i], ys[i + 1]) - 90} ${xs[i + 1]} ${ys[i + 1] - 10}`, { stroke: P.mute, sw: 3, dash: '2 10', cap: 'round' });
  f.add(f.fade(road, { at: 0.2, inDur: 0.4 }));
  items.forEach((it, i) => {
    const x = xs[i], y = ys[i], c = CYC[i % 5];
    const isl = pathEl(`M${x - 66} ${y}C${x - 60} ${y + 70} ${x + 60} ${y + 70} ${x + 66} ${y}Z`, { fill: P.panel, stroke: P.ink, sw: 3 })
      + pathEl(`M${x - 40} ${y + 20}L${x - 30} ${y + 52}M${x + 22} ${y + 24}L${x + 14} ${y + 50}`, { stroke: P.line, sw: 3, cap: 'round' })
      + pathEl(`M${x - 70} ${y}C${x - 70} ${y - 22} ${x + 70} ${y - 22} ${x + 70} ${y}C${x + 70} ${y + 16} ${x - 70} ${y + 16} ${x - 70} ${y}Z`, { fill: c, stroke: P.ink, sw: 3 });
    f.add(f.pop(isl, x, y, { at: 0.2 + i * 0.15 }));
    const tReach = T0 + i * step;
    const flag = line(x + 34, y - 6, x + 34, y - 62, { stroke: P.cream, sw: 3, cap: 'round' }) + pathEl(`M${x + 35} ${y - 62}L${x + 64} ${y - 52}L${x + 35} ${y - 42}Z`, { fill: c, stroke: P.ink, sw: 2 });
    f.add(f.pop(flag, x + 34, y - 30, { at: tReach + 0.05 }));
    const k = chip(x - tw(it.k, 16, 700) / 2 - 12, y + 66, it.k, { fill: c, size: 16, h: 30, padX: 12 });
    f.add(f.fade(k.svg + txc(x, y + 128, it.name, { size: 23, weight: 800 }) + txc(x, y + 156, it.note, { size: 16, fill: P.sub }), { at: tReach }));
  });
  const pts = items.map((_, i) => [T0 + i * step, xs[i] - 10, ys[i] - 52]);
  f.add(f.move(bot({ s: 0.75, mood: 'joy', ph: 1 }), hopFrames(pts, { peak: 70 })));
  f.add(burst(f, xs[n - 1], ys[n - 1] - 60, T0 + (n - 1) * step + 0.1));
  return f;
}

// 2. 信任仪表盘：指针走 4 级，右边亮起的 AI 越来越多
export function gauge(meta, { levels, counts = [1, 5, 20, 49] }) {
  const n = levels.length, t0 = 1.0, st = 1.25, dur = t0 + st * (n - 1) + 2.4;
  const f = makeFig(meta, dur);
  const cx = 226, cy = 470, R = 146, seg = 180 / n;
  const arcP = (a0, a1, r) => { const p = (a) => [cx + r * Math.cos((a * Math.PI) / 180), cy + r * Math.sin((a * Math.PI) / 180)]; const [x0, y0] = p(a0), [x1, y1] = p(a1); return `M${x0.toFixed(1)} ${y0.toFixed(1)}A${r} ${r} 0 0 1 ${x1.toFixed(1)} ${y1.toFixed(1)}`; };
  levels.forEach((lv, i) => {
    const a0 = 180 + i * seg + 1.5, a1 = 180 + (i + 1) * seg - 1.5, c = [P.dim, P.rose, P.org, P.yel][i] ?? CYC[i];
    f.add(f.fade(pathEl(arcP(a0, a1, R), { stroke: c, sw: 30 }), { at: 0.2 + i * 0.12 }));
    const am = ((180 + (i + 0.5) * seg) * Math.PI) / 180, lx = cx + (R + 44) * Math.cos(am), ly = cy + (R + 44) * Math.sin(am);
    f.add(f.fade(txc(lx, ly - 4, lv.k, { size: 15, fill: P.sub }) + txc(lx, ly + 20, lv.name, { size: 19, weight: 800 }), { at: 0.3 + i * 0.12 }));
  });
  const needle = pathEl(`M${cx} ${cy - 7}L${cx - 125} ${cy}L${cx} ${cy + 7}Z`, { fill: P.cream, stroke: P.ink, sw: 2 }) + circle(cx, cy, 15, { fill: P.yel, stroke: P.ink, sw: 3 });
  const fr = [[0, seg / 2]]; levels.forEach((_, i) => { const t = t0 + i * st; if (i) fr.push([t - 0.55, seg / 2 + (i - 1) * seg], [t, seg / 2 + i * seg, 'out']); });
  f.add(rot(f, needle, cx, cy, fr));
  levels.forEach((lv, i) => { const t = t0 + i * st; f.add(f.flip(txc(cx, cy + 60, lv.note, { size: 20, weight: 700, fill: P.yel }), t, i < n - 1 ? t0 + (i + 1) * st - 0.02 : null)); });
  // 右边：AI 方阵
  const GX = 446, GY = 222, cols = 7, gap = 36;
  f.add(panel(432, 200, 278, 300, { fill: P.panel2 }));
  for (let j = 0; j < cols * cols; j++) {
    const x = GX + 15 + (j % cols) * gap, y = GY + 15 + Math.floor(j / cols) * gap;
    f.add(circle(x, y, 11, { fill: P.dim, fo: 0.5 }));
    const lvl = counts.findIndex((c) => j < c);
    if (lvl >= 0) f.add(f.flip(circle(x, y, 12, { fill: P.potato, stroke: P.ink, sw: 2 }) + circle(x - 4, y - 2, 1.8, { fill: P.ink }) + circle(x + 4, y - 2, 1.8, { fill: P.ink }), t0 + lvl * st + (j % 7) * 0.03));
  }
  const labs = meta.countLabels ?? counts.map(String);
  labs.forEach((c, i) => { const t = t0 + i * st; f.add(f.flip(gt(571 - gw(c, 40) / 2, 562, c, 40, { fill: P.yel }), t, i < n - 1 ? t0 + (i + 1) * st - 0.02 : null)); });
  f.add(txc(571, 594, meta.countCap ?? '个 AI 同时在干活', { size: 17, fill: P.sub }));
  f.add(burst(f, 571, 350, t0 + (n - 1) * st + 0.1, { r: 150 }));
  return f;
}

// 3. 关卡漏斗：每一步都绕过你
export function funnel(meta, { task, stuck, free, freeLabel = '直接开写', waitLabel = '等你有空' }) {
  const dur = 9.4, f = makeFig(meta, dur);
  // 左：任务卡
  const card = panel(50, 240, 150, 190, { fill: P.cream, stroke: P.ink, sw: 3, rx: 14 }) + tx(70, 280, task, { size: 22, weight: 800, fill: P.ink })
    + [0, 1, 2, 3].map((i) => line(70, 310 + i * 24, 180 - (i % 2) * 30, 310 + i * 24, { stroke: P.mute, sw: 5, cap: 'round' })).join('');
  f.add(f.pop(card, 125, 335, { at: 0.2 }));
  // 中：你（瓶颈）
  f.add(f.fade(pathEl('M210 250L340 315M210 420L340 345', { stroke: P.mute, sw: 3, dash: '6 8' }), { at: 0.3 }));
  f.add(f.pop(at(375, 330, you(1.25)), 375, 330, { at: 0.4 }));
  // 右：等着的 AI
  f.add(f.fade(at(620, 330, bot({ s: 1.1, mood: 'sad', prop: 'paper', ph: 3 })), { at: 0, out: 5.6, outDur: 0.05 }));
  const q = loopT(gt(655, 260, '?', 36, { fill: P.rose }), ['0 0', '0 -8', '0 0'], 1.1);
  f.add(f.fade(q, { at: 0.6, out: 7.0 }));
  // 卡住的步骤：飞到你那里，再掉进下面的队列
  stuck.forEach((s, i) => {
    const t = 1.0 + i * 1.1, w = tw(s, 17, 700) + 28;
    const c = chip(-w / 2, -16, s, { fill: P.rose, color: P.cream, size: 17, h: 32 });
    const fr = [[0, 125, 300], [t, 125, 300], [t + 0.55, 330, 330, 'inout'], [t + 0.9, 375, 450 + i * 40, 'out']];
    f.add(f.fade(f.move(c.svg, fr), { at: t }));
  });
  const clock = circle(468, 470, 18, { fill: P.panel, stroke: P.cream, sw: 3 }) + loopR(line(468, 470, 468, 458, { stroke: P.yel, sw: 3, cap: 'round' }), 468, 470, 1.2);
  f.add(f.fade(clock + tx(494, 477, waitLabel, { size: 17, weight: 700, fill: P.rose }), { at: 2.0 }));
  // 绕过你：它自己去拿
  const tB = 4.6;
  f.add(f.fade(pathEl('M150 236C230 120 520 120 600 262', { stroke: P.yel, sw: 4, dash: '10 10', cap: 'round' }), { at: tB - 0.3, inDur: 0.4 }));
  const fw = tw(free, 17, 700) + 28;
  const fc = chip(-fw / 2, -16, free, { fill: P.yel, size: 17, h: 32 });
  f.add(f.fade(f.move(fc.svg, [[0, 150, 236], [tB, 150, 236], [tB + 0.5, 375, 160, 'inout'], [tB + 1.0, 600, 262, 'inout']]), { at: tB }));
  f.add(f.fade(at(620, 330, bot({ s: 1.1, mood: 'joy', prop: 'paper', ph: 3 })), { at: tB + 1.0, inDur: 0.05 }));
  f.add(stamp(f, 625, 430, `✓ ${freeLabel}`, { at: tB + 1.2, color: P.yel, angle: -6 }));
  f.add(burst(f, 620, 320, tB + 1.1));
  return f;
}

// 4. 三个厨房
export function kitchen3(meta, { panels }) {
  const dur = 7.6, f = makeFig(meta, dur);
  const W = 208, xs = [36, 271, 506], Y = 188, H = 432;
  panels.forEach((p, i) => {
    const x = xs[i], cx = x + W / 2;
    let body = panel(x, Y, W, H, { fill: i === 1 ? '#2F1F45' : P.panel, stroke: i === 2 ? P.yel : P.line, sw: i === 2 ? 3 : 2 });
    body += txc(cx, Y + 44, p.title, { size: 22, weight: 800 });
    body += rect(x + 18, Y + 250, W - 36, 14, { rx: 7, fill: P.dim });
    let scene = '';
    if (i === 0) {
      scene += loopT(at(0, 0, bot({ s: 0.62, mood: 'sad', ph: 0, idle: false }) + loopO(pathEl('M22 -40Q26 -32 22 -28Q18 -32 22 -40Z', { fill: P.sky }), [0, 1, 0], 0.8, { still: 1 })), [`${x + 55} ${Y + 200}`, `${x + 150} ${Y + 200}`, `${x + 55} ${Y + 200}`], 1.6);
      scene += at(x + 40, Y + 120, rect(0, 0, 36, 24, { rx: 4, fill: P.lilac, stroke: P.ink, sw: 2 })) + at(x + 130, Y + 120, rect(0, 0, 36, 24, { rx: 4, fill: P.sky, stroke: P.ink, sw: 2 }));
    } else if (i === 1) {
      const spots = [[60, 150], [120, 140], [160, 175], [80, 205], [140, 215]];
      let crowd = '';
      spots.forEach(([dx, dy], k) => { crowd += jitter(at(x + dx, Y + dy, bot({ s: 0.5, mood: k % 2 ? 'x' : 'sad', ph: k, idle: false })), 3, 0.32 + k * 0.05, k); });
      crowd += [[40, 100], [170, 110], [100, 95]].map(([dx, dy], k) => twinkle(gt(x + dx, Y + dy, '!', 28, { fill: P.rose }), 0.6 + k * 0.2, 0)).join('');
      scene += jitter(crowd, 2, 0.28, 1);
    } else {
      [0, 1, 2].forEach((k) => { scene += at(x + 45 + k * 60, Y + 175, bot({ s: 0.5, mood: 'happy', prop: 'chef', ph: k })); });
      const plates = [0, 1, 2].map((k) => circle(x + 30 + k * 70, Y + 257, 9, { fill: P.cream, stroke: P.ink, sw: 2 })).join('');
      scene += loopT(plates, ['0 0', '60 0'], 1.4, { linear: true });
    }
    body += scene;
    body += tx(x + 22, Y + 320, p.who, { size: 17, fill: P.sub }) + tx(x + 22, Y + 354, p.state, { size: 20, weight: 800, fill: i === 1 ? P.rose : i === 2 ? P.yel : P.cream });
    if (p.note) body += tx(x + 22, Y + 388, p.note, { size: 16, fill: P.sub });
    f.add(flipIn(f, body, cx, Y + H / 2, 0.3 + i * 0.5));
  });
  f.add(stamp(f, xs[1] + W / 2, Y + 120, '最乱', { at: 2.4, size: 30 }));
  f.add(f.ring(xs[2] - 6, Y - 6, W + 12, H + 12, { at: 3.0, color: P.yel, rx: 24, sw: 4 }));
  f.add(burst(f, xs[2] + W / 2, Y + 160, 3.1));
  return f;
}

// 5. 左右对决
export function duel(meta, { left, right, dur = 8.4 }) {
  const f = makeFig(meta, dur);
  const sides = [[40, left, 0.3, false], [390, right, 2.6, true]];
  sides.forEach(([x, s, t, good]) => {
    const cx = x + 160;
    let head = panel(x, 186, 320, 446, { fill: good ? P.panel : '#251C3C', stroke: good ? P.yel : P.line, sw: good ? 3 : 2 });
    head += txc(cx, 228, s.title, { size: 21, weight: 800, fill: good ? P.yel : P.sub });
    f.add(f.fade(head, { at: t, inDur: 0.25 }));
    f.add(f.fade(ART[s.art](f, cx, 345, t + 0.3, good), { at: t + 0.1 }));
    (s.lines ?? []).forEach((l, i) => {
      const w = tw(l, 18, 700) + 26;
      const c = chip(cx - w / 2, 470 + i * 44, l, { fill: good ? P.yel : P.dim, color: good ? P.ink : P.cream, size: 18, h: 34, padX: 13 });
      f.add(f.pop(c.svg, cx, 487 + i * 44, { at: t + 1.0 + i * 0.35 }));
    });
    if (s.verdict) f.add(stamp(f, cx, 592, s.verdict, { at: t + 1.7, color: good ? P.yel : P.rose, angle: good ? -5 : 6 }));
  });
  const vs = circle(375, 345, 30, { fill: P.rose, stroke: P.ink, sw: 3 }) + gt(375 - gw('VS', 24) / 2, 354, 'VS', 24, { fill: P.cream });
  f.add(f.pop(vs, 375, 345, { at: 2.3, from: 0.2 }));
  f.add(burst(f, 550, 340, 4.5));
  return f;
}

// 对决的插画，坐标中心 (cx, cy)，可用高度约 190
const ART = {
  ask(f, cx, cy, t, good) { // 每一步都来问你
    let s = at(cx - 70, cy + 30, bot({ s: 0.85, mood: 'sad', idle: false })) + at(cx + 75, cy - 10, you(0.85));
    [0, 1, 2].forEach((k) => { s += loopO(loopT(gt(-8, 10, '?', 30, { fill: P.rose }), [`${cx - 50} ${cy - k * 18}`, `${cx + 40} ${cy - 30 - k * 18}`], 1.3 + k * 0.35, { kt: [0, 1] }), [0, 1, 1, 0], 1.3 + k * 0.35, { kt: [0, 0.2, 0.8, 1], still: 0 }); });
    s += f.fade(tx(cx - 92, cy + 92, '你一停，它就停', { size: 16, fill: P.sub }), { at: t + 0.6 });
    return s;
  },
  brief(f, cx, cy, t) { // 背景给足，它自己跑
    const page = rect(-22, -28, 44, 56, { rx: 4, fill: P.cream, stroke: P.ink, sw: 2.5 }) + [0, 1, 2].map((i) => line(-12, -14 + i * 12, 12, -14 + i * 12, { stroke: P.mute, sw: 3 })).join('');
    let s = f.move(page, [[0, cx - 90, cy - 30], [t, cx - 90, cy - 30], [t + 0.6, cx - 20, cy + 10, 'inout'], [t + 0.9, cx - 20, cy + 10]]);
    s += f.fade(loopT(at(0, 0, bot({ s: 0.9, mood: 'joy', ph: 2 })), [`${cx - 40} ${cy + 30}`, `${cx + 70} ${cy + 30}`, `${cx - 40} ${cy + 30}`], 2.4), { at: t + 0.9 });
    s += [[-90, -60], [100, -40], [40, -80]].map(([dx, dy], k) => twinkle(star4(cx + dx, cy + dy, 9, P.yel), 1.2 + k * 0.3)).join('');
    return s;
  },
  scatter(f, cx, cy, t) {
    let s = at(cx, cy + 20, bot({ s: 0.85, mood: 'x', ph: 1 }));
    [[-120, -60], [110, -70], [-110, 50], [120, 40], [0, -95], [-60, 85]].forEach(([dx, dy], k) => {
      s += f.fade(pathEl(`M${cx} ${cy}L${cx + dx} ${cy + dy}`, { stroke: P.mute, sw: 3, dash: '6 6' }) + circle(cx + dx, cy + dy, 6, { fill: P.dim }), { at: t + k * 0.12 });
    });
    return s;
  },
  target(f, cx, cy, t) {
    let s = [52, 36, 20].map((r, i) => circle(cx + 50, cy, r, { fill: [P.cream, P.rose, P.yel][i], stroke: P.ink, sw: 2.5 })).join('');
    s += f.move(pathEl('M-46 0L0 0M-12 -8L0 0L-12 8M-46 -6L-56 -12M-46 6L-56 12', { stroke: P.cream, sw: 4, cap: 'round', join: 'round' }), [[0, cx - 160, cy], [t + 0.3, cx - 160, cy], [t + 0.75, cx + 50, cy, 'inout']]);
    s += at(cx - 90, cy + 50, bot({ s: 0.7, mood: 'joy', ph: 3 }));
    s += burst(f, cx + 50, cy, t + 0.8, { n: 10, r: 70 });
    return s;
  },
  guess(f, cx, cy, t) {
    let s = at(cx + 70, cy - 70, chip(-62, -16, '我估计是销售', { fill: P.cream, size: 15, h: 30, padX: 10 }).svg);
    s += at(cx + 70, cy - 10, you(0.7));
    s += at(cx - 80, cy + 40, rect(-40, -26, 80, 52, { rx: 8, fill: P.dim, stroke: P.ink, sw: 2 }) + txc(0, 6, '销售', { size: 17, weight: 700 }));
    s += f.move(bot({ s: 0.7, mood: 'sad', prop: 'magnifier', ph: 1 }), [[0, cx + 10, cy + 70], [t + 0.4, cx + 10, cy + 70], [t + 1.0, cx - 70, cy - 10, 'inout']]);
    s += f.fade(gt(cx + 100, cy + 80, '!', 30, { fill: P.rose }) + tx(cx + 60, cy + 104, '真问题没人看', { size: 15, fill: P.rose }), { at: t + 1.1 });
    return s;
  },
  readall(f, cx, cy, t) {
    let doc = rect(cx - 110, cy - 80, 120, 170, { rx: 8, fill: P.cream, stroke: P.ink, sw: 2.5 });
    for (let i = 0; i < 8; i++) doc += line(cx - 96, cy - 60 + i * 19, cx - 4 - (i % 3) * 16, cy - 60 + i * 19, { stroke: P.mute, sw: 3 });
    let s = doc + f.fade(f.move(rect(cx - 112, -3, 124, 6, { rx: 3, fill: P.yel }), [[0, 0, cy - 70], [t, 0, cy - 70], [t + 1.3, 0, cy + 80, 'inout']]), { at: t, out: t + 1.4 });
    s += at(cx + 70, cy + 30, bot({ s: 0.85, mood: 'happy', ph: 2 }));
    s += f.pop(circle(cx + 70, cy - 52, 15, { fill: P.yel, stroke: P.ink, sw: 2.5 }) + rect(cx + 64, cy - 38, 12, 9, { rx: 2, fill: P.cream, stroke: P.ink, sw: 2 }), cx + 70, cy - 48, { at: t + 1.5 });
    return s;
  },
  pile(f, cx, cy) {
    let books = '';
    for (let i = 0; i < 9; i++) books += rect(cx - 70 + ((i * 13) % 9) - 4, cy + 70 - i * 17, 110, 15, { rx: 3, fill: CYC[i % 5], fo: 0.55, stroke: P.ink, sw: 2 });
    let s = loopR(books, cx - 15, cy + 85, 2.4, { vals: [`-2 ${cx - 15} ${cy + 85}`, `2 ${cx - 15} ${cy + 85}`, `-2 ${cx - 15} ${cy + 85}`] });
    s += at(cx + 90, cy + 50, bot({ s: 0.7, mood: 'sleep', ph: 1 }));
    s += loopO(loopT(gt(cx + 105, cy - 10, 'z', 22, { fill: P.sub }), ['0 0', '8 -20'], 1.8, { linear: true }), [0, 1, 0], 1.8, { still: 1 });
    return s;
  },
  page(f, cx, cy, t) {
    let page = rect(cx - 80, cy - 70, 110, 140, { rx: 8, fill: P.cream, stroke: P.ink, sw: 2.5 }) + rect(cx - 80, cy - 70, 110, 26, { rx: 8, fill: P.yel, stroke: P.ink, sw: 2.5 });
    for (let i = 0; i < 4; i++) page += line(cx - 66, cy - 20 + i * 20, cx + 14 - (i % 2) * 22, cy - 20 + i * 20, { stroke: P.mute, sw: 3 });
    let s = f.pop(page, cx - 25, cy, { at: t });
    [0, 1, 2].forEach((k) => { s += f.pop(at(cx + 70, cy - 60 + k * 55, bot({ s: 0.45, mood: 'joy', ph: k })), cx + 70, cy - 60 + k * 55, { at: t + 0.4 + k * 0.2 }); });
    return s;
  },
  juggle(f, cx, cy) {
    let s = at(cx, cy + 40, bot({ s: 0.9, mood: 'x', prop: 'chef', ph: 0 }));
    const balls = [0, 1, 2, 3, 4].map((k) => circle(cx + 62 * Math.cos(k * 1.256), cy - 40 + 30 * Math.sin(k * 1.256), 10, { fill: CYC[k], stroke: P.ink, sw: 2 })).join('');
    s += loopR(balls, cx, cy - 40, 1.4);
    s += [0, 1, 2, 3].map((k) => at(cx - 105 + k * 70, cy + 105, bot({ s: 0.38, mood: 'sleep', ph: k }))).join('');
    return s;
  },
  conduct(f, cx, cy, t) {
    let s = at(cx, cy - 30, bot({ s: 0.85, mood: 'happy', prop: 'headset', ph: 1 }));
    [0, 1, 2, 3].forEach((k) => {
      const x = cx - 105 + k * 70, y = cy + 95;
      s += at(x, y, bot({ s: 0.42, mood: 'joy', prop: ['wrench', 'paper', 'box', 'magnifier'][k], ph: k }));
      const env = rect(-9, -6, 18, 12, { rx: 2, fill: P.yel, stroke: P.ink, sw: 1.6 });
      s += f.fade(f.move(env, [[0, cx, cy], [t + k * 0.3, cx, cy], [t + k * 0.3 + 0.5, x, y - 40, 'inout']]), { at: t + k * 0.3, out: t + k * 0.3 + 0.6 });
    });
    return s;
  },
  fire(f, cx, cy) {
    let s = '';
    [[-90, 60], [0, 80], [90, 55], [-45, -10], [55, -20]].forEach(([dx, dy], k) => {
      const fl = pathEl('M0 0C-16 -8 -12 -30 0 -46C4 -30 18 -26 14 -10C12 -2 6 2 0 0Z', { fill: P.org, stroke: P.ink, sw: 2 }) + pathEl('M1 -4C-6 -8 -4 -18 1 -26C4 -18 10 -14 6 -6Z', { fill: P.yel });
      s += at(cx + dx, cy + dy, loopS(fl, 0, 0, ['1 1', '1.12 0.88', '0.92 1.1', '1 1'], 0.5 + k * 0.08));
    });
    s += loopT(at(0, 0, bot({ s: 0.7, mood: 'x', prop: 'extinguisher', idle: false })), [`${cx - 100} ${cy + 20}`, `${cx + 90} ${cy + 20}`, `${cx - 100} ${cy + 20}`], 1.4);
    return s;
  },
  jar(f, cx, cy, t) {
    let s = pathEl(`M${cx - 60} ${cy - 50}L${cx - 60} ${cy + 80}Q${cx - 60} ${cy + 95} ${cx - 45} ${cy + 95}L${cx + 45} ${cy + 95}Q${cx + 60} ${cy + 95} ${cx + 60} ${cy + 80}L${cx + 60} ${cy - 50}`, { stroke: P.sky, sw: 4, fill: P.sky, fo: 0.08 });
    s += rect(cx - 68, cy - 62, 136, 14, { rx: 6, fill: P.sky, fo: 0.5 });
    [0, 1, 2, 3, 4].forEach((k) => {
      const note = rect(-14, -10, 28, 20, { rx: 3, fill: CYC[k], stroke: P.ink, sw: 1.6 });
      s += f.fade(f.move(note, [[0, cx - 30 + k * 15, cy - 120], [t + k * 0.25, cx - 30 + k * 15, cy - 120], [t + k * 0.25 + 0.45, cx - 30 + (k % 3) * 28, cy + 75 - Math.floor(k / 3) * 22, 'out']]), { at: t + k * 0.25 });
    });
    const knot = circle(cx, cy + 10, 26, { fill: P.yel, stroke: P.ink, sw: 3 }) + pathEl(`M${cx - 10} ${cy + 10}L${cx + 10} ${cy + 10}M${cx} ${cy}L${cx} ${cy + 20}`, { stroke: P.ink, sw: 3, cap: 'round' });
    s += f.pop(knot, cx, cy + 10, { at: t + 1.6 });
    s += ping(cx, cy + 10, 26, P.yel, 1.4);
    return s;
  },
  claim(f, cx, cy, t) {
    let s = at(cx - 50, cy + 40, bot({ s: 0.85, mood: 'happy', ph: 1 }));
    const b = chip(cx - 40, cy - 70, '我修好了', { fill: P.cream, size: 20, h: 40 });
    s += f.pop(b.svg + pathEl(`M${cx - 20} ${cy - 30}L${cx - 34} ${cy - 14}L${cx - 6} ${cy - 30}Z`, { fill: P.cream }), cx, cy - 50, { at: t });
    s += f.pop(gt(cx + 80, cy + 40, '?', 54, { fill: P.rose }), cx + 95, cy + 20, { at: t + 0.7 });
    return s;
  },
  proof(f, cx, cy, t) {
    const card = (label, ok, c) => rect(-62, -42, 124, 84, { rx: 10, fill: P.panel2, stroke: c, sw: 3 }) + tx(-50, -16, label, { size: 15, fill: P.sub }) + (ok ? check(0, 14, 1.3, P.yel) : cross(0, 14, 1, P.rose));
    let s = f.pop(at(cx - 70, cy - 40, card('修之前', false, P.rose)), cx - 70, cy - 40, { at: t });
    s += f.pop(at(cx + 70, cy - 40, card('修之后', true, P.yel)), cx + 70, cy - 40, { at: t + 0.4 });
    const vid = rect(-62, -34, 124, 68, { rx: 10, fill: P.panel2, stroke: P.sky, sw: 3 }) + pathEl('M-10 -16L16 0L-10 16Z', { fill: P.sky }) + tx(-50, 26, '录屏', { size: 14, fill: P.sub });
    s += f.pop(at(cx, cy + 68, vid), cx, cy + 68, { at: t + 0.8 });
    return s;
  },
  manual(f, cx, cy) { // 每次亲手点
    let s = at(cx, cy + 30, bot({ s: 0.85, mood: 'sad', ph: 2 }));
    s += [0, 1, 2].map((k) => loopO(at(cx - 80 + k * 80, cy - 60, rect(-22, -14, 44, 28, { rx: 6, fill: P.dim, stroke: P.ink, sw: 2 })), [0.3, 1, 0.3], 0.9, { kt: [0, 0.5, 1] })).join('');
    s += tx(cx - 70, cy + 100, '每次 token 都在花', { size: 15, fill: P.rose });
    return s;
  },
};
export { ART };
