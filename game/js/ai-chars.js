/*!
 * 《AI娘大战僵尸》—— AI 娘角色卡定义
 * ---------------------------------------------------------------
 * 本文件是"可挑选模块"：每张卡一个定义块，明早不满意哪张，
 * 整块删掉重写即可，不影响其他卡与引擎。
 *
 * 每张卡的素材占位当前指向引擎自带图片（跑通优先），
 * 替换方法：把 PicArr 里的路径换成 images/AIGirls/<角色>/ 下
 * 的同名文件即可（idle.png / attack.png / card.png / produce.png）。
 *
 * 数值基准：普通僵尸 HP=200；输出卡 100token≈20~28期望DPS；
 *          坦克卡 100token≈1800有效HP。
 */
"use strict";

/* ============================================================
 * 通用子弹构造器：伤害可定制（复用豌豆的移动/碰撞逻辑）
 * ============================================================ */
let oAIBullet = InheritO(oPeaBullet, { EName: "oAIBullet", Attack: 20 }),
    oBullet15 = InheritO(oPeaBullet, { EName: "oBullet15", Attack: 15 }),
    oBullet18 = InheritO(oPeaBullet, { EName: "oBullet18", Attack: 18 }),
    oBullet20 = InheritO(oPeaBullet, { EName: "oBullet20", Attack: 20 }),
    oBullet25 = InheritO(oPeaBullet, { EName: "oBullet25", Attack: 25 }),
    oBullet40 = InheritO(oPeaBullet, { EName: "oBullet40", Attack: 40 }),
    oBullet60 = InheritO(oPeaBullet, { EName: "oBullet60", Attack: 60, Speed: 7 }),
    /* GPT龙娘的方差子弹：算错(0.11倍)/算对(3倍) —— 梗：9.11>9.9 数学翻车 */
    oBulletGPTMiss = InheritO(oPeaBullet, { EName: "oBulletGPTMiss", Attack: 3, Speed: 3 }),
    oBulletGPTCrit = InheritO(oPeaBullet, { EName: "oBulletGPTCrit", Attack: 75, Speed: 6 }),
    /* 中转站的"上游金光弹" —— 梗：中转站连 Claude，演 Claude */
    oBulletUpstream = InheritO(oPeaBullet, { EName: "oBulletUpstream", Attack: 60, Speed: 8 });

/* 攻击节流工具：self._nextAt 记录下次可攻击时刻。
 * "已路由至 Luna"降智：被路由器僵尸啃过的 AI 娘 10s 内冷却×1.4（打得变慢） */
let aiCanShoot = (self, cd) => {
  if (self._lunaUntil && oSym.Now < self._lunaUntil) cd *= 1.4;
  let now = oSym.Now;
  if ((self._nextAt || 0) > now) return false;
  self._nextAt = now + cd;
  return true;
};

/* ============================================================
 * ① 吃白饭大肥鱼（DeepSeek）—— 经济位
 * 梗：免费模型+吃白饭人设。每 20s 端碗产 25 token。
 * [M3] 能量豆「干饭王」：8s 内每 2s 产 25
 * 素材目录：images/AIGirls/dabafei-eat/
 * ============================================================ */
var oChiBaiFan = InheritO(CPlants, {
  EName: "oChiBaiFan",
  CName: "吃白饭大肥鱼",
  width: 73, height: 74,
  beAttackedPointR: 40,
  SunNum: 50,
  CanSpawnSun: true,
  ProduceGif: 3,
  coolTime: 7.5,
  HP: 300,
  PicArr: ["images/AIGirls/dabafei-eat/card.png", "images/AIGirls/dabafei-eat/static.png",
    "images/AIGirls/dabafei-eat/idle.png", "images/AIGirls/dabafei-eat/produce.png"],
  Tooltip: "端碗吃白饭，定期产出 token（白嫖经济核心）",
  Story: "DeepSeek 大肥鱼的爱称来自免费与摸鱼人设：端着饭碗、上班摸鱼、嘴里傲娇。",
  ChangePosition: function (c, a) {
    c.childNodes[1].src = this.PicArr[a ? this.ProduceGif : this.NormalGif];
  },
  PrivateBirth: function (self) {
    if (!oS.ProduceSun) return;
    let id = self.id, ele = $(id);
    oSym.addTask(500, function fun(X, Y) {
      if (!$P[id]) return;
      self.ChangePosition(ele, 1);
      oSym.addTask(75, _ => {
        if (!$P[id]) return;
        AppearSun(X - 30, Y - 50, 25, 0, 25 - Math.random() * 10);
        oSym.addTask(100, _ => $P[id] && self.ChangePosition(ele, 0));
        oSym.addTask(19250, fun, [X, Y]); // 每 20s 一碗白饭
      });
    }, [GetX(self.C) + 75, GetY(self.R)]);
  },
  InitTrigger: _ => {}
}),

