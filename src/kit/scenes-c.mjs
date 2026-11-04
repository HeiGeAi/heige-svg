// 场景 C：工作台、指挥中心、计次条、公路、传送带、开锁问答、倒金字塔、病毒格
import { P, makeFig, bot, you, at, chip, panel, star4, check, cross, wrap, stamp, burst, ping, gt, gw, tx, txc, tw,
  loopT, loopO, loopS, loopR, bob, jitter, twinkle, rot, growX, growY, flipIn, rect, circle, line, pathEl } from './core.mjs';
const CYC = [P.rose, P.org, P.yel, P.sky, P.lilac];

const gear = (r, teeth, c) => {
  let d = ''; for (let i = 0; i < teeth; i++) { const a = (i / teeth) * Math.PI * 2, w = Math.PI / teeth / 1.6; const p = (aa, rr) => `${(rr * Math.cos(aa)).toFixed(1)} ${(rr * Math.sin(aa)).toFixed(1)}`; d += `${i ? 'L' : 'M'}${p(a - w, r)}L${p(a - w * 0.6, r + 9)}L${p(a + w * 0.6, r + 9)}L${p(a + w, r)}`; }
  return pathEl(d + 'Z', { fill: c, stroke: P.ink, sw: 2.6, join: 'round' }) + circle(0, 0, r * 0.35, { fill: P.bg, stroke: P.ink, sw: 2.6 });
};

