// 场景 B：门口跑腿 bot、多宫格、聊天、跳台阶、交接
import { P, makeFig, bot, you, at, chip, panel, star4, check, cross, wrap, stamp, burst, ping, gt, gw, tx, txc, tw,
  loopT, loopO, loopS, loopR, bob, jitter, twinkle, rot, growX, growY, flipIn, rect, circle, line, pathEl } from './core.mjs';
import { hopFrames } from './scenes-a.mjs';
const CYC = [P.rose, P.org, P.yel, P.sky, P.lilac];

// 6. 门口跑腿：外面的消息先过 bot，要处理的送进后厨，没用的进垃圾桶
export function router(meta, { items, inLabel = '店外的消息', okLabel = '送进后厨', noLabel = '不用管' }) {
  const n = items.length, st = 1.25, dur = 0.8 + n * st + 2.2;
  const f = makeFig(meta, dur);
  f.add(panel(36, 196, 196, 430, { fill: P.panel2 }) + txc(134, 232, inLabel, { size: 19, weight: 800, fill: P.sub }));
  // 门
  f.add(rect(318, 230, 114, 300, { rx: 14, fill: '#2E2450', stroke: P.ink, sw: 4 }) + rect(330, 242, 90, 288, { rx: 8, fill: P.bg2 }) + circle(408, 395, 5, { fill: P.yel }));
  f.add(at(375, 430, bot({ s: 1, mood: 'happy', prop: 'clip', ph: 1 })));
  f.add(tx(322, 560, '跑腿 bot', { size: 19, weight: 800, fill: P.yel }));
  // 后厨
  let kit = panel(486, 196, 228, 250, { fill: '#3A2442', stroke: P.org, sw: 3 }) + txc(600, 232, okLabel, { size: 19, weight: 800, fill: P.org });
  kit += at(560, 380, bot({ s: 0.5, prop: 'chef', mood: 'joy', ph: 0 })) + at(650, 380, bot({ s: 0.5, prop: 'chef', mood: 'happy', ph: 2 }));
  kit += rect(585, 300, 34, 26, { rx: 6, fill: P.lilac, stroke: P.ink, sw: 2 }) + loopO(loopT(pathEl('M596 296C592 288 600 284 596 276M608 296C604 288 612 284 608 276', { stroke: P.cream, sw: 2, cap: 'round' }), ['0 2', '0 -8'], 1.6, { linear: true }), [0, 0.8, 0], 1.6, { still: 0.6 });
  f.add(kit);
  // 垃圾桶
  f.add(pathEl('M560 520L576 610L640 610L656 520Z', { fill: P.dim, stroke: P.ink, sw: 3, join: 'round' }) + rect(552, 506, 112, 16, { rx: 6, fill: P.mute, stroke: P.ink, sw: 3 }) + txc(608, 494, noLabel, { size: 17, weight: 700, fill: P.sub }));
  // 消息清单一直停在左边，每条前面标好去向（文字和信息不动）
  items.forEach((it, i) => {
    const y = 280 + i * 66, w = tw(it.tag, 17, 700) + 26;
    const c = chip(-w / 2, -16, it.tag, { fill: it.to === 0 ? P.cream : P.dim, color: it.to === 0 ? P.ink : P.sub, size: 17, h: 32, padX: 13 }).svg;
    f.add(at(148, y, c) + (it.to === 0 ? check(62, y, 0.9, P.yel) : cross(62, y, 0.75, P.rose)));
  });
  // 装饰：每条消息对应一封小信封，从清单飞过门口，进后厨或进垃圾桶（信封上没有字，可以动）
  const env = (fill) => rect(-15, -10, 30, 20, { rx: 3, fill, stroke: P.ink, sw: 2 }) + pathEl('M-15 -10L0 2L15 -10', { stroke: P.ink, sw: 2, join: 'round' });
  items.forEach((it, i) => {
    const t = 0.6 + i * st, y = 280 + i * 66;
    const to = it.to === 0 ? [600, 268] : [608, 548];
    const fr = [[0, 214, y], [t, 214, y], [t + 0.45, 375, 330, 'inout'], [t + 0.75, 375, 330], [t + 1.15, to[0], to[1], 'inout']];
    f.add(f.deco(f.fade(f.move(env(it.to === 0 ? P.cream : P.mute), fr), { at: t, out: t + 1.15, inDur: 0.12, outDur: 0.15 })));
    f.add(f.deco(f.flip(at(375, 300, ping(0, 0, 20, it.to === 0 ? P.yel : P.rose, 0.8)), t + 0.5, t + 0.9)));
  });
  // 完成态：后厨计数
  const kOK = items.filter((x) => x.to === 0).length;
  f.add(gt(520, 438, `收进来 ${kOK} 件`, 20, { fill: P.yel, f: 'bold' }));
  f.add(burst(f, 600, 300, 0.6 + n * st));
  return f;
}

