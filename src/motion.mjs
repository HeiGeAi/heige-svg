// 公众号 SVG 动图引擎：把「秒为单位的时间轴」编译成能进微信正文的 SVG + SMIL。
// 规则来自对 49 张公开文章动图的统计，见 docs/analysis.md：
//   只用 g/path/rect/circle/line/text/image/animate/animateTransform/desc
//   只动 opacity 和 transform；不用 id、style 标签、clipPath、mask、defs、use、渐变、滤镜
//   所有动画 begin="0s" repeatCount="indefinite"，同一个 dur，靠 keyTimes 排时间
//   不写 animate 时的静态属性就是「静态兜底帧」，默认取循环末尾的完成态
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import opentype from 'opentype.js';

const here = path.dirname(fileURLToPath(import.meta.url));

export const EASE = { hold: '0 0 1 1', out: '0.16 1 0.3 1', inout: '0.42 0 0.58 1' };

export const THEMES = {
  paper: { ink: '#1E1C19', sub: '#47423B', mute: '#8F887D', line: '#D8D0C1', card: '#FBF8F1', cardLine: '#E4DFD3', block: '#E8E2D6', accent: '#CF4436', dark: '#1E1C19', darkText: '#E8E2D6', darkMute: '#8A857A', hl: '#F5F0E6' },
  // 被讲的产品自带品牌色时，纸底不变，只把内容 UI 换成品牌色
  amber: { ink: '#1E1C19', sub: '#47423B', mute: '#8F887D', line: '#D8D0C1', card: '#FBF8F1', cardLine: '#E4DFD3', block: '#E8E2D6', accent: '#FFC434', dark: '#17161C', darkText: '#F2F1ED', darkMute: '#9A98A0', hl: '#24232D' },
  blue: { ink: '#1E232E', sub: '#4F5562', mute: '#868C97', line: '#D8D0C1', card: '#FFFFFF', cardLine: '#E3E5EF', block: '#EDF1FB', accent: '#4E6FFF', dark: '#142660', darkText: '#FFFFFF', darkMute: '#BEE1FF', hl: '#DCE6FB' },
  mono: { ink: '#0D0D0D', sub: '#5D5D5D', mute: '#9A9A9A', line: '#D8D0C1', card: '#FFFFFF', cardLine: '#E5E5E5', block: '#F3F3F3', accent: '#CF4436', dark: '#0D0D0D', darkText: '#FFFFFF', darkMute: '#9A9A9A', hl: '#F3F3F3' },
};

// ---------- 字宽 ----------
// <text> 不带 font-family，继承文章字体，所以居中和打字都靠估算字宽，不用 text-anchor。
const HELV = { ' ': 278, '!': 278, '"': 355, '#': 556, $: 556, '%': 889, '&': 667, "'": 191, '(': 333, ')': 333, '*': 389, '+': 584, ',': 278, '-': 333, '.': 278, '/': 278, ':': 278, ';': 278, '<': 584, '=': 584, '>': 584, '?': 556, '@': 1015, A: 667, B: 667, C: 722, D: 722, E: 667, F: 611, G: 778, H: 722, I: 278, J: 500, K: 667, L: 556, M: 833, N: 722, O: 778, P: 667, Q: 778, R: 722, S: 667, T: 611, U: 722, V: 667, W: 944, X: 667, Y: 667, Z: 611, '[': 278, '\\': 278, ']': 278, '^': 469, _: 556, '`': 333, a: 556, b: 556, c: 500, d: 556, e: 556, f: 278, g: 556, h: 556, i: 222, j: 222, k: 500, l: 222, m: 833, n: 556, o: 556, p: 556, q: 556, r: 333, s: 500, t: 278, u: 556, v: 500, w: 722, x: 500, y: 500, z: 500, '{': 334, '|': 260, '}': 334, '~': 584 };
for (const d of '0123456789') HELV[d] = 556;

export function textWidth(s, size, weight = 400) {
  let w = 0;
  for (const ch of String(s)) {
    const code = ch.codePointAt(0);
    if (HELV[ch] !== undefined) w += HELV[ch] / 1000;
    else if (code < 0x2e80) w += ch === '·' ? 0.28 : ch === '→' || ch === '←' ? 1 : 0.6;
    else w += 1;
  }
  return w * size * (weight >= 600 ? 1.04 : 1);
}

