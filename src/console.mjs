// 发布台：把编好的文章做成一个本地网页，一键复制标题、摘要、封面图、正文，再粘进公众号后台。
// 正文按 text/html 加纯文本两份写进剪贴板；剪贴板接口不可用时退回浏览器自带复制。
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const len = (s) => [...String(s ?? '')].length;

// covers：[{ label, uri }]，uri 是 data: 地址
export function makeConsole({ title = '', digest = '', author = '', articleHtml, covers = [] }) {
  const coverCards = covers.map((c, i) => `
    <div class="cover"><img id="cover${i}" src="${c.uri}" alt="${esc(c.label)}">
      <div class="row"><span class="label">${esc(c.label)}</span><button data-copy-img="cover${i}">复制封面图</button></div></div>`).join('');
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>发布台 · ${esc(title)}</title>
<style>
*{box-sizing:border-box}
body{margin:0;background:#EFEAE0;font-family:-apple-system,BlinkMacSystemFont,'PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;color:#1E1C19}
.bar{position:sticky;top:0;z-index:9;display:flex;flex-wrap:wrap;gap:10px;align-items:center;padding:12px 20px;background:#1E1C19;box-shadow:0 2px 12px rgba(0,0,0,.18)}
.bar b{color:#FFD23F;font-size:15px;margin-right:auto;letter-spacing:1px}
button{font:inherit;font-size:14px;font-weight:700;border:0;border-radius:8px;padding:9px 16px;cursor:pointer;background:#FFD23F;color:#1E1C19}
button:hover{filter:brightness(.95)}
.wrap{display:flex;flex-wrap:wrap;gap:28px;align-items:flex-start;justify-content:center;padding:28px 20px 80px}
.side{width:420px;max-width:100%;position:sticky;top:76px;display:flex;flex-direction:column;gap:16px}
.card{background:#FBF8F1;border:1px solid #E4DFD3;border-radius:12px;padding:16px}
.card h3{margin:0 0 10px;font-size:13px;color:#8F887D;letter-spacing:2px}
.field{font-size:16px;line-height:1.6;font-weight:600;margin:0 0 10px}
.field.digest{font-size:14px;font-weight:400;color:#47423B}
.row{display:flex;align-items:center;justify-content:space-between;gap:10px}
.count{font-size:12px;color:#8F887D}.count.over{color:#CF4436;font-weight:700}
.cover img{width:100%;border-radius:8px;border:1px solid #E4DFD3;display:block;margin-bottom:8px}
.cover+.cover{margin-top:14px}
.label{font-size:12px;color:#8F887D}
.phone{width:420px;max-width:100%;background:#fff;border-radius:18px;box-shadow:0 10px 40px rgba(30,28,25,.15);overflow:hidden}
.phone .tt{padding:22px 16px 0;font-size:22px;line-height:1.4;font-weight:700}
.phone .au{padding:8px 16px 0;font-size:14px;color:#576B95}
.tip{font-size:12px;line-height:1.7;color:#8F887D;margin:0}
#toast{position:fixed;left:50%;bottom:36px;transform:translateX(-50%) translateY(20px);opacity:0;transition:.25s;background:#1E1C19;color:#FFD23F;font-weight:700;padding:12px 22px;border-radius:999px;font-size:14px;pointer-events:none}
#toast.on{opacity:1;transform:translateX(-50%) translateY(0)}
</style></head><body>
<div class="bar"><b>发布台</b>
  <button data-copy-text="title">复制标题</button>
  ${digest ? '<button data-copy-text="digest">复制摘要</button>' : ''}
  ${covers.length ? '<button data-copy-img="cover0">复制封面图</button>' : ''}
  <button id="copyBody">复制正文</button>
</div>
<div class="wrap">
  <div class="side">
    <div class="card"><h3>标题</h3><p class="field" id="title">${esc(title)}</p>
      <div class="row"><span class="count${len(title) > 64 ? ' over' : ''}">${len(title)} / 64 字</span><button data-copy-text="title">复制标题</button></div></div>
    ${digest ? `<div class="card"><h3>摘要</h3><p class="field digest" id="digest">${esc(digest)}</p>
      <div class="row"><span class="count${len(digest) > 120 ? ' over' : ''}">${len(digest)} / 120 字</span><button data-copy-text="digest">复制摘要</button></div></div>` : ''}
    ${covers.length ? `<div class="card"><h3>封面</h3>${coverCards}</div>` : ''}
    <div class="card"><h3>粘贴顺序</h3><p class="tip">1 新建图文，复制标题粘进标题栏${author ? `，作者填 ${esc(author)}` : ''}。<br>2 点复制正文，在正文区粘贴。<br>3 复制摘要粘进摘要栏。<br>4 复制封面图，在封面处粘贴或上传。<br>5 手机预览，确认动图在动、卡片样式没丢。</p></div>
  </div>
  <div class="phone"><div class="tt">${esc(title)}</div>${author ? `<div class="au">${esc(author)}</div>` : ''}<div id="article">${articleHtml}</div></div>
</div>
<div id="toast"></div>
<script>
const toast = (t) => { const e = document.getElementById('toast'); e.textContent = t; e.classList.add('on'); clearTimeout(e._t); e._t = setTimeout(() => e.classList.remove('on'), 1800); };
const copyNode = (node) => { const r = document.createRange(); r.selectNodeContents(node); const s = getSelection(); s.removeAllRanges(); s.addRange(r); const ok = document.execCommand('copy'); s.removeAllRanges(); return ok; };
document.querySelectorAll('[data-copy-text]').forEach((b) => b.onclick = async () => {
  const t = document.getElementById(b.dataset.copyText).textContent;
  try { await navigator.clipboard.writeText(t); } catch { const ta = document.createElement('textarea'); ta.value = t; document.body.append(ta); ta.select(); document.execCommand('copy'); ta.remove(); }
  toast(b.dataset.copyText === 'title' ? '已复制标题' : '已复制摘要');
});
document.querySelectorAll('[data-copy-img]').forEach((b) => b.onclick = async () => {
  try {
    const blob = await (await fetch(document.getElementById(b.dataset.copyImg).src)).blob();
    await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
    toast('已复制封面图');
  } catch { toast('浏览器不让直接复制图片，请右键封面图选复制图片'); }
});
document.getElementById('copyBody').onclick = async () => {
  const node = document.getElementById('article');
  try {
    await navigator.clipboard.write([new ClipboardItem({ 'text/html': new Blob([node.innerHTML], { type: 'text/html' }), 'text/plain': new Blob([node.innerText], { type: 'text/plain' }) })]);
    toast('已复制正文，去公众号正文区粘贴');
  } catch { toast(copyNode(node) ? '已复制正文，去公众号正文区粘贴' : '复制失败，请在正文里全选后手动复制'); }
};
</script></body></html>`;
}