// 7. 多宫格（2 到 4 张），每张一个会动的图标
export function tiles(meta, { cards }) {
  const n = cards.length, dur = 0.5 + n * 0.55 + 3.2;
  const f = makeFig(meta, dur);
  const lay = n === 4 ? cards.map((_, i) => [40 + (i % 2) * 350, 192 + Math.floor(i / 2) * 226, 320, 210, 'row'])
    : n === 3 ? cards.map((_, i) => [36 + i * 230, 192, 214, 436, 'col'])
      : cards.map((_, i) => [40 + i * 350, 192, 320, 436, 'col']);
  cards.forEach((c, i) => {
    const [x, y, w, h, mode] = lay[i], col = c.color ?? CYC[(i + 1) % 5];
    let s = panel(x, y, w, h, { fill: P.panel, stroke: c.hero ? P.yel : P.line, sw: c.hero ? 3.5 : 2 }) + rect(x, y, w, 10, { rx: 5, fill: col });
    if (mode === 'row') {
      s += at(x + 70, y + 108, ICON[c.icon]?.(col) ?? '');
      s += tx(x + 138, y + 80, c.title, { size: 23, weight: 800 });
      wrap(c.body, 9).forEach((l, k) => { s += tx(x + 138, y + 116 + k * 28, l, { size: 18, fill: c.hero ? P.yel : P.sub, weight: c.hero ? 700 : undefined }); });
    } else {
      s += at(x + w / 2, y + 120, ICON[c.icon]?.(col) ?? '');
      s += txc(x + w / 2, y + 236, c.title, { size: 24, weight: 800 });
      wrap(c.body, Math.floor((w - 30) / 19)).forEach((l, k) => { s += txc(x + w / 2, y + 276 + k * 30, l, { size: 19, fill: c.hero ? P.yel : P.sub, weight: c.hero ? 700 : undefined }); });
      if (c.tag) { const t = chip(0, 0, c.tag, { fill: col, size: 16, h: 30 }); s += at(x + w / 2 - t.w / 2, y + h - 56, t.svg); }
    }
    f.add(flipIn(f, s, x + w / 2, y + h / 2, 0.3 + i * 0.55));
    if (c.hero) { f.add(f.ring(x - 6, y - 6, w + 12, h + 12, { at: 0.5 + n * 0.55, color: P.yel, rx: 26, sw: 4 })); f.add(burst(f, x + w / 2, y + 90, 0.6 + n * 0.55)); }
  });
  return f;
}

