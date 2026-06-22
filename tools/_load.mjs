// _load.mjs —— 测试用：把项目里的「经典脚本」(window.KG 全局) 注入一个 fake window，
// 取出纯逻辑做 Node 单测。用 new Function("window", src)(window) 垫片把脚本跑进 fake window。
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

// 依次把若干脚本注入同一个 window，返回该 window（其上挂着 window.KG.*）。
export function makeWindow(...relPaths) {
  const window = {};
  for (const p of relPaths) {
    const src = readFileSync(resolve(__dirname, "..", p), "utf8");
    new Function("window", src)(window);
  }
  return window;
}

// 确定性 PRNG，供洗牌等可复现单测。
export function mulberry32(seed) {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// 简易内存版 localStorage（注入 KG.Progress.setStore 做存档单测）。
export function fakeStore() {
  const m = Object.create(null);
  return {
    getItem(k) { return k in m ? m[k] : null; },
    setItem(k, v) { m[k] = String(v); },
    removeItem(k) { delete m[k]; },
    _dump() { return m; },
  };
}
