// problems.js —— 口算题目生成器（纯逻辑、零题库、不碰 DOM，可在 Node 下单测）。
// genProblem(config) -> { text, answer, choices, op, operands }
// 关键边界：减法不出负数、除法只整除、干扰项像样且含正解互异非负、一关内去重。
window.KG = window.KG || {};
var KG = window.KG; // 别名：浏览器里 window.KG 即全局；Node 单测垫片下让裸 KG 也指向同一对象

KG.Problems = (function () {
  function randInt(lo, hi) {
    if (hi < lo) hi = lo;
    return lo + Math.floor(Math.random() * (hi - lo + 1));
  }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function normalize(config) {
    config = config || {};
    return {
      ops: config.ops || ["+"],
      max: config.max != null ? config.max : 10,
      min: config.min || 0,
      allowCarry: !!config.allowCarry,
      terms: config.terms || 2,
      parens: !!config.parens,
      divExact: config.divExact !== false,
      divMax: config.divMax || 9,
      mulMax: config.mulMax || 9,
      choices: config.choices || 4,
    };
  }

  // —— 不进位加数：逐位约束，使 a+b 各位都不进位，且 a+b<=a+maxB ——
  function noCarryAddend(a, maxB) {
    const onesRoom = Math.min(9 - (a % 10), maxB);
    const ones = randInt(0, Math.max(0, onesRoom));
    const tensRoomCarry = 9 - (Math.floor(a / 10) % 10);
    const tensRoomMax = Math.floor((maxB - ones) / 10);
    const tens = randInt(0, Math.max(0, Math.min(tensRoomCarry, tensRoomMax)));
    return tens * 10 + ones;
  }

  function genAdd(cfg) {
    const max = cfg.max;
    let a, b, guard = 0;
    do {
      a = randInt(cfg.min, max);
      const maxB = max - a;
      b = cfg.allowCarry ? randInt(0, maxB) : noCarryAddend(a, maxB);
      guard++;
    } while (a + b === 0 && guard < 20); // 避免 0+0 这种无聊题
    return { op: "+", a, b, answer: a + b, text: a + " + " + b };
  }

  function genSub(cfg) {
    const max = cfg.max;
    let a, b, guard = 0;
    do {
      a = randInt(cfg.min, max); // 被减数
      if (cfg.allowCarry) {
        b = randInt(0, a); // a>=b 保证非负
      } else {
        // 不退位：b 的每一位 <= a 对应位
        const ones = randInt(0, a % 10);
        const tens = randInt(0, Math.floor(a / 10) % 10);
        const hund = randInt(0, Math.floor(a / 100) % 10);
        b = hund * 100 + tens * 10 + ones;
      }
      guard++;
    } while ((a === 0 || (b === 0 && Math.random() < 0.5)) && guard < 20);
    return { op: "-", a, b, answer: a - b, text: a + " - " + b };
  }

  function genMul(cfg) {
    const mulMax = cfg.mulMax || 9;
    const max = cfg.max || 81;
    let a, b, guard = 0;
    do {
      if (mulMax <= 9) {
        a = randInt(1, mulMax);
        b = randInt(1, mulMax);
      } else {
        // 两位数 × 一位数，积 <= max
        const one = randInt(2, 9);
        const hiMax = Math.min(99, Math.floor(max / one));
        const two = randInt(10, Math.max(10, hiMax));
        if (Math.random() < 0.5) { a = one; b = two; } else { a = two; b = one; }
      }
      guard++;
    } while (a === 1 && b === 1 && guard < 20); // 避免 1×1 退化
    return { op: "×", a, b, answer: a * b, text: a + " × " + b };
  }

  function genDiv(cfg) {
    const divMax = cfg.divMax || 9;
    const max = cfg.max || 81;
    const divisor = randInt(2, divMax); // 除数 >=2，避免 ÷1
    const maxQuot = Math.max(1, Math.min(9, Math.floor(max / divisor)));
    const quotient = randInt(1, maxQuot);
    const dividend = divisor * quotient; // 先定商和除数 → 天然整除
    return { op: "÷", a: dividend, b: divisor, answer: quotient, text: dividend + " ÷ " + divisor };
  }

  // 三项（仅 +/-，挑战档），从左到右逐步保证非负、不超 max；parens 时算 a op (b op2 c)
  function genThreeTerm(cfg) {
    const max = cfg.max;
    const ops = ["+", "-"];
    if (cfg.parens) {
      const op2 = pick(ops);
      let b, c, inner;
      if (op2 === "+") { b = randInt(1, max); c = randInt(0, max - b); inner = b + c; }
      else { b = randInt(1, max); c = randInt(0, b); inner = b - c; }
      const op1 = pick(ops);
      let a, answer;
      if (op1 === "+") { a = randInt(0, max - inner); answer = a + inner; }
      else { a = randInt(inner, max); answer = a - inner; } // a>=inner 保证非负
      return { op: "mixed", answer, text: a + " " + op1 + " (" + b + " " + op2 + " " + c + ")" };
    }
    const a = randInt(1, max);
    const op1 = pick(ops);
    let b, r1;
    if (op1 === "+") { b = randInt(0, max - a); r1 = a + b; }
    else { b = randInt(0, a); r1 = a - b; }
    const op2 = pick(ops);
    let c, answer;
    if (op2 === "+") { c = randInt(0, max - r1); answer = r1 + c; }
    else { c = randInt(0, r1); answer = r1 - c; }
    return { op: "mixed", answer, text: a + " " + op1 + " " + b + " " + op2 + " " + c };
  }

  // 干扰项候选池：贴近正解 + 常见错算（加错算减、乘法邻项、商±1 / 误填除数）
  function distractorPool(answer, ctx) {
    const pool = [answer + 1, answer - 1, answer + 2, answer - 2, answer + 10, answer - 10];
    if (ctx && ctx.a != null) {
      if (ctx.op === "+") pool.push(ctx.a - ctx.b);
      else if (ctx.op === "-") pool.push(ctx.a + ctx.b);
      else if (ctx.op === "×") pool.push(answer + ctx.a, answer - ctx.a, answer + ctx.b, answer - ctx.b);
      else if (ctx.op === "÷") pool.push(ctx.b, ctx.a - ctx.b, answer + 2);
    }
    return pool;
  }

  // 生成 choices：含正解、互不重复、全为非负整数，长度 = config.choices(默认4)
  function makeChoices(answer, ctx, config) {
    const cfg = config.choices ? config : normalize(config);
    const count = cfg.choices || 4;
    const set = new Set([answer]);
    const out = [];
    for (const c of shuffle(distractorPool(answer, ctx))) {
      if (out.length >= count - 1) break;
      if (Number.isInteger(c) && c >= 0 && !set.has(c)) { set.add(c); out.push(c); }
    }
    // 兜底：用逐渐远离正解的邻值补满（k 增长，answer+k 必正且唯一，保证收敛）
    let k = 1;
    while (out.length < count - 1) {
      for (const cand of [answer + k, answer - k]) {
        if (out.length >= count - 1) break;
        if (cand >= 0 && !set.has(cand)) { set.add(cand); out.push(cand); }
      }
      k++;
    }
    return shuffle([answer].concat(out));
  }

  function genProblem(config) {
    const cfg = normalize(config);
    let p;
    if (cfg.terms === 3) {
      p = genThreeTerm(cfg);
    } else {
      const op = pick(cfg.ops);
      if (op === "+") p = genAdd(cfg);
      else if (op === "-") p = genSub(cfg);
      else if (op === "×") p = genMul(cfg);
      else p = genDiv(cfg);
    }
    const ctx = { op: p.op, a: p.a != null ? p.a : null, b: p.b != null ? p.b : null };
    return {
      text: p.text,
      answer: p.answer,
      choices: makeChoices(p.answer, ctx, cfg),
      op: p.op,
      operands: p.a != null ? [p.a, p.b] : null,
    };
  }

  // 一关 count 道题，用 text 做 key 去重；题空间太小时兜底允许重复，避免死循环。
  // opts.fixed: 错题重练，直接用给定题集（[{text,answer,op,operands}]），仅重生成 choices。
  function genLevelProblems(gen, count, opts) {
    opts = opts || {};
    const cfg = normalize(gen);
    if (opts.fixed && opts.fixed.length) {
      return opts.fixed.map(function (item) {
        const ctx = { op: item.op, a: item.operands ? item.operands[0] : null, b: item.operands ? item.operands[1] : null };
        return {
          text: item.text, answer: item.answer, op: item.op,
          operands: item.operands || null,
          choices: makeChoices(item.answer, ctx, cfg),
        };
      });
    }
    const seen = new Set();
    const out = [];
    let attempts = 0;
    const maxAttempts = count * 20;
    while (out.length < count && attempts++ < maxAttempts) {
      const p = genProblem(cfg);
      if (seen.has(p.text)) continue;
      seen.add(p.text);
      out.push(p);
    }
    while (out.length < count) out.push(genProblem(cfg)); // 兜底凑满
    return out;
  }

  return {
    genProblem: genProblem,
    genLevelProblems: genLevelProblems,
    makeChoices: makeChoices,
    _internals: { normalize: normalize, distractorPool: distractorPool },
  };
})();