// 图标库：中心在 (0,0)，大约 90 像素见方
export const ICON = {
  sleep: () => at(0, 10, bot({ s: 0.75, mood: 'sleep' })) + loopO(loopT(gt(26, -40, 'Z', 20, { fill: P.sky }), ['0 0', '10 -16'], 1.6, { linear: true }), [0, 1, 0], 1.6, { still: 1 }),
  bolt: (c) => loopS(pathEl('M6 -48L-24 6L-2 6L-10 48L24 -10L2 -10Z', { fill: P.yel, stroke: P.ink, sw: 3, join: 'round' }), 0, 0, ['1 1', '1.15 1.15', '1 1'], 0.6),
  crown: () => at(0, 18, bot({ s: 0.7, mood: 'joy' })) + bob(pathEl('M-24 -38L-24 -58L-12 -48L0 -64L12 -48L24 -58L24 -38Z', { fill: P.gold, stroke: P.ink, sw: 2.6, join: 'round' }), 4, 1.2),
  target: () => [42, 28, 14].map((r, i) => circle(0, 0, r, { fill: [P.cream, P.rose, P.yel][i], stroke: P.ink, sw: 2.5 })).join('') + loopT(pathEl('M-60 -30L-4 -2M-14 -2L-2 -2L-6 -14', { stroke: P.sky, sw: 4, cap: 'round', join: 'round' }), ['-30 -15', '0 0', '0 0', '-30 -15'], 1.8, { kt: [0, 0.3, 0.8, 1] }),
  mic: () => rect(-16, -44, 32, 52, { rx: 16, fill: P.lilac, stroke: P.ink, sw: 3 }) + pathEl('M-26 -8C-26 18 26 18 26 -8M0 12L0 36M-16 36L16 36', { stroke: P.cream, sw: 3.5, cap: 'round' }) + [1, 2].map((k) => loopO(pathEl(`M${30 + k * 10} -34C${40 + k * 12} -20 ${40 + k * 12} -4 ${30 + k * 10} 8`, { stroke: P.yel, sw: 3, cap: 'round' }), [0.2, 1, 0.2], 0.9 + k * 0.3)).join(''),
  ban: () => at(-6, 8, bot({ s: 0.62, mood: 'happy' })) + loopS(circle(0, 0, 46, { stroke: P.rose, sw: 7 }) + line(-32, 32, 32, -32, { stroke: P.rose, sw: 7, cap: 'round' }), 0, 0, ['1 1', '1.06 1.06', '1 1'], 1),
  toolbox: () => rect(-44, -14, 88, 48, { rx: 8, fill: P.org, stroke: P.ink, sw: 3 }) + rect(-16, -26, 32, 14, { rx: 4, stroke: P.ink, sw: 3 }) + line(-44, 4, 44, 4, { stroke: P.ink, sw: 2 })
    + [[-30, -50], [30, -50]].map(([dx, dy], k) => loopO(at(dx, dy, pathEl('M-8 8L8 -8M4 -12a5 5 0 1 0 6 6', { stroke: P.sub, sw: 3, cap: 'round' })), [1, 0.1, 1], 2 + k * 0.4)).join(''),
  doc: () => rect(-32, -44, 64, 86, { rx: 8, fill: P.cream, stroke: P.ink, sw: 3 }) + [0, 1, 2, 3].map((i) => line(-20, -24 + i * 16, 20 - (i % 2) * 14, -24 + i * 16, { stroke: P.mute, sw: 3 })).join('') + bob(star4(30, -44, 13, P.yel), 4, 1.1),
  one: (c) => circle(0, 0, 44, { fill: c, stroke: P.ink, sw: 3 }) + gt(-gw('1', 56) / 2, 20, '1', 56, { fill: P.ink }) + ping(0, 0, 44, P.yel, 1.6),
  key: () => rect(-30, -8, 60, 50, { rx: 10, fill: P.sky, stroke: P.ink, sw: 3 }) + pathEl('M-18 -8L-18 -26C-18 -46 18 -46 18 -26L18 -8', { stroke: P.cream, sw: 6 }) + circle(0, 14, 7, { fill: P.ink }),
  bell: () => loopR(pathEl('M-28 20C-22 14 -24 -10 -18 -20C-10 -36 10 -36 18 -20C24 -10 22 14 28 20Z', { fill: P.yel, stroke: P.ink, sw: 3, join: 'round' }) + circle(0, 26, 6, { fill: P.ink }), 0, -34, 2.4, { vals: ['-12 0 -34', '12 0 -34', '0 0 -34', '0 0 -34', '-12 0 -34'] }) + tx(30, -26, '嘘', { size: 18, weight: 800, fill: P.sub }),
  share: () => [[-36, 20], [36, 20], [0, -36]].map(([x, y], k) => line(0, 0, x, y, { stroke: P.sub, sw: 3 }) + at(x, y, bot({ s: 0.32, ph: k, mood: 'joy' }))).join('') + circle(0, 0, 14, { fill: P.yel, stroke: P.ink, sw: 3 }),
  heart: () => at(-10, 14, bot({ s: 0.6, mood: 'happy' })) + bob(pathEl('M30 -26C30 -40 50 -40 50 -26C50 -14 30 -4 30 -4C30 -4 10 -14 10 -26C10 -40 30 -40 30 -26Z', { fill: P.rose, stroke: P.ink, sw: 2.6 }), 5, 1),
  lazy: () => at(0, 12, bot({ s: 0.7, mood: 'sleep' })) + loopO(chip(10, -54, '能让 AI 干吗', { fill: P.cream, size: 14, h: 26, padX: 8 }).svg, [0, 1, 1, 0], 2.4, { kt: [0, 0.2, 0.8, 1], still: 1 }),
  boss: () => at(0, 14, bot({ s: 0.72, mood: 'happy', prop: 'clip' })) + bob(pathEl('M-24 -40L-24 -58L-12 -48L0 -64L12 -48L24 -58L24 -40Z', { fill: P.gold, stroke: P.ink, sw: 2.6, join: 'round' }), 4, 1.2),
};