/* ============================================================
 * ② 铁盆大肥鱼（DeepSeek）—— 坦克+干扰位
 * 梗：大肥鱼标志性的"铁盆帽子组件"。摘盆掷出→盆回旋戴回；
 *    命中 30% 概率"铁盆扣头"：僵尸被扣住头原地打转 2.5s。
 * [M3] 被动「帽子在手」：盆在头受伤-20%；能量豆「盆阵风暴」
 * 素材目录：images/AIGirls/dabafei-pot/
 * ============================================================ */
oTiePenDaFeiYu = InheritO(CPlants, {
  EName: "oTiePenDaFeiYu",
  CName: "铁盆大肥鱼",
  width: 75, height: 83,
  beAttackedPointR: 51,
  SunNum: 125,
  HP: 1500,
  coolTime: 20,
  AttackGif: 5, BulletGif: 3,
  PicArr: ["images/AIGirls/dabafei-pot/card.png", "images/AIGirls/dabafei-pot/static.png",
    "images/AIGirls/dabafei-pot/idle.png", "images/AIGirls/bullets/pot.png",
    "images/Plants/PeaBulletHit0.webp", "images/AIGirls/dabafei-pot/attack.png"],
  Tooltip: "摘下头顶铁盆旋转掷出（40伤），30%概率扣住僵尸的头原地打转",
  Story: "铁盆是大肥鱼表情包的标志性帽子组件：铁盆扣头。",
  NormalAttack(zid) {
    if (!aiCanShoot(this, 2000)) return; // 2s 一盆
    let self = this, id = self.id, dom = $(id);
    dom.childNodes[1].src = self.PicArr[self.AttackGif];
    oSym.addTask(100, _ => $(id) && (dom.childNodes[1].src = self.PicArr[self.NormalGif]));
    oSym.addTask(60, _ => {
      PlayAudio('throw');
      CustomBullet(oBullet40, [self.PicArr[self.BulletGif]], self.AttackedLX, self.pixelTop + 15, self.R);
      /* [M3] 铁盆扣头：30% 眩晕目标僵尸 2.5s —— 挂标记，命中后处理 */
    });
  }
}),

/* ============================================================
 * ③ 中转站大肥鱼（DeepSeek）—— 波动输出位
 * 梗：45% 中转站模型造假 / "正在连接上游"演 Claude / 502。
 * 普攻 15/1s；每第 4 发走中转→Claude 金光 60 伤；
 * 15% 翻车弹 502 停火 2s（场上有 Claude 卡则不翻车）。
 * [M3] 能量豆「全走上游」：10s 全金光
 * 素材目录：images/AIGirls/dabafei-relay/
 * ============================================================ */
