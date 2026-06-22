// test-engine.mjs —— 翻翻乐引擎：发牌 / 洗牌 / 配对判定 / 整局流程 / 防连点。
import { test } from "node:test";
import assert from "node:assert/strict";
import { makeWindow, mulberry32 } from "./_load.mjs";

const win = makeWindow(
  "games/memory/engine.js",
  "games/memory/themes.js",
  "games/memory/flags.js",
  "games/memory/data/provinces-capitals.js"
);
const KG = win.KG;
const theme = (id) => KG.THEMES.find((t) => t.id === id);
const TIER = { key: "t", cols: 4, rows: 4, pairs: 8, timer: false }; // 无计时，避免 setInterval 挂起

test("buildDeck：对数正确、每个 pairKey 恰好两张", () => {
  for (const t of KG.THEMES) {
    for (const tier of [
      { cols: 3, rows: 4, pairs: 6 },
      { cols: 4, rows: 4, pairs: 8 },
      { cols: 5, rows: 6, pairs: 15 },
    ]) {
      const deck = KG.buildDeck(t, tier, mulberry32(42));
      const usePairs = Math.min(tier.pairs, Math.floor((tier.cols * tier.rows) / 2), t.pairs.length);
      assert.equal(deck.length, usePairs * 2, "对数 " + t.id);
      const cnt = {};
      for (const c of deck) cnt[c.pairKey] = (cnt[c.pairKey] || 0) + 1;
      assert.ok(Object.values(cnt).every((v) => v === 2), "每 pairKey 两张 " + t.id);
      assert.equal(Object.keys(cnt).length, usePairs, "pairKey 种类数 " + t.id);
    }
  }
});

test("洗牌可复现：同 seed 一致、不同 seed 不同", () => {
  const t = theme("hanzi-pinyin");
  const a = KG.buildDeck(t, TIER, mulberry32(9)).map((c) => c.uid).join(",");
  const b = KG.buildDeck(t, TIER, mulberry32(9)).map((c) => c.uid).join(",");
  const c = KG.buildDeck(t, TIER, mulberry32(10)).map((c) => c.uid).join(",");
  assert.equal(a, b, "同 seed 一致");
  assert.notEqual(a, c, "不同 seed 不同");
});

test("_isMatch：比 pairKey 不比文字；同一张为 false", () => {
  const g = new KG.MemoryGame({ theme: theme("hanzi-pinyin"), tier: TIER, rng: mulberry32(1) });
  g.build();
  const byPk = {};
  for (const c of g.cards) (byPk[c.pairKey] = byPk[c.pairKey] || []).push(c);
  const [a, b] = Object.values(byPk)[0];
  assert.ok(a.face.text !== b.face.text, "association 卡面文字不同");
  assert.equal(g._isMatch(a, b), true, "同 pairKey → 配对");
  assert.equal(g._isMatch(a, a), false, "同一张 → 不配对");
  const other = Object.values(byPk)[1][0];
  assert.equal(g._isMatch(a, other), false, "不同 pairKey → 不配对");
});

test("整局流程：依次配对至全胜，onWin 触发，步数 = 对数", () => {
  let won = null, matches = 0;
  const tier = { key: "x", cols: 3, rows: 4, pairs: 6, timer: false };
  const g = new KG.MemoryGame({
    theme: theme("animals"), tier, rng: mulberry32(5),
    onMatch: () => matches++,
    onWin: (s) => { won = s; },
  });
  g.build();
  const byPk = {};
  for (const c of g.cards) (byPk[c.pairKey] = byPk[c.pairKey] || []).push(c);
  for (const pair of Object.values(byPk)) {
    g.flip(pair[0].uid);
    g.flip(pair[1].uid); // 成功即时解锁，无需 clearMismatch
  }
  assert.ok(won, "onWin 触发");
  assert.equal(g.matchedCount, g.totalPairs, "全部配对");
  assert.equal(matches, g.totalPairs, "onMatch 次数 = 对数");
  assert.equal(won.steps, g.totalPairs, "步数 = 对数（全对路径每对 1 步）");
});

test("失败路径：onMismatch 触发，连击归零、加锁，clearMismatch 后可继续", () => {
  let mism = 0;
  const g = new KG.MemoryGame({ theme: theme("fruits"), tier: TIER, rng: mulberry32(2), onMismatch: () => mism++ });
  g.build();
  const byPk = {};
  for (const c of g.cards) (byPk[c.pairKey] = byPk[c.pairKey] || []).push(c);
  const p0 = Object.values(byPk)[0], p1 = Object.values(byPk)[1];
  g.combo = 3;
  g.flip(p0[0].uid); // 第一张
  g.flip(p1[0].uid); // 第二张，不同 pairKey → 失败（first 保留至 clearMismatch）
  assert.equal(mism, 1, "onMismatch 触发");
  assert.equal(g.combo, 0, "连击归零");
  assert.equal(g.locked, true, "失败后加锁");
  assert.equal(g.first.uid, p0[0].uid, "失败后 first 仍为第一张（待 clearMismatch）");
  g.flip(p0[1].uid); // 锁定期翻牌被忽略
  assert.equal(g.first.uid, p0[0].uid, "锁定期 flip 无效（first 不变）");
  g.clearMismatch();
  assert.equal(g.locked, false, "clearMismatch 解锁");
  assert.equal(g.first, null, "clearMismatch 清空 first");
});

test("防连点：locked 时 flip 被忽略", () => {
  const g = new KG.MemoryGame({ theme: theme("animals"), tier: TIER, rng: mulberry32(7) });
  g.build();
  g.locked = true;
  const before = g.first;
  g.flip(g.cards[0].uid);
  assert.equal(g.first, before, "锁定时 flip 不改变状态");
});

test("已配对的牌不可再翻", () => {
  const g = new KG.MemoryGame({ theme: theme("animals"), tier: TIER, rng: mulberry32(3) });
  g.build();
  g.cards[0].matched = true;
  g.flip(g.cards[0].uid);
  assert.equal(g.first, null, "已配对牌点击无效");
});
