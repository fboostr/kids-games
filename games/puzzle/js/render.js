// render.js —— SVG 渲染：底图轮廓、南海诸岛装饰、拼块、托盘、放置动画、坐标换算
window.PP = window.PP || {};

const SVG_NS = "http://www.w3.org/2000/svg";

function el(tag, attrs) {
  const node = document.createElementNS(SVG_NS, tag);
  if (attrs) for (const k in attrs) node.setAttribute(k, attrs[k]);
  return node;
}

PP.Render = {
  board: null,
  layers: null,
  currentWidth: 1000,

  // 按区域上色：有 region（全国省份）走七大区配色；否则（分省地市）按 colorIndex/索引取调色板
  pieceColor(item, idx) {
    if (item.region) return PP.REGION_COLORS[item.region] || "#7bc4a4";
    const pal = PP.PIECE_PALETTE || ["#7bc4a4"];
    const i = item.colorIndex != null ? item.colorIndex : idx || 0;
    return pal[i % pal.length];
  },

  // 搭建棋盘：底图轮廓（可选）、南海诸岛装饰、放置层、特效层
  // dataset：{ width,height,items[],outline,nanhai,byRegionCapable } —— 全国与分省统一形状
  buildBoard(diff, dataset) {
    // 兜底：未显式传 dataset 时按全国数据构造（正常路径由 main.js 传入）
    const data = dataset || {
      width: window.MAP_DATA.width,
      height: window.MAP_DATA.height,
      items: window.MAP_DATA.provinces,
      outline: null,
      nanhai: window.MAP_DATA.nanhai,
      byRegionCapable: true,
    };
    const board = document.getElementById("board");
    board.innerHTML = "";
    this.board = board;
    this.currentWidth = data.width || 1000;
    board.setAttribute("viewBox", `0 0 ${data.width || 1000} ${data.height || 820}`);

    const gOutline = el("g", { class: "layer-outline" });
    const gPlaced = el("g", { class: "layer-placed" });
    const gFx = el("g", { class: "layer-fx" });

    // 底图轮廓
    if (data.outline) {
      // 分省：只画一条省最外轮廓作参考框（不画地市槽位，玩家凭地市形状判断落位）
      gOutline.appendChild(el("path", { d: data.outline, class: "province-outline" }));
    } else if (diff.outline && diff.outlineMode === "silhouette") {
      // 困难档：同色填充叠成国界外框剑影（无省界内线、无名称）
      for (const p of data.items) {
        gOutline.appendChild(el("path", { d: p.path, class: "silhouette" }));
      }
    } else if (diff.outline) {
      // 简单/中等：每个省一个灰色槽位
      for (const p of data.items) {
        const slot = el("path", { d: p.path, class: "slot", "data-id": p.id });
        gOutline.appendChild(slot);
      }
      // 槽位省名（最简单档用：照着名字放）
      if (diff.outlineNames) {
        for (const p of data.items) {
          const t = el("text", {
            x: p.centroid[0],
            y: p.centroid[1],
            class: "slot-name",
          });
          t.textContent = p.name;
          gOutline.appendChild(t);
        }
      }
    }

    // 南海诸岛（静态装饰，始终显示，体现完整版图）
    if (data.nanhai) {
      const box = data.nanhai.box;
      const s = box.scale || 1; // 内嵌小图整体等比缩放系数（避免压住台湾）
      const g = el("g", {
        class: "nanhai",
        transform: `translate(${box.x},${box.y})`,
      });
      // 矩形 + 岛屿 path 一起等比缩放（path 用原始坐标，必须随框缩放否则溢出）
      const shape = el("g", { transform: `scale(${s})` });
      shape.appendChild(
        el("rect", { x: 0, y: 0, width: box.w, height: box.h, class: "nanhai-box" })
      );
      shape.appendChild(el("path", { d: data.nanhai.path, class: "nanhai-path" }));
      g.appendChild(shape);
      // 标签按缩放后尺寸定位，字号不随缩放（保持可读）
      const label = el("text", { x: (box.w * s) / 2, y: box.h * s - 8, class: "nanhai-label" });
      label.textContent = "南海诸岛";
      g.appendChild(label);
      gOutline.appendChild(g);
    }

    board.appendChild(gOutline);
    board.appendChild(gPlaced);
    board.appendChild(gFx);
    this.layers = { outline: gOutline, placed: gPlaced, fx: gFx };
    return this.layers;
  },

  // 高亮当前大区的槽位（简单档分关用）
  highlightRegion(region, provinceIds) {
    if (!this.layers) return;
    const active = new Set(provinceIds);
    this.layers.outline.querySelectorAll(".slot").forEach((s) => {
      s.classList.toggle("slot-active", active.has(s.getAttribute("data-id")));
    });
  },

  // 把一块（省/地市）正式放上棋盘（放对时调用）
  placeProvince(p) {
    const color = this.pieceColor(p);
    const path = el("path", {
      d: p.path,
      class: "placed",
      fill: color,
      "data-id": p.id,
    });
    this.layers.placed.appendChild(path);
    // 放置脉冲动画
    path.classList.add("pop");
    setTimeout(() => path.classList.remove("pop"), 450);
    // 对应灰色槽位标记为已完成
    const slot = this.layers.outline.querySelector(`.slot[data-id="${p.id}"]`);
    if (slot) slot.classList.add("slot-done");
    return path;
  },

  // 屏幕坐标 → 棋盘 viewBox 坐标（兼容缩放/留白）
  screenToBoard(clientX, clientY) {
    const pt = this.board.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const m = this.board.getScreenCTM();
    if (!m) return { x: clientX, y: clientY };
    const sp = pt.matrixTransform(m.inverse());
    return { x: sp.x, y: sp.y };
  },

  // 当前棋盘像素 / viewBox 单位 的缩放比
  // 用真实 CTM 缩放（getScreenCTM().a），棋盘留白时也准确；CTM 不可用时回退按宽度估算
  boardScale() {
    const m = this.board.getScreenCTM();
    if (m && m.a) return m.a;
    const rect = this.board.getBoundingClientRect();
    return rect.width / (this.currentWidth || 1000);
  },

  // 生成托盘里的一个拼块（紧凑展示，按难度决定是否带名/拼音）
  makeTrayPiece(p, diff) {
    const wrap = document.createElement("div");
    wrap.className = "piece";
    wrap.dataset.id = p.id;
    wrap.style.touchAction = "none";

    const [x0, y0, x1, y1] = p.bbox;
    const bw = Math.max(1, x1 - x0);
    const bh = Math.max(1, y1 - y0);
    const svg = el("svg", {
      viewBox: `${x0} ${y0} ${bw} ${bh}`,
      class: "piece-svg",
    });
    const path = el("path", {
      d: p.path,
      fill: this.pieceColor(p),
      class: "piece-path",
    });
    svg.appendChild(path);
    wrap.appendChild(svg);

    if (diff.pieceName) {
      const name = document.createElement("div");
      name.className = "piece-name";
      name.textContent = p.name;
      wrap.appendChild(name);
      if (diff.piecePinyin) {
        const py = document.createElement("div");
        py.className = "piece-pinyin";
        py.textContent = p.pinyin;
        wrap.appendChild(py);
      }
    }
    return wrap;
  },

  // 拖动时跟随指针的浮层（按棋盘真实比例显示，落点更直观）
  makeDragClone(p) {
    const scale = this.boardScale();
    const [x0, y0, x1, y1] = p.bbox;
    const bw = (x1 - x0) * scale;
    const bh = (y1 - y0) * scale;
    const svg = el("svg", {
      viewBox: `${x0} ${y0} ${x1 - x0} ${y1 - y0}`,
    });
    svg.setAttribute("width", bw);
    svg.setAttribute("height", bh);
    svg.classList.add("drag-clone");
    const path = el("path", {
      d: p.path,
      fill: this.pieceColor(p),
      class: "piece-path",
    });
    svg.appendChild(path);
    document.body.appendChild(svg);
    // 记录质心在浮层内的像素偏移，便于让质心对准指针
    svg._cx = (p.centroid[0] - x0) * scale;
    svg._cy = (p.centroid[1] - y0) * scale;
    return svg;
  },

  // 通关庆祝彩屑
  celebrate() {
    const wrap = document.createElement("div");
    wrap.className = "confetti";
    const colors = ["#f4b942", "#5b9be8", "#ec7d7d", "#4cc1a1", "#b07be0", "#f08a4b"];
    for (let i = 0; i < 60; i++) {
      const c = document.createElement("i");
      c.style.left = (i / 60) * 100 + "%";
      c.style.background = colors[i % colors.length];
      c.style.animationDelay = (i % 10) * 0.08 + "s";
      wrap.appendChild(c);
    }
    document.body.appendChild(wrap);
    setTimeout(() => wrap.remove(), 2600);
  },
};
