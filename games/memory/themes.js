// themes.js —— 翻翻乐内置主题数据（emoji / 汉字拼音 / 反义词 / 单词图 / 大小写字母）。
// 纯数据，可在 Node 下单测。主题统一形：{ id, name, match, pairs }。
//   identical 主题每条只写一面 card；association 写 a/b 两面，say 为配对成功读出的词。
// 每个主题 pairs 数 >= 15，足够最高档（🐉 15 对）随机抽取且每局不同。
window.KG = window.KG || {};
var KG = window.KG;
KG.THEMES = KG.THEMES || [];

// —— 动物 emoji（identical，最低龄）——
KG.THEMES.push({
  id: "animals", name: "动物配对", match: "identical", category: "zero",
  pairs: [
    { card: { type: "emoji", emoji: "🐶" }, say: "小狗" },
    { card: { type: "emoji", emoji: "🐱" }, say: "小猫" },
    { card: { type: "emoji", emoji: "🐰" }, say: "兔子" },
    { card: { type: "emoji", emoji: "🐼" }, say: "熊猫" },
    { card: { type: "emoji", emoji: "🦊" }, say: "狐狸" },
    { card: { type: "emoji", emoji: "🐯" }, say: "老虎" },
    { card: { type: "emoji", emoji: "🦁" }, say: "狮子" },
    { card: { type: "emoji", emoji: "🐮" }, say: "奶牛" },
    { card: { type: "emoji", emoji: "🐷" }, say: "小猪" },
    { card: { type: "emoji", emoji: "🐸" }, say: "青蛙" },
    { card: { type: "emoji", emoji: "🐵" }, say: "猴子" },
    { card: { type: "emoji", emoji: "🐔" }, say: "公鸡" },
    { card: { type: "emoji", emoji: "🐧" }, say: "企鹅" },
    { card: { type: "emoji", emoji: "🐢" }, say: "乌龟" },
    { card: { type: "emoji", emoji: "🐬" }, say: "海豚" },
    { card: { type: "emoji", emoji: "🐳" }, say: "鲸鱼" },
    { card: { type: "emoji", emoji: "🦋" }, say: "蝴蝶" },
    { card: { type: "emoji", emoji: "🐝" }, say: "蜜蜂" },
    { card: { type: "emoji", emoji: "🐘" }, say: "大象" },
    { card: { type: "emoji", emoji: "🦒" }, say: "长颈鹿" },
  ],
});

// —— 水果 emoji（identical）——
KG.THEMES.push({
  id: "fruits", name: "水果配对", match: "identical", category: "zero",
  pairs: [
    { card: { type: "emoji", emoji: "🍎" }, say: "苹果" },
    { card: { type: "emoji", emoji: "🍌" }, say: "香蕉" },
    { card: { type: "emoji", emoji: "🍊" }, say: "橙子" },
    { card: { type: "emoji", emoji: "🍇" }, say: "葡萄" },
    { card: { type: "emoji", emoji: "🍉" }, say: "西瓜" },
    { card: { type: "emoji", emoji: "🍓" }, say: "草莓" },
    { card: { type: "emoji", emoji: "🍑" }, say: "桃子" },
    { card: { type: "emoji", emoji: "🍒" }, say: "樱桃" },
    { card: { type: "emoji", emoji: "🥝" }, say: "猕猴桃" },
    { card: { type: "emoji", emoji: "🍍" }, say: "菠萝" },
    { card: { type: "emoji", emoji: "🥥" }, say: "椰子" },
    { card: { type: "emoji", emoji: "🥭" }, say: "芒果" },
    { card: { type: "emoji", emoji: "🍐" }, say: "梨" },
    { card: { type: "emoji", emoji: "🍋" }, say: "柠檬" },
    { card: { type: "emoji", emoji: "🫐" }, say: "蓝莓" },
    { card: { type: "emoji", emoji: "🍈" }, say: "甜瓜" },
    { card: { type: "emoji", emoji: "🍅" }, say: "西红柿" },
  ],
});

// —— 汉字↔拼音（association，语文）——
KG.THEMES.push({
  id: "hanzi-pinyin", name: "汉字配拼音", match: "association", category: "chinese",
  pairs: [
    { a: { type: "text", text: "山" }, b: { type: "text", text: "shān" }, say: "山" },
    { a: { type: "text", text: "水" }, b: { type: "text", text: "shuǐ" }, say: "水" },
    { a: { type: "text", text: "日" }, b: { type: "text", text: "rì" }, say: "日" },
    { a: { type: "text", text: "月" }, b: { type: "text", text: "yuè" }, say: "月" },
    { a: { type: "text", text: "火" }, b: { type: "text", text: "huǒ" }, say: "火" },
    { a: { type: "text", text: "土" }, b: { type: "text", text: "tǔ" }, say: "土" },
    { a: { type: "text", text: "木" }, b: { type: "text", text: "mù" }, say: "木" },
    { a: { type: "text", text: "金" }, b: { type: "text", text: "jīn" }, say: "金" },
    { a: { type: "text", text: "石" }, b: { type: "text", text: "shí" }, say: "石" },
    { a: { type: "text", text: "田" }, b: { type: "text", text: "tián" }, say: "田" },
    { a: { type: "text", text: "人" }, b: { type: "text", text: "rén" }, say: "人" },
    { a: { type: "text", text: "口" }, b: { type: "text", text: "kǒu" }, say: "口" },
    { a: { type: "text", text: "手" }, b: { type: "text", text: "shǒu" }, say: "手" },
    { a: { type: "text", text: "目" }, b: { type: "text", text: "mù" }, say: "目" },
    { a: { type: "text", text: "耳" }, b: { type: "text", text: "ěr" }, say: "耳" },
    { a: { type: "text", text: "云" }, b: { type: "text", text: "yún" }, say: "云" },
    { a: { type: "text", text: "雨" }, b: { type: "text", text: "yǔ" }, say: "雨" },
    { a: { type: "text", text: "风" }, b: { type: "text", text: "fēng" }, say: "风" },
    { a: { type: "text", text: "花" }, b: { type: "text", text: "huā" }, say: "花" },
    { a: { type: "text", text: "鸟" }, b: { type: "text", text: "niǎo" }, say: "鸟" },
  ],
});

