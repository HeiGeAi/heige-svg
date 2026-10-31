// 场景模板：喂数据就出图。覆盖实物图里出现最多的 8 类画面。
// 每个模板自己算时长，都遵守同一节奏：进场 → 逐步推进 → 完成态停 ≥1.5s → 退场 0.3s → 空 0.3s → 循环。
import { Fig, rect, circle, line, text, g, pathEl, glyph, glyphWidth, textWidth } from './motion.mjs';

const HOLD = 1.8; // 完成态停留
const finish = (t) => +(t + HOLD + 0.6).toFixed(2);

// 1. 终端：一句指令打出来，agent 一步步跑完，最后亮结论
//    data: { prompt, steps:[{label,note}], done, title }
export function terminalRun(meta, { prompt, steps, done, title = 'agent', cps = 26 }) {
  const typed = prompt.length / cps;
  let t = 0.3 + typed + 0.3;
  const stepAt = steps.map(() => { const a = t; t += 0.75; return a; });
  const doneAt = t + 0.1;
  const f = new Fig({ dur: finish(doneAt + (done ? 0.4 : 0)), ...meta });
  const th = f.th, X = 40, Y = 200, W = 670, H = 420;
  f.add(f.terminal(X, Y, W, H, title));
  f.add(text(X + 22, Y + 74, '>', { size: 22, weight: 600, fill: th.accent }));
  const ty = f.type(X + 46, Y + 74, prompt, { at: 0.3, cps, size: 21, mono: true, fill: th.darkText });
  f.add(ty.svg);
  steps.forEach((s, i) => {
    const y = Y + 128 + i * 46, a = stepAt[i];
    f.add(f.spinner(X + 34, y - 7, { at: a, out: a + 0.72, color: th.darkMute }));
    const label = text(X + 62, y, s.label, { size: 21, weight: 600, fill: th.darkText });
    const note = s.note ? text(X + 62 + textWidth(s.label, 21, 600) + 16, y, s.note, { size: 19, fill: th.darkMute }) : '';
    f.add(f.fade(label, { at: a }), f.fade(note, { at: a + 0.25 }));
    f.add(f.fade(f.bounce(f.check(X + 34, y - 7, { size: 0.8, color: th.darkText }), X + 34, y - 7, a + 0.72), { at: a + 0.72, inDur: 0.08 }));
  });
  if (done) {
    const p = f.pill(X + 22, Y + H - 62, done, { fill: th.accent, color: th.accent === '#FFC434' ? '#17161C' : '#FFFFFF', size: 20, h: 40 });
    f.add(f.pop(p.svg, X + 22 + p.w / 2, Y + H - 42, { at: doneAt }));
  }
  return f;
}

// 2. 界面点击流：光标移过去，点一下，界面翻到下一屏
//    data: { screens:[{title, rows:[文字], target: 行号, button}], }
export function uiClick(meta, { window: win = '', screens }) {
  let t = 0.5;
  const marks = screens.map((s) => { const a = t; t += 1.9; return a; });
  const f = new Fig({ dur: finish(t - 0.6), ...meta });
  const th = f.th, X = 90, Y = 200, W = 570, H = 410;
  f.add(f.browser(X, Y, W, H, win));
  const stops = [];
  screens.forEach((s, i) => {
    const from = marks[i], to = i + 1 < screens.length ? marks[i + 1] : f.exit;
    let html = text(X + 30, Y + 86, s.title, { size: 25, weight: 600, fill: th.ink }) + line(X + 30, Y + 104, X + W - 30, Y + 104, { stroke: th.cardLine });
    (s.rows ?? []).forEach((r, k) => {
      const y = Y + 140 + k * 54, hit = k === s.target;
      html += rect(X + 30, y - 26, W - 60, 44, { rx: 9, fill: hit ? th.hl : th.card, stroke: th.cardLine, sw: 1.2 });
      html += text(X + 48, y + 3, r, { size: 19, fill: hit ? th.ink : th.sub, weight: hit ? 600 : undefined });
    });
    if (s.button) {
      const w = textWidth(s.button, 19, 600) + 44;
      html += rect(X + W - 30 - w, Y + H - 66, w, 44, { rx: 10, fill: th.dark }) + text(X + W - 30 - w + 22, Y + H - 37, s.button, { size: 19, weight: 600, fill: th.darkText });
      if (i + 1 < screens.length) stops.push({ t: to - 0.15, x: X + W - 30 - w / 2, y: Y + H - 44 });
    } else if (s.target !== undefined && i + 1 < screens.length) {
      stops.push({ t: to - 0.15, x: X + W - 120, y: Y + 140 + s.target * 54 - 4 });
    }
    f.add(i === 0 ? f.fade(html, { at: 0, inDur: 0.05, out: to, outDur: 0.01 }) : f.flip(html, from, to === f.exit ? f.exit + 0.3 : to));
    if (s.mark !== undefined && i === screens.length - 1) {
      const y = Y + 140 + s.mark * 54;
      f.add(f.ring(X + 26, y - 30, W - 52, 52, { at: from + 0.4, rx: 11 }));
    }
  });
  f.add(f.cursor(stops));
  return f;
}

