// game.js —— 游戏核心：拖拽吸附、难度流程、计时计分、关卡推进、完成判定
window.PP = window.PP || {};

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function fmtTime(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

PP.Game = class {
  // diff：难度配置对象（PP.DIFFICULTIES[key] 或 PP.PROVINCE_DIFF）
  // dataset：{ width,height,items[],outline,nanhai,byRegionCapable,snap?,name? }
  constructor(diff, dataset, onWin) {
    this.diff = diff;
    this.dataset = dataset;
    this.onWin = onWin;
    this.snap = dataset.snap != null ? dataset.snap : diff.snap;
    this.byId = {};
    for (const p of dataset.items) this.byId[p.id] = p;

    this.placed = new Set();
    this.errors = 0;
    this.elapsed = 0;
    this.timerId = null;
    this.drag = null; // 当前拖拽状态

    // 大区分关：仅全国数据集（byRegionCapable）且难度开启时启用
    this.byRegion = !!(diff.byRegion && dataset.byRegionCapable);
    this.regions = this.byRegion
      ? PP.REGION_ORDER.filter((r) => dataset.items.some((p) => p.region === r))
      : [];
    this.regionIndex = 0;
  }

  start() {
    PP.Render.buildBoard(this.diff, this.dataset);
    this._toggleStat("stat-timer", this.diff.timer);
    this._toggleStat("stat-errors", this.diff.timer);
    if (this.diff.timer) this._startTimer();
    this.loadLevel();
  }

  // 当前这一关需要拼的块（全国分关取当前大区；其余取全部）
  currentBatch() {
    if (this.byRegion) {
      const r = this.regions[this.regionIndex];
      return this.dataset.items.filter((p) => p.region === r);
    }
    return this.dataset.items.slice();
  }

  loadLevel() {
    const batch = this.currentBatch();
    const remaining = batch.filter((p) => !this.placed.has(p.id));

    if (this.byRegion) {
      PP.Render.highlightRegion(
        this.regions[this.regionIndex],
        batch.map((p) => p.id)
      );
    }

    const tray = document.getElementById("tray");
    tray.innerHTML = "";
    for (const p of shuffle(remaining)) {
      const piece = PP.Render.makeTrayPiece(p, this.diff);
      piece.addEventListener("pointerdown", (e) => this._onPointerDown(e, p));
      tray.appendChild(piece);
    }
    this._updateStats();
  }

  // ---- 拖拽 ----
  _onPointerDown(e, p) {
    e.preventDefault();
    if (this.drag) return;
    if (this.diff.speakOnPick) PP.Speaker.speak(p.name);

    const pieceEl = e.currentTarget;
    pieceEl.classList.add("dragging");
    const clone = PP.Render.makeDragClone(p);
    this._moveClone(clone, e.clientX, e.clientY);

    this.drag = { p, clone, pieceEl, moved: false };
    this._mv = (ev) => this._onPointerMove(ev);
    this._up = (ev) => this._onPointerUp(ev);
    window.addEventListener("pointermove", this._mv, { passive: false });
    window.addEventListener("pointerup", this._up);
    window.addEventListener("pointercancel", this._up);
  }

  _onPointerMove(e) {
    if (!this.drag) return;
    e.preventDefault();
    this.drag.moved = true;
    this._moveClone(this.drag.clone, e.clientX, e.clientY);
  }

  _onPointerUp(e) {
    if (!this.drag) return;
    const { p, clone, pieceEl } = this.drag;
    window.removeEventListener("pointermove", this._mv);
    window.removeEventListener("pointerup", this._up);
    window.removeEventListener("pointercancel", this._up);

    const board = PP.Render.board.getBoundingClientRect();
    const overBoard =
      e.clientX >= board.left &&
      e.clientX <= board.right &&
      e.clientY >= board.top &&
      e.clientY <= board.bottom;

    const at = PP.Render.screenToBoard(e.clientX, e.clientY);
    const dist = Math.hypot(at.x - p.centroid[0], at.y - p.centroid[1]);

    this.drag = null;

    if (dist <= this.snap) {
      clone.remove();
      this._place(p, pieceEl);
    } else {
      // 放错：抖一下再消失；释放在棋盘上才算一次失误
      clone.classList.add("miss");
      setTimeout(() => clone.remove(), 300);
      pieceEl.classList.remove("dragging");
      // 仅当确实把拼块拖到棋盘上才算一次失误，托盘内随手放下不罚
      if (overBoard) {
        this.errors++;
        this._updateStats();
      }
    }
  }

  _moveClone(clone, x, y) {
    clone.style.left = x - clone._cx + "px";
    clone.style.top = y - clone._cy + "px";
  }

  // ---- 放置成功 ----
  _place(p, pieceEl) {
    this.placed.add(p.id);
    if (pieceEl) pieceEl.remove();
    PP.Render.placeProvince(p);
    if (this.diff.speakOnPlace) PP.Speaker.speak(p.name);
    this._updateStats();
    this._checkProgress();
  }

  _checkProgress() {
    if (this.byRegion) {
      const batch = this.currentBatch();
      const done = batch.every((p) => this.placed.has(p.id));
      if (done) {
        if (this.regionIndex < this.regions.length - 1) {
          this.regionIndex++;
          this.loadLevel(); // 进入下一大区
        } else {
          this._win();
        }
      }
    } else if (this.placed.size === this.dataset.items.length) {
      this._win();
    }
  }

  _win() {
    this._stopTimer();
    PP.Render.celebrate();
    PP.Speaker.speak("全部拼好啦，你真棒！");
    if (this.onWin) {
      this.onWin({
        diff: this.diff,
        dataset: this.dataset,
        elapsed: this.elapsed,
        errors: this.errors,
        total: this.dataset.items.length,
      });
    }
  }

  // ---- 计时 ----
  _startTimer() {
    this._stopTimer();
    this.timerId = setInterval(() => {
      this.elapsed++;
      const elTimer = document.getElementById("stat-timer");
      if (elTimer) elTimer.textContent = "⏱️ " + fmtTime(this.elapsed);
    }, 1000);
  }

  _stopTimer() {
    if (this.timerId) clearInterval(this.timerId);
    this.timerId = null;
  }

  destroy() {
    this._stopTimer();
    if (this.drag) {
      window.removeEventListener("pointermove", this._mv);
      window.removeEventListener("pointerup", this._up);
      window.removeEventListener("pointercancel", this._up);
      if (this.drag.clone) this.drag.clone.remove();
      this.drag = null;
    }
  }

  // ---- 状态栏 ----
  _updateStats() {
    const elLevel = document.getElementById("stat-level");
    const elProg = document.getElementById("stat-progress");
    const elErr = document.getElementById("stat-errors");

    if (this.byRegion) {
      const r = this.regions[this.regionIndex];
      const batch = this.currentBatch();
      const done = batch.filter((p) => this.placed.has(p.id)).length;
      elLevel.textContent = `第 ${this.regionIndex + 1}/${this.regions.length} 关 · ${r}`;
      elProg.textContent = `本关 ${done}/${batch.length}`;
    } else {
      // 分省显省名（🗺️ 河南），全国显难度（🦊 中等）
      const title = this.dataset.byRegionCapable
        ? this.diff.emoji + " " + this.diff.label
        : this.diff.emoji + " " + (this.dataset.name || this.diff.label);
      elLevel.textContent = title;
      elProg.textContent = `已拼 ${this.placed.size}/${this.dataset.items.length}`;
    }
    if (elErr) elErr.textContent = "❌ " + this.errors;
  }

  _toggleStat(id, show) {
    const elem = document.getElementById(id);
    if (elem) elem.classList.toggle("hidden", !show);
  }
};