// 11. 工作台：左边屏幕打字、勾清单，右边 bot 干活
export function workbench(meta, { prompt, steps, done, art = 'gears', who = 'bot' }) {
  const n = steps.length, dur = 9.8;
  const f = makeFig(meta, dur);
  f.add(rect(40, 196, 400, 430, { rx: 20, fill: '#120E22', stroke: P.line, sw: 2 }) + rect(40, 196, 400, 40, { rx: 20, fill: P.panel }) + rect(40, 216, 400, 20, { fill: P.panel })
    + circle(66, 216, 6, { fill: P.rose }) + circle(86, 216, 6, { fill: P.yel }) + circle(106, 216, 6, { fill: P.sky }) + tx(128, 222, who, { size: 16, fill: P.sub }));
  let t = 0.5;
  f.add(tx(62, 276, '>', { size: 20, weight: 800, fill: P.yel }));
  wrap(prompt, 18).forEach((l, k) => { const ty = f.type(84, 276 + k * 30, l, { at: t, cps: 24, size: 19, fill: P.cream }); f.add(ty.svg); t = ty.end + 0.1; });
  const y0 = 276 + wrap(prompt, 18).length * 30 + 30;
  steps.forEach((s, k) => {
    const y = y0 + k * 46;
    f.add(f.fade(at(76, y - 6, loopR(pathEl('M-8 0A8 8 0 1 1 0 8', { stroke: P.mute, sw: 3, cap: 'round' }), 0, 0, 0.8)), { at: t, out: t + 0.5, outDur: 0.05 }));
    f.add(f.pop(check(76, y - 6, 0.8, P.yel, 3.5), 76, y - 6, { at: t + 0.5 }));
    f.add(f.fade(tx(100, y, s.label, { size: 19, weight: 700 }) + tx(100 + tw(s.label, 19, 700) + 14, y, s.note ?? '', { size: 16, fill: P.mute }), { at: t }));
    t += 0.75;
  });
  const dc = chip(62, 572, done, { fill: P.yel, size: 18, h: 36 });
  f.add(f.pop(dc.svg, 62 + dc.w / 2, 590, { at: t + 0.2 }));
  // 右侧插画
  const cx = 585;
  if (art === 'gears') {
    f.add(at(cx - 40, 300, loopR(gear(42, 10, P.org), 0, 0, 3.2)) + at(cx + 46, 360, loopR(gear(28, 8, P.sky), 0, 0, 2.1, { from: 360, to: 0 })));
    f.add(at(cx, 520, bot({ s: 1, mood: 'joy', prop: 'wrench', ph: 1 })));
    const code = chip(0, 0, '</> 程序', { fill: P.yel, size: 18, h: 34 });
    f.add(f.fade(loopT(at(cx - code.w / 2, 0, code.svg), ['0 430', '0 230'], 2.2, { linear: true }), { at: t - 0.5 }));
  } else if (art === 'magnify') {
    [0, 1, 2].forEach((k) => {
      const y = 250 + k * 86;
      f.add(rect(cx - 110, y, 200, 62, { rx: 16, fill: P.panel, stroke: P.line, sw: 2 }) + at(cx - 84, y + 31, bot({ s: 0.32, ph: k, idle: false })) + line(cx - 56, y + 24, cx + 60, y + 24, { stroke: P.mute, sw: 4, cap: 'round' }) + line(cx - 56, y + 42, cx + 20, y + 42, { stroke: P.mute, sw: 4, cap: 'round' }));
      if (k !== 1) f.add(f.pop(chip(cx + 30, y - 12, k ? '被误会' : '被纠正', { fill: P.rose, color: P.cream, size: 15, h: 28, padX: 9 }).svg, cx + 60, y + 2, { at: 1.5 + k * 1.1 }));
    });
    const mag = circle(0, 0, 34, { fill: P.sky, fo: 0.25, stroke: P.cream, sw: 6 }) + line(24, 24, 50, 50, { stroke: P.cream, sw: 9, cap: 'round' });
    f.add(f.move(mag, [[0, cx - 20, 280], [1.0, cx - 20, 280], [1.6, cx, 280, 'inout'], [2.4, cx - 10, 366, 'inout'], [3.2, cx, 452, 'inout'], [dur - 0.6, cx, 452], [dur - 0.2, cx - 20, 280, 'inout']]));
    f.add(at(cx + 60, 585, bot({ s: 0.8, mood: 'happy', prop: 'clip', ph: 2 })));
  } else {
    const parts = [[cx - 60, 280, P.org], [cx + 50, 300, P.sky], [cx, 250, P.yel]];
    parts.forEach(([x, y, c], k) => {
      const piece = rect(-18, -12, 36, 24, { rx: 6, fill: c, stroke: P.ink, sw: 2.5 });
      f.add(f.move(piece, [[0, x, y], [1.2 + k * 0.5, x, y], [1.2 + k * 0.5 + 0.6, cx - 30 + k * 30, 400, 'inout']]));
    });
    const tool = at(cx, 392, rect(-60, -20, 120, 40, { rx: 12, fill: P.yel, stroke: P.ink, sw: 3 }) + pathEl('M-36 0L36 0M24 -10L36 0L24 10', { stroke: P.ink, sw: 4, cap: 'round', join: 'round' }));
    f.add(f.pop(tool, cx, 392, { at: 3.2 }));
    f.add(at(cx - 10, 530, bot({ s: 1, mood: 'joy', prop: 'wrench', ph: 3 })));
    f.add(loopR(at(cx + 60, 480, pathEl('M0 0L18 -18M12 -26L26 -12', { stroke: P.cream, sw: 4, cap: 'round' })), cx + 60, 480, 0.8, { vals: [`-20 ${cx + 60} 480`, `20 ${cx + 60} 480`, `-20 ${cx + 60} 480`] }));
    f.add(burst(f, cx, 392, 3.3, { r: 90 }));
  }
  return f;
}

