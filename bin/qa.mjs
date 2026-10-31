#!/usr/bin/env node
// 用法：node bin/qa.mjs <输出目录> ：逐张抽帧拼成总览图，并检查文字是否出界
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';
const out = path.resolve(process.argv[2]);
const manifest = JSON.parse(fs.readFileSync(path.join(out, 'manifest.json')));
const qa = path.join(out, 'qa'); fs.mkdirSync(qa, { recursive: true });
// 默认用本机安装的 Chrome，其他路径用 CHROME_PATH 指定
const b = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH, headless: true } : { channel: 'chrome', headless: true });
const ctx = await b.newContext({ viewport: { width: 750, height: 750 } });
const STACK = "-apple-system,BlinkMacSystemFont,'Helvetica Neue','PingFang SC',sans-serif";
const fr = [0.04, 0.25, 0.5, 0.75, 0.9];
const toLocal = (s) => s.replace(/asset:([\w.-]+)/g, (_, n) => (manifest.assets[n] ? `file://${manifest.assets[n]}` : ''));
const issues = [];
for (const f of manifest.figs) {
  const p = await ctx.newPage();
  const file = path.join(qa, `${f.name}.html`);
  fs.writeFileSync(file, `<!doctype html><meta charset="utf-8"><body style="margin:0;font-family:${STACK}">${toLocal(fs.readFileSync(path.join(out, f.name + '.svg'), 'utf8'))}</body>`);
  await p.goto('file://' + file, { waitUntil: 'load' });
  const h = await p.evaluate(() => { const s = document.querySelector('svg'); s.pauseAnimations(); return s.getBoundingClientRect().height; });
  for (let i = 0; i < fr.length; i++) {
    await p.evaluate((t) => document.querySelector('svg').setCurrentTime(t), f.dur * fr[i]);
    await p.waitForTimeout(40);
    await p.screenshot({ path: path.join(qa, `${f.name}_${i}.png`), clip: { x: 0, y: 0, width: 750, height: h } });
  }
  // 出界检查：取完成态，看可见文字有没有跑出画布
  const over = await p.evaluate((t) => {
    const s = document.querySelector('svg'); s.setCurrentTime(t);
    const bad = [];
    const W = 750;
    document.querySelectorAll('text').forEach((n) => {
      let o = 1; for (let e = n; e && e !== s; e = e.parentElement) o *= +getComputedStyle(e).opacity;
      if (o < 0.5) return;
      const r = n.getBoundingClientRect();
      if (r.right > W - 4 || r.left < 4) bad.push(n.textContent.slice(0, 24));
    });
    return bad;
  }, f.dur * 0.9);
  if (over.length) issues.push(`${f.name} 文字出界：${over.join(' | ')}`);
  await p.close();
}
const sheet = await ctx.newPage();
await sheet.setViewportSize({ width: 1610, height: 900 });
const rows = manifest.figs.map((f) => `<div style="font:600 14px sans-serif;margin:6px 4px 2px">${f.name} · ${f.dur}s · ${f.kb}KB · ${f.title}</div><div style="display:flex;gap:4px">${fr.map((_, i) => `<img style="width:318px;border:1px solid #bbb" src="file://${path.join(qa, `${f.name}_${i}.png`)}">`).join('')}</div>`).join('');
const sf = path.join(qa, 'sheet.html');
fs.writeFileSync(sf, `<!doctype html><meta charset="utf-8"><body style="margin:4px;background:#ddd">${rows}</body>`);
await sheet.goto('file://' + sf, { waitUntil: 'load' });
await sheet.screenshot({ path: path.join(qa, 'sheet.png'), fullPage: true });
await b.close();
issues.forEach((i) => console.log('⚠', i));
console.log(`QA 总览：${path.join(qa, 'sheet.png')}${issues.length ? `，${issues.length} 处待修` : '，文字未出界'}`);
