// levels.js —— 口算 4 档难度卡元数据 + 各档 3 关（地图节点）配置 + 星星评定。
// 纯数据/纯函数，不碰 DOM，可在 Node 下单测。
window.KG = window.KG || {};
var KG = window.KG; // 别名：让 Node 单测垫片下裸 KG 指向同一对象

// 难度卡元数据（驱动 .diff-card 渲染）。顺序即由易到难。
KG.MATH_DIFFICULTIES = {
  easy:      { key: "easy",      emoji: "🐣", label: "启蒙", age: "4-6 岁 · 学龄前", desc: "10 以内加减，4 选 1，配○图示，点一点会读题" },
  medium:    { key: "medium",    emoji: "🦊", label: "进阶", age: "6-8 岁 · 低年级",  desc: "20/100 以内含进退位，先选一选再练打数字，有连击" },
  hard:      { key: "hard",      emoji: "🐯", label: "熟练", age: "8-10 岁",          desc: "表内乘除、两位数加减，数字键盘输入，会计时" },
  challenge: { key: "challenge", emoji: "🐉", label: "挑战", age: "10-12 岁",         desc: "四则混合、两步、带括号，计时 + 连击冲纪录" },
};
KG.MATH_DIFF_ORDER = ["easy", "medium", "hard", "challenge"];

// 每档 3 关。字段：
//   id 关号 / name 地图节点名 / count 题量 / mode 'choice'|'input'
//   timer false|'soft'|'hard'（soft 计时只记录不评速度，hard 计时影响速度星 + 连击特效）
//   combo 是否累计连击 / pictograph 是否配○图示（启蒙加减）
//   lenient 答错只提示不计错不前进（最宽容，启蒙用）
//   starTime 评 3 星的平均每题秒数阈值（仅 hard 计时关用）
//   gen 题目生成器参数（见 problems.js）
KG.MATH_LEVELS = {
  easy: [
    { id: 1, name: "森林", emoji: "🌳", count: 8,  mode: "choice", timer: false, combo: false, pictograph: true, lenient: true,
      gen: { ops: ["+"], max: 10, allowCarry: false, terms: 2, choices: 4 } },
    { id: 2, name: "草原", emoji: "🌾", count: 8,  mode: "choice", timer: false, combo: false, pictograph: true, lenient: true,
      gen: { ops: ["-"], max: 10, allowCarry: false, terms: 2, choices: 4 } },
    { id: 3, name: "小溪", emoji: "🏞️", count: 10, mode: "choice", timer: false, combo: false, pictograph: true, lenient: true,
      gen: { ops: ["+", "-"], max: 10, allowCarry: false, terms: 2, choices: 4 } },
  ],
  medium: [
    { id: 1, name: "村庄", emoji: "🏘️", count: 10, mode: "choice", timer: false, combo: true,
      gen: { ops: ["+", "-"], max: 20, allowCarry: true, terms: 2, choices: 4 } },
    { id: 2, name: "山脚", emoji: "⛰️", count: 10, mode: "choice", timer: false, combo: true,
      gen: { ops: ["+", "-"], max: 100, allowCarry: true, terms: 2, choices: 4 } },
    { id: 3, name: "石桥", emoji: "🌉", count: 10, mode: "input", timer: false, combo: true,
      gen: { ops: ["+", "-"], max: 100, allowCarry: true, terms: 2 } },
  ],
  hard: [
    { id: 1, name: "山洞", emoji: "🕳️", count: 10, mode: "input", timer: "soft", combo: true,
      gen: { ops: ["×"], max: 81, mulMax: 9, terms: 2 } },
    { id: 2, name: "矿井", emoji: "⛏️", count: 10, mode: "input", timer: "soft", combo: true,
      gen: { ops: ["÷"], max: 81, divMax: 9, divExact: true, terms: 2 } },
    { id: 3, name: "峡谷", emoji: "🏜️", count: 12, mode: "input", timer: "soft", combo: true,
      gen: { ops: ["+", "-", "×", "÷"], max: 99, mulMax: 9, divMax: 9, terms: 2 } },
  ],
  challenge: [
    { id: 1, name: "城墙", emoji: "🧱", count: 10, mode: "input", timer: "hard", combo: true, starTime: 10,
      gen: { ops: ["×"], max: 99, mulMax: 99, terms: 2 } }, // 两位数 × 一位数
    { id: 2, name: "城堡", emoji: "🏰", count: 12, mode: "input", timer: "hard", combo: true, starTime: 9,
      gen: { ops: ["+", "-"], max: 100, allowCarry: true, terms: 3 } }, // 两步
    { id: 3, name: "王座", emoji: "👑", count: 12, mode: "input", timer: "hard", combo: true, starTime: 9,
      gen: { ops: ["+", "-"], max: 100, allowCarry: true, terms: 3, parens: true } }, // 带括号
  ],
};

// 星星评定：按正确率给 1-3 星，hard 计时关叠加速度门槛。完成保底 1 星（鼓励）。
// stats: { accuracy, total, elapsed, timer, levelCfg }
KG.starsFor = function (stats) {
  const acc = stats.accuracy != null ? stats.accuracy : 0;
  let stars;
  if (acc >= 0.9) stars = 3;
  else if (acc >= 0.7) stars = 2;
  else stars = 1;
  if (stars === 3 && stats.timer === "hard" && stats.total > 0) {
    const perQ = stats.elapsed / stats.total;
    const limit = (stats.levelCfg && stats.levelCfg.starTime) || 10;
    if (perQ > limit) stars = 2; // 全对但太慢 → 降到 2 星
  }
  return Math.max(1, Math.min(3, stars));
};
