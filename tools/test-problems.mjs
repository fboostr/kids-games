// test-problems.mjs —— 口算题目生成器边界单测。
import { test } from "node:test";
import assert from "node:assert/strict";
import { makeWindow } from "./_load.mjs";

const win = makeWindow("games/math/problems.js");
const P = win.KG.Problems;

// 各档代表性 gen 配置
const CFGS = {
  addEasy: { ops: ["+"], max: 10, allowCarry: false, choices: 4 },
  subEasy: { ops: ["-"], max: 10, allowCarry: false, choices: 4 },
  addSub100: { ops: ["+", "-"], max: 100, allowCarry: true, choices: 4 },
  mulTable: { ops: ["×"], max: 81, mulMax: 9, choices: 4 },
  divTable: { ops: ["÷"], max: 81, divMax: 9, choices: 4 },
  mul2x1: { ops: ["×"], max: 99, mulMax: 99, choices: 4 },
  three: { ops: ["+", "-"], max: 100, terms: 3, choices: 4 },
  paren: { ops: ["+", "-"], max: 100, terms: 3, parens: true, choices: 4 },
};

const N = 3000;

test("choices 始终：长度4 / 含正解 / 互不重复 / 非负整数", () => {
  for (const cfg of Object.values(CFGS)) {
    for (let i = 0; i < N; i++) {
      const p = P.genProblem(cfg);
      assert.equal(p.choices.length, 4, "长度4 " + p.text);
      assert.ok(p.choices.includes(p.answer), "含正解 " + p.text);
      assert.equal(new Set(p.choices).size, 4, "互不重复 " + p.text + " " + p.choices);
      assert.ok(p.choices.every((c) => Number.isInteger(c) && c >= 0), "非负整数 " + p.choices);
    }
  }
});

test("答案恒为非负整数（减法不出负数）", () => {
  for (const cfg of [CFGS.subEasy, CFGS.addSub100, CFGS.three, CFGS.paren]) {
    for (let i = 0; i < N; i++) {
      const p = P.genProblem(cfg);
      assert.ok(Number.isInteger(p.answer) && p.answer >= 0, "非负 " + p.text + "=" + p.answer);
    }
  }
});

test("除法只整除：被除数 % 除数 === 0 且商正确", () => {
  for (let i = 0; i < N; i++) {
    const p = P.genProblem(CFGS.divTable);
    const [a, b] = p.operands;
    assert.equal(a % b, 0, "整除 " + p.text);
    assert.equal(a / b, p.answer, "商正确 " + p.text);
    assert.ok(b >= 2, "除数>=2 避免 ÷1");
  }
});

test("不进位加法：逐位不进位", () => {
  for (let i = 0; i < N; i++) {
    const p = P.genProblem(CFGS.addEasy);
    const [a, b] = p.operands;
    assert.ok((a % 10) + (b % 10) <= 9, "个位不进位 " + p.text);
    assert.ok((Math.floor(a / 10) % 10) + (Math.floor(b / 10) % 10) <= 9, "十位不进位 " + p.text);
    assert.ok(a + b <= 10, "和不超 max " + p.text);
  }
});

test("不退位减法：逐位不退位", () => {
  for (let i = 0; i < N; i++) {
    const p = P.genProblem(CFGS.subEasy);
    const [a, b] = p.operands;
    assert.ok(a % 10 >= b % 10, "个位不退位 " + p.text);
    assert.ok(Math.floor(a / 10) % 10 >= Math.floor(b / 10) % 10, "十位不退位 " + p.text);
  }
});

test("两位数×一位数：积不超 max", () => {
  for (let i = 0; i < N; i++) {
    const p = P.genProblem(CFGS.mul2x1);
    assert.ok(p.answer <= 99, "积<=max " + p.text);
    assert.ok(p.operands[0] * p.operands[1] === p.answer);
  }
});

test("一关内去重：题空间足时不重复", () => {
  const lvl = P.genLevelProblems({ ops: ["+", "-"], max: 100, allowCarry: true }, 12);
  assert.equal(lvl.length, 12);
  assert.equal(new Set(lvl.map((x) => x.text)).size, 12, "一关 12 题互不相同");
});

test("题量恒满足（题空间小也凑够，不死循环）", () => {
  const lvl = P.genLevelProblems({ ops: ["+"], max: 5, allowCarry: false }, 30);
  assert.equal(lvl.length, 30, "凑满 30 题");
  for (const p of lvl) assert.ok(p.choices.includes(p.answer));
});

test("错题重练 fixed：沿用题面、重生成合法 choices", () => {
  const fixed = [
    { text: "7 + 5", answer: 12, op: "+", operands: [7, 5] },
    { text: "9 - 3", answer: 6, op: "-", operands: [9, 3] },
  ];
  const out = P.genLevelProblems({ ops: ["+", "-"], max: 20, allowCarry: true }, 2, { fixed });
  assert.deepEqual(out.map((p) => p.text), ["7 + 5", "9 - 3"]);
  for (const p of out) {
    assert.ok(p.choices.includes(p.answer));
    assert.equal(new Set(p.choices).size, 4);
  }
});
