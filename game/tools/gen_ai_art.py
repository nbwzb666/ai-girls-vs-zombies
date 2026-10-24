# -*- coding: utf-8 -*-
"""
《AI娘大战僵尸》Q版角色素材生成器
====================================
用法：python tools/gen_ai_art.py
输出：images/AIGirls/<role>/{card.png, idle.png, attack.png, produce.png}
      images/AIGirls/interface/{token_strip.png, token_icon.png}

明天想改某个角色的形象：
  1. 改下面 CHARS 里该角色的配置（发色/服装/特征物）
  2. 重跑本脚本即可，无需动游戏代码。

角色特征（来自网络查证的流行形象）：
  - 大肥鱼系：深蓝长发+鲸尾+女仆围裙+端碗；铁盆版头顶铁盆；中转版背路由器
  - GPT龙娘：白发+绿色龙角+小龙翼
  - Claude大小姐：橘发+虎耳+红印章
  - 豆包：圆滚滚黄色豆子+呆萌脸
  - 哈基米：猫耳(Google四色)+香蕉
  - 千问：紫发+星饰+小小千问
"""
import math, os
from PIL import Image, ImageDraw, ImageFilter

ROOT = os.path.join(os.path.dirname(__file__), "..", "images", "AIGirls")

# ---------------------------------------------------------------- 基础工具
def canvas(w, h):
    return Image.new("RGBA", (w, h), (0, 0, 0, 0))

def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(len(a)))

def darken(c, k=0.72):
    return tuple(int(v * k) for v in c[:3]) + (255,)

def lighten(c, k=0.25):
    base = (255, 255, 255)
    return lerp(c, base + (255,), k)