// ---------- 字形转路径 ----------
// 标题衬线和终端等宽不能指望读者设备有字体，直接转路径。
// 坐标取 2 倍字号后四舍五入成整数再 scale(0.5)，单张图体积能压到几 KB。
const FONT_FILES = { serif: 'NotoSerifSC-Bold.otf', mono: 'JetBrainsMono-Medium.ttf', monoBold: 'JetBrainsMono-Bold.ttf' };
const fontCache = {};
function font(name) {
  if (!fontCache[name]) {
    const file = path.join(here, '..', 'fonts', FONT_FILES[name]);
    if (!fs.existsSync(file)) throw new Error(`缺字体 ${FONT_FILES[name]}，先运行 npm run fonts`);
    fontCache[name] = opentype.parse(fs.readFileSync(file).buffer);
  }
  return fontCache[name];
}

export function glyphWidth(str, size, fontName = 'serif') {
  const f = font(fontName);
  return f.getAdvanceWidth(str, size, { kerning: false });
}

function pathD(cmds) {
  const r = Math.round;
  let out = '', cx = 0, cy = 0, sx = 0, sy = 0;
  for (const c of cmds) {
    if (c.type === 'M') { const x = r(c.x), y = r(c.y); out += `M${x} ${y}`; cx = sx = x; cy = sy = y; }
    else if (c.type === 'L') { const x = r(c.x), y = r(c.y); if (x === cx && y === cy) continue; out += `l${x - cx} ${y - cy}`; cx = x; cy = y; }
    else if (c.type === 'Q') { const a = r(c.x1), b = r(c.y1), x = r(c.x), y = r(c.y); out += `q${a - cx} ${b - cy} ${x - cx} ${y - cy}`; cx = x; cy = y; }
    else if (c.type === 'C') { const a = r(c.x1), b = r(c.y1), d = r(c.x2), e = r(c.y2), x = r(c.x), y = r(c.y); out += `c${a - cx} ${b - cy} ${d - cx} ${e - cy} ${x - cx} ${y - cy}`; cx = x; cy = y; }
    else if (c.type === 'Z') { out += 'z'; cx = sx; cy = sy; }
  }
  return out;
}

function glyphPath(str, size, fontName) {
  const f = font(fontName);
  // 不做 kerning，单字宽度才能和打字机动画的逐字位置对上
  return pathD(f.getPath(str, 0, 0, size * 2, { kerning: false }).commands);
}

// ---------- XML ----------
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const num = (n) => (Number.isInteger(n) ? String(n) : String(+Number(n).toFixed(2)));
const attrs = (o) => Object.entries(o).filter(([, v]) => v !== undefined && v !== null && v !== false).map(([k, v]) => ` ${k}="${typeof v === 'number' ? num(v) : esc(v)}"`).join('');

export const rect = (x, y, w, h, o = {}) => `<rect${attrs({ x, y, width: w, height: h, rx: o.rx, fill: o.fill ?? 'none', 'fill-opacity': o.fo, stroke: o.stroke, 'stroke-width': o.sw, 'stroke-opacity': o.so, 'stroke-dasharray': o.dash })}></rect>`;
export const circle = (cx, cy, r, o = {}) => `<circle${attrs({ cx, cy, r, fill: o.fill ?? 'none', 'fill-opacity': o.fo, stroke: o.stroke, 'stroke-width': o.sw, 'stroke-opacity': o.so })}></circle>`;
export const line = (x1, y1, x2, y2, o = {}) => `<line${attrs({ x1, y1, x2, y2, stroke: o.stroke ?? '#D8D0C1', 'stroke-width': o.sw ?? 1.2, 'stroke-dasharray': o.dash, 'stroke-linecap': o.cap, 'stroke-opacity': o.so })}></line>`;
export const pathEl = (d, o = {}) => `<path${attrs({ transform: o.transform, d, fill: o.fill ?? 'none', 'fill-opacity': o.fo, stroke: o.stroke, 'stroke-width': o.sw, 'stroke-linecap': o.cap, 'stroke-linejoin': o.join, 'stroke-dasharray': o.dash })}></path>`;
export const text = (x, y, s, o = {}) => `<text${attrs({ x, y, 'font-size': o.size ?? 18, 'font-weight': o.weight, fill: o.fill ?? '#1E1C19' })}>${esc(s)}</text>`;
export const image = (x, y, w, h, href, o = {}) => `<image${attrs({ x, y, width: w, height: h, preserveAspectRatio: o.par ?? 'none', href: `asset:${href}` })}></image>`;
export const g = (content, o = {}) => `<g${attrs(o)}>${content}</g>`;
export const glyph = (x, y, s, o = {}) => pathEl(glyphPath(s, o.size ?? 22, o.font ?? 'mono'), { transform: `translate(${num(x)} ${num(y)}) scale(0.5)`, fill: o.fill ?? '#1E1C19' });

