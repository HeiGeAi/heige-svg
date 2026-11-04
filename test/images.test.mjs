import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { imageSize, inlineLocalImages, checkCovers } from '../src/images.mjs';

// 手写一个只有文件头的 PNG，够读宽高
const pngHead = (w, h) => { const b = Buffer.alloc(33); b.writeUInt32BE(0x89504e47, 0); b.writeUInt32BE(w, 16); b.writeUInt32BE(h, 20); return b; };
const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'hsvg-'));

test('读得出 PNG 和 JPEG 的宽高', () => {
  assert.deepEqual(imageSize(pngHead(1880, 800)), { w: 1880, h: 800, type: 'png' });
  const s = imageSize(fs.readFileSync(new URL('../assets/paper.jpg', import.meta.url)));
  assert.equal(s.type, 'jpeg'); assert.ok(s.w > 0 && s.h > 0);
});

test('正文里的本地图片被内嵌，远程和已内嵌的不动', () => {
  const d = tmp(); fs.writeFileSync(path.join(d, 'a.png'), pngHead(10, 10));
  const { html, errs } = inlineLocalImages('<p><img src="a.png"></p><img src="https://x.y/b.png"><img src="data:image/png;base64,AA">', d);
  assert.deepEqual(errs, []);
  assert.match(html, /<img src="data:image\/png;base64,[^"]+">/);
  assert.ok(html.includes('https://x.y/b.png') && html.includes('base64,AA'));
  assert.ok(!html.includes('src="a.png"'));
});

test('找不到的本地图片报错，不会悄悄变成空白', () => {
  const { errs } = inlineLocalImages('<img src="nope.jpg">', tmp());
  assert.equal(errs.length, 1);
});

test('封面：多张会提示只有一张主封面，比例不是 2.35:1 会提示', () => {
  const d = tmp();
  fs.writeFileSync(path.join(d, 'main.png'), pngHead(1880, 800));
  fs.writeFileSync(path.join(d, 'sq.png'), pngHead(1080, 1080));
  assert.deepEqual(checkCovers([{ path: path.join(d, 'main.png') }]), []);
  assert.equal(checkCovers([{ path: path.join(d, 'main.png') }, { path: path.join(d, 'sq.png') }]).length, 1);
  assert.match(checkCovers([{ path: path.join(d, 'sq.png') }])[0], /2\.35:1/);
});
