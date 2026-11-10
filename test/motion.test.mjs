import test from 'node:test';
import assert from 'node:assert/strict';
import { Fig, text, circle, glyph, validate, freezeInfo } from '../src/motion.mjs';
import { SCENES } from '../src/scenes.mjs';

const blank = (o = {}) => new Fig({ dur: 8, frame: false, ...o });
const keyTimes = (s) => [...s.matchAll(/keyTimes="([^"]*)"/g)].map((m) => m[1].split(';').map(Number));

test('所有动画共用同一个循环，keyTimes 从 0 到 1 且递增', () => {
  const f = blank();
  const svg = f.fade(text(0, 0, 'x'), { at: 1 }) + f.pop(text(0, 0, 'y'), 0, 0, { at: 2 });
  assert.ok(svg.includes('dur="8s"'));
  for (const k of keyTimes(svg)) {
    assert.equal(k[0], 0);
    assert.equal(k.at(-1), 1);
    k.slice(1).forEach((v, i) => assert.ok(v >= k[i]));
  }
});

test('静态属性是完成态：循环中段已出现的元素不带 opacity=0', () => {
  const f = blank();
  assert.match(f.fade(text(0, 0, 'x'), { at: 1 }), /^<g><animate/);
  assert.match(f.fade(text(0, 0, 'x'), { at: 7.9, out: null }), /^<g opacity="0">/);
});

test('波纹不进静态帧', () => {
  // 波纹是装饰，外面包一层装饰标记，里面第一层仍是 opacity=0
  assert.match(blank().ripple(10, 10, 2), /^<g data-hgd="1"><g opacity="0">/);
});

// ---------- 文字和信息不动（2026-11-10） ----------
const anims = (s) => (s.match(/<animate/g) || []).length;

test('文字上的动画输出时被去掉，停在完成态', () => {
  const f = blank();
  f.add(f.fade(text(0, 0, '第一条'), { at: 1 }));
  const s = f.toString();
  assert.equal(anims(s), 0);
  assert.ok(s.includes('第一条'));
});

test('转成路径的字形也算文字', () => {
  const f = blank();
  f.add(f.fade(glyph(0, 0, 'AB'), { at: 1 }));
  assert.equal(anims(f.toString()), 0);
});

test('主时间轴上没标装饰的图形也不动（进度条、指针这类信息）', () => {
  const f = blank();
  f.add(f.grow(0, 0, 100, 10, { at: 1 }));
  f.add(f.move(circle(0, 0, 5), [[0, 0, 0], [2, 50, 0]]));
  assert.equal(anims(f.toString()), 0);
});

test('标了装饰的角色照主时间轴动', () => {
  const f = blank();
  f.add(f.deco(f.move(circle(0, 0, 5), [[0, 0, 0], [2, 50, 0]])));
  assert.equal(anims(f.toString()), 1);
});

test('独立小循环（星星闪）照常动，含文字的除外', () => {
  const loop = (c) => `<g><animate attributeName="opacity" values="0;1;0" keyTimes="0;0.5;1" dur="2s" begin="0s" repeatCount="indefinite"></animate>${c}</g>`;
  assert.equal(anims(freezeInfo(loop(circle(0, 0, 3))).svg), 1);
  assert.equal(anims(freezeInfo(loop(text(0, 0, '字'))).svg), 0);
});

test('装饰组里不能藏文字：有文字照样冻住', () => {
  const f = blank();
  f.add(f.deco(f.move(text(0, 0, '跑腿'), [[0, 0, 0], [2, 50, 0]])));
  assert.equal(anims(f.toString()), 0);
});

test('输出里不留内部标记', () => {
  const f = blank();
  f.add(f.deco(f.fade(glyph(0, 0, 'A'), { at: 1 })));
  assert.doesNotMatch(f.toString(), /data-hg/);
});

test('motion: all 时全部照时间轴动（只给视频素材用）', () => {
  const f = blank({ motion: 'all' });
  f.add(f.fade(text(0, 0, '第一条'), { at: 1 }));
  assert.equal(anims(f.toString()), 1);
});

test('校验：文字上挂动画报错', () => {
  const bad = `<svg><g><animate attributeName="opacity" values="0;1" keyTimes="0;1" dur="2s" begin="0s" repeatCount="indefinite"></animate>${text(0, 0, '字')}</g></svg>`;
  assert.ok(validate(bad, 'x').errs.some((e) => e.includes('文字')));
  assert.equal(validate(bad, 'x', { allowTextMotion: true }).errs.filter((e) => e.includes('文字')).length, 0);
});

test('等宽打字遇到中文退回 <text>，拉丁字母转路径', () => {
  const { svg } = blank().type(0, 0, 'a中', { mono: true });
  assert.ok(svg.includes('<path'));
  assert.match(svg, /<text[^>]*>中<\/text>/);
});

test('时间超出循环会告警', () => {
  const f = blank();
  f.fade(text(0, 0, 'x'), { at: 20, out: null });
  assert.ok(f.warn.length > 0);
});

test('校验器拦下微信不认的写法', () => {
  const bad = '<svg id="a"><clipPath></clipPath><animate attributeName="fill" values="a;b" keyTimes="0;1"></animate></svg>';
  const { errs } = validate(bad, 't');
  assert.ok(errs.some((e) => e.includes('clipPath')));
  assert.ok(errs.some((e) => e.includes('id')));
  assert.ok(errs.some((e) => e.includes('fill')));
});

const SAMPLES = {
  terminalRun: { prompt: 'run', steps: [{ label: '检查', note: 'ok' }], done: '好了' },
  uiClick: { window: 'example.com', screens: [{ title: '一', rows: ['甲', '乙'], target: 1 }, { title: '二', rows: ['丙'], mark: 0 }] },
  barRace: { rows: [{ name: 'A', value: 10, hero: true }, { name: 'B', value: 40 }], tick: 10 },
  gridWall: { left: { label: '全部' }, right: { label: '局部', picked: [1, 2] } },
  pipeline: { stations: ['甲', '乙'], outs: ['过', '退'], items: [{ to: 0, tag: 'ok' }, { to: 1 }] },
  phoneChat: { app: 'App', user: '你好', steps: ['读'], result: ['好了'], mark: 0 },
  timelineList: { items: [{ when: '10:00', name: '甲', change: '+1' }] },
  rankCards: { cards: [{ title: '榜', rows: [{ name: 'A', score: 1, hero: true }] }] },
};

for (const [name, fn] of Object.entries(SCENES)) {
  test(`模板 ${name} 产物通过校验`, () => {
    const f = fn({ eyebrow: '眉题', title: '一句结论', foot: '脚注' }, SAMPLES[name]);
    const { errs } = validate(f.toString(), name);
    assert.deepEqual(errs, []);
    assert.deepEqual(f.warn, []);
    assert.ok(f.T >= 2 && f.T <= 20, `循环 ${f.T}s`);
  });
}
