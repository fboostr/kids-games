// grid.js —— 舒尔特方格纯逻辑：生成打乱的 1..n² 网格。不碰 DOM，可在 Node 下单测。
window.KG = window.KG || {};
var KG = window.KG; // 别名：让 Node 单测垫片下裸 KG 指向同一对象

KG.Schulte = (function () {
  // 生成长度 n*n、值为 1..n*n 的 Fisher-Yates 打乱数组；rng 可注入便于复现。
  function buildGrid(n, rng) {
    rng = rng || Math.random;
    const a = [];
    for (let i = 1; i <= n * n; i++) a.push(i);
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      const t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  return { buildGrid: buildGrid };
})();
