// test-themes.mjs —— 8 个内置主题数据完整性。
import { test } from "node:test";
import assert from "node:assert/strict";
import { makeWindow } from "./_load.mjs";

const win = makeWindow(
  "games/memory/themes.js",
  "games/memory/flags.js",
  "games/memory/data/provinces-capitals.js"
);
const KG = win.KG;

test("共 8 个主题，id 唯一", () => {
  assert.equal(KG.THEMES.length, 8, "8 个主题");
  const ids = KG.THEMES.map((t) => t.id);
  assert.equal(new Set(ids).size, ids.length, "id 唯一");
});

test("每个主题结构合法，pairs >= 15（够最高档抽 15 对）", () => {
  for (const t of KG.THEMES) {
    assert.ok(t.name, "有名字 " + t.id);
    assert.ok(t.match === "identical" || t.match === "association", "match 合法 " + t.id);
    assert.ok(t.pairs.length >= 15, "pairs>=15 " + t.id + " 实际 " + t.pairs.length);
    for (const pair of t.pairs) {
      if (t.match === "identical") {
        assert.ok(pair.card && pair.card.type, "identical 有 card " + t.id);
      } else {
        assert.ok(pair.a && pair.a.type, "association 有 a " + t.id);
        assert.ok(pair.b && pair.b.type, "association 有 b " + t.id);
      }
    }
  }
});

test("国旗主题：a 面为内联 SVG、b 面为国名文字", () => {
  const flags = KG.THEMES.find((t) => t.id === "flags");
  assert.ok(flags, "存在国旗主题");
  assert.ok(flags.pairs.length >= 15, "国旗 >= 15 面");
  for (const pair of flags.pairs) {
    assert.equal(pair.a.type, "svg", "a 是 svg");
    assert.ok(/<svg[\s>]/.test(pair.a.svg), "svg 字符串含 <svg");
    assert.equal(pair.b.type, "text", "b 是文字");
    assert.ok(pair.b.text.length > 0, "国名非空");
  }
});

test("省会主题：34 省、id 唯一、省名与省会非空", () => {
  assert.equal(KG.PROVINCE_CAPITALS.length, 34, "34 省");
  const ids = KG.PROVINCE_CAPITALS.map((r) => r.id);
  assert.equal(new Set(ids).size, 34, "id 唯一");
  for (const r of KG.PROVINCE_CAPITALS) {
    assert.ok(r.province && r.capital, "省名/省会非空 " + r.id);
  }
  const provCap = KG.THEMES.find((t) => t.id === "prov-cap");
  assert.equal(provCap.pairs.length, 34, "主题 34 对");
});