oZhongZhuanDaFeiYu = InheritO(CPlants, {
  EName: "oZhongZhuanDaFeiYu",
  CName: "中转站大肥鱼",
  width: 75, height: 75,
  beAttackedPointR: 51,
  SunNum: 175,
  HP: 300,
  coolTime: 12,
  AttackGif: 5, BulletGif: 3,
  _shotCount: 0,
  PicArr: ["images/AIGirls/dabafei-relay/card.png", "images/AIGirls/dabafei-relay/static.png",
    "images/AIGirls/dabafei-relay/idle.png", "images/AIGirls/bullets/req.png",
    "images/Plants/PeaBulletHit0.webp", "images/AIGirls/dabafei-relay/attack.png"],
  Tooltip: "普通请求弹；每第4发『正在连接上游……』由 Claude 金光代打(60伤)；15%概率 502 拔网线",
  Story: "中转站大肥鱼平时自己干活，某些请求会突然走中转——一道金光，Claude 替她打。",
  NormalAttack(zid) {
    let self = this;
    let allUp = self._allUpstream && oSym.Now < self._allUpstream;   // 大招期间全走上游
    /* 502 翻车：15% 且场上没有 Claude 大小姐（大招期间线路全开不翻车） */
    let hasClaude = Object.values($P).some(p => p.EName === "oClaudeOjou");
    if (self._502until && oSym.Now < self._502until) return;
    if (!aiCanShoot(self, 1000)) return;
    if (!allUp && !hasClaude && Math.random() < 0.15) {
      self._502until = oSym.Now + 2000; // 拔网线 2s
      /* [M3] 播放蹲下拔网线动画+头顶 502 弹字 */
      return;
    }
    self._shotCount = (self._shotCount || 0) + 1;
    let upstream = allUp || self._shotCount % 4 === 0;
    let id = self.id, dom = $(id);
    dom.childNodes[1].src = self.PicArr[self.AttackGif];
    oSym.addTask(100, _ => $(id) && (dom.childNodes[1].src = self.PicArr[self.NormalGif]));
    oSym.addTask(60, _ => {
      upstream ? PlayAudio('shieldhit') : PlayAudio('throw');
      let pic = upstream ? "images/AIGirls/bullets/upstream.png" : "images/AIGirls/bullets/req.png";
      CustomBullet(upstream ? oBulletUpstream : oBullet15,
        [pic], self.AttackedLX, self.pixelTop + 15, self.R);
      /* [M3] upstream 时显示 Claude 影子特效 */
    });
  }
}),

/* ============================================================
 * ④ GPT 龙娘（OpenAI）—— 高方差主C
 * 梗：白发龙角龙娘形象；"已路由至 Luna"降智（2026 GPT-5.6 宇宙系命名）；
 *    9.11>9.9 数学翻车（攻击方差）；"稳稳接住你"台词气泡。
 * 普攻 25/1.2s；10% 算错(3伤) 8% 算对暴击(75伤)。
 * [M3] 被动「已路由至 Luna」：连续输出 15s 攻击-40%，停火 5s 恢复
 * [M3] 能量豆「Sora-2 夺冠时刻」：全场僵尸看假夺冠视频停下庆祝 5s
 * 素材目录：images/AIGirls/gpt-luna/
 * ============================================================ */
oGPTLongNiang = InheritO(CPlants, {
  EName: "oGPTLongNiang",
  CName: "GPT龙娘",
  width: 75, height: 75,
  beAttackedPointR: 51,
  SunNum: 150,
  HP: 400,
  coolTime: 7.5,
  AttackGif: 5, BulletGif: 3,
  PicArr: ["images/AIGirls/gpt-luna/card.png", "images/AIGirls/gpt-luna/static.png",
    "images/AIGirls/gpt-luna/idle.png", "images/AIGirls/bullets/dragon.png",
    "images/Plants/PeaBulletHit0.webp", "images/AIGirls/gpt-luna/attack.png"],
  Tooltip: "龙息 25伤；10%概率数学没算对(3伤)，8%概率算对了得意一击(75伤)",
  Story: "白发龙角的 GPT 龙娘。攻击伤害偶尔翻车——毕竟 9.11 和 9.9 哪个大是世界难题。",
  NormalAttack(zid) {
    if (!aiCanShoot(this, 1200)) return;
    let self = this, id = self.id, dom = $(id);
    /* 被动「已路由至 Luna」：连续作战 15s 后被路由到轻量款（伤害降为15），停火 5s 切回 Sol */
    let now = oSym.Now;
    if (now - (self._lastShot || 0) > 5000) self._workSince = now;
    if (!self._lunaMode && now - (self._workSince || now) > 15000) {
      self._lunaMode = true;
      aiFloatText("已路由至 Luna……", "#9AF", self.pixelLeft - 10, self.pixelTop - 8);
    }
    self._lastShot = now;
    dom.childNodes[1].src = self.PicArr[self.AttackGif];
    oSym.addTask(100, _ => $(id) && (dom.childNodes[1].src = self.PicArr[self.NormalGif]));
    oSym.addTask(60, _ => {
      let r = Math.random(), bullet = self._lunaMode ? oBullet15 : oBullet25,
          pic = self.PicArr[self.BulletGif];
      if (r < 0.10) { bullet = oBulletGPTMiss; pic = "images/AIGirls/bullets/miss.png"; }       // 算错
      else if (r < 0.18) { bullet = oBulletGPTCrit; pic = "images/AIGirls/bullets/crit.png"; }  // 算对（得意）
      CustomBullet(bullet, [pic], self.AttackedLX, self.pixelTop + 15, self.R);
      if (Math.random() < 0.06) aiFloatText("我会稳稳接住你~", "#CFC", self.pixelLeft, self.pixelTop - 6); // 口头禅彩蛋
    });
  }
}),

