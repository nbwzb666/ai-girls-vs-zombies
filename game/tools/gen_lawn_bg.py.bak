# -*- coding: utf-8 -*-
"""
经典白天草坪背景生成器（1400x600，与 PvZ Travel 引擎格子坐标对齐）
用法：python tools/gen_lawn_bg.py
输出：images/interface/DayLawn.png
坐标依据（引擎 GetX/GetY）：
  列中心 X: C1=187 C2=267 C3=347 C4=427 C5=507 C6=587 C7=667 C8=747 C9=827(约) 间距80
  行中心 Y: R1=75 R2=165 R3=253 R4=355 R5=430
"""
import math, random
from PIL import Image, ImageDraw, ImageFilter

W, H = 1400, 600
im = Image.new("RGB", (W, H), (135, 206, 235))
d = ImageDraw.Draw(im)
random.seed(2026)

# ---------------- 天空（顶部被 UI 覆盖大半，画满以防裁切） ----------------
for y in range(0, 90):
    t = y / 90
    c = (int(120 + 40*t), int(185 + 30*t), int(230 + 18*t))
    d.line([(0, y), (W, y)], fill=c)

# ---------------- 远景树篱横带（原版草坪上沿的深绿灌木剪影） ----------------
hedge_top, hedge_bottom = 16, 36
d.rectangle([0, hedge_top, W, hedge_bottom], fill=(74, 128, 58))
for x in range(-20, W + 40, 26):
    r = random.randint(9, 14)
    cy = hedge_top + random.randint(-2, 4)
    d.ellipse([x - r, cy - r, x + r, cy + r], fill=(86, 145, 66) if x % 52 else (66, 118, 52))
d.rectangle([0, hedge_bottom, W, hedge_bottom + 5], fill=(96, 160, 74))

# ---------------- 左侧房子（原版：奶油墙+棕屋顶+门廊） ----------------
# 走道底色
d.rectangle([0, 0, 140, H], fill=(196, 186, 168))
# 房子主体（占左侧上部）
d.rectangle([0, 40, 118, 330], fill=(240, 232, 214))       # 奶油墙
d.polygon([(0, 40), (126, 8), (126, 46), (0, 78)], fill=(150, 96, 62))  # 屋顶斜边
# 窗
d.rectangle([22, 110, 86, 190], fill=(96, 148, 190), outline=(120, 96, 70), width=5)
d.line([(54, 110), (54, 190)], fill=(120, 96, 70), width=4)
d.line([(22, 150), (86, 150)], fill=(120, 96, 70), width=4)
# 砖纹
for y in range(60, 330, 22):
    for x in range(0, 118, 34):
        d.rectangle([x, y, x + 30, y + 8], outline=(228, 218, 198), width=1)
# 门廊台阶（走道，割草机停放区）
for i in range(3):
    y0 = 330 + i * 30
    d.rectangle([0, y0, 128, y0 + 30], fill=(206 + i * 4, 197 + i * 4, 180 + i * 4), outline=(178, 170, 152), width=2)
# 走道石板缝
for y in range(420, H, 42):
    d.line([(0, y), (136, y)], fill=(176, 168, 150), width=2)
d.line([(64, 330), (64, H)], fill=(176, 168, 150), width=2)