# ---------------------------------------------------------------- Q版小人引擎
class Chibi:
    """75x75 Q 版小人骨架：头大身小，特征驱动。"""
    def __init__(self, S=75):
        self.S = S
        self.im = canvas(S, S)
        self.d = ImageDraw.Draw(self.im)
        self.scale = S / 75.0

    def px(self, v): return v * self.scale

    def shadow(self, cx=37, cy=68, rx=16, ry=4):
        self.d.ellipse([self.px(cx-rx), self.px(cy-ry), self.px(cx+rx), self.px(cy+ry)],
                       fill=(30, 30, 30, 70))

    def body(self, cx, cy, rw, rh, color):
        """小裙子身体"""
        x0, y0 = self.px(cx-rw), self.px(cy-rh)
        x1, y1 = self.px(cx+rw), self.px(cy+rh)
        self.d.rounded_rectangle([x0, y0, x1, y1], radius=self.px(rw*0.9), fill=color)

    def arms(self, cx, cy, color, lift=0):
        r = self.px(4.2)
        for dx in (-13, 13):
            x = self.px(cx+dx); y = self.px(cy - lift)
            self.d.ellipse([x-r, y-r, x+r, y+r], fill=color)

    def head(self, cx, cy, r, skin=(255, 232, 214, 255), back_hair=None):
        """头+后发"""
        if back_hair:
            hr = self.px(r*1.18)
            x, y = self.px(cx), self.px(cy)
            self.d.ellipse([x-hr, y-hr, x+hr, y+hr+ self.px(8)], fill=back_hair)
        x, y = self.px(cx), self.px(cy)
        rr = self.px(r)
        self.d.ellipse([x-rr, y-rr, x+rr, y+rr], fill=skin)

    def bangs(self, cx, cy, r, color, style="arc"):
        """刘海"""
        x, y, rr = self.px(cx), self.px(cy), self.px(r)
        if style == "arc":
            self.d.pieslice([x-rr*1.05, y-rr*1.1, x+rr*1.05, y+rr*1.05], 180, 360, fill=color)
            # 刘海缺口
            self.d.polygon([(x-rr*0.95, y), (x-rr*0.3, y-rr*0.25), (x-rr*0.55, y)], fill=color)
            self.d.polygon([(x+rr*0.95, y), (x+rr*0.3, y-rr*0.25), (x+rr*0.55, y)], fill=color)
        elif style == "side":  # 侧分
            self.d.pieslice([x-rr*1.05, y-rr*1.1, x+rr*1.05, y+rr*1.05], 170, 370, fill=color)
            self.d.polygon([(x+rr*0.2, y-rr), (x+rr*1.02, y+rr*0.15), (x+rr*0.5, y+rr*0.1)], fill=color)

    def side_hair(self, cx, cy, r, color):
        """鬓发两撮"""
        x, y, rr = self.px(cx), self.px(cy), self.px(r)
        for dx in (-1, 1):
            self.d.polygon([(x+dx*rr*0.92, y-rr*0.35), (x+dx*rr*1.12, y+rr*0.55), (x+dx*rr*0.6, y+rr*0.5)], fill=color)

    def face(self, cx, cy, r, blush=(255, 170, 160, 110), mouth="smile", eye_dist=None):
        x, y, rr = self.px(cx), self.px(cy), self.px(r)
        ed = self.px(eye_dist if eye_dist else r*0.42)
        er = self.px(2.6)
        for dx in (-1, 1):
            ex = x + dx*ed
            self.d.ellipse([ex-er, y-er, ex+er, y+er], fill=(40, 34, 40, 255))
            self.d.ellipse([ex-er*0.35, y-er*0.75, ex+er*0.05, y-er*0.25], fill=(255,255,255,230))
        br = self.px(3.4)
        for dx in (-1, 1):
            bx = x + dx*ed*1.7
            self.d.ellipse([bx-br, y+rr*0.28-br*0.5, bx+br, y+rr*0.28+br*0.5], fill=blush)
        my = y + rr*0.45
        if mouth == "smile":
            self.d.arc([x-self.px(3), my-self.px(2), x+self.px(3), my+self.px(2)], 20, 160, fill=(150, 70, 70, 255), width=2)
        elif mouth == "open":
            self.d.ellipse([x-self.px(2.5), my-self.px(1.5), x+self.px(2.5), my+self.px(2.5)], fill=(190, 90, 90, 255))
        elif mouth == "cat":  # ω 嘴
            self.d.arc([x-self.px(3.4), my-self.px(2.2), x-self.px(0.4), my+self.px(1.4)], 20, 180, fill=(150,70,70,255), width=1)
            self.d.arc([x+self.px(0.4), my-self.px(2.2), x+self.px(3.4), my+self.px(1.4)], 20, 180, fill=(150,70,70,255), width=1)

    # ---------- 特征物 ----------
    def bowl(self, cx, cy, s=1.0, rice=True):
        """白饭碗"""
        w, h = self.px(9*s), self.px(5*s)
        x, y = self.px(cx), self.px(cy)
        self.d.ellipse([x-w, y-h*0.4, x+w, y+h], fill=(245, 245, 245, 255), outline=(200,200,200,255))
        if rice:
            self.d.ellipse([x-w*0.8, y-h*0.75, x+w*0.8, y+h*0.15], fill=(252, 250, 240, 255))
            for dx in (-3, 0, 3):
                self.d.point((x+self.px(dx), y-h*0.2), fill=(200,200,200,255))

    def iron_pot(self, cx, cy, s=1.0):
        """头顶铁盆（大肥鱼标志性帽子组件）"""
        w, h = self.px(11*s), self.px(7*s)
        x, y = self.px(cx), self.px(cy)
        self.d.pieslice([x-w, y-h, x+w, y+h], 180, 360, fill=(168, 172, 178, 255))
        self.d.rectangle([x-w, y-h*0.12, x+w, y+h*0.1], fill=(140, 144, 150, 255))
        self.d.ellipse([x-self.px(2.4*s), y-h*0.78, x+self.px(2.4*s), y-h*0.5], fill=(210, 214, 220, 255))

    def router(self, cx, cy, s=1.0):
        """背后的路由器+天线"""
        x, y = self.px(cx), self.px(cy)
        w, h = self.px(12*s), self.px(3*s)
        self.d.rounded_rectangle([x-w, y-h, x+w, y+h], radius=self.px(1.5), fill=(60, 64, 72, 255))
        for i, dx in enumerate((-1, 0, 1)):
            ax = x + dx * w * 0.6
            self.d.line([(ax, y-h), (ax + dx*self.px(2), y-h-self.px(7))], fill=(90, 94, 102, 255), width=2)
            self.d.ellipse([ax+dx*self.px(2)-self.px(1.4), y-h-self.px(8.4), ax+dx*self.px(2)+self.px(1.4), y-h-self.px(5.6)], fill=(120, 200, 255, 255))
        for i in range(3):
            self.d.ellipse([x-w*0.7+i*self.px(3), y+h*0.2, x-w*0.7+i*self.px(3)+self.px(1.6), y+h*0.2+self.px(1.6)], fill=(120, 220, 130, 255))

    def dragon_horn(self, cx, cy, r, color=(96, 190, 120, 255)):
        """龙角（GPT绿）"""
        x, y, rr = self.px(cx), self.px(cy), self.px(r)
        for dx in (-1, 1):
            bx = x + dx*rr*0.55
            self.d.polygon([(bx-self.px(3.2), y-rr*0.72), (bx+dx*self.px(1.5), y-rr*1.5), (bx+self.px(3.2), y-rr*0.7)], fill=color)

    def dragon_wing(self, cx, cy, s=1.0, color=(120, 205, 140, 235)):
        x, y = self.px(cx), self.px(cy)
        pts = [(x, y), (x+self.px(9*s), y-self.px(9*s)), (x+self.px(12*s), y-self.px(3*s)),
               (x+self.px(8*s), y-self.px(1*s)), (x+self.px(9*s), y+self.px(4*s))]
        self.d.polygon(pts, fill=color)

    def tiger_ear(self, cx, cy, r, color=(255, 200, 120, 255), inner=(255, 240, 220, 255)):
        x, y, rr = self.px(cx), self.px(cy), self.px(r)
        for dx in (-1, 1):
            ex = x + dx*rr*0.72
            self.d.polygon([(ex-self.px(4.5), y-rr*0.82), (ex, y-rr*1.42), (ex+self.px(4.5), y-rr*0.8)], fill=color)
            self.d.polygon([(ex-self.px(2.2), y-rr*0.88), (ex, y-rr*1.26), (ex+self.px(2.2), y-rr*0.86)], fill=inner)

    def cat_ear(self, cx, cy, r, colors=((66,133,244,255),(52,168,83,255),(251,188,5,255),(234,67,53,255))):
        """Google 四色猫耳"""
        x, y, rr = self.px(cx), self.px(cy), self.px(r)
        cs = [colors[0], colors[3]]
        for i, dx in enumerate((-1, 1)):
            ex = x + dx*rr*0.7
            self.d.polygon([(ex-self.px(5), y-rr*0.78), (ex+dx*self.px(2), y-rr*1.52), (ex+self.px(5), y-rr*0.76)], fill=cs[i])
            self.d.polygon([(ex-self.px(2.6), y-rr*0.86), (ex+dx*self.px(1), y-rr*1.32), (ex+self.px(2.6), y-rr*0.84)], fill=(255, 224, 178, 255))

    def stamp(self, cx, cy, s=1.0):
        """红色印章（Claude 封号）"""
        x, y = self.px(cx), self.px(cy)
        w, h = self.px(6.5*s), self.px(3.2*s)
        self.d.rounded_rectangle([x-w, y-h, x+w, y+h], radius=self.px(1.2), fill=(222, 58, 48, 255))
        self.d.rectangle([x-self.px(1.1), y-self.px(2.1), x+self.px(1.1), y+self.px(2.1)], fill=(255, 235, 235, 255))

    def banana(self, cx, cy, s=1.0):
        x, y = self.px(cx), self.px(cy)
        box = [x-self.px(6*s), y-self.px(6*s), x+self.px(6*s), y+self.px(6*s)]
        self.d.arc(box, 200, 340, fill=(255, 214, 64, 255), width=int(self.px(3.2*s)))
        self.d.ellipse([x+self.px(4.4*s)-self.px(1.5), y-self.px(1.5), x+self.px(4.4*s)+self.px(1.5), y+self.px(1.5)], fill=(140, 110, 50, 255))

    def star(self, cx, cy, r, color=(255, 214, 64, 255)):
        pts = []
        for i in range(10):
            a = math.pi/2 + i*math.pi/5
            rr = self.px(r if i % 2 == 0 else r*0.45)
            pts.append((self.px(cx)+rr*math.cos(a), self.px(cy)-rr*math.sin(a)))
        self.d.polygon(pts, fill=color)

    def whale_tail(self, cx, cy, s=1.0, color=(70, 110, 200, 255)):
        x, y = self.px(cx), self.px(cy)
        for dx in (-1, 1):
            self.d.ellipse([x+dx*self.px(6*s)-self.px(3.5*s), y-self.px(9*s), x+dx*self.px(6*s)+self.px(3.5*s), y-self.px(2*s)], fill=color)

    def fin_hands(self, cx, cy, color):
        """鲸鳍手"""
        r = self.px(4.6)
        for dx in (-12, 12):
            x = self.px(cx+dx); y = self.px(cy)
            self.d.ellipse([x-r, y-r*0.7, x+r, y+r*0.7], fill=color)

    def glow(self, cx, cy, r, color=(255, 235, 150, 90)):
        g = canvas(self.S, self.S)
        gd = ImageDraw.Draw(g)
        gd.ellipse([self.px(cx-r), self.px(cy-r), self.px(cx+r), self.px(cy+r)], fill=color)
        return g

    def sparkle(self, cx, cy, r=3, color=(255, 255, 255, 230)):
        self.star(cx, cy, r, color)

    def out(self):
        return self.im

