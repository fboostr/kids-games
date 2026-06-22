// test-mole.mjs —— 打地鼠口算「一题」构造（复用口算生成器）+ 存档最高分。
import { test } from "node:test";
import assert from "node:assert/strict";
import { makeWindow, fakeStore } from "./_load.mjs";

// round.js 依赖 KG.Problems，先加载 problems.js 到同一个 window
const win = makeWindow("games/math/problems.js", "games/mole/round.js");
const KG = win.KG;

const GENS = [
  { ops: ["+", "-"], max: 10, allowCarry: false, choices: 4 },
  { ops: ["×", "÷"], max: 81, mulMax: 9, divMax: 9, choices: 4 },
  { ops: ["+", "-", "×", "÷"], max: 99, mulMax: 9, divMax: 9, choices: 4 },
];

test("buildRound：恰一个正解地鼠、覆盖全部 choices、洞号互异且合法", () => {
  for (const gen of GENS) {
    for (const holes of [6, 9]) {
      for (let i = 0; i < 2000; i++) {
        const r = KG.Mole.buildRound(gen, holes);
        const answers = r.slots.filter((s) => s.isAnswer);
        assert.equal(answers.length, 1, "恰一个正解");
        assert.equal(answers[0].value, r.problem.answer, "正解 value === answer");
        const vals = r.slots.map((s) => s.value).sort((a, b) => a - b);
        const ch = r.problem.choices.slice().sort((a, b) => a - b);
        assert.deepEqual(vals, ch, "slots 覆盖全部 choices");
        const holesUsed = r.slots.map((s) => s.hole);
        assert.equal(new Set(holesUsed).size, holesUsed.length, "洞号互不相同");
        assert.ok(holesUsed.every((h) => h >= 0 && h < holes), "洞号在 [0,holes)");
      }
    }
  }
});

test("progress：打地鼠最高分取 max、返回新纪录标志", () => {
  const P = makeWindow("core/progress.js").KG.Progress;
  P.setStore(fakeStore());
  assert.equal(P.getMoleBest("m1"), null, "初始无纪录");
  assert.equal(P.recordMole("m1", { score: 10 }).newRecord, true, "首次新纪录");
  assert.equal(P.recordMole("m1", { score: 8 }).newRecord, false, "更低不破");
  assert.equal(P.recordMole("m1", { score: 15 }).newRecord, true, "更高破纪录");
  assert.equal(P.getMoleBest("m1").score, 15, "保留最高");
});
