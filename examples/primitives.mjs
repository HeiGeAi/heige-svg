import { Fig, rect, text, line, circle } from '../src/motion.mjs';
function bespoke() {
  const f = new Fig({ dur: 8, eyebrow: '底层动效 · 自测', title: '扫描、滚数、序列帧，都能跑', foot: [{ t: '完成率 ' }, { t: '96', big: true }, { t: ' 分', b: true }] });
  const th = f.th;
  f.add(f.card(40, 200, 300, 420));
  for (let i = 0; i < 9; i++) f.add(rect(70, 235 + i * 40, 240 - (i % 3) * 40, 14, { rx: 3, fill: th.block }));
  f.add(f.scan(40, 300, 210, 610, { at: 0.5, dur: 2.2 }));
  f.add(f.ring(60, 395, 260, 36, { at: 2.8 }));
  f.add(text(400, 250, '得分', { size: 24, fill: th.sub }));
  f.add(f.counter(400, 340, [0, 12, 31, 48, 67, 82, 91, 96], { at: 0.8, dur: 2, big: true, size: 76 }));
  f.add(f.sprite(['s0', 's1', 's2', 's3'], 400, 400, 120, 120, { fps: 6 }));
  f.add(f.spinner(600, 460, { at: 0.3, out: 3, r: 16 }));
  f.add(f.fade(f.bounce(f.check(600, 460, { size: 1.4 }), 600, 460, 3), { at: 3, inDur: 0.08 }));
  f.add(f.cursor([{ t: 4.2, x: 560, y: 590 }]));
  const p = f.pill(470, 570, '已确认', { size: 22, h: 42 });
  f.add(f.flip(p.svg, 4.25, f.exit + 0.3));
  return f;
}
export default {
  title: '底层动效与配色自测', author: '示例', digest: '自测',
  blocks: [
    { p: '自定义场景：扫描线、数字滚动、序列帧、转圈、回弹、光标、波纹' },
    { fig: bespoke },
    { scene: 'terminalRun', meta: { theme: 'amber', eyebrow: '配色自测 · amber', title: '深色加琥珀，跟着品牌走', foot: [{ t: '纸底不变，', }, { t: '内容跟品牌', b: true }] },
      data: { prompt: 'register for the next event', steps: [{ label: '读活动列表', note: 'GET /api/activities' }, { label: '提交报名', note: 'POST /register' }], done: '已报名' } },
    { scene: 'phoneChat', meta: { theme: 'blue', eyebrow: '配色自测 · blue', title: '蓝色手机，气泡长一点也能折行', foot: null },
      data: { app: 'DSH', user: '把这个月的花销做成表和图，按类别汇总，再比一下上个月', steps: ['读取账单', '运行脚本'], result: ['做好了，一共 ¥6,842', '餐饮比上月多 12%'], mark: 1, tag: '手机里运行' } },
  ],
};