# ---------------------------------------------------------------- 角色绘制配置
SKIN = (255, 232, 214, 255)

def draw_dabafei(variant="eat", S=75, attacking=False):
    """大肥鱼系：深蓝长发+鲸尾+女仆围裙。variant: eat/pot/relay"""
    ch = Chibi(S)
    HAIR = (48, 78, 158, 255); HAIR_D = (36, 60, 128, 255)
    MAID = (250, 250, 252, 255); APRON = (120, 170, 240, 255)
    ch.shadow()
    ch.whale_tail(37, 66, 1.0, HAIR_D)                      # 鲸尾在身后
    ch.body(37, 55, 13, 10, MAID)                           # 女仆裙
    ch.d.polygon([ch.px(24), ch.px(57), ch.px(37), ch.px(65), ch.px(50), ch.px(57)], fill=APRON) if False else None
    # 围裙带
    ch.d.rounded_rectangle([ch.px(31), ch.px(50), ch.px(43), ch.px(62)], radius=ch.px(3), fill=APRON)
    ch.head(37, 34, 15, SKIN, back_hair=HAIR)
    ch.bangs(37, 36, 15, HAIR, style="arc")
    ch.side_hair(37, 36, 15, HAIR)
    ch.face(37, 36, 15, mouth="smile")
    ch.fin_hands(37, 55, HAIR)                              # 鲸鳍小手
    if variant == "eat":
        ch.bowl(37, 50, 1.2)                                # 端碗
        ch.sparkle(24, 22, 2.2, (255, 240, 170, 220)); ch.sparkle(52, 26, 1.8, (255, 240, 170, 220))
    elif variant == "pot":
        ch.iron_pot(37, 17, 1.35)                           # 铁盆帽子
        if attacking:
            ch.iron_pot(58, 40, 0.9)                        # 攻击：手里多拿一个盆
    elif variant == "relay":
        ch.router(37, 24, 1.05)                             # 背路由器
        if attacking:
            ch.d.line([ch.px(50), ch.px(56), ch.px(64), ch.px(48)], fill=(200, 130, 60, 255), width=2)  # 甩网线
    return ch

