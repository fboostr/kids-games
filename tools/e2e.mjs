// e2e.mjs —— 真实浏览器端到端冒烟（开发期可选，需本机装 Chrome；未装则跳过）。
// 实测：两游戏 file:// 直接打开无 JS 报错，关键流程（口算答题过关、翻翻乐翻牌配对）可跑通。
// 用法：可选依赖 puppeteer-core（本项目零运行时依赖，不自带）；需要时在 tools/ 下
//       `npm i -D puppeteer-core` 即可，未安装则自动跳过。
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { createRequire } from "node:module";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const fileUrl = (p) => "file://" + resolve(ROOT, p);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const CHROME = [
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
].find((p) => existsSync(p));
if (!CHROME) { console.log("⏭  未找到 Chrome/Chromium/Edge，跳过 e2e（可选验证）。"); process.exit(0); }

let puppeteer;
try {
  const req = createRequire(import.meta.url);
  puppeteer = (await import(req.resolve("puppeteer-core"))).default;
} catch (e) {
  console.log("⏭  未找到 puppeteer-core（可在 tools/ 下 `npm i -D puppeteer-core`），跳过 e2e。");
  process.exit(0);
}

let failed = 0;
const check = (cond, msg) => { console.log(`  ${cond ? "✓" : "✗"} ${msg}`); if (!cond) failed++; };

const browser = await puppeteer.launch({
  executablePath: CHROME, headless: "new", args: ["--no-sandbox"], protocolTimeout: 120000,
});

async function newPage(url) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1000, height: 820 });
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  await page.goto(url, { waitUntil: "networkidle0" });
  return { page, errors };
}
const isWin = (page) => page.$eval("#win-screen", (el) => !el.classList.contains("hidden")).catch(() => false);

