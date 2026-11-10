// 夜空视觉包（kit）：深靛夜空底，暖黄、天空蓝、玫红、橙、奶油白，不用绿色
// 18 个讲道理的场景共用这一套：画框、角色（土豆机器人）、印章、彩纸、循环小动作
// 第一次用于「问问黑哥」公众号 2026-11 的一个四期系列
// 只用 heige-svg 引擎允许的元素：g/path/rect/circle/line/text + animate/animateTransform，只动 opacity 和 transform
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Fig, rect, circle, line, pathEl, text, textWidth, deco } from '../motion.mjs';
import opentype from 'opentype.js';

const here = path.dirname(fileURLToPath(import.meta.url));

export const P = {
  bg: '#1B1530', bg2: '#231B3D', panel: '#2B2250', panel2: '#221A40', line: '#42376E',
  cream: '#FFF4DC', sub: '#BDB2DE', mute: '#7F74A8', dim: '#4A4070',
  yel: '#FFD43B', org: '#FF9F43', rose: '#FF5C8A', sky: '#6FC8FF', lilac: '#A98BFF',
  potato: '#EDB858', potatoD: '#B97F2C', ink: '#17121F', peach: '#FFDCC4', hair: '#3B2A27',
  maroon: '#9A2F4E', gold: '#E9B949', sweater: '#2A2430',
};
const CYCLE = [P.rose, P.org, P.yel, P.sky, P.lilac];
const num = (n) => (Number.isInteger(n) ? String(n) : String(+Number(n).toFixed(2)));

// ---------- 字形转路径（思源黑体 Noto Sans SC，OFL，npm run fonts 下载） ----------
const FONTS = { black: 'NotoSansSC-Black.otf', bold: 'NotoSansSC-Bold.otf' };
const fc = {};
function font(n) {
  if (!fc[n]) { const b = fs.readFileSync(path.join(here, '..', '..', 'fonts', FONTS[n])); fc[n] = opentype.parse(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength)); }
  return fc[n];
}
export const gw = (s, size, f = 'black') => font(f).getAdvanceWidth(s, size, { kerning: false });
function pathD(cmds) {
  const r = Math.round; let out = '', cx = 0, cy = 0, sx = 0, sy = 0;
  for (const c of cmds) {
    if (c.type === 'M') { const x = r(c.x), y = r(c.y); out += `M${x} ${y}`; cx = sx = x; cy = sy = y; }
    else if (c.type === 'L') { const x = r(c.x), y = r(c.y); if (x === cx && y === cy) continue; out += `l${x - cx} ${y - cy}`; cx = x; cy = y; }
    else if (c.type === 'Q') { const a = r(c.x1), b = r(c.y1), x = r(c.x), y = r(c.y); out += `q${a - cx} ${b - cy} ${x - cx} ${y - cy}`; cx = x; cy = y; }
    else if (c.type === 'C') { const a = r(c.x1), b = r(c.y1), d = r(c.x2), e = r(c.y2), x = r(c.x), y = r(c.y); out += `c${a - cx} ${b - cy} ${d - cx} ${e - cy} ${x - cx} ${y - cy}`; cx = x; cy = y; }
    else if (c.type === 'Z') { out += 'z'; cx = sx; cy = sy; }
  }
  return out;
}
// icon：字只是角色图标的一部分（比如「你」头像），不按正文文字处理
export const gt = (x, y, s, size, { fill = P.cream, f = 'black', icon = false } = {}) =>
  pathEl(pathD(font(f).getPath(s, 0, 0, size * 2, { kerning: false }).commands), { transform: `translate(${num(x)} ${num(y)}) scale(0.5)`, fill, txt: !icon });