def draw_gpt(S=75, attacking=False):
    ch = Chibi(S)
    HAIR = (248, 248, 252, 255)
    DRESS = (32, 94, 68, 255); HORN = (96, 190, 120, 255)
    ch.shadow()
    ch.dragon_wing(24, 44, 1.0)                             # 龙翼
    ch.body(37, 55, 12, 10, DRESS)
    ch.head(37, 34, 15, SKIN, back_hair=HAIR)
    ch.bangs(37, 36, 15, HAIR, style="side")
    ch.side_hair(37, 36, 15, HAIR)
    ch.dragon_horn(37, 34, 15, HORN)                        # 龙角
    ch.face(37, 36, 15, mouth="smile")
    ch.arms(37, 55, DRESS)
    if attacking:
        # 龙息弹
        ch.d.ellipse([ch.px(52), ch.px(30), ch.px(66), ch.px(42)], fill=(140, 230, 150, 200))
        ch.d.ellipse([ch.px(56), ch.px(33), ch.px(62), ch.px(39)], fill=(230, 255, 230, 230))
    return ch

def draw_claude(S=75, attacking=False):
    ch = Chibi(S)
    HAIR = (232, 124, 52, 255); HAIR_D = (198, 96, 36, 255)
    DRESS = (250, 244, 236, 255); RIBBON = (222, 58, 48, 255)
    ch.shadow()
    ch.body(37, 55, 13, 10, DRESS)
    ch.head(37, 34, 15, SKIN, back_hair=HAIR)
    ch.bangs(37, 36, 15, HAIR, style="arc")
    ch.side_hair(37, 36, 15, HAIR_D)
    ch.tiger_ear(37, 34, 15)                                # 橘色虎耳
    ch.face(37, 36, 15, mouth="smile")
    ch.arms(37, 55, DRESS)
    # 大小姐领结
    ch.d.polygon([(ch.px(33), ch.px(47)), (ch.px(37), ch.px(50)), (ch.px(33), ch.px(53))], fill=RIBBON)
    ch.d.polygon([(ch.px(41), ch.px(47)), (ch.px(37), ch.px(50)), (ch.px(41), ch.px(53))], fill=RIBBON)
    if attacking:
        ch.stamp(56, 44, 1.3)                               # 挥出大红印章
        ch.sparkle(62, 34, 2.4, (255, 120, 110, 230))
    else:
        ch.stamp(56, 55, 0.9)
    return ch