/* ============================================================
 * ⑤ Claude 大小姐（Anthropic）—— 处决+剥装位
 * 梗：2026 封号潮（Account Disabled 红章、无预警、精准风控）；
 *    橘发虎耳、家教很严的大小姐（2026 娘化圈标准设定）。
 * 普攻羽毛笔 20/1.1s，命中敌人头上盖小红章；集满 3 章
 * → 天降 Account Disabled 大红章：小怪直接封禁秒杀，
 *   装备怪先剥掉路障/铁桶再封（付费权益也没收）。
 * [M3] 被动「精准风控」：优先锁定装备最豪华的敌人
 * [M3] 能量豆「封号潮」：全场同时落章
 * 素材目录：images/AIGirls/claude-ojou/
 * ============================================================ */
oClaudeOjou = InheritO(CPlants, {
  EName: "oClaudeOjou",
  CName: "Claude大小姐",
  width: 75, height: 75,
  beAttackedPointR: 51,
  SunNum: 175,
  HP: 350,
  coolTime: 12,
  AttackGif: 5, BulletGif: 3,
  PicArr: ["images/AIGirls/claude-ojou/card.png", "images/AIGirls/claude-ojou/static.png",
    "images/AIGirls/claude-ojou/idle.png", "images/AIGirls/bullets/quill.png",
    "images/Plants/PeaBulletHit0.webp", "images/AIGirls/claude-ojou/attack.png"],
  Tooltip: "羽毛笔 20伤并盖章；集满 3 枚红章 → Account Disabled！小怪秒封、装备全部没收",
  Story: "家教很严的橘发虎耳大小姐。她的封号又快又准，连付费用户也无法幸免。",
  NormalAttack(zid) {
    if (!aiCanShoot(this, 1100)) return;
    let self = this, id = self.id, dom = $(id);
    dom.childNodes[1].src = self.PicArr[self.AttackGif];
    oSym.addTask(100, _ => $(id) && (dom.childNodes[1].src = self.PicArr[self.NormalGif]));
    oSym.addTask(60, _ => {
      PlayAudio('throw2');
      CustomBullet(oBullet20, [self.PicArr[self.BulletGif]], self.AttackedLX, self.pixelTop + 15, self.R);
      /* 盖章：攻击命中即记 1 章（射手弹速快近似必中），满 3 章 → Account Disabled */
      let z = $Z[zid];
      if (!z) return;
      z._stamps = (z._stamps || 0) + 1;
      if (z._stamps >= 3) {
        z._stamps = 0;
        let isBoss = z.HP > 2000;
        if (isBoss) {
          aiStun(z, 2.5);
          z.getHit0 && z.getHit0(z, 150, 0);
        } else if (z.OrnHP > 0) {
          /* 付费权益也没收：先剥装备（引擎自带掉装备动画）再补一刀 */
          z.OrnHP = 1;
          z.getHit0 && z.getHit0(z, 60, 0);
        } else {
          z.getHit0 && z.getHit0(z, 9999, 0);
        }
        aiFloatText("Account Disabled", "#F66", z.X - 60, z.pixelTop);
      }
    });
  }
}),

