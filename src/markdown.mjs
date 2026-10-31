// Markdown 正文 → 文章脚本的 blocks。配图用占位行 [[图1]] 引用 figs 里的场景。
//   # 标题            → 文章标题
//   ## 小标题         → { h }
//   普通段落（单行）  → { p }，支持 **加粗标红**、`代码`
//   - 列表项          → { ul }
//   > 引用            → { quote }
//   [[图N]]           → figs[N]（场景对象或 { fig }）
//   ```prompt 标题    → 提示词卡（```card 同义；不写类型的 ``` 也按提示词卡处理，标题为「代码」）
//   ```say 标题       → 话术卡
export function fromMarkdown(md, { figs = {} } = {}) {
  const lines = String(md).replace(/\r\n/g, '\n').split('\n');
  const blocks = [];
  let title;
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i].trim();
    if (!l) continue;
    if (l.startsWith('```')) {
      const [kind = '', ...rest] = l.slice(3).trim().split(/\s+/);
      const buf = [];
      while (i + 1 < lines.length && !lines[i + 1].trim().startsWith('```')) buf.push(lines[++i]);
      i++;
      const t = rest.join(' ');
      if (kind === 'say') blocks.push({ say: { title: t || undefined, text: buf.join('\n') } });
      else blocks.push({ prompt: { title: t || (kind === 'prompt' || kind === 'card' ? '提示词' : kind || '代码'), lines: buf } });
      continue;
    }
    if (l.startsWith('# ')) { title ??= l.slice(2).trim(); continue; }
    if (l.startsWith('## ')) { blocks.push({ h: l.slice(3).trim() }); continue; }
    const fig = l.match(/^\[\[图(\d+)\]\]$/);
    if (fig) {
      const f = figs[fig[1]];
      if (!f) throw new Error(`找不到配图 [[图${fig[1]}]]`);
      blocks.push(f);
      continue;
    }
    if (l.startsWith('> ')) { blocks.push({ quote: l.slice(2).trim() }); continue; }
    if (/^[-*] /.test(l)) {
      const items = [l.slice(2).trim()];
      while (i + 1 < lines.length && /^[-*] /.test(lines[i + 1].trim())) items.push(lines[++i].trim().slice(2).trim());
      blocks.push({ ul: items });
      continue;
    }
    blocks.push({ p: l });
  }
  return { title, blocks };
}