def draw_doubao(S=75, attacking=False):
    ch = Chibi(S)
    BODY = (255, 214, 64, 255); BODY_D = (240, 186, 40, 255)
    ch.shadow()
    x, y, r = ch.px(37), ch.px(44), ch.px(22)
    ch.d.ellipse([x-r, y-r, x+r, y+r], fill=BODY)           # 圆滚滚豆子本体
    ch.d.ellipse([x-r*0.62, y-r*0.35, x-r*0.15, y+r*0.2], fill=(255, 236, 150, 255))  # 高光
    # 呆萌脸：星星眼
    for dx in (-1, 1):
        ch.star(37+dx*6.5, 42, 3.6, (60, 50, 40, 255))
    br = ch.px(4)
    for dx in (-1, 1):
        bx = x + dx*ch.px(10.5)
        ch.d.ellipse([bx-br, y+ch.px(5)-br*0.5, bx+br, y+ch.px(5)+br*0.5], fill=(255, 170, 160, 120))
    ch.d.arc([x-ch.px(3.4), y+ch.px(6), x+ch.px(3.4), y+ch.px(10)], 20, 160, fill=(150, 80, 60, 255), width=2)
    # 头顶小叶子
    ch.d.polygon([(x-ch.px(1.5), y-r), (x+ch.px(3), y-r-ch.px(7)), (x+ch.px(2.5), y-r+ch.px(1))], fill=(110, 190, 100, 255))
    if attacking:
        # 一屁股坐：动感线
        for dx in (-16, -11, 11, 16):
            ch.d.line([(x+ch.px(dx), y-r-ch.px(4)), (x+ch.px(dx*1.25), y-r-ch.px(9))], fill=(120, 110, 90, 160), width=2)
    return ch

