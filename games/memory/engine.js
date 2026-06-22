// engine.js —— 翻翻乐通用记忆配对引擎。引擎只懂卡片/配对/翻面/计步计时/胜利，
// 不碰 DOM；DOM 由 main.js 通过回调驱动。发牌/洗牌/判定为纯逻辑，可在 Node 下单测。
window.KG = window.KG || {};
var KG = window.KG; // 别名：让 Node 单测垫片下裸 KG 指向同一对象

// Fisher-Yates 洗牌，只用传入的 rng（默认 Math.random），保证单测可复现。
KG.shuffle = function (arr, rng) {
  rng = rng || Math.random;
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const t = a[i]; a[i] = a[j]; a[j] = t;
  }
  return a;
};

KG.pickN = function (arr, n, rng) {
  return KG.shuffle(arr, rng).slice(0, n);
};

// 从 theme.pairs + tier 生成本局卡片数组（已洗牌）。
// 每对拆两张卡，打同一个 pairKey（用 picked 数组里的索引，绝不用卡面文字）。
KG.buildDeck = function (theme, tier, rng) {
  rng = rng || Math.random;
  const slots = tier.cols * tier.rows;
  const usePairs = Math.min(tier.pairs, Math.floor(slots / 2), theme.pairs.length);
  const picked = KG.pickN(theme.pairs, usePairs, rng);

  const deck = [];
  picked.forEach(function (pair, i) {
    const pairKey = "pk" + i;
    let a, b;
    if (theme.match === "identical") {
      a = pair.card; b = pair.card; // 两张卡面相同
    } else {
      a = pair.a; b = pair.b; // 关联配对：卡面不同，pairKey 相同
    }
    const say = pair.say != null ? pair.say : faceSay(a);
    deck.push({ uid: pairKey + "-a", pairKey: pairKey, face: a, say: say, matched: false });
    deck.push({ uid: pairKey + "-b", pairKey: pairKey, face: b, say: say, matched: false });
  });
  return KG.shuffle(deck, rng);
};

function faceSay(face) {
  if (!face) return "";
  return face.text || face.emoji || "";
}

KG.MemoryGame = class {
  // opts: { theme, tier, rng, onBuild, onFlip, onMatch, onMismatch, onTick, onStats, onWin }
  constructor(opts) {
    this.theme = opts.theme;
    this.tier = opts.tier;
    this.rng = opts.rng || Math.random;
    this.cb = {
      onBuild: opts.onBuild || noop,
      onFlip: opts.onFlip || noop,
      onMatch: opts.onMatch || noop,
      onMismatch: opts.onMismatch || noop,
      onTick: opts.onTick || noop,
      onStats: opts.onStats || noop,
      onWin: opts.onWin || noop,
    };
    this._resetState();
  }

  _resetState() {
    this.cards = [];
    this.byUid = {};
    this.first = null;
    this.locked = false;
    this.matchedCount = 0;
    this.totalPairs = 0;
    this.steps = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.elapsed = 0;
    this.timerId = null;
    this.started = false;
  }

  build() {
    this._stopTimer();
    this._resetState();
    this.cards = KG.buildDeck(this.theme, this.tier, this.rng);
    this.totalPairs = this.cards.length / 2;
    this.byUid = {};
    for (const c of this.cards) this.byUid[c.uid] = c;
    this.cb.onBuild(this.cards);
  }

  // 玩家翻一张牌
  flip(uid) {
    if (this.locked) return;
    const c = this.byUid[uid];
    if (!c || c.matched) return;
    if (this.first && this.first.uid === uid) return; // 不能点同一张两次

    if (!this.started && this.tier.timer) { this.started = true; this._startTimer(); }
    else this.started = true;

    if (!this.first) {
      this.first = c;
      this.cb.onFlip({ card: c, first: true });
      return;
    }
    // 第二张
    this.cb.onFlip({ card: c, first: false });
    this.steps++;
    this.cb.onStats(this.snapshot());
    this.locked = true;
    if (this._isMatch(this.first, c)) this._resolveMatch(this.first, c);
    else this._resolveMismatch(this.first, c);
  }

  _isMatch(a, b) {
    return a.pairKey === b.pairKey && a.uid !== b.uid;
  }

  _resolveMatch(a, b) {
    a.matched = true;
    b.matched = true;
    this.matchedCount++;
    this.combo++;
    this.maxCombo = Math.max(this.maxCombo, this.combo);
    const say = a.say != null ? a.say : b.say;
    this.cb.onMatch({ a: a, b: b, say: say, combo: this.combo });
    this.first = null;
    this.locked = false; // 成功即时解锁（无需回翻）
    if (this.matchedCount === this.totalPairs) this._win();
  }

  _resolveMismatch(a, b) {
    this.combo = 0;
    this.cb.onMismatch({ a: a, b: b });
    // 回翻延时归 UI；动画结束后由 main 调 clearMismatch() 解锁
  }

  clearMismatch() {
    this.first = null;
    this.locked = false;
  }

  _win() {
    this._stopTimer();
    this.cb.onWin(this.stats());
  }

  stats() {
    return {
      themeId: this.theme.id,
      themeName: this.theme.name,
      tierKey: this.tier.key,
      cols: this.tier.cols,
      rows: this.tier.rows,
      pairs: this.totalPairs,
      steps: this.steps,
      maxCombo: this.maxCombo,
      elapsed: this.elapsed,
      timer: this.tier.timer,
    };
  }

  snapshot() {
    return {
      steps: this.steps,
      combo: this.combo,
      matchedCount: this.matchedCount,
      totalPairs: this.totalPairs,
    };
  }

  reset() { this.build(); }

  destroy() {
    this._stopTimer();
    this.cb = { onBuild: noop, onFlip: noop, onMatch: noop, onMismatch: noop, onTick: noop, onStats: noop, onWin: noop };
  }

  _startTimer() {
    this._stopTimer();
    this.timerId = setInterval(() => {
      this.elapsed++;
      this.cb.onTick(this.elapsed);
    }, 1000);
  }
  _stopTimer() {
    if (this.timerId) { clearInterval(this.timerId); this.timerId = null; }
  }
};

function noop() {}
