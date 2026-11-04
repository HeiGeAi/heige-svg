// 正文图片和封面的公众号适配
//   1. 本地图片要内嵌：正文里 <img src="本地路径"> 粘进公众号编辑器会被清空（编辑器拿不到你电脑上的文件），
//      内嵌成 base64 的会被编辑器自动转存到公众号图床。正文图片接口只收 1MB 以内的图，超过就提示先压成 jpg。
//   2. 封面只有一张 2.35:1：公众号后台只能上传主封面，1:1 的转发卡是后台从主封面上拖框裁出来的，不能单独上传。
import fs from 'node:fs';
import path from 'node:path';

export const COVER_RATIO = 2.35;
export const BODY_IMAGE_LIMIT_KB = 1024;

// 读 PNG / JPEG / GIF 的宽高，不依赖第三方库。读不出返回 null
export function imageSize(buf) {
  if (buf.length > 24 && buf.readUInt32BE(0) === 0x89504e47) return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20), type: 'png' };
  if (buf.length > 10 && buf.toString('ascii', 0, 3) === 'GIF') return { w: buf.readUInt16LE(6), h: buf.readUInt16LE(8), type: 'gif' };
  if (buf[0] === 0xff && buf[1] === 0xd8) {
    let i = 2;
    while (i + 9 < buf.length) {
      if (buf[i] !== 0xff) { i++; continue; }
      const m = buf[i + 1], len = buf.readUInt16BE(i + 2);
      if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) return { h: buf.readUInt16BE(i + 5), w: buf.readUInt16BE(i + 7), type: 'jpeg' };
      i += 2 + len;
    }
  }
  return null;
}

const MIME = { '.png': 'png', '.jpg': 'jpeg', '.jpeg': 'jpeg', '.gif': 'gif', '.webp': 'webp' };
export const dataUri = (file) => `data:image/${MIME[path.extname(file).toLowerCase()] ?? 'jpeg'};base64,${fs.readFileSync(file).toString('base64')}`;

// 把 html 里所有本地 <img src> 换成 base64。远程地址（http/https）和已内嵌的原样保留
export function inlineLocalImages(html, baseDir) {
  const errs = [], warns = [];
  const out = html.replace(/<img\b([^>]*?)\ssrc="([^"]+)"/g, (all, pre, src) => {
    if (/^(data:|https?:\/\/)/.test(src)) return all;
    const file = path.resolve(baseDir, decodeURI(src.replace(/^file:\/\//, '')));
    if (!fs.existsSync(file)) { errs.push(`找不到正文图片 ${src}（本地图片必须能找到，否则粘进公众号会是一块空白）`); return all; }
    const kb = fs.statSync(file).size / 1024;
    if (kb > BODY_IMAGE_LIMIT_KB) warns.push(`正文图片 ${src} ${kb.toFixed(0)}KB，超过公众号正文图片 1MB 上限，先压成 jpg（比如宽 1080、质量 85）`);
    return `<img${pre} src="${dataUri(file)}"`;
  });
  return { html: out, errs, warns };
}

// 封面检查：只认第一张当主封面，比例要接近 2.35:1
export function checkCovers(covers) {
  const warns = [];
  if (covers.length > 1) warns.push(`登记了 ${covers.length} 张封面：公众号只有一张 2.35:1 主封面，转发卡是后台从主封面裁的，不能单独上传。发布台和草稿脚本只用第一张`);
  const c = covers[0];
  if (c && fs.existsSync(c.path)) {
    const s = imageSize(fs.readFileSync(c.path));
    if (s) {
      const r = s.w / s.h;
      if (Math.abs(r - COVER_RATIO) > 0.05) warns.push(`主封面 ${path.basename(c.path)} 是 ${s.w}×${s.h}（${r.toFixed(2)}:1），公众号主封面是 2.35:1，建议 1880×800 或 900×383`);
    }
  }
  return warns;
}