// 12. 指挥中心：你 → 总入口 bot → 各个 bot
export function hub(meta, { sats, center = '幕僚长', centerNote = '总入口', who = '你' }) {
  const n = sats.length, st = 0.7, dur = 1.6 + n * st + 2.4;
  const f = makeFig(meta, dur, 760);
  f.add(at(104, 430, you(1.3)));
  f.add(txc(104, 500, who, { size: 20, weight: 800, fill: P.yel }));
  f.add(at(292, 420, bot({ s: 1.15, mood: 'happy', prop: 'headset', ph: 1 })));
  f.add(txc(292, 512, center, { size: 21, weight: 900, fill: P.yel }) + txc(292, 538, centerNote, { size: 16, fill: P.sub }));
  f.add(pathEl('M160 420L236 420', { stroke: P.yel, sw: 4, dash: '8 8', cap: 'round' }));
  const env = (s = 1) => `<g transform="scale(${s})">${rect(-12, -8, 24, 16, { rx: 3, fill: P.yel, stroke: P.ink, sw: 2 })}${pathEl('M-12 -8L0 2L12 -8', { stroke: P.ink, sw: 1.8 })}</g>`;
  f.add(f.fade(f.move(env(), [[0, 160, 420], [0.8, 160, 420], [1.3, 240, 420, 'inout']]), { at: 0.8, out: 1.35, outDur: 0.1 }));
  const rows = Math.ceil(n / 2);
  sats.forEach((s, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = 410 + col * 158, y = 230 + row * (440 / Math.max(1, rows - 1 || 1)) * (rows > 1 ? 1 : 0) + (rows === 1 ? 190 : 0);
    const yy = rows > 1 ? 225 + row * ((560 - 225) / (rows - 1)) : 420;
    const t = 1.6 + i * st;
    f.add(f.fade(pathEl(`M330 420Q370 ${(420 + yy) / 2} ${x - 4} ${yy}`, { stroke: P.line, sw: 2.5, dash: '4 8' }), { at: 0.5 }));
    f.add(f.move(env(0.8), [[0, 330, 420], [t - 0.5, 330, 420], [t, x, yy - 10, 'inout'], [t + 0.01, x, yy - 10]]).replace('<g transform', `<g opacity="0"><animate attributeName="opacity" values="0;0;1;1;0;0" keyTimes="0;${((t - 0.5) / dur).toFixed(4)};${((t - 0.45) / dur).toFixed(4)};${((t - 0.05) / dur).toFixed(4)};${(t / dur).toFixed(4)};1" calcMode="linear" dur="${dur}s" begin="0s" repeatCount="indefinite"></animate><g transform`) + '</g>');
    let card = panel(x - 14, yy - 52, 150, 112, { fill: P.panel, stroke: CYC[i % 5], sw: 2.5, rx: 16 });
    card += at(x + 22, yy + 4, bot({ s: 0.5, mood: 'joy', prop: s.prop, ph: i }));
    card += tx(x + 50, yy - 14, s.name, { size: 17, weight: 800 });
    wrap(s.note, 5).forEach((l, k) => { card += tx(x + 50, yy + 12 + k * 21, l, { size: 14, fill: P.sub }); });
    f.add(f.pop(card, x + 61, yy + 4, { at: t }));
  });
  f.add(burst(f, 292, 400, 1.6 + n * st, { r: 90 }));
  return f;
}

