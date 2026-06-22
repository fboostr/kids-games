// main.js —— 翻翻乐 UI 接线：主题卡 / 难度卡 / 棋盘渲染 / 翻牌时序 / 结算 / 纪录存档。
(function () {
  KG.Speaker.init();

  const $ = (id) => document.getElementById(id);
  const board = $("board");
  const gameEl = $("game");
  const topbar = $("topbar");
  const winScreen = $("win-screen");
  const screens = { theme: $("screen-theme"), tier: $("screen-tier"), game: $("game") };
  const _show = KG.Router.makeShowScreen(screens);
  function showScreen(which) {
    _show(which);
    KG.Router.show(topbar, which === "game");
    KG.Router.show(winScreen, false);
  }

  // 三档：牌阵 cols*rows = pairs*2。keepLit 低龄留亮、高档移除腾位。
  const TIERS = [
    { key: "easy",   emoji: "🐣", label: "启蒙", cols: 3, rows: 4, pairs: 6,  timer: false, speakOnFlip: true,  keepLit: true,  flipMs: 850, desc: "3×4 · 6 对 · 留亮不计时" },
    { key: "medium", emoji: "🦊", label: "进阶", cols: 4, rows: 4, pairs: 8,  timer: false, speakOnFlip: true,  keepLit: true,  flipMs: 800, desc: "4×4 · 8 对 · 记步数" },
    { key: "hard",   emoji: "🐉", label: "挑战", cols: 5, rows: 6, pairs: 15, timer: true,  speakOnFlip: false, keepLit: false, flipMs: 550, desc: "5×6 · 15 对 · 计时+消失腾位" },
  ];

  let game = null;
  let curTheme = null;
  let curTier = null;
  let uidToEl = {};

  // ---------- 主题卡 ----------
  function buildThemeCards() {
    const wrap = $("theme-cards");
    wrap.innerHTML = "";
    for (const theme of KG.THEMES) {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "diff-card theme-card";
      card.innerHTML =
        '<div class="diff-emoji">' + themeIcon(theme) + "</div>" +
        '<div class="diff-label">' + theme.name + "</div>" +
        '<div class="diff-age">' + matchLabel(theme) + "</div>" +
        '<div class="diff-desc">' + theme.pairs.length + " 对 · " + categoryLabel(theme.category) + "</div>";
      card.addEventListener("click", () => openTier(theme));
      wrap.appendChild(card);
    }
  }
  function themeIcon(theme) {
    const p0 = theme.pairs[0];
    const f = theme.match === "identical" ? p0.card : p0.a;
    if (f.type === "emoji") return f.emoji;
    if (f.type === "svg") return '<span class="theme-flag">' + f.svg + "</span>";
    return "🔤";
  }
  function matchLabel(theme) { return theme.match === "identical" ? "找相同" : "找关联"; }
  function categoryLabel(cat) {
    return { zero: "认物", chinese: "语文", english: "英语", world: "百科" }[cat] || "认知";
  }

  // ---------- 难度卡 ----------
  function openTier(theme) {
    curTheme = theme;
    $("tier-title").textContent = themeIcon(theme).indexOf("<") === 0 ? theme.name + " · 选难度" : theme.name + " · 选难度";
    $("tier-subtitle").textContent = matchLabel(theme) + "：" + theme.name;
    const wrap = $("tier-cards");
    wrap.innerHTML = "";
    for (const tier of TIERS) {
      const best = KG.Progress.getMemoryBest(theme.id, tier.key);
      let badge = "未挑战";
      if (best) {
        badge = "🏅 最少 " + best.steps + " 步";
        if (best.time != null) badge += " · " + fmtTime(best.time);
      }
      const card = document.createElement("button");
      card.type = "button";
      card.className = "diff-card";
      card.innerHTML =
        '<div class="diff-emoji">' + tier.emoji + "</div>" +
        '<div class="diff-label">' + tier.label + "</div>" +
        '<div class="diff-age">' + tier.desc + "</div>" +
        '<div class="diff-badge">' + badge + "</div>";
      card.addEventListener("click", () => startGame(theme, tier));
      wrap.appendChild(card);
    }
    showScreen("tier");
  }

  // ---------- 开局 ----------
  function startGame(theme, tier) {
    if (game) game.destroy();
    curTheme = theme;
    curTier = tier;
    showScreen("game");
    $("stat-theme").textContent = theme.name + " · " + tier.cols + "×" + tier.rows;
    $("stat-steps").textContent = "步数 0";
    KG.Router.show($("stat-timer"), !!tier.timer);
    $("stat-timer").textContent = "⏱️ 00:00";
    $("stat-combo").classList.add("hidden");

    game = new KG.MemoryGame({
      theme: theme,
      tier: tier,
      onBuild: renderBoard,
      onFlip: onFlip,
      onMatch: onMatch,
      onMismatch: onMismatch,
      onTick: (s) => { $("stat-timer").textContent = "⏱️ " + fmtTime(s); },
      onStats: (snap) => { $("stat-steps").textContent = "步数 " + snap.steps; },
      onWin: onWin,
    });
    game.build();
  }

  // ---------- 棋盘渲染 ----------
  // 按「宽 + 高」双向算出最大牌宽 --cell，让 m×n 牌阵完整缩放到一屏，永不滚动。
  function fitBoard() {
    if (!curTier || !board.children.length) return;
    const cols = curTier.cols, rows = curTier.rows;
    const gap = curTier.pairs >= 12 ? 8 : 12;
    const cs = getComputedStyle(gameEl);
    const usableW = gameEl.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    const usableH = gameEl.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
    if (usableW <= 0 || usableH <= 0) return;
    const cellByW = (usableW - (cols - 1) * gap) / cols;
    const cellByH = ((usableH - (rows - 1) * gap) / rows) * 3 / 4; // 牌高 = cell*4/3
    const cell = Math.max(36, Math.floor(Math.min(cellByW, cellByH)));
    board.style.setProperty("--cols", cols);
    board.style.setProperty("--cell", cell + "px");
    board.style.gap = gap + "px";
  }

  function renderBoard(cards) {
    board.innerHTML = "";
    uidToEl = {};
    for (const c of cards) {
      const el = document.createElement("button");
      el.type = "button";
      el.className = "mem-card";
      el.dataset.uid = c.uid;
      el.setAttribute("aria-label", "翻牌");
      el.innerHTML =
        '<div class="mem-inner">' +
        '<div class="mem-face mem-back">?</div>' +
        '<div class="mem-face mem-front">' + renderFace(c.face) + "</div>" +
        "</div>";
      uidToEl[c.uid] = el;
      board.appendChild(el);
    }
    fitBoard();
  }
  function renderFace(face) {
    if (face.type === "emoji") return '<span class="mem-emoji">' + face.emoji + "</span>";
    if (face.type === "svg") return '<span class="mem-svg">' + face.svg + "</span>";
    return '<span class="mem-text">' + face.text + "</span>";
  }

  // 棋盘点击委托
  board.addEventListener("click", (e) => {
    const cardEl = e.target.closest(".mem-card");
    if (!cardEl || !game) return;
    game.flip(cardEl.dataset.uid);
  });

  // ---------- 引擎回调：翻面 / 配对 / 失败 ----------
  function onFlip(info) {
    const el = uidToEl[info.card.uid];
    if (el) el.classList.add("flipped");
    if (curTier.speakOnFlip) speakSay(info.card.say);
  }

  function onMatch(info) {
    const ea = uidToEl[info.a.uid], eb = uidToEl[info.b.uid];
    [ea, eb].forEach((el) => { if (el) { el.classList.add("matched"); el.disabled = true; } });
    speakSay(info.say);
    // 连击徽标
    if (info.combo >= 2) {
      const c = $("stat-combo");
      c.textContent = "🔥 连击 ×" + info.combo;
      c.classList.remove("hidden");
      if (info.combo >= 3 && ea) KG.sparkle(ea, 10 + info.combo);
    }
    if (!curTier.keepLit) {
      // 高档：配对后短暂展示再消失腾位（visibility 保留占位，防记忆错乱）
      setTimeout(() => { [ea, eb].forEach((el) => { if (el) el.classList.add("removed"); }); }, 600);
    }
  }

  function onMismatch(info) {
    const ea = uidToEl[info.a.uid], eb = uidToEl[info.b.uid];
    [ea, eb].forEach((el) => { if (el) el.classList.add("miss"); });
    setTimeout(() => {
      [ea, eb].forEach((el) => { if (el) { el.classList.remove("flipped", "miss"); } });
      if (game) game.clearMismatch();
    }, curTier.flipMs);
    // 连击中断
    $("stat-combo").classList.add("hidden");
  }

  function speakSay(say) {
    if (!say) return;
    const lang = curTheme && curTheme.sayLang ? curTheme.sayLang : "zh-CN";
    KG.Speaker.speak(say, { lang: lang });
  }

  // ---------- 结算 ----------
  function onWin(stats) {
    KG.celebrate();
    KG.Speaker.speak("全部配对成功，你真棒！");
    const rec = KG.Progress.recordMemoryResult(stats.themeId, stats.tierKey, {
      steps: stats.steps,
      time: stats.timer ? stats.elapsed : null,
    });
    let html = '<div class="win-metrics">';
    html += "<span>👣 步数 " + stats.steps + (rec.newStepsRecord ? ' <b class="win-record">新纪录!</b>' : "") + "</span>";
    if (stats.maxCombo >= 2) html += "<span>🔥 最高连击 " + stats.maxCombo + "</span>";
    if (stats.timer) {
      html += "<span>⏱️ 用时 " + fmtTime(stats.elapsed) + (rec.newTimeRecord ? ' <b class="win-record">新纪录!</b>' : "") + "</span>";
    }
    html += "</div>";
    $("win-stats").innerHTML = html;
    setTimeout(() => KG.Router.show(winScreen, true), 700);
  }

  // ---------- 按钮 ----------
  $("btn-back-theme").addEventListener("click", () => showScreen("theme"));
  $("btn-restart").addEventListener("click", () => startGame(curTheme, curTier));
  $("btn-themes").addEventListener("click", () => { if (game) game.destroy(); showScreen("theme"); });
  $("btn-again").addEventListener("click", () => startGame(curTheme, curTier));
  $("btn-change-tier").addEventListener("click", () => openTier(curTheme));
  $("btn-change-theme").addEventListener("click", () => showScreen("theme"));

  const muteBtn = $("btn-mute");
  function refreshMuteBtn() { muteBtn.textContent = KG.Speaker.muted ? "🔇" : "🔊"; }
  muteBtn.addEventListener("click", () => {
    const muted = KG.Speaker.toggleMute();
    KG.Progress.setMuted(muted);
    refreshMuteBtn();
  });

  function fmtTime(sec) {
    const m = Math.floor(sec / 60), s = sec % 60;
    return String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
  }

  // 窗口缩放 / 转屏时棋盘实时重排（fitBoard 自带空棋盘/隐藏态守卫）
  window.addEventListener("resize", fitBoard);

  // 初始化
  KG.Speaker.setMuted(KG.Progress.getSettings().muted);
  if (!KG.Speaker.supported) muteBtn.classList.add("hidden");
  refreshMuteBtn();
  buildThemeCards();
  showScreen("theme");
})();