// 3. 条形赛跑：一根时间线扫过，谁先到谁先打勾，主角标红
//    data: { rows:[{name,value,label,hero}], unit, max }
export function barRace(meta, { rows, max, tick = 10, unit = '' }) {
  const m = max ?? Math.max(...rows.map((r) => r.value)) * 1.05;
  const runDur = 2.8;
  const f = new Fig({ dur: finish(0.4 + runDur + 0.5), ...meta });
  const th = f.th, L = 40, BX = 240, BW = 460, rowH = Math.min(84, 340 / rows.length), top = Math.max(215, 170 + (476 - rows.length * rowH - 40) / 2);
  rows.forEach((r, i) => {
    const y = top + i * rowH, w = (r.value / m) * BW, c = r.hero ? th.accent : th.sub;
    f.add(text(L, y + 16, r.name, { size: 22, weight: 600, fill: r.hero ? th.accent : th.ink }));
    f.add(rect(BX, y, BW, 18, { rx: 4, fill: th.line, fo: 0.6 }));
    const arrive = 0.4 + runDur * (r.value / m);
    f.add(f.grow(BX, y, w, 18, { at: 0.4, dur: arrive - 0.4, fill: c, ease: 'hold' }));
    const lx = BX + w + 8;
    const inside = lx + 118 > BX + BW;
    const tx = inside ? BX + w - 118 : lx + 22;
    const col = inside ? '#FFFFFF' : c;
    const ck = pathEl(`M${tx - 18} ${y + 9}L${tx - 12} ${y + 15}L${tx - 2} ${y + 3}`, { stroke: col, sw: 2.6, cap: 'round', join: 'round' });
    f.add(f.fade(f.bounce(ck, tx - 10, y + 9, arrive) + text(tx + 4, y + 16, r.label ?? `${r.value}${unit}`, { size: 20, weight: 600, fill: col }), { at: arrive, inDur: 0.1 }));
  });
  const axisY = top + rows.length * rowH + 2;
  f.add(line(BX, axisY, BX + BW, axisY, { stroke: th.sub, sw: 1.4 }));
  for (let v = 0; v <= m; v += tick) {
    const x = BX + (v / m) * BW;
    f.add(line(x, axisY, x, axisY + 7, { stroke: th.sub, sw: 1.2 }), text(x - textWidth(String(v), 16) / 2, axisY + 28, String(v), { size: 16, fill: th.mute }));
  }
  const marker = line(0, top - 12, 0, axisY, { stroke: th.ink, sw: 1, so: 0.5 }) + pathEl(`M-7 ${axisY + 1}L0 ${axisY - 9}L7 ${axisY + 1}Z`, { fill: th.ink });
  f.add(f.fade(f.move(marker, [[0, BX, 0], [0.4, BX, 0], [0.4 + runDur, BX + BW, 0]]), { at: 0.3, inDur: 0.1 }));
  return f;
}

