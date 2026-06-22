// main.js —— 口算闯关 UI 接线：难度卡 / 闯关地图 / 顶栏 / 结算 / 存档解锁。
(function () {
  KG.Speaker.init();

  const $ = (id) => document.getElementById(id);
  const els = {
    equation: $("equation"), pictograph: $("pictograph"), feedback: $("feedback"),
    choices: $("choices"), inputArea: $("input-area"), answerBox: $("answer-box"),
    keypad: $("keypad"), combo: $("combo"),
    progressFill: $("progress-fill"), progressText: $("progress-text"),
    statLevel: $("stat-level"), statTimer: $("stat-timer"),
  };
  const topbar = $("topbar");
  const winScreen = $("win-screen");
  const screens = { diff: $("screen-diff"), map: $("screen-map"), game: $("game") };
  const _show = KG.Router.makeShowScreen(screens);
  function showScreen(which) {
    _show(which);
    KG.Router.show(topbar, which === "game");
    KG.Router.show(winScreen, false);
  }

  let game = null;
  let curDiff = null;     // 当前难度 key
  let curLevel = null;    // 当前关卡 cfg
  let lastStats = null;   // 最近一次结算 stats

  // ---------- 难度卡 ----------
  function buildDiffCards() {
    const wrap = $("diff-cards");
    wrap.innerHTML = "";
    for (const key of KG.MATH_DIFF_ORDER) {
      const d = KG.MATH_DIFFICULTIES[key];
      const card = document.createElement("button");
      card.type = "button";
      card.className = "diff-card diff-" + key;
      card.innerHTML =
        '<div class="diff-emoji">' + d.emoji + "</div>" +
        '<div class="diff-label">' + d.label + "</div>" +
        '<div class="diff-age">' + d.age + "</div>" +
        '<div class="diff-desc">' + d.desc + "</div>" +
        '<div class="diff-badge">' + diffStarSummary(key) + "</div>";
      card.addEventListener("click", () => openMap(key));
      wrap.appendChild(card);
    }
  }
  // 某档累计星星 / 总星
  function diffStarSummary(key) {
    const levels = KG.MATH_LEVELS[key];
    let got = 0;
    for (const lv of levels) {
      const rec = KG.Progress.getMathLevel(key, lv.id);
      if (rec) got += rec.stars;
    }
    const total = levels.length * 3;
    return got > 0 ? "⭐ " + got + "/" + total : "未开始";
  }

  // ---------- 闯关地图 ----------
  function openMap(key) {
    curDiff = key;
    const d = KG.MATH_DIFFICULTIES[key];
    $("map-title").textContent = d.emoji + " " + d.label + " · 闯关地图";
    $("map-subtitle").textContent = d.desc;
    const wrap = $("map-nodes");
    wrap.innerHTML = "";
    const levels = KG.MATH_LEVELS[key];
    for (const lv of levels) {
      const unlocked = KG.Progress.isMathUnlocked(key, lv.id);
      const rec = KG.Progress.getMathLevel(key, lv.id);
      const card = document.createElement("button");
      card.type = "button";
      card.className = "diff-card map-node";
      card.disabled = !unlocked;
      const stars = rec ? "⭐".repeat(rec.stars) + "☆".repeat(3 - rec.stars) : (unlocked ? "☆☆☆" : "🔒");
      card.innerHTML =
        '<div class="diff-emoji">' + (lv.emoji || "📍") + "</div>" +
        '<div class="diff-label">第' + lv.id + "关 · " + lv.name + "</div>" +
        '<div class="diff-age">' + lv.count + " 题 · " + (lv.mode === "choice" ? "选一选" : "打数字") + "</div>" +
        '<div class="diff-badge">' + stars + "</div>";
      if (unlocked) card.addEventListener("click", () => startLevel(key, lv, null));
      wrap.appendChild(card);
    }
    showScreen("map");
  }

  // ---------- 开始一关 ----------
  function startLevel(key, levelCfg, fixed) {
    if (game) game.destroy();
    curDiff = key;
    curLevel = levelCfg;
    showScreen("game");
    game = new KG.MathGame({
      diffKey: key,
      levelCfg: levelCfg,
      els: els,
      speakRead: KG.Progress.getSettings().speakRead,
      fixed: fixed,
      onWin: onWin,
    });
    game.start();
  }

  // ---------- 结算 ----------
  function onWin(stats) {
    lastStats = stats;
    const levels = KG.MATH_LEVELS[stats.diffKey];
    const next = levels.find((l) => l.id === stats.levelId + 1) || null;
    // 错题重练不写存档/不解锁（避免刷分），正常通关才记录
    if (!stats.isRetry) {
      KG.Progress.recordMathWin(stats.diffKey, stats.levelId, {
        stars: stats.stars,
        accuracy: stats.accuracy,
        time: stats.timer ? stats.elapsed : null,
        maxCombo: stats.maxCombo,
        nextLevelId: next ? next.id : null,
      });
    }

    $("win-title").textContent = stats.isRetry ? "错题重练完成！" : "过关啦！" + stats.levelName;
    $("win-stars").textContent = "⭐".repeat(stats.stars) + "☆".repeat(3 - stats.stars);
    let html = '<div class="win-metrics">';
    html += "<span>✅ 答对 " + stats.correct + "/" + stats.total + "</span>";
    html += "<span>🎯 正确率 " + Math.round(stats.accuracy * 100) + "%</span>";
    if (stats.maxCombo >= 2) html += "<span>🔥 最高连击 " + stats.maxCombo + "</span>";
    if (stats.timer) {
      const m = Math.floor(stats.elapsed / 60), s = stats.elapsed % 60;
      html += "<span>⏱️ 用时 " + String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0") + "</span>";
    }
    html += "</div>";
    $("win-stats").innerHTML = html;

    KG.Router.show($("btn-next"), !!next && !stats.isRetry);
    KG.Router.show($("btn-retry-wrong"), stats.wrongList.length > 0);
    KG.Router.show(winScreen, true);
  }

  // ---------- 按钮 ----------
  $("btn-back-diff").addEventListener("click", () => showScreen("diff"));
  $("btn-restart").addEventListener("click", () => startLevel(curDiff, curLevel, null));
  $("btn-map").addEventListener("click", () => { if (game) game.destroy(); openMap(curDiff); });

  $("btn-again").addEventListener("click", () => startLevel(curDiff, curLevel, null));
  $("btn-retry-wrong").addEventListener("click", () => {
    const fixed = lastStats ? lastStats.wrongList : null;
    if (fixed && fixed.length) startLevel(curDiff, curLevel, fixed);
  });
  $("btn-next").addEventListener("click", () => {
    const levels = KG.MATH_LEVELS[curDiff];
    const next = levels.find((l) => l.id === curLevel.id + 1);
    if (next) startLevel(curDiff, next, null);
  });
  $("btn-to-map").addEventListener("click", () => openMap(curDiff));

  // 读题开关
  const readBtn = $("btn-read");
  function refreshReadBtn() {
    const on = KG.Progress.getSettings().speakRead;
    readBtn.textContent = on ? "📢" : "🔕";
    readBtn.title = on ? "读题：开" : "读题：关";
  }
  readBtn.addEventListener("click", () => {
    const on = !KG.Progress.getSettings().speakRead;
    KG.Progress.setSpeakRead(on);
    if (game) game.speakRead = on;
    refreshReadBtn();
  });

  // 声音开关
  const muteBtn = $("btn-mute");
  function refreshMuteBtn() {
    muteBtn.textContent = KG.Speaker.muted ? "🔇" : "🔊";
  }
  muteBtn.addEventListener("click", () => {
    const muted = KG.Speaker.toggleMute();
    KG.Progress.setMuted(muted);
    refreshMuteBtn();
  });

  // 初始化设置
  KG.Speaker.setMuted(KG.Progress.getSettings().muted);
  if (!KG.Speaker.supported) { muteBtn.classList.add("hidden"); readBtn.classList.add("hidden"); }
  refreshReadBtn();
  refreshMuteBtn();

  buildDiffCards();
  showScreen("diff");
})();