export const tx = (x, y, s, { size = 18, weight, fill = P.cream } = {}) => text(+x.toFixed(1), +y.toFixed(1), s, { size, weight, fill });
export const tw = (s, size, weight) => textWidth(s, size, weight);
export const txc = (cx, y, s, o = {}) => tx(cx - tw(s, o.size ?? 18, o.weight) / 2, y, s, o);
export const at = (x, y, svg, extra = '') => `<g transform="translate(${num(x)} ${num(y)})${extra}">${svg}</g>`;

// ---------- 独立循环（不跟主时间轴，自己转） ----------
const SPL = '0.42 0 0.58 1';
function kts(n, kt) { return kt ?? Array.from({ length: n }, (_, i) => +(i / (n - 1)).toFixed(4)); }
export function loopT(content, vals, dur, { type = 'translate', kt, linear = false } = {}) {
  const k = kts(vals.length, kt);
  const sp = linear ? ' calcMode="linear"' : ` calcMode="spline" keySplines="${Array(vals.length - 1).fill(SPL).join(';')}"`;
  return `<g><animateTransform attributeName="transform" type="${type}" values="${vals.join(';')}" keyTimes="${k.join(';')}"${sp} dur="${num(dur)}s" begin="0s" repeatCount="indefinite"></animateTransform>${content}</g>`;
}
export function loopO(content, vals, dur, { kt, still } = {}) {
  const k = kts(vals.length, kt);
  return `<g${still !== undefined ? ` opacity="${still}"` : ''}><animate attributeName="opacity" values="${vals.join(';')}" keyTimes="${k.join(';')}" calcMode="spline" keySplines="${Array(vals.length - 1).fill(SPL).join(';')}" dur="${num(dur)}s" begin="0s" repeatCount="indefinite"></animate>${content}</g>`;
}
export const loopS = (content, cx, cy, vals, dur, o) => at(cx, cy, loopT(at(-cx, -cy, content), vals, dur, { ...o, type: 'scale' }));
export const loopR = (content, cx, cy, dur, { from = 0, to = 360, vals } = {}) =>
  loopT(content, vals ?? [`${from} ${cx} ${cy}`, `${to} ${cx} ${cy}`], dur, { type: 'rotate', linear: true });
export const bob = (content, amp = 5, dur = 1.3, ph = 0) => loopT(content, ph % 2 ? [`0 ${-amp}`, '0 0', `0 ${-amp}`] : ['0 0', `0 ${-amp}`, '0 0'], dur);
export const jitter = (content, a = 3, dur = 0.4, ph = 0) => loopT(content, [['0 0', `${a} ${-a}`, `${-a} ${a / 2}`, `${a / 2} ${a}`, '0 0'], [`${-a} 0`, `0 ${a}`, `${a} 0`, `0 ${-a}`, `${-a} 0`]][ph % 2], dur);
export const twinkle = (content, dur = 2.2, lo = 0.15) => loopO(content, [lo, 1, lo], dur);

// 主时间轴上的旋转
export function rot(f, content, cx, cy, frames) {
  const fr = frames.map(([t, a, e]) => [t, `${a} ${cx} ${cy}`, e]);
  const a = f._smil(fr, 'animateTransform', ' attributeName="transform" type="rotate"');
  return `<g transform="rotate(${f._valueAt(fr, f.posterT)})">${a}${content}</g>`;
}
// 横向长出来（以左边为支点）
export const growX = (f, content, x, y, at0, dur = 0.6, out) =>
  f.scale(content, x, y, [[0, '0.01 1'], [at0, '0.01 1'], [at0 + dur, '1 1', 'inout'], ...(out ? [[out, '1 1'], [out + 0.3, '0.01 1', 'inout']] : [])]);
export const growY = (f, content, x, y, at0, dur = 0.5) => f.scale(content, x, y, [[0, '1 0.01'], [at0, '1 0.01'], [at0 + dur, '1 1', 'out']]);
export const flipIn = (f, content, cx, cy, at0) => f.fade(f.scale(content, cx, cy, [[0, '0.01 1'], [at0, '0.01 1'], [at0 + 0.45, '1 1', 'out']]), { at: at0, inDur: 0.08 });

