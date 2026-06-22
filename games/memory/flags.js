// flags.js —— 内联国旗 SVG（避开 Windows emoji 国旗退化成 "CN"）+ 「国旗↔国名」主题。
// 只挑几何简单的旗（横/竖三色、十字、圆），各 viewBox 统一 30×20（瑞士方旗 20×20）。
// 纯数据，可在 Node 下单测。
window.KG = window.KG || {};
var KG = window.KG;
KG.THEMES = KG.THEMES || [];

// 中国国旗：红底 1 大 4 小黄星，星尖朝向大星中心（照搬「拼拼中国」star/smallStar 画法）。
var CN_FLAG = (function () {
  function star(cx, cy, r, deg) {
    const pts = [];
    for (let i = 0; i < 5; i++) {
      const a = ((-90 + deg) + i * 144) * Math.PI / 180;
      pts.push((cx + r * Math.cos(a)).toFixed(2) + "," + (cy + r * Math.sin(a)).toFixed(2));
    }
    return '<polygon points="' + pts.join(" ") + '"/>';
  }
  function smallStar(cx, cy) {
    const deg = Math.atan2(5 - cy, 5 - cx) * 180 / Math.PI + 90;
    return star(cx, cy, 1, deg);
  }
  return (
    '<svg viewBox="0 0 30 20" preserveAspectRatio="none" role="img" aria-label="中国国旗">' +
    '<rect width="30" height="20" fill="#de2910"/>' +
    '<g fill="#ffde00">' +
    star(5, 5, 3, 0) + smallStar(10, 2) + smallStar(12, 4) + smallStar(12, 7) + smallStar(10, 9) +
    "</g></svg>"
  );
})();

// 通用画旗辅助
function vstripes(cols) {
  // 竖三色：等宽 3 条
  const w = 30 / cols.length;
  let s = '<svg viewBox="0 0 30 20" preserveAspectRatio="none">';
  cols.forEach((c, i) => { s += '<rect x="' + (i * w) + '" width="' + w + '" height="20" fill="' + c + '"/>'; });
  return s + "</svg>";
}
function hstripes(cols) {
  // 横三/二色：等高
  const h = 20 / cols.length;
  let s = '<svg viewBox="0 0 30 20" preserveAspectRatio="none">';
  cols.forEach((c, i) => { s += '<rect y="' + (i * h) + '" width="30" height="' + h + '" fill="' + c + '"/>'; });
  return s + "</svg>";
}

KG.FLAGS = {
  CN: CN_FLAG,
  JP: '<svg viewBox="0 0 30 20" preserveAspectRatio="none"><rect width="30" height="20" fill="#fff"/><circle cx="15" cy="10" r="6" fill="#bc002d"/></svg>',
  FR: vstripes(["#0055A4", "#ffffff", "#EF4135"]),
  IT: vstripes(["#009246", "#ffffff", "#CE2B37"]),
  BE: vstripes(["#000000", "#FDDA24", "#EF3340"]),
  IE: vstripes(["#169B62", "#ffffff", "#FF883E"]),
  RO: vstripes(["#002B7F", "#FCD116", "#CE1126"]),
  DE: hstripes(["#000000", "#DD0000", "#FFCE00"]),
  RU: hstripes(["#ffffff", "#0039A6", "#D52B1E"]),
  NL: hstripes(["#AE1C28", "#ffffff", "#21468B"]),
  AT: hstripes(["#ED2939", "#ffffff", "#ED2939"]),
  PL: hstripes(["#ffffff", "#DC143C"]),
  UA: hstripes(["#0057B7", "#FFDD00"]),
  // 瑞典：蓝底偏左黄十字
  SE: '<svg viewBox="0 0 30 20" preserveAspectRatio="none"><rect width="30" height="20" fill="#006AA7"/><rect x="9" width="3" height="20" fill="#FECC00"/><rect y="8.5" width="30" height="3" fill="#FECC00"/></svg>',
  // 瑞士：红底白十字（方旗，viewBox 20×20）
  CH: '<svg viewBox="0 0 20 20" preserveAspectRatio="none"><rect width="20" height="20" fill="#D52B1E"/><rect x="8" y="3.5" width="4" height="13" fill="#fff"/><rect x="3.5" y="8" width="13" height="4" fill="#fff"/></svg>',
};

KG.THEME_FLAGS = {
  id: "flags", name: "国旗配国名", match: "association", category: "world",
  pairs: [
    { a: { type: "svg", svg: KG.FLAGS.CN }, b: { type: "text", text: "中国" }, say: "中国" },
    { a: { type: "svg", svg: KG.FLAGS.JP }, b: { type: "text", text: "日本" }, say: "日本" },
    { a: { type: "svg", svg: KG.FLAGS.FR }, b: { type: "text", text: "法国" }, say: "法国" },
    { a: { type: "svg", svg: KG.FLAGS.IT }, b: { type: "text", text: "意大利" }, say: "意大利" },
    { a: { type: "svg", svg: KG.FLAGS.DE }, b: { type: "text", text: "德国" }, say: "德国" },
    { a: { type: "svg", svg: KG.FLAGS.RU }, b: { type: "text", text: "俄罗斯" }, say: "俄罗斯" },
    { a: { type: "svg", svg: KG.FLAGS.NL }, b: { type: "text", text: "荷兰" }, say: "荷兰" },
    { a: { type: "svg", svg: KG.FLAGS.BE }, b: { type: "text", text: "比利时" }, say: "比利时" },
    { a: { type: "svg", svg: KG.FLAGS.IE }, b: { type: "text", text: "爱尔兰" }, say: "爱尔兰" },
    { a: { type: "svg", svg: KG.FLAGS.RO }, b: { type: "text", text: "罗马尼亚" }, say: "罗马尼亚" },
    { a: { type: "svg", svg: KG.FLAGS.AT }, b: { type: "text", text: "奥地利" }, say: "奥地利" },
    { a: { type: "svg", svg: KG.FLAGS.SE }, b: { type: "text", text: "瑞典" }, say: "瑞典" },
    { a: { type: "svg", svg: KG.FLAGS.CH }, b: { type: "text", text: "瑞士" }, say: "瑞士" },
    { a: { type: "svg", svg: KG.FLAGS.PL }, b: { type: "text", text: "波兰" }, say: "波兰" },
    { a: { type: "svg", svg: KG.FLAGS.UA }, b: { type: "text", text: "乌克兰" }, say: "乌克兰" },
  ],
};
KG.THEMES.push(KG.THEME_FLAGS);
