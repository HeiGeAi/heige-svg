# 写自定义场景

模板表达不了时，直接用 `Fig` 拼。坐标系：宽 750，高 720（手机类 750），时间单位是秒。

```js
import { Fig, rect, text, line, circle } from '<项目目录>/src/motion.mjs';

function myFigure() {
  const f = new Fig({ dur: 8, eyebrow: '对象 · 这一节', title: '一句结论', foot: [{ t: '普通字' }, { t: '加粗', b: true }] });
  f.add(f.card(40, 200, 300, 420));                        // 静态元素直接加
  f.add(f.fade(text(70, 260, '淡入', { size: 24 }), { at: 0.5 }));
  return f;
}
export default { title: '文章标题', blocks: [{ p: '正文' }, { fig: myFigure }] };
```

块类型：`{p}` 正文（支持 `**标红加粗**` 和 `` `代码` ``）、`{h}` 小标题、`{ul:[]}` 列表、`{quote}` 引用块（放给读者复制的提示词）、`{fig}` 自定义图、`{scene, meta, data}` 模板图。

## 版面

| 区域 | 位置 |
|---|---|
| 眉题 | y=52，21 号，居中 |
| 标题 | 基线 y=118，衬线转路径，44 号，超宽自动缩 |
| 上分隔线 | y=170 |
| 内容区 | x 40–710，y 190–630 |
| 下分隔线 | y=646 |
| 脚注 | y=688，23 号 |

字号不低于 15。手机上整张图大约缩到 0.48 倍，15 号相当于 7 号字，正文类内容用 18 以上。

## 动效

| 方法 | 作用 | 典型参数 |
|---|---|---|
| `f.fade(内容,{at,out,inDur})` | 淡入淡出 | inDur 默认 0.15 |
| `f.flip(内容,at,out)` | 瞬切状态（按钮变色、换屏） | |
| `f.pop(内容,cx,cy,{at,from})` | 弹入 | from 默认 0.6 |
| `f.bounce(内容,cx,cy,at)` | 回弹 1→1.4→0.94→1，打勾用 | 外面包一层 fade |
| `f.move(内容,[[t,x,y,缓动]])` | 平移 | 缓动填 `inout` 或 `out` |
| `f.scale(内容,cx,cy,[[t,s,缓动]])` | 绕点缩放 | s 可写 `'0.01 1'` |
| `f.grow(x,y,w,h,{at,dur,fill})` | 条形从左长出 | |
| `f.type(x,y,文字,{at,cps,mono})` | 打字机，返回 `{svg,end,x}` | cps 22–26 |
| `f.cursor([{t,x,y,click}])` | 光标移动并点击，自带波纹 | 移动 0.6s |
| `f.ring(x,y,w,h,{at})` | 强调框 | |
| `f.spinner(cx,cy,{at,out})` | 转圈 | |
| `f.scan(x,w,y0,y1,{at,dur})` | 扫描线 | |
| `f.counter(x,y,[数值],{at,dur,big})` | 数字滚动 | |
| `f.sprite([素材名],x,y,w,h,{fps})` | 序列帧 | 素材放脚本旁的 `assets/` |

外壳：`f.terminal` `f.browser` `f.phone` `f.card` `f.pill` `f.check`。

## 节奏

- 循环时长：5–10 秒
- 开头约 0.2 秒空场
- 进场快（0.15s，`out`），移动慢（0.6s，`inout`）
- 逐项出现的间隔 0.4–0.8 秒
- 完成态至少停 1.5 秒
- 退场从 `f.exit` 开始（默认 dur-0.6），0.3 秒淡出，再空 0.3 秒

## 技巧

- **没有 clipPath 怎么裁切**：手机下半截直接伸出画布；需要遮挡时盖一块同色矩形
- **没有 begin 偏移怎么排时间**：引擎把所有时刻编译进 keyTimes，别手写 begin
- **静态兜底**：引擎按 `poster`（默认 dur-0.7）写静态属性。不支持动画的环境显示完成态，所以完成态必须能单独讲清楚
- **一闪而过的东西**（波纹、闪光）不要进兜底帧
- **同一内容的两个状态**：画两份，一份 `flip` 出现，另一份同时 `flip` 消失