/* ============================================================
 * ⑥ 豆包（字节）—— 近战直接处决位（用户钦点倭瓜位）
 * 梗："我会用最直接、最真相、最不绕弯……的方式告诉你"（2026.6 口头禅爆梗）。
 * 敌人踩格→蹦起一屁股坐死，无视一切装备护盾；坐完发呆 1.5s，CD 18s。
 * [M3] 能量豆「最不墨迹」：10s 无冷却连坐
 * 素材目录：images/AIGirls/doubao/
 * ============================================================ */
oDouBao = InheritO(CPlants, {
  EName: "oDouBao",
  CName: "豆包",
  width: 75, height: 75,
  beAttackedPointR: 45,
  SunNum: 50,
  HP: 400,
  coolTime: 18,
  Stature: 0,
  PicArr: ["images/AIGirls/doubao/card.png", "images/AIGirls/doubao/static.png",
    "images/AIGirls/doubao/idle.png", "", "", "images/AIGirls/doubao/attack.png"],
  Tooltip: "最直接、最不绕弯：敌人踩到格子里，一屁股坐死，无视路障铁桶",
  Story: "别人打盾磨半天，豆包直接给结果。坐下时会说：用最直接、最一针见血的方式告诉你。",
  NormalAttack(zid) {
    /* 大招期间（最不墨迹）冷却 0.8s 连坐；平时 CD 18s */
    let rapid = this._rapidUntil && oSym.Now < this._rapidUntil;
    if (!aiCanShoot(this, rapid ? 800 : 18000)) return;
    let self = this, z = $Z[zid];
    if (!z) return;
    let id = self.id, dom = $(id);
    dom.childNodes[1].src = self.PicArr[5];
    /* 蹦起 0.4s 后落下：对触发目标直接结算 999（无视装备） */
    oSym.addTask(400, _ => {
      let zz = $Z[zid];
      if (!zz || !$P[id]) return;
      /* Boss（>2000HP）改为 600 伤重击+短眩晕；小怪直接坐死 */
      let dmg = zz.HP > 2000 ? 600 : 999;
      if (zz.HP > 2000) { try { aiStun(zz, 1.5); } catch (e) {} }
      zz.getHit0 ? zz.getHit0(zz, dmg, 0) : zz.getHit(zz, dmg);
      PlayAudio('splat3');
    });
    oSym.addTask(1500, _ => $(id) && (dom.childNodes[1].src = self.PicArr[self.NormalGif]));
  }
}),

/* ============================================================
 * ⑦ Gemini 哈基米（Google）—— 干扰位
 * 梗：Gemini→哈基米（空耳+猫梗）；Nano Banana 修图（"我把你这张图改了"）；
 *    Google 限流（打 6s 摆烂 1.5s）。
 * 普攻猫爪快挠 8 伤/350ms（近程触发）。
 * [M3] 特殊「Nano Banana」：每 12s 修图——铁桶P成纸袋(护甲清零)/路障P没/小怪P小
 * [M3] 能量豆「批量修图」
 * 素材目录：images/AIGirls/hajimi/
 * ============================================================ */