const CURSOR = 'M0 0L0 25.5L6.4 19.3L10.6 28.6L15 26.7L10.9 17.6L19.4 17.6Z';

// ---------- Figure ----------
export class Fig {
  constructor({ dur = 8, h = 720, eyebrow = '', title = '', sub = '', foot = null, theme = 'paper', titleSize = 44, poster = null, frame = true, rule = true } = {}) {
    this.T = dur; this.h = h; this.title = title; this.th = THEMES[theme] ?? THEMES.paper;
    this.exit = dur - 0.6; // 内容开始退场的时刻：退场 0.3s，再留 0.3s 空白后循环
    this.posterT = poster ?? dur - 0.7;
    this.parts = [];
    this.warn = [];
    if (frame) this._frame({ eyebrow, title, sub, foot, titleSize, rule });
  }

  add(...s) { this.parts.push(...s); return this; }

  _frame({ eyebrow, title, sub, foot, titleSize, rule }) {
    const t = this.th, W = 750;
    this.add(image(0, 0, W, this.h, 'paper', { par: 'xMidYMin slice' }));
    if (eyebrow) this.add(text(this.centerX(eyebrow, 21), rule ? 52 : 48, eyebrow, { size: 21, fill: t.mute }));
    let size = titleSize;
    while (glyphWidth(title, size, 'serif') > 690 && size > 26) size -= 1;
    const tw = glyphWidth(title, size, 'serif');
    const baseY = sub || !rule ? 104 : 118;
    this.add(pathEl(glyphPath(title, size, 'serif'), { transform: `translate(${num((W - tw) / 2)} ${baseY}) scale(0.5)`, fill: t.ink }));
    if (sub) this.add(text(this.centerX(sub, 22), 144, sub, { size: 22, fill: t.sub }));
    if (rule) this.add(line(40, 170, 710, 170, { stroke: t.line }));
    if (foot) {
      const runs = Array.isArray(foot) ? foot : [{ t: foot, b: true }];
      const widths = runs.map((r) => (r.big ? glyphWidth(r.t, r.size ?? 34, 'serif') : textWidth(r.t, 23, r.b ? 600 : 400)));
      const total = widths.reduce((a, b) => a + b, 0);
      let x = (W - total) / 2;
      const y = this.h - 32;
      this.add(line(40, y - 42, 710, y - 42, { stroke: t.line }));
      runs.forEach((r, i) => {
        if (r.big) this.add(pathEl(glyphPath(r.t, r.size ?? 34, 'serif'), { transform: `translate(${num(x)} ${y + 1}) scale(0.5)`, fill: t.accent }));
        else this.add(text(x, y, r.t, { size: 23, weight: r.b ? 600 : undefined, fill: r.accent ? t.accent : r.b ? t.ink : t.sub }));
        x += widths[i];
      });
    }
  }

  centerX(s, size, weight) { return +((750 - textWidth(s, size, weight)) / 2).toFixed(1); }

  // ---- 轨道编译 ----
  // frames: [[秒, 值, 到达这一帧用的缓动]]；前后自动补平
  _track(frames) {
    const T = this.T;
    const fs2 = frames.map(([t, v, e]) => [Math.min(Math.max(t, 0), T), v, e ?? 'hold']).sort((a, b) => a[0] - b[0]);
    if (fs2[0][0] > 0) fs2.unshift([0, fs2[0][1], 'hold']);
    if (fs2[fs2.length - 1][0] < T) fs2.push([T, fs2[fs2.length - 1][1], 'hold']);
    // keyTimes 不能同值
    for (let i = 1; i < fs2.length; i++) if (fs2[i][0] <= fs2[i - 1][0]) fs2[i][0] = fs2[i - 1][0] + 0.01;
    const over = fs2.filter((f) => f[0] > T + 1e-9);
    if (over.length) { this.warn.push(`时间超出循环长度 ${T}s：${over.map((f) => f[0].toFixed(2)).join(',')}`); }
    return fs2.map(([t, v, e]) => [Math.min(t, T), v, e]);
  }

