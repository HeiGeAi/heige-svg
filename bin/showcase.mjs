#!/usr/bin/env node
// 生成 README 用的演示图。README 里的 SVG 以 <img> 加载，所以把纸纹内联，并补上字体。
// 只用于 GitHub 展示，这些文件不能直接进微信（微信版见 build 产物）。
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'out', 'showcase');
const docs = path.join(root, 'docs', 'demo');
execFileSync('node', [path.join(root, 'bin/build.mjs'), path.join(root, 'examples/demo.mjs'), out], { stdio: 'ignore' });
const paper = `data:image/jpeg;base64,${fs.readFileSync(path.join(root, 'assets/paper.jpg')).toString('base64')}`;
const STACK = "-apple-system,BlinkMacSystemFont,'PingFang SC','Noto Sans SC','Microsoft YaHei',sans-serif";
fs.mkdirSync(docs, { recursive: true });
for (const [from, to] of [['fig01', 'terminal'], ['fig04', 'pipeline'], ['fig05', 'ui-click'], ['fig02', 'bar-race']]) {
  const svg = fs.readFileSync(path.join(out, `${from}.svg`), 'utf8')
    .replace(/asset:paper/g, paper)
    .replace('<svg ', `<svg font-family="${STACK}" `);
  fs.writeFileSync(path.join(docs, `${to}.svg`), svg);
  console.log(`${to}.svg ${(Buffer.byteLength(svg) / 1024).toFixed(0)}KB`);
}