// ---------- 小部件 ----------
export function chip(x, y, label, { fill = P.yel, color = P.ink, size = 18, h = 34, weight = 700, padX = 14, stroke } = {}) {
  const w = tw(label, size, weight) + padX * 2;
  return { svg: rect(x, y, w, h, { rx: h / 2, fill, stroke, sw: stroke ? 2 : undefined }) + tx(x + padX, y + h / 2 + size * 0.36, label, { size, weight, fill: color }), w };
}
export const panel = (x, y, w, h, { fill = P.panel, stroke = P.line, rx = 20, sw = 2 } = {}) => rect(x, y, w, h, { rx, fill, stroke, sw });
export const star4 = (x, y, r, fill = P.cream) => pathEl(`M${x} ${y - r}Q${x + r * 0.18} ${y - r * 0.18} ${x + r} ${y}Q${x + r * 0.18} ${y + r * 0.18} ${x} ${y + r}Q${x - r * 0.18} ${y + r * 0.18} ${x - r} ${y}Q${x - r * 0.18} ${y - r * 0.18} ${x} ${y - r}Z`, { fill });
export const check = (x, y, s = 1, color = P.yel, sw = 4) => pathEl(`M${num(x - 11 * s)} ${num(y)}L${num(x - 3 * s)} ${num(y + 8 * s)}L${num(x + 12 * s)} ${num(y - 9 * s)}`, { stroke: color, sw, cap: 'round', join: 'round' });
export const cross = (x, y, s = 1, color = P.rose, sw = 4) => pathEl(`M${num(x - 9 * s)} ${num(y - 9 * s)}L${num(x + 9 * s)} ${num(y + 9 * s)}M${num(x + 9 * s)} ${num(y - 9 * s)}L${num(x - 9 * s)} ${num(y + 9 * s)}`, { stroke: color, sw, cap: 'round' });
export function wrap(s, max) {
  if (Array.from(s).length <= max) return [s];
  const parts = s.split('，'); const out = []; let cur = '';
  for (const p of parts) { const nx = cur ? `${cur}，${p}` : p; if (Array.from(nx).length > max && cur) { out.push(cur); cur = p; } else cur = nx; }
  if (cur) out.push(cur);
  return out.flatMap((l) => { const a = Array.from(l); const r = []; for (let i = 0; i < a.length; i += max) r.push(a.slice(i, i + max).join('')); return r; });
}
// 印章：斜着盖一下
export function stamp(f, cx, cy, label, { at: t0, color = P.rose, size = 22, angle = -8 } = {}) {
  const w = tw(label, size, 800) + 32, h = size + 22;
  const body = rect(cx - w / 2, cy - h / 2, w, h, { rx: 10, stroke: color, sw: 3.5, fill: P.bg, fo: 0.6 }) + tx(cx - w / 2 + 16, cy + size * 0.36, label, { size, weight: 800, fill: color });
  return f.pop(at(0, 0, body, ` rotate(${angle} ${cx} ${cy})`), cx, cy, { at: t0, from: 1.8, dur: 0.3 });
}
// 彩纸炸开（一闪而过，不进静态帧）
export function burst(f, cx, cy, t0, { n = 14, r = 120, colors = [P.yel, P.rose, P.sky, P.org, P.lilac, P.cream] } = {}) {
  let s = '';
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + 0.3, d = r * (0.55 + ((i * 37) % 10) / 22);
    const dx = Math.cos(a) * d, dy = Math.sin(a) * d;
    const piece = i % 3 === 0 ? circle(0, 0, 5, { fill: colors[i % colors.length] }) : i % 3 === 1 ? rect(-4, -7, 8, 14, { rx: 2, fill: colors[i % colors.length] }) : star4(0, 0, 8, colors[i % colors.length]);
    const mv = f.move(piece, [[0, cx, cy], [t0, cx, cy], [t0 + 0.75, cx + dx, cy + dy, 'out']]);
    s += f.fade(mv, { at: t0, out: t0 + 0.5, inDur: 0.04, outDur: 0.4 });
  }
  return deco(s);
}
// 扩散波纹，循环
export const ping = (cx, cy, r, color = P.yel, dur = 1.6) =>
  loopO(loopS(circle(cx, cy, r, { stroke: color, sw: 3 }), cx, cy, ['1 1', '1.7 1.7'], dur, { linear: true }), [0.9, 0], dur, { still: 0 });

