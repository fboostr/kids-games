// main.js —— 舒尔特方格 UI 接线：难度卡 / 网格 / 结算 / 最快纪录存档。
(function () {
  KG.Speaker.init();

  const $ = (id) => document.getElementById(id);
  const topbar = $("topbar");
  const winScreen = $("win-screen");
  const screens = { tier: $("screen-tier"), game: $("game") };
  const _show = KG.Router.makeShowScreen(screens);
  function showScreen(which) {
    _show(which);
    KG.Router.show(topbar, which === "game");
    KG.Router.show(winScreen, false);
  }

  const TIERS = [
    { key: "s3", size: 3, emoji: "🐣", label: "3×3", desc: "1–9，刚上手" },
    { key: "s4", size: 4, emoji: "🦊", label: "4×4", desc: "1–16，进阶" },
    { key: "s5", size: 5, emoji: "🐯", label: "5×5", desc: "1–25，经典" },
    { key: "s6", size: 6, emoji: "🐉", label: "6×6", desc: "1–36，挑战" },
  ];

  const els = {
    board: $("sch-board"),
    nextHint: $("sch-next"),
    statTimer: $("stat-timer"),
    statErrors: $("stat-errors"),
  };
  let game = null;
  let curTier = null;

  function fmt(sec) {
    const m = Math.floor(sec / 60), s = sec % 60;
    return String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
  }

  function buildTierCards() {
    const wrap = $("tier-cards");
    wrap.innerHTML = "";
    for (const t of TIERS) {
      const best = KG.Progress.getSchulteBest(t.key);
      const badge = best && best.time != null ? "🏅 最快 " + fmt(best.time) : "未挑战";
      const card = document.createElement("button");
      card.type = "button";
      card.className = "diff-card";
      card.innerHTML =
        '<div class="diff-emoji">' + t.emoji + "</div>" +
        '<div class="diff-label">' + t.label + "</div>" +
        '<div class="diff-age">' + t.desc + "</div>" +
        '<div class="diff-badge">' + badge + "</div>";
      card.addEventListener("click", () => startGame(t));
      wrap.appendChild(card);
    }
  }

  function startGame(tier) {
    if (game) game.destroy();
    curTier = tier;
    els.nextHint.textContent = "👉 找 1";
    els.statTimer.textContent = "⏱️ 00:00";
    els.statErrors.textContent = "❌ 0";
    showScreen("game");
    game = new KG.SchulteGame({
      tier: tier,
      els: els,
      speakRead: KG.Progress.getSettings().speakRead,
      onWin: onWin,
    });
    game.start();
  }

  function onWin(stats) {
    const rec = KG.Progress.recordSchulte(stats.tierKey, { time: stats.elapsed });
    let html = '<div class="win-metrics">';
    html += "<span>⏱️ 用时 " + fmt(stats.elapsed) + (rec.newRecord ? ' <b class="win-record">新纪录!</b>' : "") + "</span>";
    html += "<span>❌ 点错 " + stats.errors + " 次</span>";
    html += "</div>";
    $("win-stats").innerHTML = html;
    setTimeout(() => KG.Router.show(winScreen, true), 650);
  }

  $("btn-restart").addEventListener("click", () => startGame(curTier));
  $("btn-again").addEventListener("click", () => startGame(curTier));
  $("btn-change-tier").addEventListener("click", () => { if (game) game.destroy(); showScreen("tier"); buildTierCards(); });
  $("btn-home").addEventListener("click", () => { location.href = "../../index.html"; });
  $("btn-home2").addEventListener("click", () => { location.href = "../../index.html"; });

  const muteBtn = $("btn-mute");
  function refreshMute() { muteBtn.textContent = KG.Speaker.muted ? "🔇" : "🔊"; }
  muteBtn.addEventListener("click", () => { KG.Progress.setMuted(KG.Speaker.toggleMute()); refreshMute(); });

  KG.Speaker.setMuted(KG.Progress.getSettings().muted);
  if (!KG.Speaker.supported) muteBtn.classList.add("hidden");
  refreshMute();
  buildTierCards();
  showScreen("tier");
})();