  _smil(frames, tag, extra) {
    const f = this._track(frames);
    const T = this.T;
    const kt = f.map(([t]) => +(t / T).toFixed(4));
    kt[0] = 0; kt[kt.length - 1] = 1;
    for (let i = 1; i < kt.length; i++) if (kt[i] <= kt[i - 1]) kt[i] = +(kt[i - 1] + 0.0001).toFixed(4);
    if (kt[kt.length - 1] > 1 || kt[kt.length - 2] >= 1) this.warn.push('keyTimes 溢出，请减少关键帧或拉长 dur');
    const ks = f.slice(1).map(([, , e]) => EASE[e]);
    return `<${tag}${extra} values="${f.map((x) => x[1]).join(';')}" keyTimes="${kt.join(';')}" calcMode="spline" keySplines="${ks.join(';')}" dur="${num(T)}s" begin="0s" repeatCount="indefinite"></${tag}>`;
  }

  _valueAt(frames, t) {
    const f = this._track(frames);
    let v = f[0][1];
    for (const [ft, fv] of f) if (ft <= t + 1e-9) v = fv;
    return v;
  }

  // 淡入淡出。静态 opacity 取 poster 时刻的状态，放不了动画时读者看到的就是完成态
  fade(content, { at = 0, out = this.exit, inDur = 0.15, outDur = 0.3, to = 1, ease = 'out', from = 0 } = {}) {
    const frames = [[0, from], [at, from], [at + inDur, to, ease]];
    if (out !== null && out !== undefined) frames.push([out, to], [out + outDur, from, 'inout']);
    return this._opacity(content, frames);
  }

  _opacity(content, frames) {
    const a = this._smil(frames, 'animate', ' attributeName="opacity"');
    const p = this._valueAt(frames, this.posterT);
    return `<g${p === 1 ? '' : ` opacity="${p}"`}>${a}${content}</g>`;
  }

  // 瞬切：状态翻转（按钮变色、选中态），不做淡入
  flip(content, at, out = null) {
    const frames = [[0, 0], [at - 0.01, 0], [at, 1]];
    if (out !== null) frames.push([out, 1], [out + 0.01, 0]);
    return this._opacity(content, frames);
  }

  // 平移：frames = [[秒, x, y, 缓动]]
  move(content, frames) {
    const f = frames.map(([t, x, y, e]) => [t, `${num(x)} ${num(y)}`, e]);
    const a = this._smil(f, 'animateTransform', ' attributeName="transform" type="translate"');
    return `<g transform="translate(${this._valueAt(f, this.posterT)})">${a}${content}</g>`;
  }

  // 绕点缩放：外层 translate 到支点，里层做 scale（SMIL 的 scale 只能绕原点）
  scale(content, cx, cy, frames) {
    const f = frames.map(([t, s, e]) => [t, s, e]);
    const a = this._smil(f, 'animateTransform', ' attributeName="transform" type="scale"');
    const p = this._valueAt(f, this.posterT);
    return `<g transform="translate(${num(cx)} ${num(cy)})"><g transform="scale(${p})">${a}<g transform="translate(${num(-cx)} ${num(-cy)})">${content}</g></g></g>`;
  }

  // 弹入：从 0.6 放大到 1，配淡入
  pop(content, cx, cy, { at = 0, out = this.exit, from = 0.6, dur = 0.45 } = {}) {
    const scaled = this.scale(content, cx, cy, [[0, from], [at, from], [at + dur, 1, 'out']]);
    return this.fade(scaled, { at, out, inDur: 0.12 });
  }

  // 打勾/强调的回弹：1 → 1.4 → 0.94 → 1
  bounce(content, cx, cy, at) {
    return this.scale(content, cx, cy, [[0, 1], [at, 1], [at + 0.14, 1.4, 'out'], [at + 0.34, 0.94, 'out'], [at + 0.55, 1, 'out']]);
  }

  // 从左往右长出来的条：scale(0.01 1) → scale(1 1)
  grow(x, y, w, h, { at = 0, dur = 1.2, out = this.exit, fill, rx = 4, ease = 'inout' } = {}) {
    const bar = rect(0, -h / 2, w, h, { rx, fill: fill ?? this.th.accent });
    const a = this._smil([[0, '0.01 1'], [at, '0.01 1'], [at + dur, '1 1', ease], [out, '1 1'], [out + 0.3, '0.01 1', 'inout']], 'animateTransform', ' attributeName="transform" type="scale"');
    return this.flipOnBar(`<g transform="translate(${num(x)} ${num(y + h / 2)})"><g transform="scale(1 1)">${a}${bar}</g></g>`, at, out);
  }