// —— 反义词（association，语文）——
KG.THEMES.push({
  id: "antonyms", name: "反义词配对", match: "association", category: "chinese",
  pairs: [
    { a: { type: "text", text: "冷" }, b: { type: "text", text: "热" }, say: "冷对热" },
    { a: { type: "text", text: "大" }, b: { type: "text", text: "小" }, say: "大对小" },
    { a: { type: "text", text: "高" }, b: { type: "text", text: "矮" }, say: "高对矮" },
    { a: { type: "text", text: "上" }, b: { type: "text", text: "下" }, say: "上对下" },
    { a: { type: "text", text: "左" }, b: { type: "text", text: "右" }, say: "左对右" },
    { a: { type: "text", text: "前" }, b: { type: "text", text: "后" }, say: "前对后" },
    { a: { type: "text", text: "快" }, b: { type: "text", text: "慢" }, say: "快对慢" },
    { a: { type: "text", text: "多" }, b: { type: "text", text: "少" }, say: "多对少" },
    { a: { type: "text", text: "黑" }, b: { type: "text", text: "白" }, say: "黑对白" },
    { a: { type: "text", text: "新" }, b: { type: "text", text: "旧" }, say: "新对旧" },
    { a: { type: "text", text: "远" }, b: { type: "text", text: "近" }, say: "远对近" },
    { a: { type: "text", text: "开" }, b: { type: "text", text: "关" }, say: "开对关" },
    { a: { type: "text", text: "胖" }, b: { type: "text", text: "瘦" }, say: "胖对瘦" },
    { a: { type: "text", text: "长" }, b: { type: "text", text: "短" }, say: "长对短" },
    { a: { type: "text", text: "明" }, b: { type: "text", text: "暗" }, say: "明对暗" },
    { a: { type: "text", text: "早" }, b: { type: "text", text: "晚" }, say: "早对晚" },
  ],
});

// —— 英文单词↔emoji 图（association，英语）——
KG.THEMES.push({
  id: "word-emoji", name: "单词配图", match: "association", category: "english", sayLang: "en-US",
  pairs: [
    { a: { type: "text", text: "apple" }, b: { type: "emoji", emoji: "🍎" }, say: "apple" },
    { a: { type: "text", text: "banana" }, b: { type: "emoji", emoji: "🍌" }, say: "banana" },
    { a: { type: "text", text: "cat" }, b: { type: "emoji", emoji: "🐱" }, say: "cat" },
    { a: { type: "text", text: "dog" }, b: { type: "emoji", emoji: "🐶" }, say: "dog" },
    { a: { type: "text", text: "sun" }, b: { type: "emoji", emoji: "☀️" }, say: "sun" },
    { a: { type: "text", text: "star" }, b: { type: "emoji", emoji: "⭐" }, say: "star" },
    { a: { type: "text", text: "car" }, b: { type: "emoji", emoji: "🚗" }, say: "car" },
    { a: { type: "text", text: "fish" }, b: { type: "emoji", emoji: "🐟" }, say: "fish" },
    { a: { type: "text", text: "bird" }, b: { type: "emoji", emoji: "🐦" }, say: "bird" },
    { a: { type: "text", text: "tree" }, b: { type: "emoji", emoji: "🌳" }, say: "tree" },
    { a: { type: "text", text: "ball" }, b: { type: "emoji", emoji: "⚽" }, say: "ball" },
    { a: { type: "text", text: "book" }, b: { type: "emoji", emoji: "📕" }, say: "book" },
    { a: { type: "text", text: "cake" }, b: { type: "emoji", emoji: "🍰" }, say: "cake" },
    { a: { type: "text", text: "flower" }, b: { type: "emoji", emoji: "🌸" }, say: "flower" },
    { a: { type: "text", text: "moon" }, b: { type: "emoji", emoji: "🌙" }, say: "moon" },
    { a: { type: "text", text: "house" }, b: { type: "emoji", emoji: "🏠" }, say: "house" },
  ],
});

// —— 大写↔小写字母（association，英语）——
(function () {
  const pairs = [];
  const A = "A".charCodeAt(0);
  for (let i = 0; i < 26; i++) {
    const up = String.fromCharCode(A + i);
    const lo = up.toLowerCase();
    pairs.push({ a: { type: "text", text: up }, b: { type: "text", text: lo }, say: up, sayLang: "en-US" });
  }
  KG.THEMES.push({ id: "letter-case", name: "大写配小写", match: "association", category: "english", sayLang: "en-US", pairs: pairs });
})();