def draw_hajimi(S=75, attacking=False):
    ch = Chibi(S)
    HAIR = (250, 246, 238, 255); DRESS = (66, 133, 244, 255)
    ch.shadow()
    ch.body(37, 55, 12, 10, DRESS)
    ch.head(37, 34, 15, SKIN, back_hair=HAIR)
    ch.bangs(37, 36, 15, HAIR, style="arc")
    ch.side_hair(37, 36, 15, (230, 224, 210, 255))
    ch.cat_ear(37, 34, 15)                                  # Google 四色猫耳
    ch.face(37, 36, 15, mouth="cat")                        # ω 嘴
    ch.arms(37, 55, DRESS)
    # 猫尾
    ch.d.arc([ch.px(46), ch.px(52), ch.px(64), ch.px(70)], 90, 220, fill=(240, 235, 222, 255), width=int(ch.px(3)))
    if attacking:
        ch.banana(56, 42, 1.3)                              # 甩香蕉修图
        ch.sparkle(63, 30, 2.6, (255, 230, 120, 235))
    else:
        ch.banana(57, 55, 0.95)
    return ch

def draw_qwen(S=75, attacking=False, big=False):
    ch = Chibi(S)
    HAIR = (150, 96, 214, 255); DRESS = (108, 68, 180, 255)
    k = 1.25 if big else 1.0                                # 养大成 9B 时体型更大
    ch.shadow(37, 68, 16*k, 4)
    ch.body(37, 55, 12*k, 10*k, DRESS)
    ch.head(37, 34, 15*k, SKIN, back_hair=HAIR)
    ch.bangs(37, 36, 15*k, HAIR, style="arc")
    ch.side_hair(37, 36, 15*k, HAIR)
    ch.star(37, 20.5, 4.6, (255, 214, 64, 255))             # 头顶星饰
    ch.face(37, 36, 15*k, mouth="smile")
    ch.arms(37, 55, DRESS)
    if attacking:
        ch.sparkle(58, 34, 3.2, (220, 170, 255, 235))
        ch.sparkle(20, 44, 2.6, (220, 170, 255, 235))
    return ch

def draw_mini_qwen(S=75):
    """小千问（0.8B~9B 的随从）"""
    return draw_qwen(S, attacking=False)

# ---------------------------------------------------------------- 卡片图（215x258）
CARD_BG = {
    "dabafei-eat": (226, 240, 252), "dabafei-pot": (222, 232, 244),
    "dabafei-relay": (216, 228, 246), "gpt-luna": (228, 246, 234),
    "claude-ojou": (252, 236, 222), "doubao": (252, 244, 210),
    "hajimi": (230, 240, 252), "qwen": (240, 228, 250),
}

def make_card(chibi_drawer, role, subtitle):
    W, H = 215, 258
    im = canvas(W, H)
    d = ImageDraw.Draw(im)
    bg = CARD_BG.get(role, (240, 240, 240)) + (255,)
    d.rounded_rectangle([4, 4, W-4, H-4], radius=14, fill=bg, outline=(90, 80, 70, 255), width=3)
    d.rounded_rectangle([12, 12, W-12, H-46], radius=10, fill=(255, 255, 255, 130))
    big = chibi_drawer(S=150) if chibi_drawer else None
    im.alpha_composite(big.out(), (int(W/2-75), 40))
    # 底部名字条
    d.rounded_rectangle([14, H-40, W-14, H-14], radius=8, fill=(60, 54, 50, 235))
    # 中文字体：用系统黑体
    font = load_font(22)
    tw = d.textlength(subtitle, font=font)
    d.text(((W-tw)/2, H-36), subtitle, fill=(255, 246, 230, 255), font=font)
    return im

_FONT = None
def load_font(size):
    global _FONT
    from PIL import ImageFont
    for p in (r"C:\Windows\Fonts\msyh.ttc", r"C:\Windows\Fonts\msyhbd.ttc",
              r"C:\Windows\Fonts\simhei.ttf", r"C:\Windows\Fonts\ Deng.ttf"):
        p = p.strip()
        if os.path.exists(p):
            try: return ImageFont.truetype(p, size)
            except Exception: pass
    return ImageFont.load_default()

