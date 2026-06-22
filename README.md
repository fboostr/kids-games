# 儿童游戏合集（kids-games）

给小学/学龄前孩子做的教育小游戏合集：**纯前端、离线、双击即玩、零运行时依赖**。
一脉相承的价值观——浏览器语音读音、鼓励式反馈、难度分档，覆盖学龄前到高年级。

目前内置五款：

- **🧮 口算闯关大冒险**（数学）：出题答题闯地图，加减乘除四档难度，选一选或自制数字键盘打答案，连击 + 星星 + 错题重练。
- **🃏 翻翻乐**（记忆配对）：一套引擎喂八个主题——动物 / 水果 emoji、汉字配拼音、反义词、单词配图、大小写字母、国旗配国名、省份配省会。
- **🧩 拼拼中国**（地理拼图）：拖拼块把 34 个省级行政区拼回祖国版图，三档难度，还能分省拼地级市。合集内置的一款游戏（详见 [puzzle/README](games/puzzle/README.md)）。
- **🔢 舒尔特方格**（专注力）：按 1、2、3… 顺序点完打乱的数字网格，3×3 到 6×6 四档，计时冲最快纪录。
- **🔨 打地鼠口算**（数学街机）：算式当前题，拍中举着正确答案的地鼠，限时 60 秒累计分，复用口算题目生成器。

## 怎么玩

直接用浏览器打开根目录的 `index.html`（双击即可，无需联网、无需安装、无需起服务）：

```
index.html               → 合集首页，点卡片进入各游戏
games/math/index.html    → 口算闯关
games/memory/index.html  → 翻翻乐
games/puzzle/index.html  → 拼拼中国
games/schulte/index.html → 舒尔特方格
games/mole/index.html    → 打地鼠口算
```

在 Chrome / Edge / Safari 下 `file://` 直接打开均可。
支持浏览器语音时会读题 / 读词（中文、英文单词用英文读）；不支持时自动静默降级，游戏照常可玩。
进度（口算星星与解锁、翻翻乐最少步数/最短用时）存在浏览器 `localStorage`。

## 目录结构

```
kids-games/
├── index.html              # 合集首页
├── css/base.css            # 共享样式（按钮 / 难度卡 / 顶栏 / 彩屑 / 响应式）
├── core/                   # 共享薄框架
│   ├── speaker.js          # KG.Speaker：浏览器语音读音（含静默降级）
│   ├── router.js           # KG.Router：屏幕 show/hide
│   ├── celebrate.js        # KG.celebrate / KG.sparkle：彩屑特效
│   └── progress.js         # KG.Progress：localStorage 存档（星星/解锁/纪录/设置）
├── games/
│   ├── math/               # 口算闯关
│   │   ├── problems.js     # 题目生成器（纯逻辑：减法非负 / 除法整除 / 干扰项 / 去重）
│   │   ├── levels.js       # 4 档难度卡 + 各档 3 关 + 星星评定
│   │   ├── game.js         # KG.MathGame 单关状态机
│   │   └── main.js         # UI 接线
│   ├── memory/             # 翻翻乐
│   │   ├── engine.js       # KG.MemoryGame 引擎 + buildDeck/shuffle（纯逻辑）
│   │   ├── themes.js       # 6 个 emoji/字词主题
│   │   ├── flags.js        # ~15 面内联国旗 SVG + 国旗主题
│   │   ├── data/provinces-capitals.js  # 34 省→省会 + 省会主题
│   │   └── main.js         # UI 接线、档位、卡面渲染、翻牌时序
│   ├── puzzle/             # 拼拼中国（window.PP 命名空间，自成一体，与 core 互不依赖）
│   ├── schulte/            # 舒尔特方格
│   │   ├── grid.js         # KG.Schulte.buildGrid（纯逻辑）
│   │   ├── game.js         # KG.SchulteGame 状态机
│   │   └── main.js         # UI 接线
│   └── mole/               # 打地鼠口算
│       ├── round.js        # KG.Mole.buildRound（复用 KG.Problems，纯逻辑）
│       ├── game.js         # KG.MoleGame 限时计分
│       └── main.js         # UI 接线
└── tools/                  # 单测（零第三方依赖，用 Node 内置 node:test）
```

## 难度分档

**口算**：🐣 启蒙（10 以内加减·4 选 1·○图示·读题）→ 🦊 进阶（20/100 含进退位·选/打）→ 🐯 熟练（表内乘除·两位数加减·输入·软计时）→ 🐉 挑战（四则混合·两步·带括号·计时+连击）。

**翻翻乐**：🐣 3×4 / 6 对（翻开读音、配对留亮、不计时）→ 🦊 4×4 / 8 对（读音、记步数）→ 🐉 5×6 / 15 对（计时 + 步数、配对后消失腾位、翻面更快）。

## 测试

纯逻辑（题目生成、配对引擎、洗牌、存档）用 Node 内置测试框架单测，**零第三方依赖**：

```bash
cd tools
npm test          # 等价 node --test test-*.mjs：题目边界 / 配对判定 / 整局流程 / 主题完整性 / 存档
```

可选的真实浏览器端到端冒烟（需本机装 Chrome，并在 `tools/` 下 `npm i -D puppeteer-core`；未装则跳过）：

```bash
cd tools && node e2e.mjs
```
