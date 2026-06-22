// progress.js —— localStorage 存档：口算的星星/最佳成绩/解锁，翻翻乐的最少步数/最短用时，
// 以及全局设置（静音 / 读题）。全部读写 try/catch 静默降级：file:// 或隐私模式下
// localStorage 受限时存档失效，但游戏照常可玩（与 Speaker 的降级哲学一致）。
//
// 纯逻辑、不碰 DOM；_store 可注入（测试用 setStore 传一个 fake localStorage）。
window.KG = window.KG || {};
var KG = window.KG; // 别名：让 Node 单测垫片下裸 KG 指向同一对象

KG.Progress = (function () {
  const KEY = "KG_PROGRESS_V1";
  const SETTINGS_KEY = "KG_SETTINGS_V1";

  // 默认用浏览器 localStorage；Node/测试环境无则为 null，由 setStore 注入。
  let _store = typeof localStorage !== "undefined" ? localStorage : null;

  function _read(key) {
    if (!_store) return null;
    try {
      return JSON.parse(_store.getItem(key));
    } catch (e) {
      return null;
    }
  }
  function _write(key, value) {
    if (!_store) return;
    try {
      _store.setItem(key, JSON.stringify(value));
    } catch (e) {
      /* 配额/权限失败静默降级 */
    }
  }

  function _emptyDiff() {
    return { unlockedLevel: 1, levels: {} };
  }
  function _empty() {
    return { version: 1, math: {}, memory: {}, schulte: {}, mole: {} };
  }
  function _load() {
    const d = _read(KEY);
    if (!d || typeof d !== "object") return _empty();
    if (!d.math) d.math = {};
    if (!d.memory) d.memory = {};
    if (!d.schulte) d.schulte = {};
    if (!d.mole) d.mole = {};
    return d;
  }

  return {
    // —— 测试注入点 ——
    setStore(s) {
      _store = s;
    },

    // ============ 口算：星星 / 最佳 / 解锁 ============
    getMathDiff(diff) {
      return _load().math[diff] || _emptyDiff();
    },
    getMathLevel(diff, levelId) {
      const d = _load().math[diff];
      return (d && d.levels[levelId]) || null;
    },
    isMathUnlocked(diff, levelId) {
      // 第 1 关恒解锁；其余按 unlockedLevel
      if (levelId <= 1) return true;
      const d = _load().math[diff];
      return !!d && levelId <= d.unlockedLevel;
    },
    // 过关后调用：星星/正确率/连击取 max，用时取 min，解锁下一关。
    // 返回该关最新 record。
    recordMathWin(diff, levelId, info) {
      info = info || {};
      const data = _load();
      const d = (data.math[diff] = data.math[diff] || _emptyDiff());
      const rec =
        d.levels[levelId] ||
        { stars: 0, bestAccuracy: 0, bestTime: null, maxCombo: 0, plays: 0 };
      rec.stars = Math.max(rec.stars, info.stars || 0);
      rec.bestAccuracy = Math.max(rec.bestAccuracy, info.accuracy || 0);
      if (info.time != null) {
        rec.bestTime = rec.bestTime == null ? info.time : Math.min(rec.bestTime, info.time);
      }
      rec.maxCombo = Math.max(rec.maxCombo, info.maxCombo || 0);
      rec.plays += 1;
      d.levels[levelId] = rec;
      if (info.nextLevelId) {
        d.unlockedLevel = Math.max(d.unlockedLevel, info.nextLevelId);
      }
      _write(KEY, data);
      return rec;
    },

    // ============ 翻翻乐：最少步数 / 最短用时 ============
    getMemoryBest(themeId, tierKey) {
      const m = _load().memory[themeId];
      return (m && m[tierKey]) || null;
    },
    // 结算时调；返回 { newStepsRecord, newTimeRecord } 供 UI 显示「新纪录！」。
    recordMemoryResult(themeId, tierKey, info) {
      info = info || {};
      const data = _load();
      const m = (data.memory[themeId] = data.memory[themeId] || {});
      const prev = m[tierKey] || { steps: null, time: null };
      const out = { newStepsRecord: false, newTimeRecord: false };
      const next = { steps: prev.steps, time: prev.time };
      if (info.steps != null && (prev.steps == null || info.steps < prev.steps)) {
        next.steps = info.steps;
        out.newStepsRecord = true;
      }
      if (info.time != null && (prev.time == null || info.time < prev.time)) {
        next.time = info.time;
        out.newTimeRecord = true;
      }
      m[tierKey] = next;
      _write(KEY, data);
      return out;
    },

    // ============ 舒尔特方格：最快用时 ============
    getSchulteBest(tierKey) {
      return _load().schulte[tierKey] || null;
    },
    recordSchulte(tierKey, info) {
      info = info || {};
      const data = _load();
      const prev = data.schulte[tierKey] || { time: null };
      const out = { newRecord: false };
      if (info.time != null && (prev.time == null || info.time < prev.time)) {
        prev.time = info.time;
        out.newRecord = true;
      }
      data.schulte[tierKey] = prev;
      _write(KEY, data);
      return out;
    },

    // ============ 打地鼠口算：最高分 ============
    getMoleBest(diffKey) {
      return _load().mole[diffKey] || null;
    },
    recordMole(diffKey, info) {
      info = info || {};
      const data = _load();
      const prev = data.mole[diffKey] || { score: null };
      const out = { newRecord: false };
      if (info.score != null && (prev.score == null || info.score > prev.score)) {
        prev.score = info.score;
        out.newRecord = true;
      }
      data.mole[diffKey] = prev;
      _write(KEY, data);
      return out;
    },

    // ============ 设置：静音 / 读题（默认都「开声、读题」）============
    getSettings() {
      const s = _read(SETTINGS_KEY) || {};
      return {
        muted: s.muted === true, // 默认 false = 开声
        speakRead: s.speakRead !== false, // 默认 true = 读题
      };
    },
    setMuted(m) {
      const s = this.getSettings();
      s.muted = !!m;
      _write(SETTINGS_KEY, s);
    },
    setSpeakRead(b) {
      const s = this.getSettings();
      s.speakRead = !!b;
      _write(SETTINGS_KEY, s);
    },

    reset() {
      _write(KEY, _empty());
    },
  };
})();