// 13. 计次条：定时任务一天跑多少次
export function bars(meta, { rows, max = 100, okLabel = '✓ 够用' }) {
  const n = rows.length, dur = 8.2;
  const f = makeFig(meta, dur);
  rows.forEach((r, i) => {
    const y = 240 + i * 96, c = r.hero ? P.yel : i === 0 ? P.rose : P.sky;
    const clock = circle(0, 0, 24, { fill: P.panel, stroke: P.cream, sw: 3 }) + loopR(line(0, 0, 0, -16, { stroke: c, sw: 3.5, cap: 'round' }), 0, 0, r.spin);
    f.add(f.fade(at(70, y, clock) + tx(110, y + 8, r.name, { size: 21, weight: 800 }), { at: 0.3 + i * 0.15 }));
    const W = Math.max(10, (r.value / max) * 380);
    f.add(rect(250, y - 16, 380, 32, { rx: 16, fill: P.panel2 }));
    f.add(growX(f, rect(250, y - 16, W, 32, { rx: 16, fill: c, stroke: P.ink, sw: 2 }), 250, y, 0.8 + i * 0.3, 1.0));
    const lx = 250 + W + 14;
    f.add(f.counter(Math.min(lx, 640), y + 9, [0, Math.round(r.value / 2), r.label], { at: 0.8 + i * 0.3, dur: 1, size: 22, weight: 800, fill: P.cream }));
    if (i === 0) [0, 1, 2, 3].forEach((k) => { f.add(f.fade(loopO(loopT(circle(250 + W - 30 - k * 60, y - 20, 7, { fill: P.yel, stroke: P.ink, sw: 1.6 }), ['0 0', `${-6 + k * 4} -40`], 1.2 + k * 0.2, { linear: true }), [1, 0], 1.2 + k * 0.2, { still: 0 }), { at: 1.8 })); });
    if (r.hero) { const ok = chip(0, 0, okLabel, { fill: P.yel, size: 18, h: 34 }); const ox = 250 + W + 84; f.add(f.pop(at(ox, y - 17, ok.svg), ox + ok.w / 2, y, { at: 2.4 + n * 0.3 })); f.add(burst(f, 250 + W, y, 2.5 + n * 0.3)); }
  });
  f.add(f.fade(tx(250, 622, meta.note ?? '每跑一次，都在花 token', { size: 17, fill: P.sub }), { at: 2 }));
  return f;
}

// 14. 公路：头一公里、中间、最后一公里
export function road(meta, { segs }) {
  const dur = 8.6, f = makeFig(meta, dur);
  const xs = [40, 266, 492], W = 218, Y = 430;
  f.add(rect(30, Y - 40, 690, 80, { rx: 40, fill: '#2C2448', stroke: P.ink, sw: 3 }));
  f.add(loopT([0, 1, 2, 3, 4, 5, 6, 7, 8].map((k) => rect(40 + k * 80, Y - 3, 40, 6, { rx: 3, fill: P.cream, fo: 0.6 })).join(''), ['0 0', '-80 0'], 0.9, { linear: true }));
  segs.forEach((s, i) => {
    const x = xs[i], hot = s.hot;
    if (hot) f.add(f.fade(rect(x, Y - 40, W, 80, { rx: 36, fill: P.yel, fo: 0.25 }) + loopO(rect(x, Y - 40, W, 80, { rx: 36, stroke: P.yel, sw: 4 }), [0.3, 1, 0.3], 1.6), { at: 0.6 + i * 0.3 }));
    let sign = panel(x + 8, 208, W - 16, 120, { fill: hot ? P.panel : P.panel2, stroke: hot ? P.yel : P.line, sw: hot ? 3 : 2 });
    sign += line(x + W / 2, 328, x + W / 2, Y - 40, { stroke: P.mute, sw: 4 });
    sign += txc(x + W / 2, 252, s.name, { size: 23, weight: 900, fill: hot ? P.yel : P.sub });
    sign += txc(x + W / 2, 284, s.do, { size: 18, weight: 700 });
    sign += txc(x + W / 2, 310, s.note, { size: 15, fill: P.sub });
    f.add(f.pop(sign, x + W / 2, 268, { at: 0.4 + i * 0.3 }));
  });
  // 中间：一群人挤在这
  [0, 1, 2].forEach((k) => f.add(at(330 + k * 46, Y + 110, bot({ s: 0.48, mood: 'sleep', ph: k }))));
  f.add(txc(376, Y + 170, '大部分人只用这段', { size: 16, fill: P.mute }));
  // 开车的 bot
  const cart = at(0, 0, rect(-34, 6, 68, 26, { rx: 8, fill: P.rose, stroke: P.ink, sw: 2.6 }) + circle(-20, 34, 9, { fill: P.ink }) + circle(20, 34, 9, { fill: P.ink })) + at(0, -22, bot({ s: 0.62, mood: 'joy', ph: 2, idle: false }));
  f.add(f.move(cart, [[0, 90, Y - 36], [1.4, 90, Y - 36], [3.2, 360, Y - 36, 'inout'], [4.0, 380, Y - 36], [5.6, 640, Y - 36, 'inout']]));
  f.add(burst(f, 150, Y - 60, 1.6, { r: 80 }) + burst(f, 640, Y - 60, 5.7, { r: 100 }));
  f.add(stamp(f, 600, Y + 110, '✓ 交回结果', { at: 5.8, color: P.yel, angle: -5 }));
  return f;
}

