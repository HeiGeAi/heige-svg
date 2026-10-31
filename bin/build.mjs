#!/usr/bin/env node
// 用法：node bin/build.mjs <文章脚本.mjs | 文章.md> [输出目录]
// 产出：figNN.svg、article.html（待上传）、preview.html（本地预览）、console.html（发布台，一键复制）、manifest.json
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { validate } from '../src/motion.mjs';
import { SCENES } from '../src/scenes.mjs';
import { promptCard, sayCard } from '../src/cards.mjs';
import { fromMarkdown } from '../src/markdown.mjs';
import { makeConsole } from '../src/console.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const [src, outArg] = process.argv.slice(2);
if (!src) { console.error('用法：node bin/build.mjs <文章脚本.mjs | 文章.md> [输出目录]'); process.exit(1); }
const srcDir = path.dirname(path.resolve(src));
const art = src.endsWith('.md') ? readMarkdown(src) : (await import(pathToFileURL(path.resolve(src)).href)).default;

// .md 直接排版：开头可选 --- 包住的 title、author、digest、cover，正文写法见 src/markdown.mjs（.md 里没法定义配图）
function readMarkdown(file) {
  let md = fs.readFileSync(file, 'utf8');
  const meta = {};
  const fm = md.match(/^---\n([\s\S]*?)\n---\n/);
  if (fm) {
    for (const l of fm[1].split('\n')) { const m = l.match(/^(\w+):\s*(.*)$/); if (m) meta[m[1]] = m[2].trim(); }
    md = md.slice(fm[0].length);
  }
  const { title, blocks } = fromMarkdown(md);
  return { ...meta, title: meta.title ?? title, blocks };
}
const out = path.resolve(outArg ?? path.join(path.dirname(path.resolve(src)), 'out'));
fs.mkdirSync(out, { recursive: true });

const SANS = "'Noto Sans SC','PingFang SC','Microsoft YaHei',-apple-system,sans-serif";
const SERIF = "'Noto Serif SC','Songti SC',STSong,Georgia,serif";
const MONO = "'JetBrains Mono','SF Mono',Menlo,Consolas,monospace";
const accent = art.accent ?? '#cf4436';
const WRAP = 'overflow-wrap:break-word;';
const P = `font-family:${SANS};font-size:15px;color:#4a4a45;line-height:28px;margin:0 0 14px;${WRAP}`;
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
// 正文内联：**加粗标红**、`代码`
const inline = (s) => esc(s)
  .replace(/\*\*(.+?)\*\*/g, `<strong style="font-weight:700;color:${accent};">$1</strong>`)
  .replace(/`(.+?)`/g, `<code style="font-family:${MONO};font-size:13.5px;color:#007aaa;background:rgba(26,26,24,0.06);padding:1px 5px;border-radius:3px;">$1</code>`);

const errs = [], warns = [], figs = [];
const htmlBlocks = [];
let n = 0;
for (const b of art.blocks) {
  if (b.p) htmlBlocks.push(`<p style="${P}">${inline(b.p)}</p>`);
  else if (b.h) htmlBlocks.push(`<hr style="border:0;border-top:1px solid rgba(120,120,112,0.18);height:0;margin:0 0 26px;" /><h2 style="font-family:${SERIF};font-size:22px;font-weight:700;line-height:31px;color:${accent};margin:0 0 8px;${WRAP}">${esc(b.h)}</h2>`);
  else if (b.ul) htmlBlocks.push(`<ul style="padding:0 0 0 22px;${P}">${b.ul.map((x) => `<li style="padding:0;margin:0 0 4px;">${inline(x)}</li>`).join('')}</ul>`);
  else if (b.html) htmlBlocks.push(b.html);
  else if (b.prompt || b.code) htmlBlocks.push(promptCard({ title: '代码', ...(b.code ? { text: b.code } : b.prompt), theme: art.cardTheme }));
  else if (b.say) htmlBlocks.push(sayCard({ ...b.say, theme: art.cardTheme }));
  else if (b.quote) htmlBlocks.push(`<section style="background:rgba(255,255,255,0.12);border-left:3px solid ${accent};padding:8px 20px;margin:0 0 24px;border-radius:0 6px 6px 0;"><p style="${P}margin:0;">${inline(b.quote)}</p></section>`);
  else if (b.fig || b.scene) {
    const fig = b.fig ? b.fig() : SCENES[b.scene](b.meta, b.data);
    const svg = fig.toString();
    const name = `fig${String(++n).padStart(2, '0')}`;
    const v = validate(svg, name);
    errs.push(...v.errs); warns.push(...v.warns, ...(fig.warn ?? []).map((w) => `${name}: ${w}`));
    fs.writeFileSync(path.join(out, `${name}.svg`), svg);
    figs.push({ name, title: fig.title, dur: fig.T, kb: +v.kb.toFixed(1) });
    htmlBlocks.push(`<section style="margin:0 0 14px;max-width:100%;overflow:hidden;border-radius:6px;">${svg}</section>`);
  }
}
const article = `<section style="background:rgba(26,26,24,0.02);max-width:640px;margin:0 auto;padding:24px 16px;${WRAP}">${htmlBlocks.join('')}</section>`;
fs.writeFileSync(path.join(out, 'article.html'), article);