# ---------------------------------------------------------------- token 素材
def make_token(S=100):
    """金色 token 币：外圈+T 字标记+高光"""
    im = canvas(S, S)
    d = ImageDraw.Draw(im)
    cx = cy = S/2
    r = S*0.42
    d.ellipse([cx-r, cy-r, cx+r, cy+r], fill=(255, 196, 64, 255), outline=(196, 140, 30, 255), width=max(2, S//25))
    r2 = r*0.78
    d.ellipse([cx-r2, cy-r2, cx+r2, cy+r2], outline=(255, 226, 150, 255), width=max(2, S//33))
    f = load_font(int(S*0.42))
    t = "T"
    tw = d.textlength(t, font=f)
    d.text((cx-tw/2, cy-S*0.23), t, fill=(140, 90, 20, 255), font=f)
    d.ellipse([cx-r*0.82, cy-r*0.86, cx-r*0.3, cy-r*0.55], fill=(255, 246, 210, 200))
    return im

def make_token_strip():
    """30 帧旋转雪碧图（3900x140，与 sun2.png 同规格）"""
    FW, FH = 130, 140
    base = make_token(112)
    strip = Image.new("RGBA", (FW*30, FH), (0, 0, 0, 0))
    for i in range(30):
        rot = base.rotate(-i * 12, resample=Image.BICUBIC, expand=False)
        # 旋转时模拟 3D 翻转的宽度压缩
        squeeze = abs(math.cos(math.radians(i*12)))
        w = max(30, int(112 * (0.35 + 0.65*squeeze)))
        rot = rot.resize((w, 112))
        strip.alpha_composite(rot, (FW//2 - w//2, FH//2 - 56))
    return strip

# ---------------------------------------------------------------- 主流程
ROLES = [
    ("dabafei-eat",  "吃白饭大肥鱼", lambda S, a=False: draw_dabafei("eat", S, a), True),
    ("dabafei-pot",  "铁盆大肥鱼",   lambda S, a=False: draw_dabafei("pot", S, a), False),
    ("dabafei-relay","中转站大肥鱼", lambda S, a=False: draw_dabafei("relay", S, a), False),
    ("gpt-luna",     "GPT龙娘",      lambda S, a=False: draw_gpt(S, a), False),
    ("claude-ojou",  "Claude大小姐", lambda S, a=False: draw_claude(S, a), False),
    ("doubao",       "豆包",         lambda S, a=False: draw_doubao(S, a), False),
    ("hajimi",       "Gemini哈基米", lambda S, a=False: draw_hajimi(S, a), False),
    ("qwen",         "千问大小姐",   lambda S, a=False: draw_qwen(S, a), False),
]

def main():
    # 角色图
    for role, name, drawer, has_produce in ROLES:
        folder = os.path.join(ROOT, role)
        os.makedirs(folder, exist_ok=True)
        drawer(S=75, a=False).out().save(os.path.join(folder, "idle.png"))
        drawer(S=75, a=True).out().save(os.path.join(folder, "attack.png"))
        drawer(S=75, a=False).out().save(os.path.join(folder, "static.png"))
        if has_produce:
            # 产币姿态：发光版
            im = drawer(S=75, a=False).out()
            g = drawer(S=75, a=False)
            glow = Image.new("RGBA", (75, 75), (255, 235, 150, 70))
            im = Image.alpha_composite(im, glow)
            im.save(os.path.join(folder, "produce.png"))
        make_card(lambda S=150, dr=drawer: dr(S, False), role, name).save(
            os.path.join(folder, "card.png"))
        print("OK", role)
    # 小千问（随从）
    mf = os.path.join(ROOT, "qwen-minion")
    os.makedirs(mf, exist_ok=True)
    draw_mini_qwen(60).out().save(os.path.join(mf, "idle.png"))
    draw_qwen(75, True).out().save(os.path.join(mf, "idle_big.png"))
    # token 素材
    itf = os.path.join(ROOT, "interface")
    os.makedirs(itf, exist_ok=True)
    make_token(96).save(os.path.join(itf, "token_icon.png"))
    make_token_strip().save(os.path.join(itf, "token_strip.png"))
    print("OK token assets")

if __name__ == "__main__":
    main()
