/*!
 * 《AI娘大战僵尸》—— 全局补丁与入口
 * ---------------------------------------------------------------
 * 1. NextLevel 覆盖：AIGirls1 → AIGirls2 → AIGirls3 → AIGirls1 循环
 * 2. 主菜单"冒险模式"按钮直达 AIGirls1
 * 3. URL 参数直达（测试/分享用）：index.html?lvl=AIGirls2
 */
"use strict";

/* ---------- 关卡链覆盖 ---------- */
NextLevel = function (lvl = oS.Lvl) {
  if (/AIGirls1/.test(lvl)) return "AIGirls2";
  if (/AIGirls2/.test(lvl)) return "AIGirls3";
  if (/AIGirls3/.test(lvl)) return "AIGirls1";
  return "AIGirls1";
};

/* ---------- 主菜单按钮直达 + URL 参数直达 ---------- */
(function () {
  let hooked = false;
  let patchMenu = () => {
    let adv = document.getElementById("eAdventure");
    if (adv && !hooked) {
      hooked = true;
      adv.onclick = () => SelectModal("AIGirls1", "Level");
      console.log("[AI娘大战僵尸] 冒险模式按钮已指向 AIGirls1");
    }
  };
  setInterval(patchMenu, 500); // 主页 DOM 异步加载，轮询挂钩子

  /* URL 直达：?lvl=AIGirls1 */
  let m = location.search.match(/lvl=(\w+)/);
  if (m) {
    let go = () => {
      try { SelectModal(m[1], "Level"); } catch (e) { setTimeout(go, 400); }
    };
    setTimeout(go, 800);
  }
})();

/* ---------- 阳光 → Token 换皮（CSS 覆盖，不动引擎文件） ---------- */
(function () {
  let style = document.createElement("style");
  style.textContent = `
    /* 掉落物：阳光旋转图 → token 旋转图（同规格 30 帧雪碧图） */
    .SunPic { background: url(images/AIGirls/interface/token_strip.png) !important; }
    /* 计数器旁的阳光图标（Topbar 精灵图挖出区域）用 token 图标覆盖 */
    #dSunBank { position: relative; }
  `;
  document.head.appendChild(style);

  /* 计数器图标 overlay：等 Topbar 渲染后盖在阳光图标位置 */
  let overlayTimer = setInterval(() => {
    let sSun = document.getElementById("sSunNum");
    if (sSun && !document.getElementById("aiTokenIcon")) {
      let holder = sSun.parentElement || sSun;
      let icon = document.createElement("img");
      icon.id = "aiTokenIcon";
      icon.src = "images/AIGirls/interface/token_icon.png";
      icon.style.cssText = "position:absolute;left:-34px;top:2px;width:36px;height:36px;pointer-events:none;";
      holder.style.position = "relative";
      holder.appendChild(icon);
    }
  }, 800);
  setTimeout(() => clearInterval(overlayTimer), 60000);
})();

/* ---------- 自动演示模式（验证用）：index.html?lvl=AIGirls1&demo=1 ----------
 * 3s 后自动种下 5 名 AI 娘 → 16s 后自动给 GPT 龙娘放大招 → 验证种植/攻击/大招全链路 */
(function () {
  if (!/[?&]demo=1/.test(location.search)) return;
  let planted = false;
  let timer = setInterval(() => {
    if (oS.isStartGame === 1 && !planted && typeof oChiBaiFan !== "undefined") {
      planted = true;
      clearInterval(timer);
      try {
        CustomSpecial(oChiBaiFan, 2, 1);
        CustomSpecial(oGPTLongNiang, 1, 3);
        CustomSpecial(oTiePenDaFeiYu, 3, 3);
        CustomSpecial(oClaudeOjou, 2, 5);
        CustomSpecial(oQwenOjou, 4, 4);
        console.log("[demo] 5 名 AI 娘已种植");
      } catch (e) { console.warn("[demo] plant error", e); }
      /* 16s 后给 GPT 龙娘放 Sora 夺冠大招 */
      oSym.addTask(16000, _ => {
        try {
          let gpt = Object.values($P).find(p => p.EName === "oGPTLongNiang");
          if (gpt && typeof aiULT !== "undefined") {
            aiULT.oGPTLongNiang(gpt);
            console.log("[demo] GPT 大招已释放");
          }
        } catch (e) {}
      });
    }
  }, 1000);
})();

/* ---------- 音乐替换：森林曲 → 原创白天草坪 BGM（ai-bgm.js 合成器） ---------- */
(function () {
  /* 包装引擎音乐函数：名为 AI_BGM_Day 时启停合成器，其他照旧 */
  let _PlayMusic = PlayMusic, _StopMusic = StopMusic, _NewMusic = NewMusic;
  window.PlayMusic = function (name) {
    if (name === "AI_BGM_Day") { try { aiBGM.start(); } catch (e) {} return; }
    try { aiBGM.stop(); } catch (e) {}
    return _PlayMusic(name);
  };
  window.StopMusic = function (name) {
    try { aiBGM.stop(); } catch (e) {}
    return _StopMusic(name);
  };
  window.NewMusic = function (name) {
    if (name === "AI_BGM_Day") return;
    try { aiBGM.stop(); } catch (e) {}
    return _NewMusic(name);
  };
})();

/* ---------- 明日待办（夜间标注，不影响运行） ----------
 * [ ] 阳光图标/文案 → token（图片替换 images/interface/ 下阳光资源 + 语言文件）
 * [ ] 割草机 → 防火墙（图片+文案）
 * [ ] 主菜单标题图 → 《AI娘大战僵尸》
 */
