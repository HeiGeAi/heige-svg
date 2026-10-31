---
name: heige-svg
description: 给公众号文章做会动的配图和一键排版，把正文、数据和时间轴编译成内联 SVG + SMIL 动画、公众号正文 HTML、本地预览和发布台（一键复制标题、摘要、封面图、正文）。正文可直接写 Markdown，代码块排成可复制的提示词卡。包含终端、界面点击、条形赛跑、方格墙、流水线、手机对话、时间线、成绩卡 8 个场景模板，以及校验、抽帧检查和实验性的草稿箱发布脚本。真实公众号接口与手机微信播放仍待验证。触发：做动图 / 动态配图 / 会动的图 / SVG 动画配图 / 给这篇配动图 / 公众号动画 / 公众号排版 / 一键复制到公众号 / 发布台。
---

# heige-svg：公众号动图

下面的命令都在本 skill 目录（项目根目录）下运行。首次使用先执行 `npm ci && npm run fonts`。

手法和数据依据见 `docs/analysis.md`。写自定义场景前先读 `docs/writing-scenes.md`。

## 流程

**1. 读稿，定配图位。** 一张图只讲一个动作或一个结论，配在「说完这句话、读者想看怎么回事」的地方。适合配图的内容：操作步骤、系统怎么配合、前后对比、榜单数据。限制条件、价格和注意事项留在文字里。实物密度是 80–270 字一张图，教程和原理类偏密，发布消息类偏疏。

**2. 给每张图写三行字。**
- 眉题（eyebrow）：`对象 · 这一节`，如 `AGI Bar · 领 key`
- 标题（title）：**一句结论**，不是名词标签。写「一个认字，一个判卷」，不写「模型架构」。不要照抄正文，尽量控制在 18 字内
- 脚注（foot）：图里放不下的一个硬信息，如 `显存至少 24 GB`。想强调的部分用 `b: true`，大数字用 `big: true`

**3. 写文章脚本。** 两种写法：
- 正文写成 Markdown，配图位放 `[[图1]]`，脚本只定义配图，照抄 `examples/markdown-figs.mjs`（`fromMarkdown(md, { figs })`）。没有配图的文章直接编译 `.md`，见 `examples/markdown.md`。
- 全部写在 `xxx.mjs` 里，照抄 `examples/demo.mjs`。

优先用现成模板，模板表达不了再用底层动效写（见 `docs/writing-scenes.md`）。提示词、命令、清单一律用卡片：Markdown 里写 ```` ```prompt 卡片标题 ````（话术用 ```` ```say 卡片标题 ````），脚本里写 `{ prompt: { title, text } }`；要读者替换的内容写成 `【填你的…】`，会标黄底。封面写进 `covers: [{ label, path }]`，发布台和 publish.py 都会用。

**4. 编译。**
```bash
node bin/build.mjs <脚本.mjs 或 文章.md> <输出目录>
```
校验不过（✗）必须改。⚠ 要判断。产出里 `console.html` 是发布台：交给用户审稿和发布时给这个网页（飞书文档里动图不会动），用户点按钮复制标题、摘要、封面图、正文，自己粘进公众号后台。2026-11-01 实测粘贴加存草稿后动画和卡片都保留；正文样式里行高必须写像素（无单位会被判行高异常），SVG 里不要依赖内嵌数据图片（会被清空）。

**5. 抽帧自查。**
```bash
node bin/qa.mjs <输出目录>
```
必须用 Read 打开 `<输出目录>/qa/sheet.png` 逐张看：文字有没有重叠、出框，节奏对不对，完成态是否讲清了标题那句话。然后打开 `preview.html` 看真实播放。

**6. 发草稿箱（对外动作，必须先得到用户确认，并问清用哪个账号）。**
```bash
python3 bin/publish.py <输出目录> --account <别名> --cover <封面>
```
默认只演练。确认后加 `--send`。凭据从环境变量 `WECHAT_<别名>_APPID` 和 `WECHAT_<别名>_APPSECRET` 读取，不要把密钥写进命令或输出里。发送后脚本会把草稿读回来，核对标签存活情况。最后要在手机上预览确认动画在播。

> ⚠️ **接口路径尚未实测**：还没确认 `draft/add` 会完整保留 SVG 动画。第一次用时先发一篇小测试稿，看存活核对结果。如果被过滤或报 45002，把结果告诉用户，并更新这一段和 README 的项目状态。

## 模板

| 模板 | 用在 | data |
|---|---|---|
| `terminalRun` | agent 跑任务、装环境、一句话搞定 | `prompt, steps:[{label,note}], done, title` |
| `uiClick` | 产品操作教程 | `window, screens:[{title, rows, target, button, mark}]` |
| `barRace` | 速度、数量对比，主角标红 | `rows:[{name,value,label,hero}], max, tick` |
| `gridWall` | 全量 vs 局部的左右对比 | `left:{label,note}, right:{label,picked,note}, cols, rows` |
| `pipeline` | 系统流程、分流 | `input, stations, outs, items:[{to,tag}]` |
| `phoneChat` | 手机 App 演示（750 高） | `app, user, steps, result, mark, tag` |
| `timelineList` | 事件列表、时间线 | `items:[{when,name,change,who}]` |
| `rankCards` | 多组榜单、数据卡 | `cards:[{title,rows:[{name,score,hero}]}]` |

配色用 `meta.theme`：`paper`（默认，暖纸底红强调）、`mono`（黑白，OpenAI 类）、`amber`（深色琥珀）、`blue`（蓝）。纸底不变，内容 UI 跟随被讲产品的品牌色。

## 红线

- 只用 `g/path/rect/circle/line/text/image/animate/animateTransform/desc`；只动 `opacity` 和 `transform`。`bin/build.mjs` 会拦截违规
- 不用 `id`、`clipPath`、`mask`、`defs`、`use`、渐变、滤镜、`<style>`、`text-anchor`。需要裁切就用画布边缘或遮挡块
- 特殊字体（标题衬线、终端等宽）转路径，不要写 `font-family`
- 图里的数据和界面文案必须真实，不能为了好看编数字
- 模拟真实产品界面时只画示意，不冒充官方截图
- 不要复用别人文章里的素材（吉祥物、配图本身）。手法可以学，素材用自己的