// ---------- 角色：小土豆机器人 ----------
export function bot({ s = 1, ph = 0, mood = 'happy', prop = null, idle = true, color = P.potato, blink = true } = {}) {
  const k = P.ink;
  let b = '';
  b += circle(-11, 35, 7, { fill: color, stroke: k, sw: 2.6 }) + circle(11, 35, 7, { fill: color, stroke: k, sw: 2.6 });
  b += pathEl('M-30 -2C-31 -27 -12 -40 4 -39C25 -38 35 -21 33 0C31 24 14 36 -3 35C-22 34 -29 19 -30 -2Z', { fill: color, stroke: k, sw: 3.2, join: 'round' });
  b += pathEl('M17 -31C30 -20 34 -4 31 10C28 24 16 32 4 34C18 24 26 4 17 -31Z', { fill: P.potatoD, fo: 0.3 });
  b += circle(-17, -19, 2.6, { fill: P.potatoD, fo: 0.75 }) + circle(15, 18, 2.3, { fill: P.potatoD, fo: 0.75 }) + circle(-8, 23, 1.9, { fill: P.potatoD, fo: 0.75 });
  b += line(2, -39, 4, -52, { stroke: k, sw: 2.6, cap: 'round' }) + loopO(circle(4, -55, 5, { fill: P.yel, stroke: k, sw: 2 }), [1, 0.45, 1], 1.4 + ph * 0.2);
  let eyes;
  if (mood === 'x') eyes = cross(-9, -6, 0.5, k, 3) + cross(10, -6, 0.5, k, 3);
  else if (mood === 'joy') eyes = pathEl('M-14 -5Q-10 -11 -6 -5M6 -5Q10 -11 14 -5', { stroke: k, sw: 3, cap: 'round' });
  else if (mood === 'sleep') eyes = pathEl('M-14 -6Q-10 -3 -6 -6M6 -6Q10 -3 14 -6', { stroke: k, sw: 3, cap: 'round' });
  else {
    eyes = rect(-13, -12, 7, 11, { rx: 3.5, fill: k }) + rect(6, -12, 7, 11, { rx: 3.5, fill: k }) + circle(-10.6, -9.3, 1.6, { fill: '#FFFFFF' }) + circle(8.4, -9.3, 1.6, { fill: '#FFFFFF' });
    if (blink) eyes = loopS(eyes, 0, -6, ['1 1', '1 1', '1 0.12', '1 1'], 3.3 + ph * 0.37, { kt: [0, 0.9, 0.95, 1] });
  }
  b += eyes;
  b += circle(-19, 4, 4.4, { fill: P.rose, fo: 0.55 }) + circle(19, 4, 4.4, { fill: P.rose, fo: 0.55 });
  if (mood === 'sad' || mood === 'x') b += pathEl('M-5 11Q0 6 5 11', { stroke: k, sw: 2.4, cap: 'round' });
  else if (mood === 'joy') b += pathEl('M-6 5Q0 15 6 5Z', { fill: P.maroon, stroke: k, sw: 2 });
  else if (mood !== 'sleep') b += pathEl('M-5 6Q0 11 5 6', { stroke: k, sw: 2.4, cap: 'round' });
  b += circle(-31, 12, 6.5, { fill: color, stroke: k, sw: 2.6 }) + circle(31, 12, 6.5, { fill: color, stroke: k, sw: 2.6 });
  b += PROPS[prop]?.() ?? '';
  const body = `<g transform="scale(${s})">${b}</g>`;
  return deco(idle ? bob(body, 4 * s, 1.25 + (ph % 4) * 0.17, ph) : body);
}
const PROPS = {
  headset: () => pathEl('M-27 -12C-28 -40 28 -42 28 -12', { stroke: P.ink, sw: 4, cap: 'round' }) + rect(-34, -16, 9, 16, { rx: 4, fill: P.ink }) + rect(25, -16, 9, 16, { rx: 4, fill: P.ink }) + pathEl('M-30 0C-30 12 -18 16 -8 14', { stroke: P.ink, sw: 2.6, cap: 'round' }) + circle(-7, 14, 3.2, { fill: P.ink }),
  paper: () => at(0, 18, rect(-16, -12, 32, 26, { rx: 3, fill: '#FFFFFF', stroke: P.ink, sw: 2.4 }) + line(-10, -4, 10, -4, { stroke: P.mute, sw: 2 }) + line(-10, 3, 6, 3, { stroke: P.mute, sw: 2 })),
  box: () => at(0, 20, rect(-20, -12, 40, 26, { rx: 3, fill: '#D99A4E', stroke: P.ink, sw: 2.4 }) + line(-20, -4, 20, -4, { stroke: P.ink, sw: 1.6 })),
  clip: () => at(0, 18, rect(-15, -14, 30, 32, { rx: 4, fill: P.sky, stroke: P.ink, sw: 2.4 }) + rect(-6, -17, 12, 6, { rx: 2, fill: P.ink }) + line(-9, -3, 9, -3, { stroke: P.ink, sw: 1.8 }) + line(-9, 4, 5, 4, { stroke: P.ink, sw: 1.8 })),
  wrench: () => at(30, 6, pathEl('M0 0L16 -16M12 -22a8 8 0 1 0 10 10l-5 -1 -2 -6z', { stroke: P.ink, sw: 3.2, cap: 'round', join: 'round', fill: '#C9C3D9' })),
  magnifier: () => at(30, 4, circle(10, -12, 10, { fill: P.sky, fo: 0.5, stroke: P.ink, sw: 3 }) + line(3, -5, -6, 4, { stroke: P.ink, sw: 4, cap: 'round' })),
  plane: () => at(30, 0, pathEl('M-6 6L18 -6L-2 -2Z M-2 -2L4 8', { fill: '#FFFFFF', stroke: P.ink, sw: 2, join: 'round' })),
  chef: () => at(0, -40, pathEl('M-18 6C-26 4 -26 -10 -16 -10C-16 -20 -2 -22 2 -14C8 -22 22 -18 20 -8C28 -8 28 6 18 6Z', { fill: '#FFFFFF', stroke: P.ink, sw: 2.4 }) + rect(-16, 4, 34, 8, { rx: 2, fill: '#FFFFFF', stroke: P.ink, sw: 2.4 })),
  baton: () => at(32, 2, line(0, 0, 16, -22, { stroke: P.cream, sw: 3, cap: 'round' }) + circle(16, -22, 3, { fill: P.yel })),
  megaphone: () => at(30, 0, pathEl('M-4 -5L14 -14L14 14L-4 5Z', { fill: P.rose, stroke: P.ink, sw: 2.4, join: 'round' })),
  shovel: () => at(30, 4, line(0, 8, 10, -18, { stroke: P.ink, sw: 3.4, cap: 'round' }) + pathEl('M6 -16L18 -28L22 -14Z', { fill: '#C9C3D9', stroke: P.ink, sw: 2.2, join: 'round' })),
  extinguisher: () => at(30, 8, rect(-6, -18, 13, 28, { rx: 5, fill: P.rose, stroke: P.ink, sw: 2.4 }) + line(1, -18, 12, -24, { stroke: P.ink, sw: 2.6, cap: 'round' })),
};

