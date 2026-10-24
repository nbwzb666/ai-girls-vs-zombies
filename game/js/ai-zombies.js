/*!
 * 《AI娘大战僵尸》—— 梗怪定义（5 只）
 * ---------------------------------------------------------------
 * 设计原则：每只怪=基础僵尸+1~2 个梗行为钩子；视觉先沿用原版图
 * （标注 TODO 换皮路径），机制先行，明日换图即换长相。
 *
 * 梗出处（均为"AI 用户/网民看到就笑"的日常梗，非术语课）：
 *   弹窗广告：全网日常弹窗广告挡路 → 撑杆跳过第一个角色
 *   路由器：2026"被路由到 Luna=降智" → 啃咬使 AI 娘降智（攻速-40%）
 *   幻觉："它在幻觉"AI 用户日常语 → 半透明，远程 35% 打空
 *   转圈加载：网页转圈加载 → 速度快但每 3s 原地转圈 1s（转圈时无敌）
 *   版本更新巨人：被强制更新支配的恐惧 → 每损 25% HP 弹"正在安装更新"
 */
"use strict";

/* ============================================================
 * ① 弹窗广告僵尸：顶着"弹窗盾"无视你的前排飘过去，打掉弹窗后落地
 * 继承引擎气球僵尸全套逻辑（气球=弹窗盾，飘行=广告挡视线跨越前排）。
 * 素材 TODO：images/AIZombies/popup-ad/（气球位置换"限时特惠"弹窗牌）
 * ============================================================ */
var oPopupAdZombie = InheritO(oBalloonZombie, {
  EName: "oPopupAdZombie",
  CName: "弹窗广告僵尸",
  HP: 400,
  Lvl: 2
  /* 飘行/被击落行为全部继承自 oBalloonZombie */
});

/* ============================================================
 * ② 路由器僵尸：啃咬附带把 AI 娘"路由到 Luna"（降智）
 * 被 Luna 路由的 AI 娘 10s 内攻击冷却 ×1.4（aiCanShoot 统一处理）。
 * 素材 TODO：images/AIZombies/router/（背路由器天线背包）
 * ============================================================ */
var oRouterZombie = InheritO(oZombie, {
  EName: "oRouterZombie",
  CName: "路由器僵尸",
  HP: 300,
  Lvl: 2,
  Attack: 22,
  NormalAttack(zid, pid, x) {
    let plant = $P[pid];
    if (plant) {
      plant._lunaUntil = oSym.Now + 10000; // "已路由至 Luna"
      /* [M3+] 头顶弹字"已路由至 Luna" */
    }
    return CZombies.prototype.NormalAttack.call(this, zid, pid, x);
  }
});

/* ============================================================
 * ③ 幻觉僵尸：半透明，我方远程 35% 打空
 * 素材 TODO：images/AIZombies/hallucination/（半透明残影）
 * ============================================================ */
var oHallucinationZombie = InheritO(oZombie, {
  EName: "oHallucinationZombie",
  CName: "幻觉僵尸",
  HP: 300,
  Lvl: 2,
  BirthCallBack(a) {
    let r = oZombie.prototype.BirthCallBack.call(this, a);
    /* 半透明残影 */
    this.EleBody && (this.EleBody.style.opacity = 0.55);
    this.Ele && (this.Ele.style.opacity = 0.8);
    return r;
  },
  getPea(self, attack, direction) {
    /* 35% 打空：命中幻觉 */
    if (Math.random() < 0.35) {
      self.PlayNormalballAudio && self.PlayNormalballAudio();
      /* [M3+] 弹出"miss/打空"字样 */
      return;
    }
    oZombie.prototype.getPea.call(self, self, attack, direction);
  }
});

/* ============================================================
 * ④ 转圈加载僵尸：速度快，每 3s 原地转圈 1s，转圈时无敌
 * 素材 TODO：images/AIZombies/loading/（头顶转圈图标）
 * ============================================================ */
var oLoadingZombie = InheritO(oZombie, {
  EName: "oLoadingZombie",
  CName: "转圈加载僵尸",
  HP: 350,
  Lvl: 2,
  OSpeed: 2.4, Speed: 2.4,
  _spinInvul: 0,
  BirthCallBack(a) {
    let r = oZombie.prototype.BirthCallBack.call(this, a);
    let self = this;
    /* 循环：跑 3s → 转圈(无敌)1s */
    (function spinLoop() {
      if (!$Z[self.id]) return;
      oSym.addTask(3000, () => {
        if (!$Z[self.id]) return;
        self._spinInvul = 1;
        self.SpeedCoefficient = 0;                 // 原地转圈
        self.EleBody && (self.EleBody.style.filter = "brightness(1.4)");
        oSym.addTask(1000, () => {
          if (!$Z[self.id]) return;
          self._spinInvul = 0;
          self.SpeedCoefficient = 1;
          self.EleBody && (self.EleBody.style.filter = "");
          spinLoop();
        });
      });
    })();
    return r;
  },
  getHit(self, attack) {
    if (self._spinInvul) return;                    // 加载中打不动
    return oZombie.prototype.getHit.call(self, self, attack);
  },
  getHit0(self, attack, d) {
    if (self._spinInvul) return;
    return oZombie.prototype.getHit0.call(self, self, attack, d);
  }
});

/* ============================================================
 * ⑤ 版本更新巨人（Boss）：每损 25% HP 弹"正在安装更新"
 * 短暂无敌 + 攻速/啃咬提升 20%（过拟合式越打越疯）。
 * 素材 TODO：images/AIZombies/update-giant/（巨人+进度条盾）
 * ============================================================ */
var oUpdateGiant = InheritO(oGargantuar || oBucketheadZombie, {
  EName: "oUpdateGiant",
  CName: "版本更新巨人",
  HP: 3800,
  Lvl: 3,
  Attack: 100,
  _lastPhase: 0,
  BirthCallBack(a) {
    let base = (oGargantuar || oBucketheadZombie).prototype.BirthCallBack;
    let r = base.call(this, a);
    let self = this;
    /* 阶段检查：每损 25% 触发一次安装更新 */
    (function phaseLoop() {
      if (!$Z[self.id]) return;
      let pct = 4 - Math.floor(self.HP / (self.BreakPointTotal = self.BreakPointTotal || 3800) * 4.001);
      if (pct > self._lastPhase) {
        self._lastPhase = pct;
        self._spinInvul = 1;                        // 安装中无敌
        self.Attack = (self.Attack || 100) * 1.2;   // 越打越疯
        self.SpeedCoefficient = Math.min(1, 0.55 + pct * 0.15);
        /* [M3+] 弹出"正在安装更新 43%..."进度条 */
        oSym.addTask(1200, () => { self._spinInvul = 0; });
      }
      oSym.addTask(200, phaseLoop);
    })();
    return r;
  },
  getHit0(self, attack, d) {
    if (self._spinInvul) return;                    // 更新中无敌
    return (oGargantuar || oBucketheadZombie).prototype.getHit0.call(self, self, attack, d);
  }
});
