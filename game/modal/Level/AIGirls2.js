/*!
 * 《AI娘大战僵尸》第 2 关：全卡解锁 + 梗怪登场
 * 梗怪：路由器（啃咬降智）/幻觉（半透明打空）/弹窗广告（飘过前排）
 */
"use strict";

oS.Init({
  PName: [oChiBaiFan, oDouBao, oTiePenDaFeiYu, oGPTLongNiang, oZhongZhuanDaFeiYu,
          oClaudeOjou, oHajimi, oQwenOjou],
  ZName: [oZombie, oConeheadZombie, oBucketheadZombie,
          oRouterZombie, oHallucinationZombie, oPopupAdZombie],
  CanSelectCard: 0,
  SunNum: 200,
  LevelName: "服务器草坪 1-2 请求洪流",
  LvlEName: 99,
  LoadMusic: "Bgm_Forest_Ready",
  StartGameMusic: "Bgm_Forest_Fight"
}, {
  AZ: [[oZombie, 5, 1], [oConeheadZombie, 4, 2], [oRouterZombie, 3, 3],
       [oHallucinationZombie, 2, 4], [oPopupAdZombie, 1, 6], [oBucketheadZombie, 2, 7]],
  FlagNum: 10,
  FlagToSumNum: {
    a1: [3, 5, 8],
    a2: [1, 2, 3, 5]
  }
});
