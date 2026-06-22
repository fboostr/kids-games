// round.js —— 打地鼠口算「一题」的纯逻辑：复用 KG.Problems 生成题目，把正解+干扰项
// 分配到地洞。不碰 DOM，可在 Node 下单测。依赖先加载 games/math/problems.js。
window.KG = window.KG || {};
var KG = window.KG; // 别名：让 Node 单测垫片下裸 KG 指向同一对象

KG.Mole = (function () {
  // 打乱 [0..holes-1] 取前 k 个不同洞号
  function pickHoles(holes, k, rng) {
    const a = [];
    for (let i = 0; i < holes; i++) a.push(i);
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      const t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a.slice(0, k);
  }

  // buildRound(genConfig, holes, rng) -> { problem:{text,answer,choices}, slots:[{hole,value,isAnswer}] }
  // 不变量：恰好一个 isAnswer（value===answer）；slots 覆盖全部 choices；洞号互不相同且 < holes。
  function buildRound(genConfig, holes, rng) {
    rng = rng || Math.random;
    const p = KG.Problems.genProblem(genConfig); // {text, answer, choices, ...}
    const choices = p.choices.slice();
    const holeIdx = pickHoles(holes, choices.length, rng);
    const slots = choices.map(function (value, i) {
      return { hole: holeIdx[i], value: value, isAnswer: value === p.answer };
    });
    return { problem: { text: p.text, answer: p.answer, choices: choices }, slots: slots };
  }

  return { buildRound: buildRound };
})();
