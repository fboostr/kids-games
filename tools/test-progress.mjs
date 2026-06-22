// test-progress.mjs —— localStorage 存档：星星/解锁取 max 不回退、纪录取 min、设置默认值。
import { test } from "node:test";
import assert from "node:assert/strict";
import { makeWindow, fakeStore } from "./_load.mjs";

function freshProgress() {
  const win = makeWindow("core/progress.js");
  win.KG.Progress.setStore(fakeStore());
  return win.KG.Progress;
}

test("口算：recordMathWin 写星星、解锁下一关", () => {
  const P = freshProgress();
  assert.equal(P.isMathUnlocked("easy", 1), true, "第1关恒解锁");
  assert.equal(P.isMathUnlocked("easy", 2), false, "第2关初始锁定");
  P.recordMathWin("easy", 1, { stars: 2, accuracy: 0.8, time: null, maxCombo: 3, nextLevelId: 2 });
  assert.equal(P.isMathUnlocked("easy", 2), true, "过第1关后解锁第2关");
  const rec = P.getMathLevel("easy", 1);
  assert.equal(rec.stars, 2);
  assert.equal(rec.plays, 1);
});

test("口算：星星/正确率取 max 不回退，用时取 min", () => {
  const P = freshProgress();
  P.recordMathWin("hard", 1, { stars: 3, accuracy: 1.0, time: 40, maxCombo: 5, nextLevelId: 2 });
  P.recordMathWin("hard", 1, { stars: 1, accuracy: 0.5, time: 30, maxCombo: 2, nextLevelId: 2 });
  const rec = P.getMathLevel("hard", 1);
  assert.equal(rec.stars, 3, "星星不回退");
  assert.equal(rec.bestAccuracy, 1.0, "正确率取 max");
  assert.equal(rec.bestTime, 30, "用时取 min");
  assert.equal(rec.maxCombo, 5, "连击取 max");
  assert.equal(rec.plays, 2, "游玩次数累加");
});

test("翻翻乐：recordMemoryResult 步数/用时取 min，返回新纪录标志", () => {
  const P = freshProgress();
  let r = P.recordMemoryResult("animals", "easy", { steps: 10, time: 30 });
  assert.deepEqual(r, { newStepsRecord: true, newTimeRecord: true }, "首次都是新纪录");
  r = P.recordMemoryResult("animals", "easy", { steps: 8, time: 40 });
  assert.equal(r.newStepsRecord, true, "更少步数 → 新纪录");
  assert.equal(r.newTimeRecord, false, "用时更长 → 不破纪录");
  const best = P.getMemoryBest("animals", "easy");
  assert.equal(best.steps, 8, "保留最少步数");
  assert.equal(best.time, 30, "保留最短用时");
});

test("翻翻乐：无计时档 time=null 不污染纪录", () => {
  const P = freshProgress();
  const r = P.recordMemoryResult("fruits", "easy", { steps: 6, time: null });
  assert.equal(r.newTimeRecord, false);
  assert.equal(P.getMemoryBest("fruits", "easy").time, null);
});

test("设置：默认开声、开读题；可切换并持久化", () => {
  const P = freshProgress();
  assert.deepEqual(P.getSettings(), { muted: false, speakRead: true }, "默认开声开读题");
  P.setMuted(true);
  P.setSpeakRead(false);
  assert.deepEqual(P.getSettings(), { muted: true, speakRead: false });
});

test("reset 清空存档", () => {
  const P = freshProgress();
  P.recordMathWin("easy", 1, { stars: 3, accuracy: 1, time: null, maxCombo: 0, nextLevelId: 2 });
  P.reset();
  assert.equal(P.getMathLevel("easy", 1), null, "重置后无记录");
  assert.equal(P.isMathUnlocked("easy", 2), false, "重置后回到锁定");
});