// 8. 聊天：复述 / 订行程
export function chat(meta, { variant = 'restate', user, voice, steps = [], reply = [], unsure, options = [], reject, ask = '等你点头', done = '全部订好' }) {
  const dur = variant === 'restate' ? 9.6 : 10.4;
  const f = makeFig(meta, dur);
  // 右侧：用户
  const userAv = at(672, 246, you(0.95));
  f.add(f.pop(userAv, 672, 246, { at: 0.2 }));
  const UW = 450, ux = 600 - UW;
  let ub = rect(ux, 200, UW, voice ? 128 : 96, { rx: 22, fill: P.yel, stroke: P.ink, sw: 3 });
  if (voice) {
    ub += circle(ux + 40, 244, 18, { fill: P.ink }) + pathEl(`M${ux + 33} 236L${ux + 50} 244L${ux + 33} 252Z`, { fill: P.yel });
    for (let k = 0; k < 18; k++) { const h = 10 + ((k * 7) % 5) * 7; ub += loopS(rect(ux + 74 + k * 13, 244 - h / 2, 7, h, { rx: 3.5, fill: P.ink }), ux + 77 + k * 13, 244, ['1 0.4', '1 1.2', '1 0.4'], 0.5 + (k % 4) * 0.13); }
    ub += tx(ux + 330, 252, voice, { size: 17, weight: 700, fill: P.ink });
    ub += tx(ux + 24, 302, user, { size: 18, weight: 800, fill: P.ink });
  } else wrap(user, 22).forEach((l, k) => { ub += tx(ux + 24, 240 + k * 30, l, { size: 19, weight: 800, fill: P.ink }); });
  f.add(f.pop(ub, 600, 250, { at: 0.5, from: 0.8 }));
  // 左侧：bot
  const by = voice ? 380 : 350;
  f.add(f.pop(at(80, by + 40, bot({ s: 0.9, mood: 'happy', prop: variant === 'book' ? 'plane' : 'headset', ph: 2 })), 80, by + 40, { at: 1.3 }));
  const dots = [0, 1, 2].map((k) => loopO(circle(176 + k * 22, by + 30, 7, { fill: P.cream }), [0.2, 1, 0.2], 0.9, { kt: [0, 0.3 + k * 0.15, 1] })).join('');
  f.add(f.fade(rect(150, by + 8, 96, 44, { rx: 22, fill: P.panel }) + dots, { at: 1.5, out: 2.6, outDur: 0.1 }));
  const BH = variant === 'restate' ? 240 : 250;
  f.add(f.fade(rect(150, by, 560, BH, { rx: 22, fill: P.panel, stroke: P.line, sw: 2 }), { at: 2.6, inDur: 0.1 }));
  let t = 2.8;
  if (variant === 'restate') {
    steps.forEach((s, k) => { f.add(f.fade(check(182, by + 36 + k * 34, 0.75, P.sky, 3.5) + tx(204, by + 43 + k * 34, s, { size: 18, fill: P.sub }), { at: t })); t += 0.45; });
    reply.forEach((r, k) => { f.add(f.fade(tx(180, by + 160 + k * 34, r, { size: 21, weight: 800 }), { at: t })); t += 0.5; });
    if (unsure) { const c = chip(430, by + 170, unsure, { fill: P.rose, color: P.cream, size: 18, h: 36 }); f.add(f.pop(c.svg, 430 + c.w / 2, by + 188, { at: t })); f.add(f.flip(ping(430 + c.w / 2, by + 188, 30, P.rose, 1.2), t + 0.3)); t += 0.6; }
    f.add(stamp(f, 590, by + BH - 30, meta.doneStamp ?? '✓ 开工前就对齐了', { at: t + 0.3, color: P.yel, angle: -4 }));
    f.add(burst(f, 590, by + BH - 40, t + 0.4));
  } else {
    options.forEach((o, k) => {
      const x = 176 + k * 170, y = by + 28;
      const card = rect(x, y, 150, 104, { rx: 14, fill: P.panel2, stroke: P.sky, sw: 2.5 }) + at(x + 32, y + 40, pathEl('M-14 8L18 -8L-6 -2Z M-6 -2L2 12', { fill: P.cream, stroke: P.ink, sw: 2, join: 'round' })) + tx(x + 58, y + 46, o, { size: 19, weight: 800 }) + tx(x + 18, y + 84, '机票加酒店', { size: 15, fill: P.sub });
      f.add(f.pop(card, x + 75, y + 52, { at: t })); t += 0.4;
    });
    if (reject) {
      const x = 176 + options.length * 170, y = by + 28;
      const card = rect(x, y, 150, 104, { rx: 14, fill: P.panel2, stroke: P.dim, sw: 2 }) + tx(x + 16, y + 46, reject, { size: 17, weight: 700, fill: P.mute }) + tx(x + 16, y + 80, '最后一排', { size: 17, weight: 700, fill: P.mute });
      f.add(f.pop(card, x + 75, y + 52, { at: t })); f.add(f.pop(cross(x + 75, y + 52, 2.4, P.rose, 6), x + 75, y + 52, { at: t + 0.4 })); t += 0.8;
    }
    const btn = chip(180, by + 160, ask, { fill: P.yel, size: 20, h: 44 });
    f.add(f.pop(btn.svg, 180 + btn.w / 2, by + 182, { at: t }));
    f.add(f.fade(ping(180 + btn.w / 2, by + 182, 34, P.yel, 1.1), { at: t, out: t + 1.4, outDur: 0.1 }));
    const yes = chip(560, by + 160, '好', { fill: P.cream, size: 20, h: 44, padX: 22 });
    f.add(f.pop(yes.svg, 560 + yes.w / 2, by + 182, { at: t + 1.0 }));
    f.add(f.fade(f.move(pathEl('M0 0L0 26L7 20L12 31L17 29L12 18L21 18Z', { fill: '#FFFFFF', stroke: P.ink, sw: 2, join: 'round' }), [[0, 680, 640], [t + 1.0, 680, 640], [t + 1.5, 585, by + 190, 'inout']]), { at: t + 0.9, out: t + 2.1 }));
    f.add(stamp(f, 400, by + BH - 30, `✓ ${done}`, { at: t + 1.8, color: P.yel, angle: -4 }));
    f.add(burst(f, 400, by + BH - 40, t + 1.9));
  }
  return f;
}

