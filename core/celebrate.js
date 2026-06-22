// celebrate.js —— 通关庆祝彩屑，照搬自「拼拼中国」render.js 的 celebrate。
window.KG = window.KG || {};

// 全屏彩屑，2.6s 后自动移除。count 可调（默认 60）。
KG.celebrate = function (count) {
  const n = count || 60;
  const wrap = document.createElement("div");
  wrap.className = "confetti";
  const colors = ["#f4b942", "#5b9be8", "#ec7d7d", "#4cc1a1", "#b07be0", "#f08a4b"];
  for (let i = 0; i < n; i++) {
    const c = document.createElement("i");
    c.style.left = (i / n) * 100 + "%";
    c.style.background = colors[i % colors.length];
    c.style.animationDelay = (i % 10) * 0.08 + "s";
    wrap.appendChild(c);
  }
  document.body.appendChild(wrap);
  setTimeout(() => wrap.remove(), 2600);
};

// 局部小彩屑：从某元素中心喷一小撮（高连击时用），不铺满全屏。
KG.sparkle = function (originEl, count) {
  const n = count || 16;
  const rect = originEl
    ? originEl.getBoundingClientRect()
    : { left: window.innerWidth / 2, top: window.innerHeight / 2, width: 0, height: 0 };
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const colors = ["#f4b942", "#5b9be8", "#ec7d7d", "#4cc1a1", "#b07be0"];
  const wrap = document.createElement("div");
  wrap.className = "sparkle";
  for (let i = 0; i < n; i++) {
    const s = document.createElement("i");
    const ang = (i / n) * Math.PI * 2;
    const dist = 50 + Math.random() * 60;
    s.style.left = cx + "px";
    s.style.top = cy + "px";
    s.style.setProperty("--dx", Math.cos(ang) * dist + "px");
    s.style.setProperty("--dy", Math.sin(ang) * dist + "px");
    s.style.background = colors[i % colors.length];
    wrap.appendChild(s);
  }
  document.body.appendChild(wrap);
  setTimeout(() => wrap.remove(), 900);
};
