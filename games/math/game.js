// game.js —— 口算单关状态机：出题→答→即时反馈→前进→过关。
// 渲染进 main.js 传入的 els 容器；纯游戏逻辑在此，UI 接线（难度卡/地图/结算）在 main.js。
window.KG = window.KG || {};

KG.MathGame = class {
  // opts: { diffKey, levelCfg, els, speakRead, onWin(stats) }
  // els: { equation, pictograph, choices, inputArea, answerBox, keypad, feedback,
  //        progressFill, progressText, combo, statLevel, statStars, statTimer }
  constructor(opts) {
    this.diffKey = opts.diffKey;
    this.cfg = opts.levelCfg;
    this.els = opts.els;
    this.speakRead = opts.speakRead !== false;
    this.onWin = opts.onWin || function () {};
    this.fixed = opts.fixed || null; // 错题重练题集

    const count = this.fixed ? this.fixed.length : this.cfg.count;
    this.problems = KG.Problems.genLevelProblems(this.cfg.gen, count, { fixed: this.fixed });
    this.count = this.problems.length;

    this.index = 0;
    this.correct = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.wrongList = [];
    this.elapsed = 0;
    this.timerId = null;
    this.locked = false;
    this.finished = false; // 过关后置真，挡掉遗留按钮的延迟点击（防越界崩溃）
    this.buffer = "";
    this._onKeypad = this._onKeypad.bind(this);
  }

  start() {
    this.els.keypad.addEventListener("click", this._onKeypad);
    if (this.els.statLevel) {
      this.els.statLevel.textContent = (this.cfg.emoji || "") + " " + this.cfg.name;
    }
    this._showTimer(this.cfg.timer);
    this._renderProblem();
    this._updateProgress();
  }

  destroy() {
    this._stopTimer();
    if (this.els && this.els.keypad) this.els.keypad.removeEventListener("click", this._onKeypad);
  }

  // ---------- 计时 ----------
  _showTimer(timer) {
    if (!this.els.statTimer) return;
    if (timer) {
      this.els.statTimer.classList.remove("hidden");
      this.els.statTimer.textContent = "⏱️ 00:00";
      this._startTimer();
    } else {
      this.els.statTimer.classList.add("hidden");
    }
  }
  _startTimer() {
    this._stopTimer();
    this.timerId = setInterval(() => {
      this.elapsed++;
      const m = Math.floor(this.elapsed / 60);
      const s = this.elapsed % 60;
      if (this.els.statTimer) {
        this.els.statTimer.textContent =
          "⏱️ " + String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
      }
    }, 1000);
  }
  _stopTimer() {
    if (this.timerId) { clearInterval(this.timerId); this.timerId = null; }
  }

  // ---------- 出题渲染 ----------
  _renderProblem() {
    const p = this.problems[this.index];
    this.buffer = "";
    this.els.feedback.textContent = "";
    this.els.feedback.className = "feedback";
    this.els.equation.innerHTML =
      '<span class="eq-text">' + p.text + '</span> <span class="eq-eq">=</span> <span class="eq-q">?</span>';

    this._renderPictograph(p);

    const isChoice = this.cfg.mode === "choice";
    KG.Router.show(this.els.choices, isChoice);
    KG.Router.show(this.els.inputArea, !isChoice);
    if (isChoice) this._renderChoices(p);
    else this.els.answerBox.textContent = "_";

    if (this.speakRead) this._speakProblem(p);
  }

  _renderChoices(p) {
    const wrap = this.els.choices;
    wrap.innerHTML = "";
    for (const c of p.choices) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "answer-btn";
      btn.textContent = c;
      btn.addEventListener("click", () => this._submit(c, btn));
      wrap.appendChild(btn);
    }
  }

  _renderPictograph(p) {
    const box = this.els.pictograph;
    if (!box) return;
    box.innerHTML = "";
    if (!this.cfg.pictograph || !p.operands || (p.op !== "+" && p.op !== "-")) {
      box.classList.add("hidden");
      return;
    }
    box.classList.remove("hidden");
    const a = p.operands[0], b = p.operands[1];
    const mkGroup = (n, crossFrom) => {
      const g = document.createElement("div");
      g.className = "dot-group";
      for (let i = 0; i < n; i++) {
        const d = document.createElement("span");
        d.className = "dot" + (crossFrom != null && i >= crossFrom ? " dot-x" : "");
        g.appendChild(d);
      }
      return g;
    };
    if (p.op === "+") {
      box.appendChild(mkGroup(a));
      const plus = document.createElement("span"); plus.className = "dot-op"; plus.textContent = "+";
      box.appendChild(plus);
      box.appendChild(mkGroup(b));
    } else {
      // 减法：画 a 个，划掉后 b 个
      box.appendChild(mkGroup(a, a - b));
    }
  }

  _speakProblem(p) {
    if (!KG.Speaker.canSpeak()) return;
    const spoken = p.text
      .replace(/×/g, " 乘 ")
      .replace(/÷/g, " 除以 ")
      .replace(/\+/g, " 加 ")
      .replace(/-/g, " 减 ")
      .replace(/[()]/g, " ");
    KG.Speaker.speak(spoken + " 等于几");
  }

  // ---------- 数字键盘 ----------
  _onKeypad(e) {
    const key = e.target.closest(".key");
    if (!key) return;
    const k = key.dataset.k;
    if (this.locked || this.finished) return;
    if (k === "del") {
      this.buffer = this.buffer.slice(0, -1);
    } else if (k === "enter") {
      if (this.buffer === "") { this._shakeAnswer(); return; }
      this._submit(parseInt(this.buffer, 10), null);
      return;
    } else if (/^\d$/.test(k)) {
      if (this.buffer.length < 4) this.buffer += k;
    }
    this.els.answerBox.textContent = this.buffer === "" ? "_" : this.buffer;
  }
  _shakeAnswer() {
    const el = this.els.answerBox;
    el.style.animation = "none";
    void el.offsetWidth;
    el.style.animation = "shake 0.3s";
  }

  // ---------- 答题统一入口 ----------
  _submit(given, btn) {
    if (this.locked || this.finished) return;
    const p = this.problems[this.index];
    if (!p) return; // 越界保护（过关瞬间的遗留点击）
    const right = given === p.answer;
    if (right) {
      this.correct++;
      this.combo++;
      this.maxCombo = Math.max(this.maxCombo, this.combo);
      this._feedbackRight(p, btn);
    } else {
      this.combo = 0;
      this._feedbackWrong(p, btn, given);
      const lenient = this.cfg.lenient;
      if (!lenient) this.wrongList.push({ text: p.text, answer: p.answer, op: p.op, operands: p.operands });
      if (lenient) {
        // 宽容档：原题再来，不前进、不计错
        this.locked = true;
        setTimeout(() => { this.locked = false; this._renderProblem(); }, 1100);
        this._updateCombo();
        return;
      }
    }
    this._updateCombo();
    this.locked = true;
    setTimeout(() => { this.locked = false; this._next(); }, right ? 750 : 1200);
  }

  _feedbackRight(p, btn) {
    if (btn) btn.classList.add("right");
    this.els.equation.querySelector(".eq-q").textContent = p.answer;
    this.els.equation.classList.add("eq-right");
    const praises = ["太棒了！", "答对啦！", "真厉害！", "好聪明！"];
    const msg = praises[Math.floor(Math.random() * praises.length)];
    this.els.feedback.textContent = "✅ " + msg;
    this.els.feedback.className = "feedback feedback-right";
    KG.Speaker.speak(msg);
    if (this.cfg.combo && this.combo >= 3) {
      KG.sparkle(this.els.equation, 12 + this.combo);
    }
    setTimeout(() => this.els.equation.classList.remove("eq-right"), 750);
  }

  _feedbackWrong(p, btn, given) {
    if (btn) btn.classList.add("wrong");
    // 在选择式里把正解按钮也点亮
    if (this.cfg.mode === "choice") {
      this.els.choices.querySelectorAll(".answer-btn").forEach((b) => {
        if (parseInt(b.textContent, 10) === p.answer) b.classList.add("right");
      });
    }
    this.els.equation.querySelector(".eq-q").textContent = p.answer;
    this.els.equation.classList.add("eq-wrong");
    this.els.feedback.textContent = "🤔 再想想～ 正确答案是 " + p.answer;
    this.els.feedback.className = "feedback feedback-wrong";
    KG.Speaker.speak("再想想");
    this.buffer = "";
    if (this.els.answerBox) this.els.answerBox.textContent = "_";
    setTimeout(() => this.els.equation.classList.remove("eq-wrong"), 1200);
  }

  _updateCombo() {
    if (!this.els.combo) return;
    if (this.cfg.combo && this.combo >= 2) {
      this.els.combo.textContent = "🔥 连击 ×" + this.combo;
      this.els.combo.classList.remove("hidden");
      this.els.combo.classList.remove("pop"); void this.els.combo.offsetWidth;
      this.els.combo.classList.add("pop");
    } else {
      this.els.combo.classList.add("hidden");
    }
  }

  _updateProgress() {
    const done = this.index;
    const pct = Math.round((done / this.count) * 100);
    if (this.els.progressFill) this.els.progressFill.style.width = pct + "%";
    if (this.els.progressText) this.els.progressText.textContent = "本关 " + done + "/" + this.count;
  }

  _next() {
    this.index++;
    if (this.index >= this.count) return this._win();
    this._renderProblem();
    this._updateProgress();
  }

  _win() {
    this.finished = true;
    this._stopTimer();
    if (this.els.progressFill) this.els.progressFill.style.width = "100%";
    if (this.els.progressText) this.els.progressText.textContent = "本关 " + this.count + "/" + this.count;
    KG.celebrate();
    const accuracy = this.count > 0 ? this.correct / this.count : 0;
    const stats = {
      diffKey: this.diffKey,
      levelCfg: this.cfg,
      levelId: this.cfg.id,
      levelName: this.cfg.name,
      total: this.count,
      correct: this.correct,
      accuracy: accuracy,
      elapsed: this.elapsed,
      maxCombo: this.maxCombo,
      timer: this.cfg.timer,
      wrongList: this.wrongList,
      isRetry: !!this.fixed,
    };
    stats.stars = KG.starsFor(stats);
    setTimeout(() => this.onWin(stats), 650);
  }
};