// 4. 方格墙：两种情况对比，一格格变色（「全要人看」vs「只看几块」）
//    data: { left:{label,cols,rows,mode:'all'}, right:{label,picked:[索引]}, leftNote, rightNote }
export function gridWall(meta, { left, right, cols = 6, rows = 5 }) {
  const cell = 34, gap = 8, n = cols * rows, step = 0.11;
  const allDur = n * step;
  const f = new Fig({ dur: finish(0.5 + allDur + 0.4), ...meta });
  const th = f.th;
  const draw = (ox, label, labelFill, fn) => {
    f.add(text(ox, 262, label, { size: 24, weight: 600, fill: labelFill }));
    for (let i = 0; i < n; i++) {
      const x = ox + (i % cols) * (cell + gap), y = 290 + Math.floor(i / cols) * (cell + gap);
      f.add(rect(x, y, cell, cell, { rx: 5, fill: th.block }));
      fn(i, x, y);
    }
  };
  draw(50, left.label, th.ink, (i, x, y) => f.add(f.flip(rect(x, y, cell, cell, { rx: 5, fill: th.sub }), 0.5 + i * step, f.exit + 0.3)));
  f.add(line(375, 240, 375, 600, { stroke: th.line }));
  const picked = new Set(right.picked);
  draw(410, right.label, th.accent, (i, x, y) => {
    if (!picked.has(i)) return;
    const a = 0.5 + [...picked].indexOf(i) * 0.55;
    f.add(f.pop(rect(x - 3, y - 3, cell + 6, cell + 6, { rx: 7, fill: th.accent }), x + cell / 2, y + cell / 2, { at: a }));
  });
  if (right.note) {
    const a = 0.5 + picked.size * 0.55 + 0.2;
    f.add(f.fade(f.check(424, 568, { size: 0.7, color: th.ink }) + text(444, 575, right.note, { size: 22, weight: 600, fill: th.ink }), { at: a }));
  }
  if (left.note) f.add(f.fade(text(50, 575, left.note, { size: 22, fill: th.sub }), { at: 0.5 + allDur }));
  return f;
}

// 5. 流水线：方块依次穿过几个处理站，按结果分流到不同出口
//    data: { stations:['A','B'], items:[{tag, to:0|1}], outs:['直接入库','交给人看'] }
export function pipeline(meta, { stations, items, outs, input = '输入' }) {
  const cycle = 1.5;
  const f = new Fig({ dur: finish(0.5 + items.length * cycle), ...meta });
  const th = f.th;
  const midY = 400, sw = 138, sh = 92;
  const inX = 50, gapX = 34;
  const stX = stations.map((_, i) => inX + 100 + gapX + i * (sw + gapX));
  const outX = stX[stX.length - 1] + sw + gapX + 8, outW = 710 - outX;
  f.add(rect(inX, midY - 60, 100, 120, { rx: 8, fill: th.block }), text(inX + 50 - textWidth(input, 18) / 2, midY + 86, input, { size: 18, fill: th.mute }));
  for (let k = 0; k < 4; k++) f.add(rect(inX + 14, midY - 44 + k * 22, 72, 8, { rx: 3, fill: th.sub, fo: 0.45 }));
  stations.forEach((s, i) => {
    const x = stX[i];
    f.add(rect(x, midY - sh / 2, sw, sh, { rx: 12, fill: th.card, stroke: th.ink, sw: 2 }), text(x + sw / 2 - textWidth(s, 23, 600) / 2, midY + 8, s, { size: 23, weight: 600, fill: th.ink }));
    const ax = x - gapX + 6;
    f.add(line(ax, midY, x - 6, midY, { stroke: th.mute, sw: 1.6 }), pathEl(`M${x - 13} ${midY - 5}L${x - 6} ${midY}L${x - 13} ${midY + 5}`, { stroke: th.mute, sw: 1.6 }));
  });
  const outYs = [250, 470], outH = 130;
  outs.forEach((o, i) => {
    const y = outYs[i], c = i === 1 ? th.accent : th.ink;
    f.add(rect(outX, y, outW, outH, { rx: 10, stroke: c, sw: 1.8, dash: '6 6' }), text(outX + outW / 2 - textWidth(o, 18, 600) / 2, y - 12, o, { size: 18, weight: 600, fill: c }));
  });
  const landed = [0, 0];
  items.forEach((it, i) => {
    const at = 0.5 + i * cycle, bw = 58, bh = 26, y0 = midY - bh / 2;
    const c = it.to === 1 ? th.accent : th.ink;
    const slot = landed[it.to]++;
    const ex = outX + 10, ey = outYs[it.to] + 16 + slot * (bh + 10);
    const frames = [[0, inX + 21, y0], [at, inX + 21, y0]];
    let ct = at;
    stX.forEach((x) => { ct += 0.32; frames.push([ct, x + sw / 2 - bw / 2, y0, 'inout']); ct += 0.12; frames.push([ct, x + sw / 2 - bw / 2, y0]); });
    ct += 0.4; frames.push([ct, ex, ey, 'inout']);
    const chip = rect(0, 0, bw, bh, { rx: 5, fill: '#FFFFFF', stroke: c, sw: 2 }) + rect(10, 11, bw - 20, 4, { rx: 2, fill: c });
    f.add(f.fade(f.move(chip, frames), { at, inDur: 0.1 }));
    if (it.tag) {
      const p = f.pill(ex + bw + 6, ey - 2, it.tag, { fill: c, size: 16, h: 30, padX: 9 });
      f.add(f.pop(p.svg, ex + bw, ey + 10, { at: ct }));
    }
  });
  return f;
}