  flipOnBar(content, at, out) { return this.flip(content, at, out + 0.3); }

  // 逐字打出来。mono=true 用路径字形（终端里要等宽），否则用 <text>
  type(x, y, str, { at = 0, cps = 22, size = 21, fill, weight, mono = false, out = this.exit, bold = false } = {}) {
    let cx = x, t = at, html = '';
    const color = fill ?? this.th.ink;
    for (const ch of Array.from(str)) {
      if (ch === ' ') { cx += mono ? glyphWidth(' ', size, 'mono') : textWidth(' ', size, weight); t += 1 / cps; continue; }
      // 等宽字体没有中文，中文退回 <text>，继承文章字体
      const asGlyph = mono && ch.codePointAt(0) < 0x2e80;
      const piece = asGlyph ? glyph(cx, y, ch, { size, fill: color, font: bold ? 'monoBold' : 'mono' }) : text(+cx.toFixed(1), y, ch, { size, fill: color, weight });
      html += this.fade(piece, { at: t, out, inDur: 0.02 });
      cx += asGlyph ? glyphWidth(ch, size, bold ? 'monoBold' : 'mono') : textWidth(ch, size, weight);
      t += 1 / cps;
    }
    return { svg: html, end: t, x: cx };
  }

  // 光标路径：stops = [{t, x, y, click}]，到达 t 时刻点击。到达前 0.6s 开始移动，末尾回到起点
  cursor(stops, { rest = [640, 660], color = '#0D0D0D' } = {}) {
    const f = [[0, rest[0], rest[1]]];
    const clicks = [];
    for (const s of stops) {
      const travel = s.travel ?? 0.6;
      f.push([Math.max(s.t - travel, f[f.length - 1][0] + 0.01), f[f.length - 1][1], f[f.length - 1][2]]);
      f.push([s.t, s.x, s.y, 'inout']);
      if (s.click !== false) clicks.push(s);
    }
    f.push([this.exit, f[f.length - 1][1], f[f.length - 1][2]]);
    f.push([this.exit + 0.5, rest[0], rest[1], 'inout']);
    let html = clicks.map((c) => this.ripple(c.x + 2, c.y + 2, c.t + 0.05)).join('');
    html += this.move(pathEl(CURSOR, { fill: color, stroke: '#FFFFFF', sw: 2, join: 'round' }), f);
    return html;
  }

  // 点击波纹：一闪而过，不要进静态帧
  ripple(x, y, at, { r = 26, color = '#0D0D0D' } = {}) {
    const c = circle(0, 0, r, { fill: color, fo: 0.18, stroke: color, sw: 2, so: 0.6 });
    const s = this.scale(c, 0, 0, [[0, 0.2], [at, 0.2], [at + 0.45, 1, 'out']]);
    const frames = [[0, 0], [at - 0.01, 0], [at, 0.55], [at + 0.45, 0]];
    const a = this._smil(frames, 'animate', ' attributeName="opacity"');
    return `<g opacity="0">${a}<g transform="translate(${num(x)} ${num(y)})">${s}</g></g>`;
  }

  // 强调框：结论出现时框一下
  ring(x, y, w, h, { at = 0, out = this.exit, color, rx = 10, sw = 2.8, pad = 0 } = {}) {
    const c = color ?? this.th.accent;
    const body = rect(x - pad, y - pad, w + pad * 2, h + pad * 2, { rx, stroke: c, sw });
    return this.pop(body, x + w / 2, y + h / 2, { at, out, from: 1.12, dur: 0.35 });
  }

