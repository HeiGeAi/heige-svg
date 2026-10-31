import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { promptCard, sayCard } from '../src/cards.mjs';
import { fromMarkdown } from '../src/markdown.mjs';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

test('提示词卡：一行一个 <p>，不用 white-space:pre，标签和标题都在', () => {
  const html = promptCard({ title: '派单规矩', lines: ['什么时候派：', '1 活重；', '', '交回来的当初稿。'] });
  assert.equal((html.match(/<p /g) || []).length, 3);
  assert.ok(!/white-space:\s*pre/.test(html));
  assert.ok(html.includes('可复制') && html.includes('派单规矩'));
});

test('提示词卡：小标题加圆点，编号行悬挂缩进，空行变段间距', () => {
  const html = promptCard({ lines: ['怎么派：', '1 活重', '', '收尾'] });
  assert.match(html, /font-weight:700[^>]*><span[^>]*border-radius:50%/);
  assert.match(html, /text-indent:-22px/);
  assert.match(html, /margin-top:10px;[^>]*>收尾/);
});

test('提示词卡：【填空】高亮，原文保留；HTML 转义', () => {
  const html = promptCard({ text: '派给【填你的工具】 <b>' });
  assert.ok(html.includes('【填你的工具】</span>'));
  assert.ok(html.includes('&lt;b&gt;'));
});

test('话术卡：标题和正文都在，换行合并', () => {
  const html = sayCard({ title: '这样说', text: '先复述\n再动手' });
  assert.ok(html.includes('这样说') && html.includes('先复述再动手'));
});

test('Markdown：标题、段落、小标题、列表、引用、代码块、配图占位', () => {
  const fig = { scene: 'barRace' };
  const { title, blocks } = fromMarkdown([
    '# 标题', '', '段落', '## 小节', '- 一', '- 二', '> 引用', '[[图1]]',
    '```prompt 规矩', '1 第一条', '```', '```say 这样说', '一句话', '```', '```', 'npm ci', '```',
  ].join('\n'), { figs: { 1: fig } });
  assert.equal(title, '标题');
  assert.deepEqual(blocks.slice(0, 5), [{ p: '段落' }, { h: '小节' }, { ul: ['一', '二'] }, { quote: '引用' }, fig]);
  assert.deepEqual(blocks[5], { prompt: { title: '规矩', lines: ['1 第一条'] } });
  assert.deepEqual(blocks[6], { say: { title: '这样说', text: '一句话' } });
  assert.equal(blocks[7].prompt.title, '代码');
});

test('Markdown：找不到配图直接报错', () => {
  assert.throws(() => fromMarkdown('[[图3]]'), /图3/);
});

test('编译 .md：出 article、preview、console，发布台带四个复制按钮和内嵌封面', () => {
  const out = fs.mkdtempSync(path.join(os.tmpdir(), 'heige-md-'));
  execFileSync(process.execPath, [path.join(root, 'bin/build.mjs'), path.join(root, 'examples/markdown.md'), out]);
  for (const f of ['article.html', 'preview.html', 'console.html', 'manifest.json']) assert.ok(fs.existsSync(path.join(out, f)), f);
  const con = fs.readFileSync(path.join(out, 'console.html'), 'utf8');
  for (const t of ['复制标题', '复制摘要', '复制封面图', '复制正文']) assert.ok(con.includes(t), t);
  assert.ok(con.includes('data:image/png;base64,'));
  const man = JSON.parse(fs.readFileSync(path.join(out, 'manifest.json'), 'utf8'));
  assert.equal(man.title, '一篇 Markdown，直接排成公众号文章');
  assert.ok(man.cover.endsWith('cover.png'));
  assert.ok(fs.readFileSync(path.join(out, 'article.html'), 'utf8').includes('整理会议纪要'));
});

test('粘进公众号的正文和卡片：行高一律写像素', () => {
  const out = fs.mkdtempSync(path.join(os.tmpdir(), 'heige-lh-'));
  execFileSync(process.execPath, [path.join(root, 'bin/build.mjs'), path.join(root, 'examples/markdown.md'), out]);
  const html = fs.readFileSync(path.join(out, 'article.html'), 'utf8');
  assert.deepEqual(html.match(/line-height:\s*[\d.]+(?=[;"])/g) ?? [], []);
});