// 6. 手机对话：气泡逐条出现，AI 逐行回复，结论圈出来
//    data: { app, user, steps:[文字], result:[文字], mark: 行号 }
export function phoneChat(meta, { app = 'App', user, steps = [], result = [], mark, tag }) {
  let t = 0.4;
  const bubbleAt = t; t += 0.55;
  const stepAt = steps.map(() => { const a = t; t += 0.5; return a; });
  const resAt = result.map(() => { const a = t; t += 0.35; return a; });
  const f = new Fig({ dur: finish(t + 0.3), h: 750, rule: false, ...meta });
  const th = f.th, X = 150, Y = 132, W = 450;
  f.add(f.phone(X, Y, W, '#F7F8FD'));
  f.add(text(X + 34, Y + 74, app, { size: 24, weight: 600, fill: th.ink }), line(X + 8, Y + 94, X + W - 8, Y + 94, { stroke: th.cardLine }));
  f.add(rect(X + 24, this_inputY(f) , W - 48, 52, { rx: 26, fill: '#FFFFFF', stroke: th.cardLine, sw: 1.2 }), text(X + 48, this_inputY(f) + 33, `给 ${app} 发消息…`, { size: 19, fill: th.mute }));
  const lines = wrap(user, 22, W - 130);
  const bh = lines.length * 34 + 30, bw = Math.min(W - 70, Math.max(...lines.map((l) => textWidth(l, 22))) + 44);
  const by = Y + 118;
  let bubble = rect(X + W - 30 - bw, by, bw, bh, { rx: 18, fill: th.hl });
  lines.forEach((l, i) => { bubble += text(X + W - 30 - bw + 22, by + 39 + i * 34, l, { size: 22, fill: th.ink }); });
  f.add(f.pop(bubble, X + W - 30, by + bh / 2, { at: bubbleAt, from: 0.85 }));
  let y = by + bh + 48;
  steps.forEach((s, i) => {
    f.add(f.spinner(X + 44, y - 6, { at: stepAt[i], out: stepAt[i] + 0.48, color: th.mute, r: 7 }));
    f.add(f.fade(f.check(X + 44, y - 6, { size: 0.55, color: th.mute }), { at: stepAt[i] + 0.48, inDur: 0.05 }), f.fade(text(X + 66, y, s, { size: 21, fill: th.sub }), { at: stepAt[i] }));
    y += 42;
  });
  y += 18;
  result.forEach((r, i) => {
    f.add(f.fade(text(X + 34, y, r, { size: 24, weight: i === 0 ? 600 : undefined, fill: th.ink }), { at: resAt[i], inDur: 0.2 }));
    if (mark === i) f.add(f.ring(X + 24, y - 31, textWidth(r, 24) + 22, 44, { at: resAt[i] + 0.3, rx: 9 }));
    y += 50;
  });
  if (tag) {
    const p = f.pill(X + W + 22, by + 8, tag, { fill: th.accent, size: 18, h: 34, padX: 11 });
    f.add(f.pop(p.svg, X + W + 22 + p.w / 2, by + 25, { at: resAt[0] ?? 1.5 }));
  }
  return f;
}

