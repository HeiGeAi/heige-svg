// 夜空视觉包的场景索引。文章脚本里写 { kit: '场景名', meta, data }，meta 见 core.mjs 的 frame()
import * as A from './scenes-a.mjs';
import * as B from './scenes-b.mjs';
import * as C from './scenes-c.mjs';
export const KIT = {
  islands: A.islands, gauge: A.gauge, funnel: A.funnel, kitchen3: A.kitchen3, duel: A.duel,
  router: B.router, tiles: B.tiles, chat: B.chat, ladder: B.ladder, handoff: B.handoff,
  workbench: C.workbench, hub: C.hub, bars: C.bars, road: C.road, belt: C.belt, quiz: C.quiz, pyramid: C.pyramid, infect: C.infect,
};
export { ART } from './scenes-a.mjs';
export { ICON } from './scenes-b.mjs';
export * from './core.mjs';