try {
  // ---------- 合集首页 ----------
  {
    const { page, errors } = await newPage(fileUrl("index.html"));
    const cards = await page.$$eval(".game-card", (els) => els.length);
    check(errors.length === 0, "首页无 JS 报错" + (errors.length ? " → " + errors[0] : ""));
    check(cards === 5, "首页有 5 张游戏卡");
    await page.close();
  }

  // ---------- 口算闯关：自动答对一关到结算 ----------
  {
    const { page, errors } = await newPage(fileUrl("games/math/index.html"));
    const diffs = await page.$$eval("#diff-cards .diff-card", (e) => e.length);
    check(errors.length === 0, "口算页无 JS 报错" + (errors.length ? " → " + errors[0] : ""));
    check(diffs === 4, "4 张难度卡");
    await page.$$eval("#diff-cards .diff-card", (els) => els[0].click());
    await page.waitForSelector("#map-nodes .map-node", { visible: true });
    const nodes = await page.$$eval("#map-nodes .map-node", (e) => e.length);
    check(nodes === 3, "easy 档 3 个关卡节点");
    await page.$$eval("#map-nodes .map-node:not([disabled])", (els) => els[0].click());
    await page.waitForSelector("#choices .answer-btn", { visible: true });

    let won = false;
    for (let step = 0; step < 30; step++) {
      if (await isWin(page)) { won = true; break; }
      const prog = await page.$eval("#progress-text", (e) => e.textContent).catch(() => "");
      const ans = await page.$eval("#equation .eq-text", (el) => {
        const t = el.textContent.replace(/×/g, "*").replace(/÷/g, "/");
        try { return eval(t); } catch (e) { return null; }
      });
      const clicked = await page.evaluate((a) => {
        const b = [...document.querySelectorAll("#choices .answer-btn")].find((x) => parseInt(x.textContent, 10) === a);
        if (b) { b.click(); return true; }
        return false;
      }, ans);
      if (!clicked) break;
      // 等到进度推进或弹出结算
      await page.waitForFunction((prev) => {
        const w = !document.getElementById("win-screen").classList.contains("hidden");
        return w || document.getElementById("progress-text").textContent !== prev;
      }, { timeout: 5000 }, prog).catch(() => {});
    }
    check(won, "答对一关后弹出结算页");
    const stars = await page.$eval("#win-stars", (el) => el.textContent).catch(() => "");
    check(/⭐/.test(stars), "结算页显示星星 " + stars);
    check(errors.length === 0, "口算闯关全程无 JS 报错" + (errors.length ? " → " + errors[0] : ""));
    await page.close();
  }

  // ---------- 翻翻乐：用「相同」主题(动物)按卡面配对，跑到全胜 ----------
  {
    const { page, errors } = await newPage(fileUrl("games/memory/index.html"));
    const themes = await page.$$eval("#theme-cards .theme-card", (e) => e.length);
    check(errors.length === 0, "翻翻乐页无 JS 报错" + (errors.length ? " → " + errors[0] : ""));
    check(themes === 8, "8 张主题卡");
    await page.$$eval("#theme-cards .theme-card", (els) => els[0].click()); // 动物（identical）
    await page.waitForSelector("#tier-cards .diff-card", { visible: true });
    await page.$$eval("#tier-cards .diff-card", (els) => els[0].click()); // easy 3×4
    await page.waitForSelector(".mem-card", { visible: true });
    const cardCount = await page.$$eval(".mem-card", (e) => e.length);
    check(cardCount === 12, "easy 档 3×4 共 12 张牌");

    // 相同主题：按 .mem-front 文本（emoji）分组，每组两张即一对
    const groups = await page.$$eval(".mem-card", (els) => {
      const g = {};
      for (const e of els) {
        const k = e.querySelector(".mem-front").textContent.trim();
        (g[k] = g[k] || []).push(e.dataset.uid);
      }
      return g;
    });
    const clickCard = (uid) => page.evaluate((u) => document.querySelector(`.mem-card[data-uid="${u}"]`).click(), uid);
    for (const uids of Object.values(groups)) {
      await clickCard(uids[0]);
      await sleep(120);
      await clickCard(uids[1]);
      // 等这一对进入 matched
      await page.waitForFunction((u) => {
        const el = document.querySelector(`.mem-card[data-uid="${u}"]`);
        return el && el.classList.contains("matched");
      }, { timeout: 4000 }, uids[1]).catch(() => {});
      await sleep(80);
    }
    // 结算页有 700ms 延迟揭示，等它出现
    await page.waitForFunction(() => !document.getElementById("win-screen").classList.contains("hidden"), { timeout: 3000 }).catch(() => {});
    const won = await isWin(page);
    check(won, "按卡面配对达成全配对并弹结算");
    const winStats = await page.$eval("#win-stats", (el) => el.textContent).catch(() => "");
    check(/步数/.test(winStats), "结算页显示步数 " + winStats.trim());
    check(errors.length === 0, "翻翻乐全程无 JS 报错" + (errors.length ? " → " + errors[0] : ""));
    await page.close();
  }

  // ---------- 翻翻乐：🐉 5×6 大牌阵缩放到一屏、不滚动 ----------
  {
    const { page, errors } = await newPage(fileUrl("games/memory/index.html"));
    await page.$$eval("#theme-cards .theme-card", (els) => els[0].click());
    await page.waitForSelector("#tier-cards .diff-card", { visible: true });
    await page.$$eval("#tier-cards .diff-card", (els) => els[2].click()); // 第三档 = 🐉 5×6 / 15 对
    await page.waitForSelector(".mem-card", { visible: true });
    await sleep(120); // 等 fitBoard 完成
    const m = await page.evaluate(() => {
      const g = document.getElementById("game");
      return {
        cards: document.querySelectorAll(".mem-card").length,
        scrollH: g.scrollHeight, clientH: g.clientHeight,
        scrollW: g.scrollWidth, clientW: g.clientWidth,
      };
    });
    check(m.cards === 30, "🐉 档 5×6 共 30 张牌");
    check(m.scrollH <= m.clientH + 2, "棋盘纵向不溢出·无滚动 (scrollH=" + m.scrollH + " ≤ clientH=" + m.clientH + ")");
    check(m.scrollW <= m.clientW + 2, "棋盘横向不溢出 (scrollW=" + m.scrollW + " ≤ clientW=" + m.clientW + ")");
    check(errors.length === 0, "翻翻乐大牌阵无 JS 报错" + (errors.length ? " → " + errors[0] : ""));
    await page.close();
  }

  // ---------- 拼拼中国（内置游戏）：加载渲染 + 返回链接 ----------
  {
    const { page, errors } = await newPage(fileUrl("games/puzzle/index.html"));
    await page.waitForSelector("#mode-cards .mode-card", { visible: true });
    const modes = await page.$$eval("#mode-cards .mode-card", (e) => e.length);
    const back = await page.$eval("a.screen-back", (el) => el.getAttribute("href")).catch(() => null);
    check(errors.length === 0, "拼图页无 JS 报错" + (errors.length ? " → " + errors[0] : ""));
    check(modes === 2, "2 个玩法卡（拼全国 / 分省）");
    check(back === "../../index.html", "拼图首页有「← 合集」返回链接");
    // 拼全国 → 简单档 → 棋盘托盘渲染出拼块
    await page.$$eval("#mode-cards .mode-card", (els) => els[0].click());
    await page.waitForSelector("#difficulty-cards .diff-card", { visible: true });
    await page.$$eval("#difficulty-cards .diff-card", (els) => els[0].click());
    await page.waitForSelector("#tray .piece", { visible: true });
    const pieces = await page.$$eval("#tray .piece", (e) => e.length);
    check(pieces > 0, "拼图棋盘渲染出拼块 " + pieces + " 个");
    check(errors.length === 0, "拼图全程无 JS 报错" + (errors.length ? " → " + errors[0] : ""));
    await page.close();
  }

  // ---------- 舒尔特方格：选 3×3 → 按顺序点完一局到结算 ----------
  {
    const { page, errors } = await newPage(fileUrl("games/schulte/index.html"));
    const tiers = await page.$$eval("#tier-cards .diff-card", (e) => e.length);
    check(errors.length === 0, "舒尔特页无 JS 报错" + (errors.length ? " → " + errors[0] : ""));
    check(tiers === 4, "4 张难度卡");
    await page.$$eval("#tier-cards .diff-card", (els) => els[0].click()); // 3×3
    await page.waitForSelector(".sch-cell", { visible: true });
    const cells = await page.$$eval(".sch-cell", (e) => e.length);
    check(cells === 9, "3×3 共 9 格");
    // 从 1 顺序点到 9
    let solved = true;
    for (let n = 1; n <= 9; n++) {
      const ok = await page.evaluate((n) => {
        const c = [...document.querySelectorAll(".sch-cell")].find((x) => parseInt(x.dataset.val, 10) === n);
        if (c) { c.click(); return true; }
        return false;
      }, n);
      if (!ok) { solved = false; break; }
      await sleep(50);
    }
    await page.waitForFunction(() => !document.getElementById("win-screen").classList.contains("hidden"), { timeout: 3000 }).catch(() => {});
    const won = await isWin(page);
    check(solved && won, "顺序点完 1-9 弹出结算");
    const ws = await page.$eval("#win-stats", (el) => el.textContent).catch(() => "");
    check(/用时/.test(ws), "结算页显示用时 " + ws.trim());
    check(errors.length === 0, "舒尔特全程无 JS 报错" + (errors.length ? " → " + errors[0] : ""));
    await page.close();
  }

  // ---------- 打地鼠口算：选启蒙 → 连拍正解地鼠，得分增长 ----------
  {
    const { page, errors } = await newPage(fileUrl("games/mole/index.html"));
    const diffs = await page.$$eval("#diff-cards .diff-card", (e) => e.length);
    check(errors.length === 0, "打地鼠页无 JS 报错" + (errors.length ? " → " + errors[0] : ""));
    check(diffs === 4, "4 张难度卡");
    await page.$$eval("#diff-cards .diff-card", (els) => els[0].click()); // 启蒙
    await page.waitForSelector(".mole.up", { visible: true });
    // 原子地读算式求解 + 拍中正解地鼠（在单个 evaluate 内完成，避免地鼠换洞打断）
    let hits = 0;
    for (let k = 0; k < 6; k++) {
      const hit = await page.evaluate(() => {
        const t = document.querySelector("#equation .eq-text").textContent.replace(/×/g, "*").replace(/÷/g, "/");
        let ans;
        try { ans = eval(t); } catch (e) { return false; }
        const m = [...document.querySelectorAll(".mole.up")].find((x) => parseInt(x.firstChild.textContent, 10) === ans);
        if (m) { m.click(); return true; }
        return false;
      });
      if (hit) hits++;
      await sleep(150);
    }
    const score = await page.$eval("#stat-score", (el) => el.textContent).catch(() => "");
    check(hits >= 3, "至少拍中 3 次正解地鼠（实拍中 " + hits + "）");
    check(/⭐\s*[1-9]/.test(score), "顶栏得分增长 " + score);
    check(errors.length === 0, "打地鼠全程无 JS 报错" + (errors.length ? " → " + errors[0] : ""));
    await page.close();
  }
} finally {
  await browser.close();
}

console.log(failed === 0 ? "\n✅ e2e 全部通过" : `\n❌ e2e 有 ${failed} 项失败`);
process.exit(failed ? 1 : 0);