// 7. 时间线清单：左边时间点，节点依次亮，右边数字变化
//    data: { items:[{when,name,change,who}] }
export function timelineList(meta, { items }) {
  const stepT = 0.42;
  const f = new Fig({ dur: finish(0.3 + items.length * stepT), ...meta });
  const th = f.th, top = 205, rowH = Math.min(70, 420 / items.length), axisX = 240;
  f.add(line(axisX, top - 10, axisX, top + rowH * items.length - 20, { stroke: th.line, sw: 2 }));
  items.forEach((it, i) => {
    const y = top + i * rowH + 12, at = 0.3 + i * stepT;
    f.add(circle(axisX, y - 7, 6, { fill: th.card, stroke: th.line, sw: 2 }));
    f.add(f.pop(circle(axisX, y - 7, 8, { fill: th.accent }), axisX, y - 7, { at, dur: 0.3 }));
    f.add(f.fade(g(text(40, y, it.when, { size: 22, fill: th.ink }) + text(266, y, it.name, { size: 23, weight: 600, fill: th.ink }) + text(430, y, it.change, { size: 22, weight: 600, fill: th.accent }) + (it.who ? text(710 - textWidth(it.who, 17), y, it.who, { size: 17, fill: th.mute }) : '')), { at, inDur: 0.2 }));
  });
  return f;
}

// 8. 成绩卡：一组卡片依次亮，主角行标红并打勾
//    data: { cards:[{title,rows:[{name,score,hero}]}] }
export function rankCards(meta, { cards }) {
  const stepT = 0.5;
  const f = new Fig({ dur: finish(0.3 + cards.length * stepT + 0.3), ...meta });
  const th = f.th, cols = 2, cw = 325, ch = cards.length > 4 ? 130 : 200, gx = 20, gy = 16, X = 40, Y = 195;
  cards.forEach((c, i) => {
    const x = X + (i % cols) * (cw + gx), y = Y + Math.floor(i / cols) * (ch + gy), at = 0.3 + i * stepT;
    f.add(f.card(x, y, cw, ch), text(x + 18, y + 34, c.title, { size: 21, weight: 600, fill: th.ink }));
    let body = '', heroFirst = c.rows[0]?.hero;
    c.rows.forEach((r, k) => {
      const ry = y + 70 + k * 40;
      if (r.hero) body += rect(x + 10, ry - 25, cw - 20, 36, { rx: 5, fill: th.accent, fo: 0.1 });
      const col = r.hero ? th.accent : th.sub;
      body += text(x + 18, ry, `${k + 1}  ${r.name}`, { size: 20, weight: r.hero ? 600 : undefined, fill: col }) + text(x + cw - 18 - textWidth(String(r.score), 20, 600), ry, String(r.score), { size: 20, weight: r.hero ? 600 : undefined, fill: col });
    });
    f.add(f.fade(body, { at, inDur: 0.25 }));
    if (heroFirst) f.add(f.fade(f.bounce(f.check(x + cw - 26, y + 26, { size: 0.6 }), x + cw - 26, y + 26, at + 0.2), { at: at + 0.2, inDur: 0.08 }));
  });
  return f;
}

const this_inputY = (f) => f.h - 72;

export function wrap(s, size, maxW) {
  const out = []; let cur = '', w = 0;
  for (const ch of Array.from(s)) {
    const cw = textWidth(ch, size);
    if (w + cw > maxW) { out.push(cur); cur = ''; w = 0; }
    cur += ch; w += cw;
  }
  if (cur) out.push(cur);
  return out;
}

export const SCENES = { terminalRun, uiClick, barRace, gridWall, pipeline, phoneChat, timelineList, rankCards };
