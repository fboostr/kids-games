// test-levels.mjs —— 口算档位/关卡配置自洽 + 星星评定。
import { test } from "node:test";
import assert from "node:assert/strict";
import { makeWindow } from "./_load.mjs";

const win = makeWindow("games/math/problems.js", "games/math/levels.js");
const KG = win.KG;
const VALID_OPS = new Set(["+", "-", "×", "÷"]);
const VALID_MODE = new Set(["choice", "input"]);

test("4 档难度卡元数据齐全", () => {
  assert.deepEqual(KG.MATH_DIFF_ORDER, ["easy", "medium", "hard", "challenge"]);
  for (const key of KG.MATH_DIFF_ORDER) {
    const d = KG.MATH_DIFFICULTIES[key];
    assert.ok(d && d.emoji && d.label && d.age && d.desc, "档元数据 " + key);
  }
});

test("每关配置合法，且能凑够题不抛错", () => {
  for (const key of KG.MATH_DIFF_ORDER) {
    const levels = KG.MATH_LEVELS[key];
    assert.ok(Array.isArray(levels) && levels.length >= 1, "有关卡 " + key);
    for (const lv of levels) {
      assert.ok(lv.count > 0, "count>0 " + key + lv.id);
      assert.ok(VALID_MODE.has(lv.mode), "mode 合法 " + key + lv.id);
      assert.ok(lv.gen && lv.gen.max > 0, "gen.max>0 " + key + lv.id);
      assert.ok(lv.gen.ops.every((o) => VALID_OPS.has(o)), "ops 合法 " + key + lv.id);
      const probs = KG.Problems.genLevelProblems(lv.gen, lv.count);
      assert.equal(probs.length, lv.count, "凑够题 " + key + lv.id);
    }
  }
});

test("starsFor：按正确率给 1-3 星，完成保底 1 星", () => {
  const base = { total: 10, elapsed: 0, timer: false };
  assert.equal(KG.starsFor({ ...base, accuracy: 1.0 }), 3);
  assert.equal(KG.starsFor({ ...base, accuracy: 0.9 }), 3);
  assert.equal(KG.starsFor({ ...base, accuracy: 0.8 }), 2);
  assert.equal(KG.starsFor({ ...base, accuracy: 0.7 }), 2);
  assert.equal(KG.starsFor({ ...base, accuracy: 0.5 }), 1);
  assert.equal(KG.starsFor({ ...base, accuracy: 0.0 }), 1); // 保底 1
});

test("starsFor：hard 计时关全对但太慢 → 降到 2 星", () => {
  const cfg = { starTime: 8 };
  const slow = { accuracy: 1.0, total: 10, elapsed: 100, timer: "hard", levelCfg: cfg }; // 每题 10s > 8s
  const fast = { accuracy: 1.0, total: 10, elapsed: 50, timer: "hard", levelCfg: cfg }; // 每题 5s
  assert.equal(KG.starsFor(slow), 2);
  assert.equal(KG.starsFor(fast), 3);
});
