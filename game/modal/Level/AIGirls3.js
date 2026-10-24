/*!
 * 《AI娘大战僵尸》第 3 关：决战·版本更新巨人
 * 全阵容梗怪 + 终波 Boss（版本更新巨人：每损 25% HP 无敌+变强）
 */
"use strict";

oS.Init({
  PName: [oChiBaiFan, oDouBao, oTiePenDaFeiYu, oGPTLongNiang, oZhongZhuanDaFeiYu,
          oClaudeOjou, oHajimi, oQwenOjou],
  ZName: [oZombie, oConeheadZombie, oBucketheadZombie,
          oRouterZombie, oHallucinationZombie, oPopupAdZombie,
          oLoadingZombie, oUpdateGiant],
  CanSelectCard: 0,
  SunNum: 250,
  LevelName: "服务器机房 1-3 正在安装更新 99%",
  LvlEName: 99,
  LoadMusic: "Bgm_Forest_Ready",
  StartGameMusic: "Bgm_Forest_Fight"
}, {
  AZ: [[oZombie, 5, 1], [oConeheadZombie, 4, 1], [oLoadingZombie, 2, 2],
       [oRouterZombie, 3, 3], [oHallucinationZombie, 2, 4], [oPopupAdZombie, 1, 5],
       [oBucketheadZombie, 3, 6], [oUpdateGiant, 1, 10]],
  FlagNum: 10,
  FlagToSumNum: {
    a1: [3, 5, 8],
    a2: [1, 2, 4, 6]
  }
});
