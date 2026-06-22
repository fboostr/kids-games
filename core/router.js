// router.js —— 极简屏幕路由：show/hide 各 section，仿「拼拼中国」main.js 的 showScreen。
window.KG = window.KG || {};

KG.Router = {
  // 显示/隐藏单个元素（用 .hidden class，base.css 里 display:none !important）
  show(el, visible) {
    if (el) el.classList.toggle("hidden", !visible);
  },

  // 工厂：传入 { screenKey: element } 映射，返回一个 showScreen(which) 函数，
  // 调用时把目标屏显示、其余隐藏。element 可为 null（容错）。
  makeShowScreen(screens) {
    const self = this;
    return function showScreen(which) {
      for (const key in screens) {
        self.show(screens[key], key === which);
      }
    };
  },
};
