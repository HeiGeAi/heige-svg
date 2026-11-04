#!/usr/bin/env node
// 用法：node bin/xcard.mjs <卡片配置.json> [输出目录]
// 把社交平台的一条原帖做成「原帖卡」图片：头像、账号、日期、原文、译文、配图、浏览点赞，宽 1080 的 jpg，
// 每张控制在 1MB 以内（公众号正文图片上限）。正文里用 ![说明](卡片.jpg) 引用，编译时会内嵌，粘进公众号会转存图床。
// 配置里的路径相对配置文件。数字请照原帖页面如实填写，不要编。
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';
import { dataUri } from '../src/images.mjs';

const [cfgArg, outArg] = process.argv.slice(2);
if (!cfgArg) { console.error('用法：node bin/xcard.mjs <卡片配置.json> [输出目录]'); process.exit(1); }
const cfgFile = path.resolve(cfgArg), base = path.dirname(cfgFile);
const cfg = JSON.parse(fs.readFileSync(cfgFile, 'utf8'));
const out = path.resolve(outArg ?? path.join(base, 'xcards'));
fs.mkdirSync(out, { recursive: true });

const THEMES = {
  paper: { page: '#F4F0E6', card: '#FFFDF8', line: '#1A1A1D', shadow: '#1A1A1D', tag: '#FFD43B' },
  night: { page: '#1B1530', card: '#FFF8EC', line: '#17121F', shadow: '#FFD43B', tag: '#FFD43B' },
};
const th = THEMES[cfg.theme ?? 'paper'] ?? THEMES.paper;
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const br = (s) => esc(s).replace(/\n/g, '<br>');
const img = (p) => dataUri(path.resolve(base, p));
const STACK = "-apple-system,BlinkMacSystemFont,'PingFang SC','Noto Sans SC','Microsoft YaHei',sans-serif";

function page(c) {
  const av = c.avatar ? `<img class="av" src="${img(c.avatar)}">` : `<div class="av ini">${esc([...(c.name ?? '?')][0].toUpperCase())}</div>`;
  const media = c.media ? `<img class="media" src="${img(c.media)}">` : '';
  const stats = (c.stats ?? []).map(([k, v]) => `<span>${esc(k)} <em>${esc(v)}</em></span>`).join('');
  return `<!doctype html><meta charset="utf-8"><style>
html,body{margin:0;background:${th.page}}
.wrap{padding:24px;width:672px;font-family:${STACK}}
.card{background:${th.card};border:3px solid ${th.line};border-radius:18px;padding:26px 28px 20px;box-shadow:7px 7px 0 ${th.shadow}}
.hd{display:flex;align-items:center;gap:14px}
.av{width:56px;height:56px;border-radius:50%;border:2px solid ${th.line};object-fit:cover}
.ini{display:flex;align-items:center;justify-content:center;background:${th.tag};font-weight:900;font-size:26px;color:#1A1A1D}
.nm{font-weight:900;font-size:20px;color:#1A1A1D;line-height:24px}
.hn{font-size:15px;color:#7A746A;line-height:20px}
.tag{margin-left:auto;font-size:13px;font-weight:700;color:#1A1A1D;background:${th.tag};border-radius:999px;padding:5px 12px}
.en{margin-top:18px;font-size:17px;line-height:27px;color:#3A3732}
.media{margin-top:16px;width:100%;border-radius:12px;border:1.5px solid #E4DFD3;display:block}
.zh{margin-top:18px;border-left:6px solid #FFD43B;background:#FFF6D6;padding:12px 16px;font-size:19px;line-height:31px;font-weight:700;color:#1A1A1D;border-radius:0 10px 10px 0}
.zh b{display:block;font-size:12px;color:#8A6D00;letter-spacing:2px;line-height:18px;margin-bottom:4px}
.ft{margin-top:16px;padding-top:12px;border-top:1.5px dashed #D8D1C2;display:flex;gap:22px;font-size:14px;color:#7A746A}
.ft em{font-style:normal;font-weight:900;color:#1A1A1D}
</style><div class="wrap"><div class="card">
<div class="hd">${av}<div><div class="nm">${esc(c.name)}</div><div class="hn">${esc(c.handle)}${c.date ? ` · ${esc(c.date)}` : ''}</div></div>${cfg.label === '' ? '' : `<div class="tag">${esc(c.label ?? cfg.label ?? '原帖')}</div>`}</div>
${c.text ? `<div class="en">${br(c.text)}</div>` : ''}${media}
${c.translation ? `<div class="zh"><b>${esc(cfg.transLabel ?? '译文')}</b>${br(c.translation)}</div>` : ''}
${stats ? `<div class="ft">${stats}</div>` : ''}
</div></div>`;
}

const b = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH, headless: true } : { channel: 'chrome', headless: true });
const ctx = await b.newContext({ viewport: { width: 720, height: 800 }, deviceScaleFactor: 1.5 });
const p = await ctx.newPage();
let bad = 0;
for (const [i, c] of (cfg.cards ?? []).entries()) {
  await p.setContent(page(c), { waitUntil: 'load' });
  const name = c.out ?? `xcard-${String(i + 1).padStart(2, '0')}.jpg`;
  const file = path.join(out, name);
  let q = 88;
  for (;;) {
    await p.locator('.wrap').screenshot({ path: file, type: 'jpeg', quality: q });
    if (fs.statSync(file).size < 1024 * 1024 || q <= 60) break;
    q -= 8;
  }
  const kb = fs.statSync(file).size / 1024;
  if (kb >= 1024) bad++;
  console.log(`${kb >= 1024 ? '✗' : '✓'} ${name} ${kb.toFixed(0)}KB`);
}
await b.close();
process.exit(bad ? 1 : 0);