// 「你」：奶油色圆头像
export const you = (s = 1) => deco(`<g transform="scale(${s})">${circle(0, 0, 34, { fill: P.cream, stroke: P.ink, sw: 3 })}${gt(-gw('你', 32) / 2, 11, '你', 32, { fill: P.ink, icon: true })}</g>`);

// ---------- 画框 ----------
// meta：tag 左上角标签（如「系列名 01」）、part 小节名、title 标题、hl 标题里要标黄的词、foot 底栏 [{t, b}]
export function frame(f, { tag, part, title, hl, foot, h = 720 }) {
  f.add(rect(0, 0, 750, h, { fill: P.bg }));
  const glow = (cx, cy, c, rs, base = 0.035) => rs.map((r, i) => circle(cx, cy, r, { fill: c, fo: base + i * 0.018 })).join('');
  f.add(loopT(glow(60, h - 130, P.rose, [190, 120]), ['0 0', '14 -10', '0 0'], 8.5));
  const planet = circle(712, 44, 17, { fill: P.lilac, fo: 0.6 }) + circle(707, 39, 5, { fill: P.cream, fo: 0.3 })
    + pathEl('M684 53C684 41 742 34 744 44C746 52 688 63 684 53Z', { stroke: P.sky, sw: 2.5, so: 0.7 });
  f.add(loopT(planet, ['0 0', '0 -6', '0 0'], 5.5));
  [[702, 186, 7, 1.9], [58, 210, 5, 2.6], [718, h - 220, 6, 3.1], [26, h - 300, 5, 2.2], [470, 28, 5, 2.8], [610, h - 96, 4, 1.7]].forEach(([x, y, r, d]) => f.add(twinkle(star4(x, y, r, P.cream), d)));
  let cw = 0;
  if (tag) { cw = gw(tag, 17, 'bold') + 28; f.add(rect(40, 30, cw, 34, { rx: 17, fill: P.yel }) + gt(54, 53, tag, 17, { fill: P.ink, f: 'bold' })); cw += 14; }
  if (part) f.add(tx(40 + cw, 54, part, { size: 18, fill: P.sub }));
  let size = 46; while (gw(title, size) > 670 && size > 30) size -= 1;
  const i0 = hl ? title.indexOf(hl) : -1;
  if (i0 >= 0) {
    const pre = title.slice(0, i0), post = title.slice(i0 + hl.length);
    const x1 = 40 + gw(pre, size), x2 = x1 + gw(hl, size);
    f.add(gt(40, 124, pre, size) + gt(x1, 124, hl, size, { fill: P.yel }) + gt(x2, 124, post, size));
    const wav = []; for (let x = x1; x < x2 - 6; x += 12) wav.push(`${num(x)} 140`, `${num(x + 6)} 147`);
    f.add(growX(f, pathEl(`M${wav.join('L')}`, { stroke: P.yel, sw: 4, cap: 'round', join: 'round' }), x1, 143, 0.3, 0.6));
  } else f.add(gt(40, 124, title, size));
  if (foot) {
    f.add(rect(0, h - 62, 750, 62, { fill: P.bg2 }) + line(0, h - 62, 750, h - 62, { stroke: P.line, sw: 1.5 }));
    const runs = foot; const ws = runs.map((r) => tw(r.t, 22, r.b ? 700 : 400)); let x = (750 - ws.reduce((a, b) => a + b, 0)) / 2;
    runs.forEach((r, i) => { f.add(tx(x, h - 23, r.t, { size: 22, weight: r.b ? 700 : undefined, fill: r.b ? P.yel : P.sub })); x += ws[i]; });
  }
}
export function makeFig(meta, dur, h = 720) {
  const f = new Fig({ dur: Math.round(dur * 100) / 100, h, frame: false, title: meta.title });
  frame(f, { ...meta, h });
  return f;
}
export { Fig, rect, circle, line, pathEl, text };
