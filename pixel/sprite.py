#!/usr/bin/env python3
"""Autorský nástroj na pixel art koně. Kreslí se po řádcích, renderuje do PNG."""
import zlib, struct, sys

W, H = 64, 46

# ---- paleta ----
P = {
 '.': None,
 'O': (0x34,0x1E,0x10),   # obrys
 'D': (0x4E,0x2C,0x14),   # stín srsti
 'M': (0x7A,0x4A,0x22),   # základní srst
 'L': (0xA8,0x71,0x37),   # světlo
 'H': (0xD2,0x9E,0x58),   # nejvyšší světlo
 'K': (0x1C,0x12,0x0C),   # hříva tmavá
 'k': (0x32,0x21,0x14),   # hříva střední
 'j': (0x50,0x37,0x20),   # hříva světlá
 'F': (0x20,0x16,0x10),   # kopyto
 'f': (0x44,0x32,0x24),   # kopyto světlo
 'E': (0x10,0x0A,0x06),   # oko
 'W': (0xF0,0xE2,0xC8),   # lesk
 'R': (0xB0,0x3A,0x50),   # rozeta
 'Y': (0xE0,0xB0,0x4E),   # zlatá
}

def blank(): return [['.' for _ in range(W)] for _ in range(H)]

def span(g, y, x0, x1, c):
    if 0 <= y < H:
        for x in range(max(0, x0), min(W - 1, x1) + 1):
            g[y][x] = c

# ---- tvar koně: (řádek, od, do) ----
BODY = [
 (9,  14, 20), (9,  33, 37),
 (10, 11, 40), (11,  9, 42), (12,  8, 43), (13,  7, 44),
 (14,  7, 44), (15,  6, 44), (16,  6, 44), (17,  6, 44),
 (18,  6, 43), (19,  7, 43), (20,  7, 43), (21,  8, 42),
 (22,  9, 42), (23, 11, 41), (24, 13, 40), (25, 16, 38),
 (26, 20, 35),
]
NECK = [
 (5, 48, 50), (6, 46, 51), (7, 44, 52), (8, 42, 52),
 (9, 39, 52), (10, 37, 51), (11, 36, 50), (12, 36, 49),
 (13, 36, 48), (14, 37, 47), (15, 38, 46), (16, 39, 45),
 (17, 40, 45), (18, 41, 44), (19, 42, 44),
]
HEAD = [
 (4, 51, 55), (5, 50, 57), (6, 50, 58), (7, 50, 58),
 (8, 51, 59), (9, 52, 59), (10, 53, 60), (11, 54, 60),
 (12, 55, 61), (13, 56, 61), (14, 57, 62), (15, 58, 62),
 (16, 59, 62), (17, 59, 61),
]
EARS = [ (1, 53, 54), (2, 52, 54), (3, 52, 55), (1, 49, 50), (2, 49, 51), (3, 49, 51) ]
MANE = [
 (4, 48, 51), (5, 47, 50), (6, 45, 49), (7, 43, 47), (8, 41, 46),
 (9, 38, 44), (10, 36, 42), (11, 35, 40), (12, 35, 39), (13, 35, 38),
 (14, 36, 38),
]
FORELOCK = [ (3, 51, 54), (4, 52, 55), (5, 54, 56) ]
TAIL = [
 (9, 11, 13), (10, 9, 12), (11, 7, 11), (12, 6, 10), (13, 5, 9),
 (14, 4, 8), (15, 3, 8), (16, 3, 7), (17, 3, 7), (18, 3, 7),
 (19, 3, 7), (20, 3, 7), (21, 3, 7), (22, 3, 7), (23, 3, 7),
 (24, 3, 8), (25, 3, 8), (26, 3, 8), (27, 4, 8), (28, 4, 9),
 (29, 4, 9), (30, 4, 9), (31, 5, 9), (32, 5, 10), (33, 6, 10),
 (34, 6, 10), (35, 7, 10),
]

def leg_fore(x, bend=0, lift=0):
    h = bend // 2
    s = []
    for y in range(25, 31): s.append((y, x, x + 4))
    for y in range(31, 33): s.append((y, x + h, x + 3 + h))
    for y in range(33, 39 - lift): s.append((y, x + 1 + bend, x + 4 + bend))
    s.append((39 - lift, x + bend, x + 5 + bend))
    return s

def leg_hind(x, bend=0, lift=0):
    h = bend // 2
    s = []
    for y in range(21, 28): s.append((y, x, x + 7))
    for y in range(28, 31): s.append((y, x - 1, x + 5))
    for y in range(31, 34): s.append((y, x - 2 + h, x + 3 + h))
    for y in range(34, 39 - lift): s.append((y, x + 1 + bend, x + 4 + bend))
    s.append((39 - lift, x + bend, x + 5 + bend))
    return s

def hoof(g, x, y=40, c='F'):
    span(g, y,     x,     x + 5, 'f' if c == 'F' else c)
    span(g, y + 1, x,     x + 5, c)
    span(g, y + 2, x,     x + 5, c)
    span(g, y + 3, x - 1, x + 5, c)

COAT = set('DMLH')

def shade_form(g):
    """Celové stínování podle tvaru: pás světla sleduje horní hranu."""
    for x in range(W):
        top = None
        for y in range(H):
            if g[y][x] in COAT:
                top = y; break
        if top is None: continue
        for y in range(top, H):
            if g[y][x] not in COAT: continue
            d = y - top
            if g[y][x] == 'D':          # odvrácené nohy zůstávají tmavé
                continue
            g[y][x] = 'H' if d <= 1 else 'L' if d <= 5 else 'M' if d <= 12 else 'D'

