// main.js —— 打地鼠口算 UI 接线：难度卡 / 地洞 / 结算 / 最高分存档。
(function () {
  KG.Speaker.init();

  const $ = (id) => document.getElementById(id);
  const topbar = $("topbar");
  const winScreen = $("win-screen");
  const screens = { diff: $("screen-diff"), game: $("game") };
  const _show = KG.Router.makeShowScreen(screens);
  function showScreen(which) {
    _show(which);
    KG.Router.show(topbar, which === "game");
    KG.Router.show(winScreen, false);
  }

  // 难度：gen 复用口算题目生成器形状；holes/popMs/duration 控街机节奏；speak 只在最易档读题。
  const DIFFS = [
    { key: "m1", emoji: "🐣", label: "启蒙", desc: "10 以内加减 · 慢", gen: { ops: ["+", "-"], max: 10, allowCarry: false, choices: 4 }, holes: 6, popMs: 1500, duration: 60, speak: true },
    { key: "m2", emoji: "🦊", label: "进阶", desc: "100 以内加减 · 中", gen: { ops: ["+", "-"], max: 100, allowCarry: true, choices: 4 }, holes: 6, popMs: 1200, duration: 60, speak: false },
    { key: "m3", emoji: "🐯", label: "熟练", desc: "表内乘除 · 快", gen: { ops: ["×", "÷"], max: 81, mulMax: 9, divMax: 9, choices: 4 }, holes: 6, popMs: 1000, duration: 60, speak: false },
    { key: "m4", emoji: "🐉", label: "挑战", desc: "四则混合 · 极快", gen: { ops: ["+", "-", "×", "÷"], max: 99, mulMax: 9, divMax: 9, choices: 4 }, holes: 9, popMs: 850, duration: 60, speak: false },
  ];

  const els = {
    field: $("mole-field"),
    equation: $("equation"),
    statScore: $("stat-score"),
    statTimer: $("stat-timer"),
    statCombo: $("stat-combo"),
  };
  let game = null;
  let curDiff = null;

  function buildDiffCards() {
    const wrap = $("diff-cards");
    wrap.innerHTML = "";
    for (const d of DIFFS) {
      const best = KG.Progress.getMoleBest(d.key);
      const badge = best && best.score != null ? "🏅 最高 " + best.score + " 分" : "未挑战";
      const card = document.createElement("button");
      card.type = "button";
      card.className = "diff-card";
      card.innerHTML =
        '<div class="diff-emoji">' + d.emoji + "</div>" +
        '<div class="diff-label">' + d.label + "</div>" +
        '<div class="diff-age">' + d.desc + "</div>" +
        '<div class="diff-badge">' + badge + "</div>";
      card.addEventListener("click", () => startGame(d));
      wrap.appendChild(card);
    }
  }

  function startGame(diff) {
    if (game) game.destroy();
    curDiff = diff;
    els.statScore.textContent = "⭐ 0";
    els.statTimer.textContent = "⏳ " + diff.duration;
    els.statTimer.classList.remove("hurry");
    els.statCombo.classList.add("hidden");
    showScreen("game");
    game = new KG.MoleGame({
      diff: diff,
      els: els,
      speakRead: KG.Progress.getSettings().speakRead,
      onEnd: onEnd,
    });
    game.start();
  }

  function onEnd(stats) {
    const rec = KG.Progress.recordMole(stats.diffKey, { score: stats.score });
    let html = '<div class="win-metrics">';
    html += "<span>⭐ 得分 " + stats.score + (rec.newRecord ? ' <b class="win-record">新纪录!</b>' : "") + "</span>";
    if (stats.maxCombo >= 2) html += "<span>🔥 最高连击 " + stats.maxCombo + "</span>";
    html += "</div>";
    $("win-stats").innerHTML = html;
    setTimeout(() => KG.Router.show(winScreen, true), 700);
  }

  $("btn-restart").addEventListener("click", () => startGame(curDiff));
  $("btn-again").addEventListener("click", () => startGame(curDiff));
  $("btn-change-diff").addEventListener("click", () => { if (game) game.destroy(); showScreen("diff"); buildDiffCards(); });
  $("btn-home").addEventListener("click", () => { if (game) game.destroy(); location.href = "../../index.html"; });
  $("btn-home2").addEventListener("click", () => { location.href = "../../index.html"; });

  const muteBtn = $("btn-mute");
  function refreshMute() { muteBtn.textContent = KG.Speaker.muted ? "🔇" : "🔊"; }
  muteBtn.addEventListener("click", () => { KG.Progress.setMuted(KG.Speaker.toggleMute()); refreshMute(); });

  KG.Speaker.setMuted(KG.Progress.getSettings().muted);
  if (!KG.Speaker.supported) muteBtn.classList.add("hidden");
  refreshMute();
  buildDiffCards();
  showScreen("diff");
})();
