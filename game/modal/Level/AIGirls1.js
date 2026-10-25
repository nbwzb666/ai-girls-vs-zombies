/*!
 * 《AI娘大战僵尸》第 1 关：服务器草坪·教学关
 * 解锁前 5 张卡；只有经典三件套僵尸。
 */
"use strict";

oS.Init({
  PName: [oChiBaiFan, oDouBao, oTiePenDaFeiYu, oGPTLongNiang, oZhongZhuanDaFeiYu],
  ZName: [oZombie, oConeheadZombie, oBucketheadZombie],
  CanSelectCard: 0,
  SunNum: 150,
  LevelName: "服务器草坪 1-1 陌生的访客",
  backgroundImage: "images/interface/DayLawn.png",
  LvlEName: 99,
  LoadMusic: "AI_BGM_Day",
  StartGameMusic: "AI_BGM_Day"
}, {
  AZ: [[oZombie, 6, 1], [oConeheadZombie, 3, 3], [oBucketheadZombie, 1, 7]],
  FlagNum: 8,
  FlagToSumNum: {
    a1: [5, 6],
    a2: [1, 4, 10]
  }
});
