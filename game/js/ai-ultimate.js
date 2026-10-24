/*!
 * 《AI娘大战僵尸》—— 显卡大招系统（能量豆式）
 * ================================================================
 * 机制（2026 AI 梗：算力=显卡）：
 *   1. 战斗中定期掉落「显卡」（60~90s 一张，Boss 波必掉，视觉=绿色显卡）
 *   2. 点击拾取 → 顶部显卡计数 +1，进入"选择释放"状态
 *   3. 再点击场上一名 AI 娘 → 消耗一张显卡，释放她的专属大招
 *
 * 大招清单（每张卡的 onUltimate，可逐个挑选/替换）：
 *   吃白饭·干饭王       8s 内每 2s 产 25 token
 *   铁盆·盆阵风暴       本行全体 60 伤+扣头眩晕 2.5s
 *   中转站·全走上游     10s 内每发都是 Claude 金光弹（60伤）
 *   GPT·Sora夺冠时刻    全场僵尸看假夺冠视频停下庆祝 5s（眩晕+受伤加深）
 *   Claude·封号潮       全场 Account Disabled：小怪直接封禁、精英剥装眩晕
 *   豆包·最不墨迹       10s 内冷却 0.8s 连续起坐
 *   哈基米·批量修图     全场敌人装备全被 P 掉+减速 5s
 *   千问·全家桶         周围空格召唤全套尺寸小千问助战 15s
 */
"use strict";

/* ============ 显卡掉落与拾取 ============ */
var aiGPU = { count: 0, selecting: false };

function aiAppearGPU() {
  try {
    let id = "aiGPU" + Math.random();
    let X = 150 + Math.random() * 600, Y = 60 + Math.random() * 300;
    let ele = NewEle(id, "img",
      `position:absolute;left:${X}px;top:${Y}px;width:52px;height:52px;z-index:300;cursor:pointer;transition:top .8s ease-out;`,
      { src: "images/AIGirls/interface/gpu.png" }, EDAll);
    /* 下落动画后可点击拾取 */
    oSym.addTask(30, _ => {
      let e = $(id); if (!e) return;
      e.onclick = () => {
        aiGPU.count++;
        aiUpdateGPUHUD();
        PlayAudio("points");
        ClearChild(e);
      };
    });
    /* 12s 未拾取自动消失 */
    oSym.addTask(12000, _ => { let e = $(id); e && ClearChild(e); });
  } catch (e) { console.warn("[AI] GPU drop error", e); }
}

function aiUpdateGPUHUD() {
  let hud = $("aiGPUHUD");
  if (!hud) {
    hud = NewEle("aiGPUHUD", "div",
      "position:absolute;left:250px;top:4px;z-index:200;color:#7CFC98;font-weight:bold;" +
      "font-size:14px;text-shadow:0 0 3px #000;pointer-events:none;padding:4px 8px;background:rgba(20,60,30,.7);border-radius:8px;",
      {}, EDAll);
  }
  hud.innerHTML = `<img src="images/AIGirls/interface/gpu.png" style="width:22px;height:22px;vertical-align:-5px;"> ×${aiGPU.count}` +
    (aiGPU.selecting ? ` <span style="color:#FFE680">点击一名AI娘释放大招！</span>` : "");
}

/* 掉落循环：挂到开战事件 */
(function () {
  let started = false;
  let loop = () => {
    if (!oS.isStartGame || started) return;
    started = true;
    (function gpuLoop() {
      oSym.addTask(60000 + Math.random() * 30000, _ => {
        oS.isStartGame === 1 && aiAppearGPU();
        gpuLoop();
      });
    })();
  };
  window.addEventListener("jng-event-startgame", loop);
  setInterval(loop, 1000);
})();

/* ============ 释放交互：点击 AI 娘 ============ */
(function () {
  setInterval(() => {
    let scene = $("dFightingScene") || $("dAll");
    if (!scene || scene._aiGPUHooked) return;
    scene._aiGPUHooked = true;
    scene.addEventListener("click", ev => {
      if (!aiGPU.selecting || aiGPU.count <= 0) return;
      /* 由点击坐标反查植物 */
      try {
        let rect = scene.getBoundingClientRect();
        let x = ev.clientX - rect.left + (document.getElementById("dAll").offsetLeft || 0);
        let row = aiFindRowByY(ev.clientY - rect.top);
        let col = aiFindColByX(x);
        let plant = oGd.$[`${row}_${col}_1`];
        if (plant && plant.EName && aiULT[plant.EName]) {
          aiGPU.count--;
          aiGPU.selecting = false;
          aiUpdateGPUHUD();
          aiULT[plant.EName](plant);          // 释放专属大招
        } else if (plant) {
          aiFloatText("这名AI娘还没有专属大招配置", "#FFD");
        }
      } catch (e) { console.warn("[AI] ultimate error", e); }
    });
  }, 1200);
})();

