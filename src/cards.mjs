// 公众号正文卡片：提示词卡（可复制）、话术卡。只用内联样式，一行一个 <p>，不用 white-space:pre，
// 粘进公众号编辑器后不会多出空行和大缩进。默认纸白底、墨黑字、黄点缀，和 paper 主题的配图同一套色。
const SANS = "-apple-system,BlinkMacSystemFont,'PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif";

export const CARD_THEME = {
  ink: '#1E1C19', sub: '#47423B', mute: '#8F887D', line: '#E4DFD3', paper: '#FBF8F1', head: '#F3EDE0',
  accent: '#FFD23F', accentSoft: '#FFF1C2', accentDeep: '#8A5A00',
};

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// 【填空】标成浅底高亮，复制出去还是原文
const fill = (s, c) => esc(s).replace(/【(.+?)】/g, `<span style="background:${c.accentSoft};color:${c.accentDeep};border-radius:3px;padding:0 3px;">【$1】</span>`);

function line(raw, gapBefore, c) {
  const s = raw.trimEnd();
  const base = `margin:0;font-family:${SANS};font-size:14px;line-height:1.8;letter-spacing:0.3px;word-break:break-all;`;
  const gap = gapBefore ? 'margin-top:10px;' : '';
  // 「什么时候派：」这类短句冒号收尾，当小标题
  if (/^[^\d\s].{0,12}[：:]$/.test(s)) return `<p style="${base}${gap}font-weight:700;color:${c.ink};"><span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:${c.accent};margin:0 8px 2px 0;vertical-align:middle;font-size:0;line-height:0;">.</span>${esc(s)}</p>`;
  // 「1 内容」「1. 内容」编号行，悬挂缩进
  const m = s.match(/^(\d+)[.、]?\s+(.*)$/);
  if (m) return `<p style="${base}${gap}color:${c.sub};padding-left:22px;text-indent:-22px;"><span style="display:inline-block;width:22px;text-indent:0;color:${c.accentDeep};font-weight:700;">${m[1]}</span>${fill(m[2], c)}</p>`;
  return `<p style="${base}${gap}color:${c.sub};">${fill(s, c)}</p>`;
}

// 提示词卡：title 抬头标题，hint 抬头右侧小字，text 或 lines 为正文（空行变段间距）
export function promptCard({ title = '提示词', hint = '长按全选复制', badge = '可复制', text, lines, theme } = {}) {
  const c = { ...CARD_THEME, ...theme };
  const rows = lines ?? String(text ?? '').split('\n');
  const body = [];
  let gap = false;
  for (const l of rows) {
    if (!l.trim()) { gap = body.length > 0; continue; }
    body.push(line(l, gap, c));
    gap = false;
  }
  return `<section style="margin:6px 0 26px;border:1px solid ${c.line};border-radius:10px;overflow:hidden;background:${c.paper};">`
    + `<section style="display:flex;align-items:center;justify-content:space-between;padding:9px 14px;background:${c.head};border-bottom:1px solid ${c.line};">`
    + `<span style="font-family:${SANS};font-size:13px;font-weight:700;color:${c.ink};"><span style="display:inline-block;background:${c.accent};color:${c.ink};font-size:12px;font-weight:700;padding:1px 8px;border-radius:4px;margin-right:8px;">${esc(badge)}</span>${esc(title)}</span>`
    + `<span style="font-family:${SANS};font-size:12px;color:${c.mute};">${esc(hint)}</span>`
    + `</section>`
    + `<section style="padding:14px 16px 16px;">${body.join('')}</section>`
    + `</section>`;
}

// 话术卡：一句示范怎么说，左侧色条加小标题
export function sayCard({ title = '这样说', text = '', theme } = {}) {
  const c = { ...CARD_THEME, ...theme };
  return `<section style="margin:6px 0 26px;padding:14px 16px;border-radius:10px;background:${c.paper};border:1px solid ${c.line};border-left:4px solid ${c.accent};">`
    + `<p style="margin:0 0 6px;font-family:${SANS};font-size:12px;font-weight:700;color:${c.mute};letter-spacing:1px;">${esc(title)}</p>`
    + `<p style="margin:0;font-family:${SANS};font-size:15px;line-height:1.8;color:${c.ink};font-weight:600;">${fill(String(text).replace(/\n+/g, ''), c)}</p>`
    + `</section>`;
}
