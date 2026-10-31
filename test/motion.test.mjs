import test from 'node:test';
import assert from 'node:assert/strict';
import { Fig, text, validate } from '../src/motion.mjs';
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
  assert.match(blank().ripple(10, 10, 2), /^<g opacity="0">/);
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
