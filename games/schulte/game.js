// game.js —— 舒尔特方格状态机：按 1→N² 顺序点格、计时、点错提示、全部点完结算。
window.KG = window.KG || {};

KG.SchulteGame = class {
  // opts: { tier, els, speakRead, onWin }
  // tier: { key, size, emoji, label }
  // els: { board, nextHint, statTimer, statErrors }
  constructor(opts) {
    this.cfg = opts.tier;
    this.els = opts.els;
    this.speakRead = opts.speakRead !== false;
    this.onWin = opts.onWin || function () {};
    this.size = this.cfg.size;
    this.total = this.size * this.size;
    this.next = 1;
    this.errors = 0;
    this.elapsed = 0;
    this.timerId = null;
    this.finished = false;
    this.cells = {}; // value -> button
    this._onClick = this._onClick.bind(this);
  }

  start() {
    this.grid = KG.Schulte.buildGrid(this.size);
    this._renderBoard();
    this._updateHint();
    this._updateErrors();
    this._startTimer();
  }

  destroy() {
    this._stopTimer();
    if (this.els.board) this.els.board.removeEventListener("click", this._onClick);
  }

  _renderBoard() {
    const board = this.els.board;
    board.style.setProperty("--cols", this.size);
    board.classList.toggle("dense", this.size >= 5);
    board.innerHTML = "";
    this.cells = {};
    for (const val of this.grid) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "sch-cell";
      b.dataset.val = val;
      b.textContent = val;
      this.cells[val] = b;
      board.appendChild(b);
    }
    board.addEventListener("click", this._onClick);
  }

  _onClick(e) {
    const cell = e.target.closest(".sch-cell");
    if (!cell || this.finished) return;
    this._tap(parseInt(cell.dataset.val, 10), cell);
  }

  _tap(val, cell) {
    if (val === this.next) {
      cell.classList.add("found");
      cell.disabled = true;
      KG.sparkle(cell, 8);
      this.next++;
      if (this.next > this.total) return this._win();
      this._updateHint();
      if (this.speakRead && this.size <= 4) KG.Speaker.speak(String(this.next));
    } else {
      this.errors++;
      this._updateErrors();
      cell.classList.remove("wrong"); void cell.offsetWidth;
      cell.classList.add("wrong");
    }
  }

  _updateHint() {
    if (this.els.nextHint) this.els.nextHint.textContent = "👉 找 " + this.next;
  }
  _updateErrors() {
    if (this.els.statErrors) this.els.statErrors.textContent = "❌ " + this.errors;
  }

  _startTimer() {
    this._stopTimer();
    this.timerId = setInterval(() => {
      this.elapsed++;
      if (this.els.statTimer) this.els.statTimer.textContent = "⏱️ " + fmt(this.elapsed);
    }, 1000);
  }
  _stopTimer() {
    if (this.timerId) { clearInterval(this.timerId); this.timerId = null; }
  }

  _win() {
    this.finished = true;
    this._stopTimer();
    KG.celebrate();
    KG.Speaker.speak("全部找到，真厉害！");
    this.onWin({
      tierKey: this.cfg.key,
      size: this.size,
      elapsed: this.elapsed,
      errors: this.errors,
    });
  }
};

function fmt(sec) {
  const m = Math.floor(sec / 60), s = sec % 60;
  return String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
}