def detail(g):
    # stín za lopatkou a pod krkem
    for (y, a, b) in [(13,40,44),(14,41,44),(15,42,44),(16,42,44),(17,42,44),
                      (18,41,43),(19,41,43),(20,40,43),(21,39,42),(22,38,41)]:
        for x in range(a, b + 1):
            if g[y][x] in COAT: g[y][x] = 'D'
    # světlo na zádi
    for (y, a, b) in [(12,11,16),(13,11,15)]:
        for x in range(a, b + 1):
            if g[y][x] in COAT: g[y][x] = 'H'
    # nohy: válcové stínování po souvislých úsecích, světlo zprava
    for y in range(26, H):
        runs, cur = [], None
        for x in range(W):
            if g[y][x] in COAT:
                if cur is None: cur = [x, x]
                else: cur[1] = x
            elif cur is not None:
                runs.append(cur); cur = None
        if cur is not None: runs.append(cur)
        for lo, hi in runs:
            if hi - lo > 10: continue                 # ještě trup
            far = 20 <= lo <= 30 or 29 <= lo <= 36
            for x in range(lo, hi + 1):
                if far:
                    g[y][x] = 'D' if x < hi else 'M'
                else:
                    g[y][x] = 'D' if x == lo else ('H' if x == hi else
                              'L' if x == hi - 1 else 'M')
    # světlo na čele a nose
    for (y, a, b) in [(5,54,57),(6,55,58),(7,56,58),(11,58,60),(12,59,61)]:
        for x in range(a, b + 1):
            if g[y][x] in COAT: g[y][x] = 'H'
    # hříva a ocas: prameny, ne šum
    for y in range(H):
        xs = [x for x in range(W) if g[y][x] == 'k']
        if not xs: continue
        lo, hi = min(xs), max(xs)
        for x in xs:
            g[y][x] = 'j' if x <= lo else ('K' if (x - lo + y) % 3 == 0 else 'k')

def outline(g):
    src = [r[:] for r in g]
    for y in range(H):
        for x in range(W):
            if src[y][x] == '.': continue
            edge = False
            for dy, dx in ((1,0),(-1,0),(0,1),(0,-1)):
                ny, nx = y + dy, x + dx
                if not (0 <= ny < H and 0 <= nx < W) or src[ny][nx] == '.':
                    edge = True; break
            if edge: g[y][x] = 'O'

# nohy pro jednotlivé fáze cvalu: (bend, lift) pro zadní blízkou, zadní vzdálenou,
# přední blízkou, přední vzdálenou; dy = svislý posun trupu
GAIT = [
  ((-4, 0), (-2, 2), (5, 3), (2, 5), 0),
  ((-1, 4), (1, 6), (1, 6), (-2, 4), -1),
  ((4, 1), (2, 2), (-3, 4), (-4, 2), 0),
  ((3, 6), (4, 7), (-2, 6), (-1, 7), -2),
]

def draw(frame=None, dy=0):
    g = blank()
    if frame is None:
        hn, hf, fn, ff = (0, 0), (0, 0), (0, 0), (0, 0)
    else:
        hn, hf, fn, ff, dy = GAIT[frame]

    def sp(rows, c, off=0):
        for (y, a, b) in rows: span(g, y + off, a, b, c)

    sp(leg_hind(22, *hf), 'D'); sp(leg_fore(31, *ff), 'D')
    hoof(g, 23 + hf[0], 40 - hf[1], 'D'); hoof(g, 31 + ff[0], 40 - ff[1], 'D')
    sp(TAIL, 'k', dy)
    sp(BODY, 'M', dy); sp(NECK, 'M', dy); sp(HEAD, 'M', dy)
    sp(EARS, 'D', dy); sp(MANE, 'k', dy); sp(FORELOCK, 'k', dy)
    sp(leg_hind(12, *hn), 'M'); sp(leg_fore(39, *fn), 'M')
    hoof(g, 13 + hn[0], 40 - hn[1]); hoof(g, 39 + fn[0], 40 - fn[1])
    shade_form(g)
    detail(g)
    outline(g)
    g[8 + dy][55] = 'E'; g[8 + dy][56] = 'E'; g[9 + dy][55] = 'E'
    g[7 + dy][55] = 'D'
    g[15 + dy][61] = 'D'; g[16 + dy][61] = 'E'
    return g

# ---- render ----
def png(path, grid, scale=8, bg=(0xE8,0xDC,0xC8)):
    w, h = W * scale, H * scale
    rows = []
    for y in range(h):
        row = bytearray()
        for x in range(w):
            c = P.get(grid[y // scale][x // scale])
            row += bytes(c if c else bg)
        rows.append(bytes(row))
    raw = b''.join(b'\x00' + r for r in rows)
    def ch(t, d):
        c = t + d
        return struct.pack('>I', len(d)) + c + struct.pack('>I', zlib.crc32(c) & 0xffffffff)
    out = b'\x89PNG\r\n\x1a\n' + ch(b'IHDR', struct.pack('>IIBBBBB', w, h, 8, 2, 0, 0, 0))
    out += ch(b'IDAT', zlib.compress(raw, 9)) + ch(b'IEND', b'')
    open(path, 'wb').write(out)

def strip(frames, scale=6):
    n = len(frames)
    w, h = W * n, H
    big = [['.' for _ in range(w)] for _ in range(h)]
    for i, f in enumerate(frames):
        for y in range(H):
            for x in range(W):
                big[y][i * W + x] = f[y][x]
    saveW, saveH = W, H
    globals()['W'], globals()['H'] = w, h
    png('gait.png', big, scale)
    globals()['W'], globals()['H'] = saveW, saveH

if __name__ == '__main__':
    png('horse.png', draw())
    strip([draw(i) for i in range(4)])
    print('hotovo')
