// Markdown 正文加动图：正文写在 .md 里，[[图1]] 这样的占位行换成下面定义的场景
import fs from 'node:fs';
import { fromMarkdown } from '../src/markdown.mjs';

const md = fs.readFileSync(new URL('./markdown-figs.md', import.meta.url), 'utf8');

const figs = {
  1: { scene: 'barRace', meta: { eyebrow: '示例 · 对比', title: '分工以后，最慢的活快了一倍', foot: [{ t: '示例数据，' }, { t: '仅演示写法', b: true }] },
    data: { rows: [{ name: '一个人全干', value: 30, label: '30 分钟' }, { name: '分工', value: 15, label: '15 分钟', hero: true }], max: 30, tick: 10 } },
  2: { scene: 'timelineList', meta: { eyebrow: '示例 · 步骤', title: '三步，照着做', foot: [{ t: '每一步，' }, { t: '都能单独复制', b: true }] },
    data: { items: [{ when: '第 1 步', name: '写规矩', change: '放进规矩文件' }, { when: '第 2 步', name: '派活', change: '按本事分出去' }, { when: '第 3 步', name: '验收', change: '核对完再交' }] } },
};

const { title, blocks } = fromMarkdown(md, { figs });

export default {
  title,
  author: '示例',
  digest: 'Markdown 写正文，脚本只管配图，一条命令出公众号排版和发布台。',
  covers: [{ label: '主封面', path: 'assets/cover.png' }],
  blocks,
};
