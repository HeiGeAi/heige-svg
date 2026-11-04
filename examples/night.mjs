// 夜空视觉包示例：18 个场景各来一张，内容是「怎么把活交给 AI」这类通用道理
// 编译：node bin/build.mjs examples/night.mjs out/night && node bin/qa.mjs out/night
const tag = '夜空视觉包';
const M = (part, title, hl, a, b) => ({ tag, part, title, hl, foot: [{ t: a }, { t: b, b: true }] });

export default {
  title: '夜空视觉包：18 个会动的讲道理场景',
  author: '示例',
  digest: '深靛夜空、土豆机器人、印章和彩纸，一张图讲清一个道理。',
  blocks: [
    { p: '每个场景都按内容画面来设计：岛屿航线讲路线，仪表盘讲等级，对决讲做法对比。' },
    { kit: 'islands', meta: M('islands', '4 步，从盯着做走到全程放手', '全程放手', '每一站，', '都插上旗再往前'), data: { items: [
      { k: '第 1 步', name: '看着做', note: '当场纠正' }, { k: '第 2 步', name: '存技能', note: '写成手册' },
      { k: '第 3 步', name: '一句话', note: '只说名字' }, { k: '第 4 步', name: '设例行', note: '到点自己跑' }] } },
    { kit: 'gauge', meta: { ...M('gauge', '信得过多少，就能交出去多少', '交出去', '大多数人，', '卡在第一级'), countLabels: ['1 个', '5 个', '更多', '一大群'], countCap: '同时放心交出去的 AI' }, data: { levels: [
      { k: '第 1 级', name: '盯着做', note: '一句一句纠正' }, { k: '第 2 级', name: '教会它', note: '存成技能' },
      { k: '第 3 级', name: '交给它', note: '设成例行' }, { k: '第 4 级', name: '放手', note: '你只抽查' }] } },
    { kit: 'funnel', meta: M('funnel', '每一步都绕过你，周报就得等你', '等你', '哪一步离不开你，', '哪一步就是瓶颈'), data: { task: '写周报', stuck: ['复制表格', '转述背景', '帮它检查'], free: '它自己取数', freeLabel: '直接开写' } },
    { kit: 'kitchen3', meta: M('kitchen3', '最乱的，是全家挤进厨房那一下', '最乱', '该改的是动线，', '骂人没用'), data: { panels: [
      { title: '在家做饭', who: '谁干：全是你', state: '不乱，但累' }, { title: '全家挤进厨房', who: '谁干：一堆人', state: '谁都找不着东西' }, { title: '饭店后厨', who: '谁干：各有岗位', state: '主厨只管出菜' }] } },
    { kit: 'duel', meta: M('duel', '一个对的行业词，顶十句大白话', '行业词', '越懂行，', '越能说出那个词'), data: {
      left: { title: '说了一大段', art: 'scatter', lines: ['它只能挨个去猜'], verdict: '✗ 越说越偏' },
      right: { title: '用对一个专业词', art: 'target', lines: ['它抓住这个词', '一路按这个方向'], verdict: '✓ 一下就准' } } },
    { kit: 'router', meta: M('router', '门口一个跑腿的，后厨才能专心炒菜', '跑腿', '外面的消息，', '先过它这一道'), data: { items: [{ tag: '新订单', to: 0 }, { tag: '一条差评', to: 0 }, { tag: '广告推销', to: 1 }, { tag: '菜要涨价', to: 0 }] } },
    { kit: 'tiles', meta: M('tiles', '四条规矩，最少人写的是不该做', '不该做', '一个只写稿的 bot，', '用不着你的银行账户'), data: { cards: [
      { title: '只干一件事', body: '只盯一个渠道，出摘要', icon: 'target' }, { title: '只有一种语气', body: '一听就知道是谁', icon: 'mic' },
      { title: '写明不该做', body: '不替你发帖，没事就闭嘴', icon: 'ban', hero: true }, { title: '工具不多给', body: '权限只给够用的', icon: 'toolbox' }] } },
    { kit: 'chat', meta: M('chat restate', '先让它复述，误会在开工前就露出来', '复述', '听对了，', '这段复述就是任务说明'), data: {
      variant: 'restate', voice: '语音 3 分钟', user: '最后一句：用你自己的话复述一遍', steps: ['把一大段话消化一遍', '理成有条理的问题'], reply: ['你的目标是……', '要解决的是……'], unsure: '这两处我不确定' } },
    { kit: 'chat', meta: M('chat book', '先给方案，你点头它才下单', '你点头', '撤不回来的事，', '多问一句不丢人'), data: {
      variant: 'book', user: '帮我订出差的机票和酒店，下单之前先问我', options: ['方案 1', '方案 2'], reject: '半夜红眼航班', ask: '等你点头', done: '全部订好' } },
    { kit: 'ladder', meta: M('ladder', '一级一级往上走，别跳步', '别跳步', '很多人一上来，', '就跳到了第四级'), data: { steps: [
      { k: '第 1 级', name: '看着它做', note: '做歪了当场纠正' }, { k: '第 2 级', name: '存成技能', note: '做顺了写成手册' },
      { k: '第 3 级', name: '一句话做对', note: '只说名字' }, { k: '第 4 级', name: '设成例行', note: '到点自己跑' }], badge: '走到这才放手' } },
    { kit: 'handoff', meta: M('handoff', '同一件报销，你出手越来越少', '越来越少', '看它做对几次，', '才是放手的前提'), data: { stages: [
      { k: '第 1 次', name: '翻收据填单', note: '你在旁边纠正', you: 1 }, { k: '顺了以后', name: '存成技能', note: '起个名字', you: 0.55 },
      { k: '下一次', name: '只说一句', note: '一次做好', you: 0.2 }, { k: '最后', name: '自动填单', note: '来收据就填', you: 0 }] } },
    { kit: 'workbench', meta: M('workbench', '让它写段程序，别每次亲手干', '写段程序', '直接问 AI，', '哪些步骤能变成程序'), data: {
      prompt: '我的流程里，哪些步骤能变成程序？', steps: [{ label: '翻一遍流程', note: '找重复的' }, { label: '挑出机械的几步', note: '每次都一样' }, { label: '写成小程序', note: '一次写好' }, { label: '以后直接跑', note: '省钱也更稳' }], done: '机械步骤已改成程序', art: 'gears' } },
    { kit: 'hub', meta: M('hub', '你只跟总入口说话，剩下的它来转派', '总入口', '负责人，', '只拆任务不亲自干'), data: { center: '幕僚长', sats: [
      { name: '个人助理', note: '订票点饭提醒', prop: 'plane' }, { name: '负责人', note: '只分派不亲自干', prop: 'clip' },
      { name: '盯反馈', note: '半小时看一次', prop: 'magnifier' }, { name: '干活的', note: '各干各的那块', prop: 'wrench' }] } },
    { kit: 'bars', meta: { ...M('bars', '15 分钟跑一次，一天就快 100 次', '快 100 次', '一般来说，', '一小时一次就够'), note: '每跑一次，都在花 token' }, data: { rows: [
      { name: '每 15 分钟', value: 96, label: '96 次', spin: 0.4 }, { name: '每 30 分钟', value: 48, label: '48 次', spin: 0.8 },
      { name: '每小时', value: 24, label: '24 次', spin: 1.6, hero: true }, { name: '一天 3 次', value: 3, label: '3 次', spin: 4 }] } },
    { kit: 'road', meta: M('road', '最费人的，恰恰是两头', '两头', '你给它的是背景，', '用不着一步步指令'), data: { segs: [
      { name: '头一公里', do: '搞清该干什么', note: '它自己去拿背景', hot: true }, { name: '中间', do: '具体干活', note: '大部分人只用这段' }, { name: '最后一公里', do: '真把事办完', note: '交回结果不是建议', hot: true }] } },
    { kit: 'belt', meta: { ...M('belt 计时', '从报问题到上线，全程不用你出手', '不用你出手', '一小时内没人说话，', '就自动上线'), timerNote: '这一小时里随时能叫停' }, data: {
      stations: [{ name: '盯反馈', note: '一直在看' }, { name: '建任务单', note: '自己建' }, { name: '复现问题', note: '确认真有' }, { name: '修好再测', note: '假装用户' }, { name: '通知你', note: '留一小时' }],
      items: [{ tag: '用户报的问题' }], timer: ['60:00', '45:00', '30:00', '15:00', '00:00'], endLabel: '自动上线' } },
    { kit: 'belt', meta: M('belt 叫停', '坏东西在前面就挡住了', '挡住了', '越往后才发现，', '纠正越贵'), data: {
      stations: [{ name: '分类', note: '是不是真问题' }, { name: '复现', note: '能不能复现' }],
      items: [{ tag: '属于正常', stopAt: 0, why: '不用修' }, { tag: '复现不出', stopAt: 1, why: '先放着' }, { tag: '真有问题' }], endLabel: '接着修' } },
    { kit: 'quiz', meta: M('quiz', '四个问题答得出来，才能放心交出去', '放心交出去', '最后一问，', '留着你说停的权力'), data: { items: [
      { q: '什么信号让它开始？', a: '来了事，还是到了点' }, { q: '每一步由谁来做？', a: '具体到哪个 bot' },
      { q: '每一步交什么证据？', a: '截图、链接、前后对比' }, { q: '哪一步你能叫停？', a: '撤不回来的那一步' }] } },
    { kit: 'pyramid', meta: M('pyramid', '越往上越靠谱，很多人是倒过来用的', '倒过来', '开会强调和专人盯，', '都在最下面两档'), data: { layers: [
      { k: '第 1 档', name: '改结构', change: '错误根本没机会发生' }, { k: '第 2 档', name: '自动检查', change: '犯了马上被拦下' },
      { k: '第 3 档', name: '写成技能', change: '靠 AI 自觉，尽量少用' }, { k: '第 4 档', name: '靠人检查', change: '最难做大' }] } },
    { kit: 'infect', meta: M('infect', '一处临时糊弄，几天就被抄得满处都是', '满处都是', '定期清理，', '你喂给 AI 的参考资料'), data: {} },
  ],
};
