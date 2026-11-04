import test from 'node:test';
import assert from 'node:assert/strict';
import { validate } from '../src/motion.mjs';
import { KIT } from '../src/kit/index.mjs';
import night from '../examples/night.mjs';
import { fromMarkdown } from '../src/markdown.mjs';

const kitBlocks = night.blocks.filter((b) => b.kit);

test('示例覆盖全部 18 个夜空场景', () => {
  const used = new Set(kitBlocks.map((b) => b.kit));
  for (const name of Object.keys(KIT)) assert.ok(used.has(name), `示例里没用到 ${name}`);
});

for (const [i, b] of kitBlocks.entries()) {
  test(`夜空场景 ${i + 1} ${b.kit} 通过微信校验`, () => {
    const fig = KIT[b.kit](b.meta, b.data);
    const { errs, kb } = validate(fig.toString(), b.kit);
    assert.deepEqual(errs, []);
    assert.ok(kb < 75, `${kb.toFixed(0)}KB 超过 75KB`);
    assert.deepEqual(fig.warn, []);
  });
}

test('夜空配色里没有绿色', () => {
  for (const b of kitBlocks) {
    for (const m of KIT[b.kit](b.meta, b.data).toString().matchAll(/#([0-9a-fA-F]{6})\b/g)) {
      const [r, g, bl] = [0, 2, 4].map((k) => parseInt(m[1].slice(k, k + 2), 16));
      assert.ok(!(g > r + 30 && g > bl + 30), `${b.kit} 用了偏绿的 #${m[1]}`);
    }
  }
});

test('Markdown：飞书红字转成标红加粗，图片行变成 img 块', () => {
  const { blocks } = fromMarkdown('<b><font color="red">金句</font></b>\n\n![截图](a.jpg)');
  assert.deepEqual(blocks[0], { p: '**金句**' });
  assert.deepEqual(blocks[1], { img: { alt: '截图', src: 'a.jpg' } });
});