  // 转圈：8 根辐条逐帧亮，独立于主时间轴循环（dur 0.8s，discrete）
  spinner(cx, cy, { at = 0, out = this.exit, r = 9, color } = {}) {
    const c = color ?? this.th.mute;
    let spokes = '';
    const n = 8;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const x1 = cx + Math.cos(a) * r * 0.55, y1 = cy + Math.sin(a) * r * 0.55, x2 = cx + Math.cos(a) * r, y2 = cy + Math.sin(a) * r;
      const vals = Array.from({ length: n + 1 }, (_, k) => ((k % n) === i ? 1 : 0.25)).join(';');
      const kts = Array.from({ length: n + 1 }, (_, k) => +(k / n).toFixed(3)).join(';');
      spokes += `<g><animate attributeName="opacity" values="${vals}" keyTimes="${kts}" calcMode="discrete" dur="0.8s" begin="0s" repeatCount="indefinite"></animate>${line(x1, y1, x2, y2, { stroke: c, sw: 2.2, cap: 'round' })}</g>`;
    }
    return this.fade(spokes, { at, out, inDur: 0.05, outDur: 0.05 });
  }

  // 扫描线：一条线走过目标区，同时留下完成态
  scan(x, w, y0, y1, { at = 0, dur = 1.6, color, band = 14 } = {}) {
    const c = color ?? this.th.ink;
    const body = rect(x, -band, w, band, { fill: c, fo: 0.08 }) + rect(x, -1.2, w, 2.4, { fill: c });
    const moved = this.move(body, [[0, 0, y0], [at, 0, y0], [at + dur, 0, y1, 'out']]);
    const frames = [[0, 0], [at, 0], [at + 0.08, 1, 'out'], [at + dur, 1], [at + dur + 0.2, 0, 'out']];
    const a = this._smil(frames, 'animate', ' attributeName="opacity"');
    return `<g opacity="0">${a}${moved}</g>`;
  }

  // 数字滚动：离散帧切换，最后停在终值
  counter(x, y, values, { at = 0, dur = 1, size = 28, weight = 600, fill, out = this.exit, big = false } = {}) {
    const step = dur / (values.length - 1);
    return values.map((v, i) => {
      const start = at + i * step;
      const end = i === values.length - 1 ? out : start + step;
      const piece = big ? pathEl(glyphPath(String(v), size, 'serif'), { transform: `translate(${num(x)} ${num(y)}) scale(0.5)`, fill: fill ?? this.th.accent }) : text(x, y, v, { size, weight, fill: fill ?? this.th.ink });
      return this.flip(piece, start, end);
    }).join('');
  }

  // 序列帧：一组图片按离散帧切换，自己循环
  sprite(names, x, y, w, h, { fps = 8 } = {}) {
    const n = names.length, dur = n / fps;
    return names.map((nm, i) => {
      const vals = Array.from({ length: n + 1 }, (_, k) => (k === i || (i === 0 && k === n) ? 1 : 0)).join(';');
      const kts = Array.from({ length: n + 1 }, (_, k) => (k / n).toFixed(4)).join(';');
      return `<g${i === 0 ? '' : ' opacity="0"'}><animate attributeName="opacity" values="${vals}" keyTimes="${kts}" calcMode="discrete" dur="${num(dur)}s" begin="0s" repeatCount="indefinite"></animate>${image(x, y, w, h, nm)}</g>`;
    }).join('');
  }

  // ---- 常用外壳 ----
  terminal(x, y, w, h, title = 'terminal') {
    const t = this.th;
    return rect(x, y, w, h, { rx: 14, fill: t.dark, stroke: t.line, sw: 1 })
      + pathEl(`M${x} ${y + 34}V${y + 14}a14 14 0 0 1 14 -14H${x + w - 14}a14 14 0 0 1 14 14V${y + 34}Z`, { fill: '#FFFFFF', fo: 0.07 })
      + circle(x + 22, y + 17, 5.5, { fill: '#E0675A' }) + circle(x + 40, y + 17, 5.5, { fill: '#E3B85C' }) + circle(x + 58, y + 17, 5.5, { fill: '#8DB37A' })
      + text(x + w / 2 - textWidth(title, 17) / 2, y + 23, title, { size: 17, fill: t.darkMute });
  }

  browser(x, y, w, h, url = '') {
    const t = this.th;
    return rect(x, y + 8, w, h, { rx: 16, fill: '#000000', fo: 0.08 }) + rect(x, y, w, h, { rx: 14, fill: t.card, stroke: t.cardLine, sw: 1.2 })
      + circle(x + 24, y + 22, 5.5, { fill: '#E0675A' }) + circle(x + 42, y + 22, 5.5, { fill: '#E3B85C' }) + circle(x + 60, y + 22, 5.5, { fill: '#8DB37A' })
      + text(x + w / 2 - textWidth(url, 16) / 2, y + 28, url, { size: 16, fill: t.mute }) + line(x, y + 44, x + w, y + 44, { stroke: t.cardLine });
  }

  // 手机壳：屏幕下半截直接伸出画布，靠 viewBox 裁切，不用 clipPath
  phone(x, y, w, screenFill = '#FFFFFF') {
    const t = this.th;
    const h = this.h - y + 60;
    return rect(x, y, w, h, { rx: 44, fill: screenFill, stroke: t.dark, sw: 9 })
      + circle(x + w / 2, y + 26, 5, { fill: t.dark });
  }

  card(x, y, w, h, o = {}) {
    const t = this.th;
    return rect(x, y, w, h, { rx: o.rx ?? 12, fill: o.fill ?? t.card, stroke: o.stroke ?? t.cardLine, sw: 1.2 });
  }

  pill(x, y, label, { fill, color, size = 18, padX = 14, h = 34, weight = 600 } = {}) {
    const w = textWidth(label, size, weight) + padX * 2;
    return { svg: rect(x, y, w, h, { rx: h / 2, fill: fill ?? this.th.accent }) + text(x + padX, y + h / 2 + size * 0.36, label, { size, weight, fill: color ?? '#FFFFFF' }), w };
  }

  check(x, y, { size = 1, color } = {}) {
    const c = color ?? this.th.accent;
    const s = 12 * size;
    return pathEl(`M${num(x - s)} ${num(y)}L${num(x - s * 0.25)} ${num(y + s * 0.75)}L${num(x + s)} ${num(y - s)}`, { stroke: c, sw: 3, cap: 'round', join: 'round' });
  }

  toString() {
    const body = this.parts.join('');
    const svg = `<svg viewBox="0 0 750 ${this.h}" width="750" height="${this.h}" xmlns="http://www.w3.org/2000/svg" style="display:block;max-width:100%;height:auto"><desc>${esc(this.title)}</desc>${body}</svg>`;
    return svg;
  }
}

