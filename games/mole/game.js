// game.js —— 打地鼠口算：限时街机。算式当前题，地鼠带数字冒头，拍中「等于答案」那只得分。
window.KG = window.KG || {};

KG.MoleGame = class {
  // opts: { diff, els, speakRead, onEnd }
  // diff: { key, emoji, label, gen, holes, popMs, duration, speak }
  // els: { field, equation, statScore, statTimer, statCombo }
  constructor(opts) {
    this.cfg = opts.diff;
    this.els = opts.els;
    this.speakRead = opts.speakRead !== false;
    this.onEnd = opts.onEnd || function () {};
    this.score = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.timeLeft = this.cfg.duration;
    this.holeMoles = {}; // hole -> { value, isAnswer }
    this.curValues = []; // 当前题 4 个数字 [{value,isAnswer}]
    this.finished = false;
    this.countdownId = null;
    this.reshuffleId = null;
    this._onClick = this._onClick.bind(this);
  }

  start() {
    this._buildField();
    this.els.field.addEventListener("click", this._onClick);
    this._updateStats();
    this.els.statTimer.textContent = "⏳ " + this.timeLeft;
    this._newRound();
    this.countdownId = setInterval(() => this._tick(), 1000);
    this.reshuffleId = setInterval(() => { if (!this.finished) this._placeAtRandomHoles(); }, this.cfg.popMs);
  }

  destroy() {
    this._stop();
    if (this.els.field) this.els.field.removeEventListener("click", this._onClick);
  }
  _stop() {
    if (this.countdownId) { clearInterval(this.countdownId); this.countdownId = null; }
    if (this.reshuffleId) { clearInterval(this.reshuffleId); this.reshuffleId = null; }
  }

  _buildField() {
    const field = this.els.field;
    field.style.setProperty("--cols", this.cfg.holes >= 9 ? 3 : 3); // 6→3列2行，9→3列3行
    field.innerHTML = "";
    for (let i = 0; i < this.cfg.holes; i++) {
      const hole = document.createElement("div");
      hole.className = "hole";
      hole.innerHTML =
        '<button class="mole" type="button" data-hole="' + i + '"><span class="mole-num"></span></button>';
      field.appendChild(hole);
    }
    this.moleEls = [].slice.call(field.querySelectorAll(".mole"));
  }

  _tick() {
    this.timeLeft--;
    this.els.statTimer.textContent = "⏳ " + Math.max(0, this.timeLeft);
    if (this.timeLeft <= 5) this.els.statTimer.classList.add("hurry");
    if (this.timeLeft <= 0) this._end();
  }

  _newRound() {
    const r = KG.Mole.buildRound(this.cfg.gen, this.cfg.holes);
    this.answer = r.problem.answer;
    this.curValues = r.problem.choices.map((v) => ({ value: v, isAnswer: v === r.problem.answer }));
    this.els.equation.innerHTML =
      '<span class="eq-text">' + r.problem.text + '</span> = <span class="eq-q">?</span>';
    this._placeAtRandomHoles();
    if (this.speakRead && this.cfg.speak) this._speakProblem(r.problem.text);
  }

  _placeAtRandomHoles() {
    const holes = pickHoles(this.cfg.holes, this.curValues.length);
    // 全部地鼠先缩回
    for (const m of this.moleEls) { m.classList.remove("up", "bonk", "miss"); m.firstChild.textContent = ""; }
    this.holeMoles = {};
    this.curValues.forEach((v, i) => {
      const hole = holes[i];
      const mole = this.moleEls[hole];
      mole.firstChild.textContent = v.value;
      mole.classList.add("up");
      this.holeMoles[hole] = v;
    });
  }

  _onClick(e) {
    const mole = e.target.closest(".mole");
    if (!mole || this.finished) return;
    const hole = parseInt(mole.dataset.hole, 10);
    const m = this.holeMoles[hole];
    if (!m || !mole.classList.contains("up")) return; // 没冒头的洞不算
    if (m.isAnswer) {
      this.score++;
      this.combo++;
      this.maxCombo = Math.max(this.maxCombo, this.combo);
      this._updateStats();
      mole.classList.add("bonk");
      KG.sparkle(mole, 10 + Math.min(this.combo, 10));
      this._newRound();
    } else {
      this.combo = 0;
      this._updateStats();
      mole.classList.remove("miss"); void mole.offsetWidth;
      mole.classList.add("miss");
    }
  }

  _updateStats() {
    this.els.statScore.textContent = "⭐ " + this.score;
    if (this.combo >= 2) {
      this.els.statCombo.textContent = "🔥 ×" + this.combo;
      this.els.statCombo.classList.remove("hidden");
    } else {
      this.els.statCombo.classList.add("hidden");
    }
  }

  _speakProblem(text) {
    if (!KG.Speaker.canSpeak()) return;
    const spoken = text
      .replace(/×/g, " 乘 ").replace(/÷/g, " 除以 ")
      .replace(/\+/g, " 加 ").replace(/-/g, " 减 ");
    KG.Speaker.speak(spoken + " 等于几");
  }

  _end() {
    this.finished = true;
    this._stop();
    for (const m of this.moleEls) m.classList.remove("up");
    KG.celebrate();
    KG.Speaker.speak("时间到，你真棒！");
    this.onEnd({ diffKey: this.cfg.key, score: this.score, maxCombo: this.maxCombo });
  }
};

function pickHoles(holes, k) {
  const a = [];
  for (let i = 0; i < holes; i++) a.push(i);
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = a[i]; a[i] = a[j]; a[j] = t;
  }
  return a.slice(0, k);
}
