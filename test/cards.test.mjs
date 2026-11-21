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

test('编译 Windows 换行的 Markdown 稿件保留标题、作者和摘要', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'heige-crlf-'));
  const source = path.join(dir, 'article.md');
  const out = path.join(dir, 'out');
  fs.writeFileSync(source, ['---', 'title: 标题', 'author: 作者', 'digest: 摘要', '---', '这是正文。', ''].join('\r\n'));
  execFileSync(process.execPath, [path.join(root, 'bin/build.mjs'), source, out]);

  const { title, author, digest, chars } = JSON.parse(fs.readFileSync(path.join(out, 'manifest.json'), 'utf8'));
  assert.deepEqual({ title, author, digest, chars }, { title: '标题', author: '作者', digest: '摘要', chars: 5 });
});

test('粘进公众号的正文和卡片：行高一律写像素', () => {
  const out = fs.mkdtempSync(path.join(os.tmpdir(), 'heige-lh-'));
  execFileSync(process.execPath, [path.join(root, 'bin/build.mjs'), path.join(root, 'examples/markdown.md'), out]);
  const html = fs.readFileSync(path.join(out, 'article.html'), 'utf8');
  assert.deepEqual(html.match(/line-height:\s*[\d.]+(?=[;"])/g) ?? [], []);
});

test('fromMarkdown 去除 UTF-8 BOM 并兼容 CR/CRLF 换行', () => {
  const { title, blocks } = fromMarkdown('\uFEFF# 带 BOM 标题\r\r第一段\r\n第二段');
  assert.equal(title, '带 BOM 标题');
  assert.deepEqual(blocks, [{ p: '第一段' }, { p: '第二段' }]);
});

test('build.mjs 遇到不存在的 scene 报校验错而不是抛出 TypeError', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'heige-bad-scene-'));
  const script = path.join(dir, 'bad.mjs');
  const out = path.join(dir, 'out');
  fs.writeFileSync(script, 'export default { title: "测试", blocks: [{ scene: "nonexistentScene", meta: {}, data: {} }] };\n');
  let err;
  try {
    execFileSync(process.execPath, [path.join(root, 'bin/build.mjs'), script, out], { encoding: 'utf8', stdio: 'pipe' });
  } catch (e) {
    err = e;
  }
  assert.ok(err, 'expected non-zero exit');
  assert.equal(err.status, 1);
  assert.match(err.stdout, /没有这个场景：nonexistentScene/);
  assert.doesNotMatch(err.stderr, /TypeError/);
});

test('qa.mjs 和 xcard.mjs 支持含 # 的目录与空昵称卡片', (t) => {
  const hasChrome = Boolean(process.env.CHROME_PATH) || [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
  ].some((p) => fs.existsSync(p));
  if (!hasChrome) { t.skip('no local Chrome found'); return; }

  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'heige-qa-'));
  const out = path.join(dir, 'draft#1');
  execFileSync(process.execPath, [path.join(root, 'bin/build.mjs'), path.join(root, 'examples/markdown-figs.mjs'), out], { stdio: 'pipe' });
  execFileSync(process.execPath, [path.join(root, 'bin/qa.mjs'), out], { stdio: 'pipe' });
  assert.ok(fs.existsSync(path.join(out, 'qa', 'sheet.png')));

  const cfg = path.join(dir, 'empty-name.json');
  const xout = path.join(dir, 'xcards');
  fs.writeFileSync(cfg, JSON.stringify({ cards: [{ name: '', handle: '@anon', text: 'hello' }] }));
  execFileSync(process.execPath, [path.join(root, 'bin/xcard.mjs'), cfg, xout], { stdio: 'pipe' });
  assert.ok(fs.existsSync(path.join(xout, 'xcard-01.jpg')));
});