// 15. 传送带：步骤一路走完，或者在某一站被叫停
export function belt(meta, { stations, items, endLabel = '上线', timer }) {
  const n = stations.length, m = items.length;
  const per = 1.0 + n * 0.55, dur = 0.6 + m * per + (timer ? 2.8 : 1.6);
  const f = makeFig(meta, dur, 740);
  const Y = 480, X0 = 70, X1 = 650;
  f.add(rect(40, Y, 640, 30, { rx: 15, fill: '#2C2448', stroke: P.ink, sw: 3 }));
  f.add(loopT([...Array(14)].map((_, k) => line(52 + k * 46, Y + 15, 70 + k * 46, Y + 15, { stroke: P.mute, sw: 4, cap: 'round' })).join(''), ['0 0', '46 0'], 0.6, { linear: true }));
  [0, 1, 2, 3, 4, 5, 6].forEach((k) => f.add(at(60 + k * 100, Y + 46, loopR(circle(0, 0, 13, { fill: P.panel, stroke: P.ink, sw: 2.5 }) + line(-9, 0, 9, 0, { stroke: P.mute, sw: 2.5 }), 0, 0, 0.9))));
  const sx = stations.map((_, i) => X0 + 60 + i * ((X1 - X0 - 120) / Math.max(1, n - 1)));
  stations.forEach((s, i) => {
    const x = sx[i];
    let tower = rect(x - 54, 230, 108, 118, { rx: 14, fill: P.panel, stroke: CYC[i % 5], sw: 2.5 }) + line(x - 30, 348, x - 30, Y, { stroke: P.line, sw: 4 }) + line(x + 30, 348, x + 30, Y, { stroke: P.line, sw: 4 });
    tower += txc(x, 264, s.name, { size: n > 3 ? 17 : 20, weight: 900, fill: CYC[i % 5] });
    wrap(s.note ?? '', n > 3 ? 6 : 8).forEach((l, k) => { tower += txc(x, 290 + k * 20, l, { size: 14, fill: P.sub }); });
    tower += at(x, 404, bot({ s: 0.5, mood: 'happy', prop: 'magnifier', ph: i }));
    f.add(f.pop(tower, x, 289, { at: 0.2 + i * 0.12 }));
  });
  // 终点旗
  f.add(line(705, Y, 705, Y - 110, { stroke: P.cream, sw: 4, cap: 'round' }) + pathEl(`M707 ${Y - 110}L744 ${Y - 96}L707 ${Y - 82}Z`, { fill: P.yel, stroke: P.ink, sw: 2 }) + txc(705, Y + 92, endLabel, { size: 18, weight: 800, fill: P.yel }));
  let stops = 0, passes = 0;
  items.forEach((it, j) => {
    const t0 = 0.6 + j * per, w = tw(it.tag, 16, 700) + 24;
    const box = rect(-w / 2, -34, w, 34, { rx: 8, fill: it.stopAt === undefined ? P.cream : P.cream, stroke: P.ink, sw: 2.5 }) + tx(-w / 2 + 12, -12, it.tag, { size: 16, weight: 700, fill: P.ink });
    const fr = [[0, 40, Y - 2], [t0, 40, Y - 2]];
    let tt = t0;
    const last = it.stopAt ?? n;
    for (let i = 0; i < last; i++) { tt += 0.55; fr.push([tt, sx[i], Y - 2, 'inout']); f.add(f.flip(at(sx[i], 378, ping(0, 0, 16, P.yel, 0.7)), tt, tt + 0.4)); }
    if (it.stopAt !== undefined) {
      tt += 0.55; fr.push([tt, sx[it.stopAt] - 30, Y - 2, 'inout']);
      const bar = rect(-40, -6, 80, 12, { rx: 6, fill: P.rose, stroke: P.ink, sw: 2 });
      f.add(f.fade(f.move(bar, [[0, sx[it.stopAt], 360], [tt - 0.2, sx[it.stopAt], 360], [tt, sx[it.stopAt], Y - 44, 'out'], [tt + 0.6, sx[it.stopAt], Y - 44], [tt + 0.9, sx[it.stopAt], 360, 'inout']]), { at: tt - 0.2, out: tt + 0.9 }));
      fr.push([tt + 0.5, sx[it.stopAt] - 30, Y - 2], [tt + 0.9, sx[it.stopAt] - 40 + stops * 0, Y + 110 + stops * 38, 'inout']);
      f.add(f.move(box, fr));
      f.add(f.pop(chip(sx[it.stopAt] + 26 + 0, Y + 76 + stops * 38, `叫停：${it.why ?? ''}`, { fill: P.rose, color: P.cream, size: 14, h: 28, padX: 8 }).svg, sx[it.stopAt] + 60, Y + 90 + stops * 38, { at: tt + 0.9 }));
      stops++;
    } else {
      if (timer) {
        const tw0 = tt + 0.2;
        const clock = circle(0, 0, 34, { fill: P.panel, stroke: P.yel, sw: 4 }) + loopR(line(0, 0, 0, -24, { stroke: P.yel, sw: 4, cap: 'round' }), 0, 0, 0.6);
        f.add(f.fade(at(sx[n - 1] - 30, 630, clock), { at: tw0 }));
        f.add(f.counter(sx[n - 1] + 14, 641, timer, { at: tw0, dur: 1.6, size: 26, weight: 900, fill: P.cream }));
        f.add(f.fade(at(sx[n - 1] - 150, 630, you(0.6)) + tx(sx[n - 1] - 330 - 0, 640, meta.timerNote ?? '这段时间里随时能叫停', { size: 17, weight: 700, fill: P.yel }), { at: tw0 }));
        tt = tw0 + 1.8;
      }
      tt += 0.5; fr.push([tt, 705 - 40 + 0, Y - 2 - passes * 0, 'inout']);
      fr.push([tt + 0.01, 705 - 40, Y - 2]);
      f.add(f.fade(f.move(box, fr), { at: t0, out: tt + 0.2, outDur: 0.2 }));
      f.add(burst(f, 705, Y - 90, tt));
      passes++;
    }
  });
  if (meta.note) f.add(f.fade(txc(560, 700 - 70, meta.note, { size: 17, fill: P.sub }), { at: 0.5 }));
  return f;
}

