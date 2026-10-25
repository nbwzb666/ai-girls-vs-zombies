/*!
 * 《AI娘大战僵尸》—— 原创白天草坪 BGM（Web Audio 实时合成）
 * ================================================================
 * 原创轻快小曲（C 大调 / 132BPM / 钢琴+贝斯+轻鼓），替换引擎的森林系音乐。
 * 引擎接入：ai-patch.js 把 LoadMusic/StartGameMusic = "AI_BGM_Day" 时启停本合成器。
 * 想换曲子：直接改下面的 MELODY/BASS 音高数组（数字=MIDI 音高，0=休止）。
 */
"use strict";

var aiBGM = (function () {
  let ctx = null, master = null, timer = null, barIdx = 0, nextTime = 0, playing = false;
  const BPM = 132, BEAT = 60 / BPM, EIGHTH = BEAT / 2;

  /* MIDI 音高 → 频率 */
  const f = m => 440 * Math.pow(2, (m - 69) / 12);

  /* ---- 乐谱（原创）---- */
  // 和弦进行：C G Am F ×2
  const CHORDS = [[60, 64, 67], [55, 59, 62], [57, 60, 64], [53, 57, 60],
                  [60, 64, 67], [55, 59, 62], [57, 60, 64], [53, 57, 60]];
  // 主旋律：8 小节 × 8 个八分音符槽（C 大调五声风格，轻快跳跃）
  const MELODY = [
    [72, 0, 76, 79, 0, 79, 76, 0],
    [74, 0, 71, 74, 79, 0, 74, 0],
    [72, 0, 76, 81, 0, 79, 76, 0],
    [77, 76, 74, 72, 0, 72, 74, 0],
    [84, 0, 79, 76, 79, 0, 76, 0],
    [79, 0, 74, 71, 74, 0, 71, 0],
    [81, 0, 76, 72, 76, 79, 81, 0],
    [77, 74, 72, 74, 76, 0, 79, 0],
  ];
  // 贝斯：每小节 [根, 0, 根, 0, 五度, 0, 根, 0]
  const BASSROOT = [48, 43, 45, 41, 48, 43, 45, 41];

  /* ---- 音色 ---- */
  function piano(t, midi, dur, vol) {
    vol = vol || 0.16;
    let o1 = ctx.createOscillator(), o2 = ctx.createOscillator(), g = ctx.createGain();
    o1.type = "triangle"; o1.frequency.value = f(midi);
    o2.type = "sine"; o2.frequency.value = f(midi + 12);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o1.connect(g); o2.connect(g); g.connect(master);
    o1.start(t); o2.start(t); o1.stop(t + dur); o2.stop(t + dur);
  }
  function bass(t, midi) {
    let o = ctx.createOscillator(), g = ctx.createGain();
    o.type = "sine"; o.frequency.value = f(midi);
    g.gain.setValueAtTime(0.18, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + BEAT * 0.9);
    o.connect(g); g.connect(master);
    o.start(t); o.stop(t + BEAT);
  }
  function hat(t, strong) {
    let buf = ctx.createBufferSource(), g = ctx.createGain(), hp = ctx.createBiquadFilter();
    let len = ctx.sampleRate * 0.05, b = ctx.createBuffer(1, len, ctx.sampleRate), ch = b.getChannelData(0);
    for (let i = 0; i < len; i++) ch[i] = Math.random() * 2 - 1;
    buf.buffer = b; hp.type = "highpass"; hp.frequency.value = 7000;
    g.gain.setValueAtTime(strong ? 0.06 : 0.03, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
    buf.connect(hp); hp.connect(g); g.connect(master);
    buf.start(t);
  }
  function kick(t) {
    let o = ctx.createOscillator(), g = ctx.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(150, t);
    o.frequency.exponentialRampToValueAtTime(46, t + 0.1);
    g.gain.setValueAtTime(0.13, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
    o.connect(g); g.connect(master);
    o.start(t); o.stop(t + 0.13);
  }

  /* ---- 调度：每小节排一次 ---- */
  function scheduleBar(t) {
    let m = MELODY[barIdx % MELODY.length];
    let root = BASSROOT[barIdx % BASSROOT.length];
    for (let i = 0; i < 8; i++) {
      let ti = t + i * EIGHTH;
      if (m[i]) piano(ti, m[i], i % 2 ? EIGHTH : EIGHTH * 1.6);
      hat(ti, i === 0 || i === 4);
      if (i === 0 || i === 4) kick(ti);
      if (i === 0 || i === 4 || i === 6) {
        // 贝斯
        let n = (i === 6) ? root + 7 : root;
        bass(ti, n);
      }
      // 每两小节在第 7 槽加一个和弦垫音
      if (i === 6 && barIdx % 2 === 1) {
        CHORDS[barIdx % CHORDS.length].forEach(c => piano(ti, c + 12, EIGHTH * 1.4, 0.05));
      }
    }
    barIdx++;
  }

  return {
    start() {
      if (playing) return;
      try {
        ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
        ctx.resume && ctx.resume();
        master = ctx.createGain(); master.gain.value = 0.8; master.connect(ctx.destination);
        playing = true; barIdx = 0; nextTime = ctx.currentTime + 0.1;
        timer = setInterval(() => {
          if (!playing) return;
          while (nextTime < ctx.currentTime + 0.3) {
            scheduleBar(nextTime);
            nextTime += BEAT * 4;
          }
        }, 120);
      } catch (e) { console.warn("[AI] BGM start error", e); }
    },
    stop() {
      playing = false;
      timer && clearInterval(timer); timer = null;
      try { master && master.disconnect(); } catch (e) {}
    }
  };
})();
