// provinces-capitals.js —— 34 省级行政区 → 省会/首府 手写表（「拼拼中国」provinces.js 无省会字段，
// 故独立维护，不解析其 path 数据）。用于「省份↔省会」翻翻乐主题（association，地理）。
// 纯数据，可在 Node 下单测。
window.KG = window.KG || {};
var KG = window.KG;
KG.THEMES = KG.THEMES || [];

KG.PROVINCE_CAPITALS = [
  { id: "110000", province: "北京", capital: "北京" },
  { id: "120000", province: "天津", capital: "天津" },
  { id: "130000", province: "河北", capital: "石家庄" },
  { id: "140000", province: "山西", capital: "太原" },
  { id: "150000", province: "内蒙古", capital: "呼和浩特" },
  { id: "210000", province: "辽宁", capital: "沈阳" },
  { id: "220000", province: "吉林", capital: "长春" },
  { id: "230000", province: "黑龙江", capital: "哈尔滨" },
  { id: "310000", province: "上海", capital: "上海" },
  { id: "320000", province: "江苏", capital: "南京" },
  { id: "330000", province: "浙江", capital: "杭州" },
  { id: "340000", province: "安徽", capital: "合肥" },
  { id: "350000", province: "福建", capital: "福州" },
  { id: "360000", province: "江西", capital: "南昌" },
  { id: "370000", province: "山东", capital: "济南" },
  { id: "410000", province: "河南", capital: "郑州" },
  { id: "420000", province: "湖北", capital: "武汉" },
  { id: "430000", province: "湖南", capital: "长沙" },
  { id: "440000", province: "广东", capital: "广州" },
  { id: "450000", province: "广西", capital: "南宁" },
  { id: "460000", province: "海南", capital: "海口" },
  { id: "500000", province: "重庆", capital: "重庆" },
  { id: "510000", province: "四川", capital: "成都" },
  { id: "520000", province: "贵州", capital: "贵阳" },
  { id: "530000", province: "云南", capital: "昆明" },
  { id: "540000", province: "西藏", capital: "拉萨" },
  { id: "610000", province: "陕西", capital: "西安" },
  { id: "620000", province: "甘肃", capital: "兰州" },
  { id: "630000", province: "青海", capital: "西宁" },
  { id: "640000", province: "宁夏", capital: "银川" },
  { id: "650000", province: "新疆", capital: "乌鲁木齐" },
  { id: "710000", province: "台湾", capital: "台北" },
  { id: "810000", province: "香港", capital: "香港" },
  { id: "820000", province: "澳门", capital: "澳门" },
];

KG.THEME_PROV_CAP = {
  id: "prov-cap", name: "省份配省会", match: "association", category: "world",
  pairs: KG.PROVINCE_CAPITALS.map(function (r) {
    return {
      a: { type: "text", text: r.province },
      b: { type: "text", text: r.capital },
      say: r.province + "，" + r.capital,
    };
  }),
};
KG.THEMES.push(KG.THEME_PROV_CAP);