// 16. 开锁问答：四个问题都答出来，锁才开
export function quiz(meta, { items, unlock = '放心交出去' }) {
  const n = items.length, st = 0.95, dur = 0.6 + n * st + 2.6;
  const f = makeFig(meta, dur);
  items.forEach((it, i) => {
    const y = 200 + i * 104, t = 0.4 + i * st;
    let row = panel(40, y, 470, 88, { fill: P.panel, stroke: P.line, sw: 2, rx: 18 }) + tx(116, y + 38, it.q, { size: 21, weight: 800 });
    f.add(f.fade(row, { at: t }));
    f.add(f.fade(circle(78, y + 44, 22, { fill: P.rose, stroke: P.ink, sw: 2.5 }) + gt(78 - gw('?', 26) / 2, y + 54, '?', 26, { fill: P.cream }), { at: t, out: t + 0.55, outDur: 0.1 }));
    f.add(f.pop(circle(78, y + 44, 22, { fill: P.yel, stroke: P.ink, sw: 2.5 }) + check(78, y + 44, 0.8, P.ink, 4), 78, y + 44, { at: t + 0.6 }));
    f.add(f.fade(tx(116, y + 68, it.a, { size: 17, fill: P.yel }), { at: t + 0.6 }));
  });
  const tU = 0.6 + n * st + 0.2, LX = 615, LY = 410;
  const shackle = pathEl(`M${LX - 34} ${LY - 20}L${LX - 34} ${LY - 56}C${LX - 34} ${LY - 104} ${LX + 34} ${LY - 104} ${LX + 34} ${LY - 56}L${LX + 34} ${LY - 20}`, { stroke: P.cream, sw: 12, cap: 'round' });
  f.add(f.move(shackle, [[0, 0, 0], [tU, 0, 0], [tU + 0.35, 0, -36, 'out']]));
  f.add(rect(LX - 64, LY - 30, 128, 110, { rx: 20, fill: P.yel, stroke: P.ink, sw: 4 }) + circle(LX, LY + 18, 12, { fill: P.ink }) + rect(LX - 4, LY + 20, 8, 26, { rx: 3, fill: P.ink }));
  const c = chip(0, 0, unlock, { fill: P.cream, size: 19, h: 38 });
  f.add(f.pop(at(LX - c.w / 2, LY + 110, c.svg), LX, LY + 129, { at: tU + 0.4 }));
  f.add(burst(f, LX, LY - 30, tU + 0.3, { r: 120 }));
  f.add(f.pop(at(LX, 236, bot({ s: 0.55, mood: 'joy', ph: 2 })), LX, 236, { at: tU + 0.6 }));
  return f;
}