function aiFindRowByY(y) {
  /* 草坪 5 行：约 90~500 区域（按 900x600 布局估算，GetY 反算） */
  try { return GetR(Math.min(5, Math.max(1, Math.round((y - 90) / 95) + 1))) || Math.min(5, Math.max(1, Math.round((y - 90) / 95) + 1)); }
  catch (e) { return Math.min(5, Math.max(1, Math.round((y - 90) / 95) + 1)); }
}
function aiFindColByX(x) { return Math.min(9, Math.max(1, Math.round((x - 40) / 80))); }

/* 点击显卡 HUD 进入/退出选择模式（HUD 不可点，改为：拾取后自动进入选择模式，
 * 再点空白处取消）——简化交互：拾取即进入选择，点 AI 娘释放，点空白取消 */
(function () {
  setInterval(() => {
    if (aiGPU.count > 0 && !aiGPU.selecting && $("aiGPUHUD")) {
      aiGPU.selecting = true; aiUpdateGPUHUD();
    }
  }, 500);
})();

/* ============ 通用效果工具 ============ */
function aiAllZombies(fn) {
  Object.values($Z).forEach(z => { try { fn(z); } catch (e) {} });
}
function aiFloatText(txt, color, x, y) {
  try {
    let id = "aiTxt" + Math.random();
    let e = NewEle(id, "div",
      `position:absolute;left:${x || 380}px;top:${y || 250}px;z-index:400;color:${color || "#FFF"};` +
      "font-size:20px;font-weight:bold;text-shadow:0 0 4px #000;transition:all 1.2s ease-out;pointer-events:none;",
      { innerText: txt }, EDAll);
    oSym.addTask(50, _ => { e.style.top = (parseInt(e.style.top) - 60) + "px"; e.style.opacity = 0; });
    oSym.addTask(1300, _ => ClearChild(e));
  } catch (e) {}
}
/* 眩晕 N 秒（循环调用引擎 1s 眩晕） */
function aiStun(zombie, seconds) {
  for (let i = 0; i < seconds; i++) {
    oSym.addTask(i * 1000, _ => { $Z[zombie.id] && zombie.getVertigo && zombie.getVertigo(zombie, 0, 0); });
  }
}

