// 用本地假服务器走完 publish.py 的发送流程，不碰真实的微信接口
import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const script = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'bin', 'publish.py');

function run(args, env = {}) {
  return new Promise((resolve) => {
    const p = spawn('python3', [script, ...args], { env: { ...process.env, ...env } });
    let out = '', err = '';
    p.stdout.on('data', (d) => { out += d; });
    p.stderr.on('data', (d) => { err += d; });
    p.on('close', (code) => resolve({ code, out, err }));
  });
}

function fixture() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wsm-'));
  const paper = path.join(dir, 'paper.jpg');
  fs.writeFileSync(paper, 'fake');
  fs.writeFileSync(path.join(dir, 'cover.jpg'), 'fake');
  fs.writeFileSync(path.join(dir, 'article.html'), '<section><svg viewBox="0 0 1 1"><image href="asset:paper"></image><g><animate attributeName="opacity"></animate></g></svg></section>');
  fs.writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify({ title: '标题', kb: 1, figs: [{}], assets: { paper } }));
  return dir;
}

function fakeWechat(stripSvg) {
  const seen = { paths: [], draft: null };
  const server = http.createServer((req, res) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      const url = new URL(req.url, 'http://x');
      seen.paths.push(url.pathname);
      const body = Buffer.concat(chunks).toString();
      const send = (o) => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(o)); };
      if (url.pathname === '/cgi-bin/stable_token') return send({ access_token: 'T', expires_in: 7200 });
      if (url.pathname === '/cgi-bin/media/uploadimg') return send({ url: 'https://img.example/paper.jpg' });
      if (url.pathname === '/cgi-bin/material/add_material') return send({ media_id: 'COVER' });
      if (url.pathname === '/cgi-bin/draft/add') { seen.draft = JSON.parse(body).articles[0]; return send({ media_id: 'DRAFT' }); }
      if (url.pathname === '/cgi-bin/draft/get') {
        const content = stripSvg ? seen.draft.content.replace(/<animate[^>]*><\/animate>/g, '') : seen.draft.content;
        return send({ news_item: [{ content }] });
      }
      res.statusCode = 404; res.end('{}');
    });
  });
  return new Promise((resolve) => server.listen(0, () => resolve({ server, seen, base: `http://127.0.0.1:${server.address().port}` })));
}

const ENV = { WECHAT_APPID: 'id', WECHAT_APPSECRET: 'secret' };

test('默认只演练，不联网也不需要凭据', async () => {
  const dir = fixture();
  const r = await run([dir], { WECHAT_API_BASE: 'http://127.0.0.1:1', WECHAT_APPID: '', WECHAT_APPSECRET: '' });
  assert.equal(r.code, 0, r.err);
  assert.match(r.out, /演练结束/);
});

test('发送：替换素材地址，创建草稿，读回全部保留', async () => {
  const dir = fixture();
  const { server, seen, base } = await fakeWechat(false);
  const r = await run([dir, '--cover', path.join(dir, 'cover.jpg'), '--send'], { ...ENV, WECHAT_API_BASE: base });
  server.close();
  assert.equal(r.code, 0, r.err);
  assert.ok(seen.paths.includes('/cgi-bin/stable_token'));
  assert.match(seen.draft.content, /https:\/\/img\.example\/paper\.jpg/);
  assert.ok(!seen.draft.content.includes('asset:'));
  assert.equal(seen.draft.title, '标题');
  assert.equal(seen.draft.thumb_media_id, 'COVER');
  assert.match(r.out, /全部保留/);
});

test('发送：动画被吃掉时要报出来', async () => {
  const dir = fixture();
  const { server, base } = await fakeWechat(true);
  const r = await run([dir, '--cover', path.join(dir, 'cover.jpg'), '--send'], { ...ENV, WECHAT_API_BASE: base });
  server.close();
  assert.equal(r.code, 0, r.err);
  assert.match(r.out, /animate: 1 → 0/);
  assert.match(r.out, /先别发布/);
});

test('缺凭据时不输出密钥，退出码非 0', async () => {
  const dir = fixture();
  const r = await run([dir, '--account', 'nobody', '--cover', path.join(dir, 'cover.jpg'), '--send']);
  assert.notEqual(r.code, 0);
  assert.match(r.err, /WECHAT_NOBODY_APPID/);
});