# ---------------- 草坪棋盘格（5 行 × 9 列，亮暗交替） ----------------
# 行边界（由中心 Y 推行高：约 [30,120],[120,210],[210,302],[302,408],[408,486]
row_bounds = [(41, 126), (126, 212), (212, 301), (301, 398), (398, 478)]
col_x0, col_w = 147, 80           # C1 左边 187-40；列宽 80
LIGHT = (178, 226, 108)           # 亮格：明亮黄绿
DARK = (156, 206, 88)             # 暗格
# 草坪底色先铺（含格间）
d.rectangle([col_x0 - 7, row_bounds[0][0], col_x0 + 9 * col_w + 7, row_bounds[-1][1]], fill=(166, 214, 96))
for r, (ry0, ry1) in enumerate(row_bounds):
    for c in range(9):
        x0 = col_x0 + c * col_w
        color = LIGHT if (r + c) % 2 == 0 else DARK
        d.rectangle([x0, ry0, x0 + col_w, ry1], fill=color)
        # 轻微草叶噪点（每格几撮）
        for _ in range(14):
            gx = random.randint(x0 + 3, x0 + col_w - 3)
            gy = random.randint(ry0 + 3, ry1 - 3)
            tone = tuple(max(0, v - 26) for v in color) if random.random() < .5 else tuple(min(255, v + 18) for v in color)
            d.line([(gx, gy), (gx + random.randint(-2, 2), gy - random.randint(3, 6))], fill=tone)

# ---------------- 草坪上/下边缘修饰 ----------------
# 上缘：树篱到第一行之间的深色过渡草带
d.rectangle([0, hedge_bottom + 5, W, row_bounds[0][0]], fill=(116, 178, 76))
for x in range(0, W, 9):
    d.line([(x, row_bounds[0][0] - random.randint(2, 7)), (x, row_bounds[0][0])], fill=(104, 164, 66))
# 左缘（房子与草坪交界）
d.rectangle([128, row_bounds[0][0], col_x0 - 7, row_bounds[-1][1]], fill=(140, 192, 82))
# 下缘：草坪前缘（原版草坪前是深色土沿+下方阴影草）
d.rectangle([0, row_bounds[-1][1], W, row_bounds[-1][1] + 16], fill=(120, 172, 70))
d.rectangle([0, row_bounds[-1][1] + 16, W, H], fill=(92, 140, 58))
for x in range(0, W, 12):
    h = random.randint(10, 26)
    d.line([(x, row_bounds[-1][1] + 14), (x + random.randint(-3, 3), row_bounds[-1][1] + 14 - h)], fill=(104, 158, 62))
# 前缘土沿阴影
d.rectangle([0, H - 46, W, H], fill=(76, 118, 50))

# ---------------- 右侧：草坪外的马路/尘土（僵尸来路，原版右侧远景） ----------------
d.rectangle([col_x0 + 9 * col_w + 7, hedge_bottom + 8, W, row_bounds[-1][1] + 16], fill=(150, 202, 84))
road_x0 = col_x0 + 9 * col_w + 20
# 尘土路面
d.rectangle([road_x0, 74, W, 492], fill=(188, 178, 152))
for y in range(74, 492, 26):
    d.line([(road_x0, y), (W, y)], fill=(176, 166, 140), width=1)
for _ in range(120):  # 碎石
    x = random.randint(road_x0 + 4, W - 6); y = random.randint(78, 488)
    d.point((x, y), fill=(160, 150, 126) if random.random() < .5 else (204, 196, 172))
# 路面上下草沿
d.rectangle([road_x0, 66, W, 76], fill=(120, 176, 74))
d.rectangle([road_x0, 490, W, 502], fill=(120, 172, 70))
# 远处右边的树篱延续
for x in range(road_x0, W, 24):
    r = random.randint(8, 14)
    d.ellipse([x - r, hedge_top - r + 6, x + r, hedge_top + r], fill=(80, 136, 60))

# ---------------- 整体轻微柔化 + 光照渐变 ----------------
im = im.filter(ImageFilter.GaussianBlur(0.4))
grad = Image.new("L", (W, H), 0)
gd = ImageDraw.Draw(grad)
for y in range(H):
    gd.line([(0, y), (W, y)], fill=max(0, min(60, (y - 300) // 5)))
white = Image.new("RGB", (W, H), (255, 244, 200))
im = Image.composite(white, im, grad.point(lambda v: v // 2))

im.save("images/interface/DayLawn.png")
print("DayLawn.png OK", im.size)
