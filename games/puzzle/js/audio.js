// audio.js —— 用浏览器内置语音合成读省名（离线、无需音频文件）
// 无中文语音或不支持时自动降级为静默，不影响游戏。
window.PP = window.PP || {};

PP.Speaker = {
  supported: typeof window !== "undefined" && "speechSynthesis" in window,
  muted: false,
  voice: null,

  init() {
    if (!this.supported) return;
    const pick = () => {
      const voices = window.speechSynthesis.getVoices() || [];
      // 优先选中文语音
      this.voice =
        voices.find((v) => /zh[-_]?CN/i.test(v.lang)) ||
        voices.find((v) => /^zh/i.test(v.lang)) ||
        voices.find((v) => /Chinese|中文|普通话/i.test(v.name)) ||
        null;
    };
    pick();
    // 语音列表常常异步加载，监听一次更新
    window.speechSynthesis.onvoiceschanged = pick;
  },

  // 是否真的能读（支持 + 没静音 + 找得到中文语音）
  canSpeak() {
    return this.supported && !this.muted;
  },

  speak(text) {
    if (!this.canSpeak() || !text) return;
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "zh-CN";
      if (this.voice) u.voice = this.voice;
      u.rate = 0.85; // 慢一点，孩子听得清
      u.pitch = 1.05;
      window.speechSynthesis.speak(u);
    } catch (e) {
      /* 读音失败时静默降级 */
    }
  },

  toggleMute() {
    this.muted = !this.muted;
    if (this.muted && this.supported) window.speechSynthesis.cancel();
    return this.muted;
  },
};
