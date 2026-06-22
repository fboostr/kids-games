// test-schulte.mjs —— 舒尔特方格网格生成 + 存档纪录。
import { test } from "node:test";
import assert from "node:assert/strict";
import { makeWindow, mulberry32, fakeStore } from "./_load.mjs";

const win = makeWindow("games/schulte/grid.js");
const KG = win.KG;

test("buildGrid：长度 n²、值恰为 1..n² 无缺无重", () => {
  for (const n of [3, 4, 5, 6]) {
    const g = KG.Schulte.buildGrid(n);
    assert.equal(g.length, n * n, n + "×" + n + " 长度");
    const sorted = g.slice().sort((a, b) => a - b);
    const expect = Array.from({ length: n * n }, (_, i) => i + 1);
    assert.deepEqual(sorted, expect, n + "×" + n + " 值集合 1..n²");
  }
});

test("buildGrid：同 seed 复现、不同 seed 不同", () => {
  const a = KG.Schulte.buildGrid(5, mulberry32(11));
  const b = KG.Schulte.buildGrid(5, mulberry32(11));
  const c = KG.Schulte.buildGrid(5, mulberry32(12));
  assert.deepEqual(a, b, "同 seed 一致");
  assert.notDeepEqual(a, c, "不同 seed 不同");
});

test("progress：舒尔特最快用时取 min、返回新纪录标志", () => {
  const P = makeWindow("core/progress.js").KG.Progress;
  P.setStore(fakeStore());
  assert.equal(P.getSchulteBest("s5"), null, "初始无纪录");
  assert.equal(P.recordSchulte("s5", { time: 40 }).newRecord, true, "首次新纪录");
  assert.equal(P.recordSchulte("s5", { time: 55 }).newRecord, false, "更慢不破");
  assert.equal(P.recordSchulte("s5", { time: 30 }).newRecord, true, "更快破纪录");
  assert.equal(P.getSchulteBest("s5").time, 30, "保留最快");
});
