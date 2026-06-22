// main.js —— 入口：选玩法/难度/省份、开局、通关、重玩、回主菜单、读音开关
(function () {
  PP.Speaker.init();

  let game = null;
  let currentDiff = null;     // 当前难度配置对象
  let currentDataset = null;  // 当前数据集（全国 / 某省）

  // 中国国旗 SVG（替代 🇨🇳 emoji——Windows 字体不含国旗字形，emoji 会退化显示成 "CN"）。
  // 用内联 SVG 保证全平台像素级一致；尺寸随所在容器 font-size（1em）缩放。
  function star(cx, cy, r, deg) {           // 单颗黄色五角星 polygon
    const pts = [];
    for (let i = 0; i < 5; i++) {
      const a = ((-90 + deg) + i * 144) * Math.PI / 180;
      pts.push(`${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`);
    }
    return `<polygon points="${pts.join(" ")}"/>`;
  }
  // 小星朝向大星中心 (5,5)：旋转角取 atan2 指向角，使一只星尖对准大星
  function smallStar(cx, cy) {
    const deg = Math.atan2(5 - cy, 5 - cx) * 180 / Math.PI + 90;
    return star(cx, cy, 1, deg);
  }
  const CN_FLAG_SVG =
    `<svg class="cn-flag" viewBox="0 0 30 20" role="img" aria-label="中国国旗">` +
    `<rect width="30" height="20" fill="#de2910"/>` +
    `<g fill="#ffde00">` +
      star(5, 5, 3, 0) +        // 大星
      smallStar(10, 2) +        // 4 颗小星，星尖均指向大星
      smallStar(12, 4) +
      smallStar(12, 7) +
      smallStar(10, 9) +
    `</g></svg>`;

  const startScreen = document.getElementById("start-screen");
  const difficultyScreen = document.getElementById("difficulty-screen");
  const provinceScreen = document.getElementById("province-screen");
  const winScreen = document.getElementById("win-screen");
  const topbar = document.getElementById("topbar");
  const gameEl = document.getElementById("game");

  function show(elem, visible) {
    elem.classList.toggle("hidden", !visible);
  }

  // 切换主界面：mode（首页选玩法）/ difficulty / province / game
  function showScreen(which) {
    show(startScreen, which === "mode");
    show(difficultyScreen, which === "difficulty");
    show(provinceScreen, which === "province");
    show(winScreen, false);
    show(topbar, which === "game");
    show(gameEl, which === "game");
  }

  // ---- 数据集：全国 / 某省，统一形状供 Game/Render 使用 ----
  function nationalDataset() {
    return {
      width: window.MAP_DATA.width,
      height: window.MAP_DATA.height,
      items: window.MAP_DATA.provinces,
      outline: null,
      nanhai: window.MAP_DATA.nanhai,
      byRegionCapable: true,
    };
  }
  function provinceDataset(adcode) {
    const p = window.PROVINCE_PUZZLES[adcode];
    return {
      width: p.width,
      height: p.height,
      items: p.pieces,
      outline: p.outline,
      nanhai: null,
      byRegionCapable: false,
      snap: p.snapHint, // 按省尺度自适应吸附
      name: p.name,
    };
  }

  // ---- 玩法卡（首页）----
  function buildModeCards() {
    const wrap = document.getElementById("mode-cards");
    wrap.innerHTML = "";
    const modes = [
      { key: "national", emoji: CN_FLAG_SVG, label: "拼全国", desc: "把 34 个省级行政区拼回祖国版图，分三档难度" },
      { key: "province", emoji: "🗺️", label: "分省拼图", desc: "选一个省，把它的各个地级市拼成全省地图" },
    ];
    for (const m of modes) {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "diff-card mode-card mode-" + m.key;
      card.innerHTML =
        `<div class="diff-emoji">${m.emoji}</div>` +
        `<div class="diff-label">${m.label}</div>` +
        `<div class="diff-desc">${m.desc}</div>`;
      card.addEventListener("click", () =>
        showScreen(m.key === "national" ? "difficulty" : "province")
      );
      wrap.appendChild(card);
    }
  }

  // ---- 全国难度卡 ----
  function buildCards() {
    const wrap = document.getElementById("difficulty-cards");
    wrap.innerHTML = "";
    for (const key of ["easy", "medium", "hard"]) {
      const d = PP.DIFFICULTIES[key];
      const card = document.createElement("button");
      card.type = "button";
      card.className = "diff-card diff-" + key;
      card.innerHTML =
        `<div class="diff-emoji">${d.emoji}</div>` +
        `<div class="diff-label">${d.label}</div>` +
        `<div class="diff-age">${d.age}</div>` +
        `<div class="diff-desc">${d.desc}</div>`;
      card.addEventListener("click", () => startGame(d, nationalDataset()));
      wrap.appendChild(card);
    }
  }

  // ---- 省份选择网格 ----
  function buildProvinceGrid() {
    const wrap = document.getElementById("province-cards");
    wrap.innerHTML = "";
    const list = Object.values(window.PROVINCE_PUZZLES || {}).sort((a, b) =>
      String(a.id).localeCompare(String(b.id))
    );
    if (list.length === 0) {
      wrap.innerHTML = '<p class="tip">暂无分省数据，请先运行 tools/build-provinces.mjs。</p>';
      return;
    }
    for (const p of list) {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "prov-card";
      card.dataset.id = p.id;
      card.innerHTML =
        `<div class="prov-name">${p.name}</div>` +
        `<div class="prov-count">${p.pieces.length} 个地市</div>`;
      card.addEventListener("click", () => startGame(PP.PROVINCE_DIFF, provinceDataset(p.id)));
      wrap.appendChild(card);
    }
  }

  function startGame(diff, dataset) {
    if (game) game.destroy();
    currentDiff = diff;
    currentDataset = dataset;
    showScreen("game");
    game = new PP.Game(diff, dataset, onWin);
    game.start();
  }

  function onWin(stats) {
    const box = document.getElementById("win-stats");
    const isProvince = !stats.dataset.byRegionCapable;
    let html = isProvince
      ? `<p class="win-line">你把 ${stats.dataset.name} 的 ${stats.total} 个地市都拼好啦！🎈</p>`
      : `<p class="win-line">你认识了全部 ${stats.total} 个省级行政区，真厉害！${CN_FLAG_SVG}</p>`;
    if (stats.diff.timer) {
      const m = Math.floor(stats.elapsed / 60);
      const s = stats.elapsed % 60;
      html +=
        `<div class="win-metrics">` +
        `<span>⏱️ 用时 ${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}</span>` +
        `<span>❌ 放错 ${stats.errors} 次</span>` +
        `</div>`;
    } else if (stats.diff.key === "medium" || isProvince) {
      html += `<div class="win-metrics"><span>❌ 放错 ${stats.errors} 次</span></div>`;
    }
    box.innerHTML = html;
    setTimeout(() => show(winScreen, true), 600);
  }

  function goHome() {
    if (game) game.destroy();
    game = null;
    showScreen("mode");
  }

  // 按钮
  document.getElementById("btn-restart").addEventListener("click", () => startGame(currentDiff, currentDataset));
  document.getElementById("btn-home").addEventListener("click", goHome);
  document.getElementById("btn-again").addEventListener("click", () => startGame(currentDiff, currentDataset));
  document.getElementById("btn-change").addEventListener("click", goHome);
  document.getElementById("btn-back-diff").addEventListener("click", () => showScreen("mode"));
  document.getElementById("btn-back-prov").addEventListener("click", () => showScreen("mode"));

  const muteBtn = document.getElementById("btn-mute");
  muteBtn.addEventListener("click", () => {
    const muted = PP.Speaker.toggleMute();
    muteBtn.textContent = muted ? "🔇" : "🔊";
  });
  if (!PP.Speaker.supported) {
    muteBtn.classList.add("hidden");
  }

  // 副标题里的国旗占位回填（与玩法卡共用同一份 SVG，保持单一来源）
  const subtitleFlag = document.querySelector(".subtitle-flag");
  if (subtitleFlag) subtitleFlag.innerHTML = CN_FLAG_SVG;

  buildModeCards();
  buildCards();
  buildProvinceGrid();
  showScreen("mode");
})();
