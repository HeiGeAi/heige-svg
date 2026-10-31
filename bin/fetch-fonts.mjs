#!/usr/bin/env node
// 下载标题衬线和终端等宽字体（都是 OFL 授权），版本固定，已存在就跳过
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'fonts');
const FONTS = {
  'NotoSerifSC-Bold.otf': 'https://github.com/notofonts/noto-cjk/raw/Serif2.003/Serif/SubsetOTF/SC/NotoSerifSC-Bold.otf',
  'JetBrainsMono-Medium.ttf': 'https://github.com/JetBrains/JetBrainsMono/raw/v2.304/fonts/ttf/JetBrainsMono-Medium.ttf',
  'JetBrainsMono-Bold.ttf': 'https://github.com/JetBrains/JetBrainsMono/raw/v2.304/fonts/ttf/JetBrainsMono-Bold.ttf',
};
for (const [name, url] of Object.entries(FONTS)) {
  const file = path.join(dir, name);
  if (fs.existsSync(file)) { console.log(`已有 ${name}`); continue; }
  process.stdout.write(`下载 ${name} … `);
  const res = await fetch(url);
  if (!res.ok) { console.error(`失败：HTTP ${res.status} ${url}`); process.exit(1); }
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(file, buf);
  console.log(`${(buf.length / 1048576).toFixed(1)}MB`);
}