/* ============ 八个大招 ============ */
var aiULT = {
  /* 吃白饭·干饭王：8s 每 2s 产 25 */
  oChiBaiFan(p) {
    aiFloatText("干饭王！！干饭都是一口气的！", "#FFE680");
    let X = GetX(p.C) + 75, Y = GetY(p.R);
    for (let i = 0; i < 4; i++) {
      oSym.addTask(i * 2000, _ => { $P[p.id] && AppearSun(X - 30, Y - 50, 25, 0, 0); });
    }
  },
  /* 铁盆·盆阵风暴：本行全体 60 伤+扣头眩晕 */
  oTiePenDaFeiYu(p) {
    aiFloatText("铛铛铛铛——盆阵风暴！", "#CFE");
    aiAllZombies(z => {
      if (z.R === p.R) {
        z.getHit0 && z.getHit0(z, 60, 0);
        aiStun(z, 2.5);
      }
    });
  },
  /* 中转站·全走上游：10s 每发金光 60 伤 */
  oZhongZhuanDaFeiYu(p) {
    aiFloatText("正在连接上游……线路已全开！", "#FFD76E");
    p._allUpstream = oSym.Now + 10000;
  },
  /* GPT·Sora夺冠时刻：全场停下看假视频 5s（眩晕+受伤+50% 简化为眩晕+伤害） */
  oGPTLongNiang(p) {
    aiFloatText("Sora-2：《僵尸勇夺世界杯》！", "#AFA");
    oSym.addTask(300, _ => aiFloatText("他们真的信了……", "#AFA", 380, 290));
    aiAllZombies(z => {
      aiStun(z, 5);
      z.getHit0 && z.getHit0(z, 40, 0);
    });
  },
  /* Claude·封号潮：全场 Account Disabled */
  oClaudeOjou(p) {
    aiFloatText("Account Disabled × 全员", "#F66");
    aiAllZombies(z => {
      let isBoss = z.HP > 2000;
      if (isBoss) { aiStun(z, 6); z.getHit0 && z.getHit0(z, 200, 0); }
      else { z.getHit0 && z.getHit0(z, 9999, 0); }
    });
  },
  /* 豆包·最不墨迹：10s 冷却 0.8s 连坐 */
  oDouBao(p) {
    aiFloatText("最直接、最不墨迹：全部坐掉", "#FFD");
    p._rapidUntil = oSym.Now + 10000;
  },
  /* 哈基米·批量修图：全场剥装+减速 */
  oHajimi(p) {
    aiFloatText("咔嚓——我把你们这张图全改了！", "#BDF");
    aiAllZombies(z => {
      if (z.OrnHP) { z.OrnHP = 1; z.getHit0 && z.getHit0(z, 10, 0); }  /* 装备 P 掉 */
      z.getSlow && z.getSlow(z);
      aiStun(z, 1.5);
    });
  },
  /* 千问·全家桶：周围空格召唤小千问（15s 助战） */
  oQwenOjou(p) {
    aiFloatText("Qwen 全家桶开箱！", "#D9F");
    let spots = [[p.R, p.C - 1], [p.R, p.C + 1], [Math.min(5, p.R + 1), p.C]];
    spots.forEach(([r, c], i) => {
      oSym.addTask(i * 300, _ => {
        try {
          if (r >= 1 && r <= 5 && c >= 1 && c <= 9 && !oGd.$[`${r}_${c}_1`]) {
            let m = CustomSpecial(oQwenMini, r, c);
            m && oSym.addTask(15000, _ => { let mm = m; mm && mm.Die ? mm.Die(mm) : (mm.getHurt && mm.getHurt(null, 0, 9999)); });
          }
        } catch (e) {}
      });
    });
  }
};

/* ============ 小千问（千问养成随从 / 全家桶召唤物） ============
 * Qwen 梗：0.8B→2B→4B→9B 全尺寸家族。每 30s 长大一档：
 * 攻击 6→12→24→48，体型随之变大（transform scale）。
 * PKind 3 = 重叠植物，可与大千问同格共存。 */
var oQwenMini = InheritO(CPlants, {
  EName: "oQwenMini",
  CName: "小千问",
  PKind: 3,
  width: 55, height: 55,
  beAttackedPointR: 35,
  SunNum: 0,
  HP: 120,
  coolTime: 0,
  AttackGif: 5, BulletGif: 3,
  _stage: 0, /* 0=0.8B 1=2B 2=4B 3=9B */
  PicArr: ["", "images/AIGirls/qwen-minion/idle.png", "images/AIGirls/qwen-minion/idle.png",
    "images/AIGirls/bullets/star.png", "images/Plants/PeaBulletHit0.webp", "images/AIGirls/qwen-minion/idle.png"],
  PrivateBirth(self) {
    /* 成长：每 30s 升一档（攻速加快+体型变大） */
    (function growLoop() {
      oSym.addTask(30000, _ => {
        if (!$P[self.id]) return;
        if (self._stage < 3) {
          self._stage++;
          let scales = [1.0, 1.15, 1.3, 1.45];
          try {
            let body = $(self.id).childNodes[1];
            body.style.transform = `scale(${scales[self._stage]})`;
            body.style.transformOrigin = "bottom center";
          } catch (e) {}
          aiFloatText(["小千问 2B！", "小千问 4B！", "千问 9B 满血养成！！"][self._stage - 1],
            "#D9F", self.pixelLeft - 30, self.pixelTop - 8);
        }
        growLoop();
      });
    })();
  },
  NormalAttack(zid) {
    /* 攻击间隔随档位缩短：900/700/500/350ms */
    let cds = [900, 700, 500, 350];
    if (!aiCanShoot(this, cds[this._stage || 0])) return;
    let bullets = [oAIBullet, oBullet15, oBullet20, oBullet40];
    CustomBullet(bullets[this._stage || 0], [this.PicArr[this.BulletGif]],
      this.AttackedLX, this.pixelTop + 10, this.R);
  }
});

/* ============ 死亡掉落增强（尝试性钩子，失败不影响定时掉落） ============
 * 思路：眩晕/死亡路径多样，为稳妥仅对 Boss 额外处理：Boss 波开始时必掉一张。 */
