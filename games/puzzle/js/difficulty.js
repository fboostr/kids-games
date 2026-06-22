// difficulty.js —— 三档难度配置 + 七大区顺序与配色
// 难度靠开关这些机制递进：底图轮廓 / 名称提示 / 拼音 / 读音 / 吸附半径 / 大区分组 / 计时
window.PP = window.PP || {};

PP.DIFFICULTIES = {
  easy: {
    key: "easy",
    label: "简单",
    emoji: "🐣",
    age: "3-6 岁 · 学龄前",
    desc: "按七大区一关一关来，省份带拼音、点一点会读名字，吸附范围大",
    outline: true,        // 显示灰色省界底图
    outlineMode: "slots", // 底图样式：每个省一个灰色槽位
    outlineNames: true,   // 底图槽位上标省名（最易：照着名字放）
    pieceName: true,      // 拼块显示省名
    piecePinyin: true,    // 拼块显示拼音
    speakOnPlace: true,   // 放对时读出省名
    speakOnPick: true,    // 拿起拼块时读出省名
    snap: 58,             // 吸附半径（地图坐标，越大越好放）
    byRegion: true,       // 按七大区分关推进
    timer: false,
  },
  medium: {
    key: "medium",
    label: "中等",
    emoji: "🦊",
    age: "6-10 岁 · 小学",
    desc: "一次拼全 34 个省，底图只有空白轮廓，看名字找位置",
    outline: true,
    outlineMode: "slots",
    outlineNames: false,
    pieceName: true,
    piecePinyin: false,
    speakOnPlace: true,
    speakOnPick: false,
    snap: 32,
    byRegion: false,
    timer: false,
  },
  hard: {
    key: "hard",
    label: "困难",
    emoji: "🐉",
    age: "高手挑战",
    desc: "只有国界外框、不显示名字、要放得准，还会计时和记错误",
    outline: true,
    outlineMode: "silhouette", // 底图样式：整块国界外框剑影（无省界内线）
    outlineNames: false,
    pieceName: false,
    piecePinyin: false,
    speakOnPlace: true,
    speakOnPick: false,
    snap: 18,
    byRegion: false,
    timer: true,
  },
};

// 分省拼图：单档固定配置。只给省外轮廓作参考，地市块带名、按省尺度自适应吸附。
// 与全国三档并列，但不分关、不计时、不显拼音。snap 仅作兜底，运行时由各省 snapHint 覆盖。
PP.PROVINCE_DIFF = {
  key: "province",
  label: "分省",
  emoji: "🗺️",
  outline: true,
  outlineMode: "province", // 单条省外框（实际由 dataset.outline 驱动渲染）
  outlineNames: false,
  pieceName: true,       // 地市块显名
  piecePinyin: false,    // 地市暂不显拼音
  speakOnPlace: true,    // 放对读出地市名
  speakOnPick: true,     // 拿起也读，帮助认地市
  snap: 28,              // 兜底值；实际用 dataset.snap（各省 snapHint）
  byRegion: false,
  timer: false,
};

// 简单档分关顺序（由近及远、由熟到生的一种自然顺序）
PP.REGION_ORDER = ["东北", "华北", "华东", "华中", "华南", "西南", "西北"];

// 七大区配色（放置后按区上色，顺便认识地理分区）
PP.REGION_COLORS = {
  华北: "#f4b942",
  东北: "#4cc1a1",
  华东: "#5b9be8",
  华中: "#ec7d7d",
  华南: "#b07be0",
  西南: "#f08a4b",
  西北: "#8bc34a",
};

// 分省拼图地市块调色板（地市无七大区概念，按 colorIndex 取色；与 tools/build-provinces.mjs 保持一致）
PP.PIECE_PALETTE = [
  "#f4b942", "#5b9be8", "#ec7d7d", "#4cc1a1", "#b07be0", "#f08a4b",
  "#8bc34a", "#26c6da", "#ff8a80", "#9575cd", "#4db6ac", "#ffb74d",
];