// 9. 跳台阶：一级一级往上
export function ladder(meta, { steps, badge }) {
  const n = steps.length, t0 = 1.5, st = 1.1, dur = t0 + st * (n - 1) + 2.4;
  const f = makeFig(meta, dur);
  const gap = 14, W = (650 - gap * (n - 1)) / n, base = 612;
  const tops = steps.map((_, i) => base - (150 + i * ((300 - 150) / Math.max(1, n - 1))));
  steps.forEach((s, i) => {
    const x = 50 + i * (W + gap), top = tops[i], c = [P.rose, P.org, P.yel, P.sky, P.lilac][i % 5];
    let b = rect(x, top, W, base - top, { rx: 16, fill: c, stroke: P.ink, sw: 3 }) + rect(x + W - 14, top + 8, 8, base - top - 16, { rx: 4, fill: P.ink, fo: 0.15 });
    b += tx(x + 16, top + 32, s.k, { size: 16, weight: 700, fill: P.ink });
    b += tx(x + 16, top + 66, s.name, { size: W < 130 ? 19 : 22, weight: 900, fill: P.ink });
    wrap(s.note, Math.floor((W - 26) / 16)).forEach((l, k) => { b += tx(x + 16, top + 96 + k * 22, l, { size: 16, fill: P.ink }); });
    f.add(growY(f, b, x + W / 2, base, 0.3 + i * 0.18, 0.5));
    if (i < n - 1) f.add(f.pop(at(x + W - 22, top + 26, circle(0, 0, 14, { fill: P.cream, stroke: P.ink, sw: 2.5 }) + check(0, 1, 0.6, P.ink, 3.5)), x + W - 22, top + 26, { at: t0 + (i + 1) * st - 0.1 }));
  });
  const pts = steps.map((_, i) => [t0 + i * st, 50 + i * (W + gap) + W / 2, tops[i] - 44]);
  f.add(f.move(bot({ s: 0.85, mood: 'joy', ph: 1 }), hopFrames([[0, pts[0][1], pts[0][2]], ...pts], { peak: 55 })));
  const tEnd = t0 + (n - 1) * st;
  if (badge) { const c = chip(0, 0, badge, { fill: P.cream, size: 19, h: 38 }); f.add(f.pop(at(50, 200, c.svg), 50 + c.w / 2, 219, { at: tEnd + 0.2 })); }
  f.add(burst(f, pts[n - 1][1], pts[n - 1][2], tEnd + 0.05));
  return f;
}