// 校验：把会被微信吃掉或违反手法的东西在本地拦下来
const ALLOWED = new Set(['svg', 'desc', 'g', 'path', 'rect', 'circle', 'line', 'text', 'image', 'animate', 'animateTransform', 'tspan']);
export function validate(svg, name = '') {
  const errs = [], warns = [];
  for (const m of svg.matchAll(/<([a-zA-Z][\w:-]*)/g)) if (!ALLOWED.has(m[1])) errs.push(`${name}: 不允许的标签 <${m[1]}>（实物图里从未出现）`);
  if (/\sid="/.test(svg)) errs.push(`${name}: 不能有 id 属性`);
  if (/url\(#/.test(svg)) errs.push(`${name}: 不能引用 url(#…)`);
  if (/font-family/.test(svg)) errs.push(`${name}: <text> 不要写 font-family，要特殊字体请转路径`);
  if (/text-anchor/.test(svg)) errs.push(`${name}: 不要用 text-anchor，用估算宽度算 x`);
  for (const m of svg.matchAll(/attributeName="([^"]*)"/g)) if (!['opacity', 'transform'].includes(m[1])) errs.push(`${name}: 只允许动 opacity 和 transform，发现 ${m[1]}`);
  for (const m of svg.matchAll(/keyTimes="([^"]*)"/g)) {
    const k = m[1].split(';').map(Number);
    if (k[0] !== 0 || k[k.length - 1] !== 1) errs.push(`${name}: keyTimes 必须从 0 到 1：${m[1]}`);
    for (let i = 1; i < k.length; i++) if (k[i] < k[i - 1]) errs.push(`${name}: keyTimes 不递增：${m[1]}`);
  }
  for (const m of svg.matchAll(/ values="([^"]*)" keyTimes="([^"]*)"(?: calcMode="(\w+)")?(?: keySplines="([^"]*)")?/g)) {
    const v = m[1].split(';').length, k = m[2].split(';').length;
    if (v !== k) errs.push(`${name}: values 和 keyTimes 数量不等`);
    if (m[3] === 'spline' && m[4] && m[4].split(';').length !== k - 1) errs.push(`${name}: keySplines 数量不对`);
  }
  const kb = Buffer.byteLength(svg) / 1024;
  if (kb > 75) warns.push(`${name}: ${kb.toFixed(0)}KB，超过实物图上限（约 72KB）`);
  return { errs, warns, kb };
}