// 17. 倒金字塔：纠错四档
export function pyramid(meta, { layers, side = '开会强调、专人盯' }) {
  const n = layers.length, dur = 8.6, f = makeFig(meta, dur);
  const cx = 320, H = 96, gap = 10, top = 196;
  layers.forEach((l, i) => {
    const y = top + i * (H + gap), w0 = 600 - i * 110, w1 = w0 - 110;
    const c = [P.yel, P.org, P.lilac, P.dim][i];
    let s = pathEl(`M${cx - w0 / 2} ${y}L${cx + w0 / 2} ${y}L${cx + w1 / 2} ${y + H}L${cx - w1 / 2} ${y + H}Z`, { fill: c, stroke: P.ink, sw: 3, join: 'round' });
    s += txc(cx, y + 40, `${l.k}  ${l.name}`, { size: 23, weight: 900, fill: i === 3 ? P.cream : P.ink });
    s += txc(cx, y + 70, l.change, { size: 17, fill: i === 3 ? P.sub : P.ink });
    f.add(f.fade(f.move(s, [[0, 0, -60], [0.3 + i * 0.4, 0, -60], [0.3 + i * 0.4 + 0.45, 0, 0, 'out']]), { at: 0.3 + i * 0.4 }));
  });
  f.add(growY(f, pathEl('M690 610L690 220M674 240L690 214L706 240', { stroke: P.yel, sw: 6, cap: 'round', join: 'round' }), 690, 610, 2.0, 0.8));
  f.add(f.fade(at(640, 198, chip(0, 0, '越往上越靠谱', { fill: P.yel, size: 15, h: 28, padX: 8 }).svg), { at: 2.8 }));
  f.add(f.fade(f.move(bot({ s: 0.62, mood: 'joy', prop: 'wrench', ph: 1 }), [[0, cx - 210, top + H * 2], [3.2, cx - 210, top + H * 2], [3.8, cx - 236, top - 10, 'out']]), { at: 3.1 }));
  const bY = top + 2 * (H + gap) + H;
  f.add(f.fade(pathEl(`M${cx + 150} ${top + 2 * (H + gap) + 8}C${cx + 200} ${top + 2 * (H + gap)} ${cx + 200} ${top + 4 * (H + gap) - 18} ${cx + 110} ${top + 4 * (H + gap) - 18}`, { stroke: P.rose, sw: 4, dash: '6 6' }), { at: 4.2 }));
  f.add(f.pop(at(cx + 230, bY + 30, bot({ s: 0.6, mood: 'sad', prop: 'megaphone', ph: 2 })), cx + 230, bY + 30, { at: 4.4 }));
  f.add(stamp(f, cx + 230, bY + 108, side, { at: 4.8, size: 17, angle: -6 }));
  f.add(burst(f, cx, top + 30, 3.9));
  return f;
}

