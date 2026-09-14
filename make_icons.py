#!/usr/bin/env python3
"""Ikona aplikace: noční obloha se souhvězdím a jasnou Polárkou.
   Bez externích knihoven — vlastní zápis PNG."""
import math, zlib, struct, os

TOP, BOT   = (0x24, 0x2C, 0x66), (0x06, 0x09, 0x1A)   # obloha shora dolů
GLOW       = (0x46, 0x50, 0x96)                        # nádech světla vpravo nahoře
LINE       = (0xB4, 0xC0, 0xF4)                        # spojnice
CORE       = (0xFF, 0xFA, 0xE8)                        # jádro hvězdy
HALO       = (0xFF, 0xD9, 0x8A)                        # záře

POLARKA = (.335, .335, .088)                           # x, y, poloměr paprsků
STARS   = [(.640, .258, .030), (.735, .552, .026), (.470, .705, .024)]
CHAIN   = [(POLARKA[0], POLARKA[1]), (.640, .258), (.735, .552), (.470, .705)]
DUST    = [(.16,.58,.008),(.855,.20,.009),(.30,.86,.007),(.88,.80,.008),(.545,.44,.007),
           (.20,.20,.0075),(.68,.88,.007),(.40,.50,.006),(.83,.38,.006),(.12,.40,.006)]

def mix(a, b, t):
    t = max(0.0, min(1.0, t))
    return tuple(a[i] + (b[i] - a[i]) * t for i in range(3))

def seg_dist(px, py, ax, ay, bx, by):
    vx, vy = bx - ax, by - ay
    wx, wy = px - ax, py - ay
    L = vx * vx + vy * vy
    t = 0.0 if L == 0 else max(0.0, min(1.0, (wx * vx + wy * vy) / L))
    dx, dy = px - (ax + vx * t), py - (ay + vy * t)
    return math.hypot(dx, dy)

def star4(dx, dy, R, k=.46):
    """Čtyřcípá hvězda: |x|^k + |y|^k <= R^k dává pro k<1 vypouklé cípy."""
    dx, dy = max(abs(dx), 1e-9), max(abs(dy), 1e-9)
    return dx ** k + dy ** k <= R ** k

def shade(u, v):
    col = mix(TOP, BOT, (v * .82 + (v ** 2) * .18))
    g = max(0.0, 1.0 - math.hypot(u - .78, v + .06) / 1.05)
    col = mix(col, GLOW, g * g * .55)

    for (x, y, r) in DUST:                              # drobné hvězdy v pozadí
        d = math.hypot(u - x, v - y)
        if d < r: col = mix(col, CORE, .55 * (1 - d / r))

    for i in range(len(CHAIN) - 1):                     # spojnice souhvězdí
        ax, ay = CHAIN[i]; bx, by = CHAIN[i + 1]
        d = seg_dist(u, v, ax, ay, bx, by)
        if d < .009: col = mix(col, LINE, .34 * (1 - d / .009))

    for (x, y, r) in STARS:                             # menší hvězdy
        d = math.hypot(u - x, v - y)
        if d < r * 3.4: col = mix(col, HALO, .20 * (1 - d / (r * 3.4)) ** 2)
        if d < r: col = mix(col, CORE, 1.0)

    px, py, pr = POLARKA                                # Polárka
    d = math.hypot(u - px, v - py)
    if d < pr * 3.2: col = mix(col, HALO, .34 * (1 - d / (pr * 3.2)) ** 2)
    if star4(u - px, v - py, pr): col = mix(col, HALO, .85)
    if star4(u - px, v - py, pr * .52): col = mix(col, CORE, 1.0)
    if d < pr * .30: col = (255.0, 255.0, 255.0)
    return col

def render(size, path, ss=3):
    px = bytearray(size * size * 4)
    for y in range(size):
        for x in range(size):
            r = g = b = 0.0
            for sy in range(ss):
                for sx in range(ss):
                    c = shade((x + (sx + .5) / ss) / size, (y + (sy + .5) / ss) / size)
                    r += c[0]; g += c[1]; b += c[2]
            n = ss * ss
            i = (y * size + x) * 4
            px[i] = round(r / n); px[i+1] = round(g / n); px[i+2] = round(b / n); px[i+3] = 255
    raw = b''.join(b'\x00' + bytes(px[y*size*4:(y+1)*size*4]) for y in range(size))
    def ch(t, d):
        c = t + d
        return struct.pack('>I', len(d)) + c + struct.pack('>I', zlib.crc32(c) & 0xffffffff)
    out = b'\x89PNG\r\n\x1a\n' + ch(b'IHDR', struct.pack('>IIBBBBB', size, size, 8, 6, 0, 0, 0))
    out += ch(b'IDAT', zlib.compress(raw, 9)) + ch(b'IEND', b'')
    open(path, 'wb').write(out)
    print('->', path, size)

os.makedirs('icons', exist_ok=True)
for s in (180, 192, 512):
    render(s, 'icons/icon-%d.png' % s)