oHajimi = InheritO(CPlants, {
  EName: "oHajimi",
  CName: "Gemini哈基米",
  width: 75, height: 75,
  beAttackedPointR: 51,
  SunNum: 150,
  HP: 350,
  coolTime: 10,
  AttackGif: 5, BulletGif: 3,
  _lazyUntil: 0,
  PicArr: ["images/AIGirls/hajimi/card.png", "images/AIGirls/hajimi/static.png",
    "images/AIGirls/hajimi/idle.png", "images/AIGirls/bullets/claw.png",
    "images/Plants/PeaBulletHit0.webp", "images/AIGirls/hajimi/attack.png"],
  Tooltip: "猫爪快挠（8伤/0.35s 近程）；每12s 拿香蕉把最前敌人『修图』——铁桶P成纸袋",
  Story: "Gemini 的空耳昵称。打 6 秒要趴下摆烂 1.5 秒——已达今日限额。",
  PrivateBirth(self) {
    /* 「Nano Banana」修图：每 12s 把本行最前面的装备怪 P 掉装备 */
    (function editLoop() {
      oSym.addTask(12000, _ => {
        if (!$P[self.id]) return;
        let target = null;
        Object.values($Z).forEach(z => {
          if (z.R === self.R && z.OrnHP > 0 && (!target || z.X > target.X)) target = z;
        });
        if (target) {
          aiFloatText("Nano Banana：改图！", "#BDF", target.X - 70, target.pixelTop);
          target.OrnHP = 1;                       // 装备被 P 成纸袋，下一击掉落
          target.getHit0 && target.getHit0(target, 10, 0);
          PlayAudio("shieldhit");
        }
        editLoop();
      });
    })();
  },
  NormalAttack(zid) {
    /* 限流摆烂：输出 6s 后停 1.5s（"已达今日限额"） */
    if (this._lazyUntil > oSym.Now) return;
    if (!this._workFrom) this._workFrom = oSym.Now;
    if (oSym.Now - this._workFrom > 6000) {
      this._lazyUntil = oSym.Now + 1500;
      this._workFrom = 0;
      if (Math.random() < 0.5) aiFloatText("已达今日限额…摆烂", "#DDD", this.pixelLeft - 20, this.pixelTop - 6);
      return;
    }
    if (!aiCanShoot(this, 350)) return;
    let self = this;
    oSym.addTask(60, _ => {
      CustomBullet(oAIBullet, [self.PicArr[self.BulletGif]], self.AttackedLX, self.pixelTop + 15, self.R);
    });
  }
}),

/* ============================================================
 * ⑧ 千问大小姐（阿里 Qwen）—— 养成召唤位
 * 梗：Qwen 开源全家桶 0.5B~72B，小模型特别多、特别全。
 * 本体 18/1.3s（弱）；每 25s 孵一只 0.8B 小千问（同格随从），
 * 存活每 30s 长大一档 0.8B→2B→4B→9B（攻 6→12→24→48，体型变大）；
 * 小千问被啃死从头再孵。
 * [M3] 孵化+成长系统；能量豆「全家桶」：倒出全尺寸小千问
 * 素材目录：images/AIGirls/qwen/
 * ============================================================ */
oQwenOjou = InheritO(CPlants, {
  EName: "oQwenOjou",
  CName: "千问大小姐",
  width: 75, height: 75,
  beAttackedPointR: 51,
  SunNum: 200,
  HP: 500,
  coolTime: 15,
  AttackGif: 5, BulletGif: 3,
  PicArr: ["images/AIGirls/qwen/card.png", "images/AIGirls/qwen/static.png",
    "images/AIGirls/qwen/idle.png", "images/AIGirls/bullets/star.png",
    "images/Plants/PeaBulletHit0.webp", "images/AIGirls/qwen/attack.png"],
  Tooltip: "本体 18伤；不断孵化小千问 0.8B→2B→4B→9B 越养越强——保护好养大的 9B！",
  Story: "千问家族特别能生：0.5B 到 72B 全尺寸都有，开源全家桶全球下载第一。",
  PrivateBirth(self) {
    /* 「开源孵化」：每 25s 检查一次，本格没有小千问就孵一只 0.8B（成长见 oQwenMini） */
    (function hatchLoop() {
      oSym.addTask(25000, _ => {
        if (!$P[self.id]) return;
        let minion = oGd.$[`${self.R}_${self.C}_3`];
        if (!minion) {
          try {
            CustomSpecial(oQwenMini, self.R, self.C);
            aiFloatText("孵化 0.8B 小千问", "#D9F", self.pixelLeft - 30, self.pixelTop - 8);
          } catch (e) {}
        }
        hatchLoop();
      });
    })();
  },
  NormalAttack(zid) {
    if (!aiCanShoot(this, 1300)) return;
    let self = this, id = self.id, dom = $(id);
    dom.childNodes[1].src = self.PicArr[self.AttackGif];
    oSym.addTask(100, _ => $(id) && (dom.childNodes[1].src = self.PicArr[self.NormalGif]));
    oSym.addTask(60, _ => {
      CustomBullet(oBullet18, [self.PicArr[self.BulletGif]], self.AttackedLX, self.pixelTop + 15, self.R);
    });
  }
});