// 10. 交接：同一件事，你出手越来越少
export function handoff(meta, { stages, meterLabel = '要你出手' }) {
  const n = stages.length, st = 1.05, dur = 0.8 + n * st + 2.2;
  const f = makeFig(meta, dur);
  const W = 156, gap = 14, X = 40;
  f.add(tx(40, 222, meterLabel, { size: 17, weight: 700, fill: P.rose }));
  stages.forEach((s, i) => {
    const x = X + i * (W + gap), cx = x + W / 2, t = 0.6 + i * st;
    const mh = 120 * s.you;
    let m = rect(x + 20, 238, W - 40, 124, { rx: 10, fill: P.panel2, stroke: P.line, sw: 2 });
    f.add(f.fade(m, { at: t }));
    if (mh > 0) f.add(growY(f, rect(x + 22, 360 - mh, W - 44, mh, { rx: 8, fill: P.rose, fo: 0.85 }), cx, 360, t + 0.1, 0.5));
    else f.add(f.pop(at(cx, 300, check(0, 0, 1.6, P.yel, 5)), cx, 300, { at: t + 0.3 }));
    if (s.you > 0) f.add(f.fade(txc(cx, 304, `${Math.round(s.you * 100)}%`, { size: 22, weight: 800, fill: P.cream }), { at: t + 0.5 }));
    let card = panel(x, 384, W, 236, { fill: i === n - 1 ? P.panel : P.panel2, stroke: i === n - 1 ? P.yel : P.line, sw: i === n - 1 ? 3 : 2 });
    const k = chip(0, 0, s.k, { fill: [P.rose, P.org, P.yel, P.sky][i % 4], size: 15, h: 28, padX: 10 });
    card += at(cx - k.w / 2, 398, k.svg) + txc(cx, 456, s.name, { size: 20, weight: 900 });
    wrap(s.note, 8).forEach((l, j) => { card += txc(cx, 488 + j * 24, l, { size: 16, fill: P.sub }); });
    f.add(f.fade(card, { at: t }));
    f.add(f.pop(at(cx, 572, bot({ s: 0.62, mood: ['sad', 'happy', 'happy', 'joy'][Math.min(3, i)], prop: 'paper', ph: i })), cx, 572, { at: t + 0.2 }));
  });
  f.add(burst(f, X + (n - 1) * (W + gap) + W / 2, 540, 0.6 + (n - 1) * st + 0.4));
  return f;
}