// 素材：asset:名字 → 本地文件。发布时由 publish.py 换成微信图床地址
const assetDirs = [path.join(out, '..', 'assets'), path.join(path.dirname(path.resolve(src)), 'assets'), path.join(here, '..', 'assets')];
const assets = {};
for (const m of article.matchAll(/asset:([\w.-]+)/g)) {
  const nm = m[1];
  if (assets[nm]) continue;
  for (const d of assetDirs) for (const ext of ['.jpg', '.png', '.jpeg', '.gif']) {
    const p = path.join(d, nm + ext);
    if (!assets[nm] && fs.existsSync(p)) assets[nm] = p;
  }
  if (!assets[nm]) errs.push(`找不到素材 ${nm}`);
}
// 预览页把素材内联，放到哪里打开都不会裂图
const dataUri = (p) => `data:image/${p.endsWith('.png') ? 'png' : p.endsWith('.gif') ? 'gif' : 'jpeg'};base64,${fs.readFileSync(p).toString('base64')}`;
const toLocal = (h) => h.replace(/asset:([\w.-]+)/g, (_, nm) => (assets[nm] ? dataUri(assets[nm]) : ''));
fs.writeFileSync(path.join(out, 'preview.html'), `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(art.title ?? '预览')}</title></head><body style="margin:0;background:#fff;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue','PingFang SC','Hiragino Sans GB','Microsoft YaHei',Arial,sans-serif"><div style="max-width:420px;margin:0 auto"><h1 style="font-size:22px;line-height:1.4;padding:20px 16px 0;margin:0">${esc(art.title ?? '')}</h1>${toLocal(article)}</div></body></html>`);
const kb = Buffer.byteLength(article) / 1024;
const chars = htmlBlocks.join('').replace(/<svg\b[\s\S]*?<\/svg>/g, '').replace(/<[^>]+>/g, '').length;
// 实物文章最大 545KB；接口的真实上限官方没写清，超限会报 45002
if (kb > 550) warns.push(`正文 ${kb.toFixed(0)}KB，超过实物文章的最大值 545KB，接口可能报 45002`);
// 封面：art.covers [{ label, path }] 或 art.cover 路径，相对文章脚本所在目录
const covers = (art.covers ?? (art.cover ? [{ label: '封面', path: art.cover }] : [])).map((c) => ({ label: c.label ?? '封面', path: path.resolve(srcDir, c.path) }));
for (const c of covers) if (!fs.existsSync(c.path)) errs.push(`找不到封面 ${c.path}`);
const okCovers = covers.filter((c) => fs.existsSync(c.path));
// 粘贴版：公众号编辑器会清空 SVG 里内嵌数据的 <image>，配图的纸纹底换成同色纯色块（2026-11-01 实测）
const pasteSafe = (h) => h.replace(/<image x="0" y="0" width="(\d+)" height="(\d+)"[^>]*href="asset:paper"[^>]*>(<\/image>)?/g, '<rect x="0" y="0" width="$1" height="$2" fill="#F4EFE5"></rect>');
fs.writeFileSync(path.join(out, 'console.html'), makeConsole({ title: art.title, digest: art.digest, author: art.author, articleHtml: toLocal(pasteSafe(article)), covers: okCovers.map((c) => ({ label: c.label, uri: dataUri(c.path) })) }));
const manifest = { title: art.title, author: art.author, digest: art.digest, cover: okCovers[0]?.path ?? art.cover, covers: okCovers, figs, assets, kb: +kb.toFixed(1), chars, charsPerFig: figs.length ? Math.round(chars / figs.length) : null };
fs.writeFileSync(path.join(out, 'manifest.json'), JSON.stringify(manifest, null, 2));
for (const w of warns) console.log('⚠', w);
for (const e of errs) console.log('✗', e);
console.log(`${figs.length} 张图，正文 ${kb.toFixed(0)}KB，文字 ${chars} 字${figs.length ? `，平均 ${manifest.charsPerFig} 字一张图` : ''} → ${out}`);
figs.forEach((f) => console.log(`  ${f.name} ${f.dur}s ${f.kb}KB  ${f.title}`));
process.exit(errs.length ? 1 : 0);