// 18. 病毒格：一处糊弄传开，园丁冒头就拔
export function infect(meta, { left = '一处临时糊弄', right = '冒头就拔，立条规矩' }) {
  const dur = 9.2, f = makeFig(meta, dur);
  const C = 6, S = 46, G = 6;
  const grid = (ox, oy) => { let s = ''; for (let i = 0; i < C * C; i++) s += rect(ox + (i % C) * (S + G), oy + Math.floor(i / C) * (S + G), S, S, { rx: 8, fill: P.panel, stroke: P.line, sw: 1.5 }); return s; };
  const L = [44, 222], R = [404, 222];
  f.add(grid(...L) + grid(...R));
  f.add(txc(44 + 155, 210, left, { size: 19, weight: 800, fill: P.rose }) + txc(404 + 155, 210, right, { size: 19, weight: 800, fill: P.yel }));
  const seed = [2, 2];
  for (let i = 0; i < C * C; i++) {
    const r = Math.floor(i / C), c = i % C, d = Math.abs(r - seed[0]) + Math.abs(c - seed[1]);
    if (d > 5) continue;
    const t = 0.6 + d * 0.55;
    const cell = rect(L[0] + c * (S + G), L[1] + r * (S + G), S, S, { rx: 8, fill: P.rose, stroke: P.ink, sw: 2 }) + circle(L[0] + c * (S + G) + S / 2, L[1] + r * (S + G) + S / 2, 6, { fill: P.ink, fo: 0.35 });
    f.add(f.pop(cell, L[0] + c * (S + G) + S / 2, L[1] + r * (S + G) + S / 2, { at: t, from: 0.3 }));
  }
  // 右边：冒头一格，园丁过去拔掉，再围一圈
  const rr = 3, rc = 2, bx = R[0] + rc * (S + G), by = R[1] + rr * (S + G), tB = 1.2;
  f.add(f.fade(f.pop(rect(bx, by, S, S, { rx: 8, fill: P.rose, stroke: P.ink, sw: 2 }), bx + S / 2, by + S / 2, { at: tB, from: 0.3, out: 3.4 }), { at: 0 }));
  f.add(f.move(bot({ s: 0.55, mood: 'happy', prop: 'shovel', ph: 2 }), [[0, 680, 640], [1.6, 680, 640], [2.8, bx + S / 2 + 28, by - 14, 'inout'], [dur - 0.8, bx + S / 2 + 28, by - 14]]));
  f.add(f.pop(rect(bx, by, S, S, { rx: 8, fill: P.yel, stroke: P.ink, sw: 2 }) + check(bx + S / 2, by + S / 2, 0.7, P.ink, 3.5), bx + S / 2, by + S / 2, { at: 3.5 }));
  f.add(f.ring(R[0] - 8, R[1] - 8, C * (S + G) - G + 16, C * (S + G) - G + 16, { at: 4.2, color: P.yel, rx: 16, sw: 4 }));
  f.add(burst(f, bx + S / 2, by + S / 2, 3.6, { r: 80 }));
  return f;
}
