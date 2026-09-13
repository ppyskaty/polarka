#!/usr/bin/env python3
"""Pixelová scéna dostihové dráhy + export spritesheetu s alfou."""
import zlib, struct, sys
import sprite as S

SW, SH = 180, 80

PAL = {
 '.': None,
 '1': (0x4F,0x8F,0xC4), '2': (0x69,0xA6,0xD6), '3': (0x86,0xBD,0xE4), '4': (0xA6,0xD3,0xEE),
 '5': (0xC6,0xE4,0xF4),                                   # obloha shora dolů
 's': (0xFF,0xF0,0xB0), 'S': (0xFF,0xE2,0x7A),            # slunce
 'w': (0xFF,0xFF,0xFF), 'W': (0xD8,0xEA,0xF6),            # mraky
 'h': (0x7E,0x9E,0x86), 'H': (0x94,0xB2,0x98),            # vzdálené kopce
 't': (0x2E,0x5A,0x38), 'T': (0x3E,0x74,0x45),            # stromy
 'g': (0x4E,0x8C,0x45), 'G': (0x62,0xA5,0x52), 'e': (0x3A,0x6E,0x36),  # tráva
 'p': (0xEE,0xE4,0xD2), 'P': (0xC9,0xBB,0xA2),            # ohradník
 'd': (0xB5,0x88,0x55), 'D': (0x9A,0x70,0x44), 'c': (0xCB,0xA0,0x6C),  # hlína
 'o': (0x7E,0x59,0x33),                                   # tmavá hlína
 'k': (0x1E,0x1A,0x18), 'K': (0xF4,0xF2,0xEE),            # cíl
}

def blank(w, h): return [['.' for _ in range(w)] for _ in range(h)]
def span(g, y, x0, x1, c):
    if 0 <= y < len(g):
        for x in range(max(0, x0), min(len(g[0]) - 1, x1) + 1): g[y][x] = c

def scene():
    g = blank(SW, SH)
    bands = [(0, '1'), (9, '2'), (19, '3'), (29, '4'), (38, '5')]
    for i, (y0, c) in enumerate(bands):
        y1 = bands[i + 1][0] if i + 1 < len(bands) else 46
        span_rows = range(y0, y1)
        for y in span_rows: span(g, y, 0, SW - 1, c)
    # rozptyl na přechodech pásů oblohy (dithering)
    for i in range(1, len(bands)):
        y0, c = bands[i]
        prev = bands[i - 1][1]
        for x in range(SW):
            if (x % 2) == 0: g[y0][x] = prev
            if (x % 4) == 0 and y0 + 1 < 46: g[y0 + 1][x] = prev
            if (x % 3) == 1: g[y0 - 1][x] = c
    # slunce
    for y in range(4, 18):
        r = [3,5,6,7,7,8,8,8,8,7,7,6,5,3][y - 4]
        span(g, y, 150 - r, 150 + r, 'S')
    for y in range(6, 16):
        r = [3,4,5,5,5,5,5,4,3,2][y - 6]
        span(g, y, 150 - r, 150 + r, 's')
    # mraky
    for (cx, cy, k) in ((28, 13, 1), (98, 7, 1), (62, 25, 0)):
        span(g, cy - 1, cx - 3 - k*2, cx + 2 + k*2, 'w')
        span(g, cy,     cx - 6 - k*4, cx + 5 + k*4, 'w')
        span(g, cy + 1, cx - 9 - k*5, cx + 9 + k*5, 'w')
        span(g, cy + 2, cx - 8 - k*5, cx + 8 + k*5, 'W')
        for x in range(cx - 9 - k*5, cx + 10 + k*5, 3):
            if 0 <= x < SW: g[cy + 3][x] = 'W' 
    # vzdálené kopce
    prof = []
    for x in range(SW):
        import math
        y = 44 - int(5 * math.sin(x / 26.0) + 3 * math.sin(x / 9.0 + 1))
        prof.append(y)
    for x in range(SW):
        for y in range(prof[x], 54): g[y][x] = 'h'
        g[prof[x]][x] = 'H'
    # lesní silueta na obzoru
    for x in range(SW):
        import math
        y = prof[x] + 1 + int(2 * math.sin(x / 4.0) + 2 * math.sin(x / 7.0))
        for yy in range(max(prof[x] - 2, y - 3), y + 1):
            if 0 <= yy < SH: g[yy][x] = 't' if (x + yy) % 3 else 'T'
    # louka
    for y in range(50, 62):
        span(g, y, 0, SW - 1, 'g' if y > 53 else 'G')
    for x in range(0, SW, 5):
        g[50][x] = 'G'; g[51][(x + 2) % SW] = 'e'
    # ohradník
    for y in range(44, 56):
        span(g, y, 0, SW - 1, g[y][0]) if False else None
    for x in range(6, SW, 26):
        for y in range(46, 58): 
            g[y][x] = 'P'; g[y][x + 1] = 'p'
    for y in (50, 54):
        for x in range(SW):
            g[y][x] = 'p'; g[y + 1][x] = 'P'
    # tráva před ohradníkem
    for y in range(58, 64): span(g, y, 0, SW - 1, 'g' if y < 61 else 'e')
    for x in range(0, SW, 4):
        g[58][x] = 'G'; g[59][(x + 2) % SW] = 'G'
    # dráha
    for y in range(64, SH):
        span(g, y, 0, SW - 1, 'c' if y < 67 else 'd' if y < 74 else 'D')
    span(g, 64, 0, SW - 1, 'o')
    for i in range(0, SW, 7):
        g[69][(i + 3) % SW] = 'D'; g[70][(i + 5) % SW] = 'c'
        g[73][(i + 1) % SW] = 'o'; g[76][(i + 4) % SW] = 'c'
        g[78][(i + 6) % SW] = 'D'
    return g

def finish(g, x=160):
    for y in range(30, 72): g[y][x] = 'K'; g[y][x + 1] = 'P'
    for i in range(6):
        for j in range(5):
            c = 'k' if (i + j) % 2 == 0 else 'K'
            for dy in range(3):
                for dx in range(3):
                    yy, xx = 30 + i * 3 + dy, x + 2 + j * 3 + dx
                    if 0 <= yy < SH and 0 <= xx < SW: g[yy][xx] = c
    return g

# ---------- PNG s alfou ----------
def png_rgba(path, grid, pal, w, h, scale=1):
    rows = []
    for y in range(h * scale):
        row = bytearray()
        for x in range(w * scale):
            c = pal.get(grid[y // scale][x // scale])
            row += bytes(c + (255,)) if c else b'\x00\x00\x00\x00'
        rows.append(bytes(row))
    raw = b''.join(b'\x00' + r for r in rows)
    def ch(t, d):
        cc = t + d
        return struct.pack('>I', len(d)) + cc + struct.pack('>I', zlib.crc32(cc) & 0xffffffff)
    out = b'\x89PNG\r\n\x1a\n' + ch(b'IHDR', struct.pack('>IIBBBBB', w * scale, h * scale, 8, 6, 0, 0, 0))
    out += ch(b'IDAT', zlib.compress(raw, 9)) + ch(b'IEND', b'')
    open(path, 'wb').write(out)

if __name__ == '__main__':
    import os
    os.makedirs('../assets', exist_ok=True)
    g = finish(scene())
    png_rgba('../assets/scene.png', g, PAL, SW, SH)
    png_rgba('scene-big.png', g, PAL, SW, SH, 4)

    frames = [S.draw()] + [S.draw(i) for i in range(4)]
    sheet = blank(S.W * 5, S.H)
    for i, f in enumerate(frames):
        for y in range(S.H):
            for x in range(S.W): sheet[y][i * S.W + x] = f[y][x]
    png_rgba('../assets/horse.png', sheet, S.P, S.W * 5, S.H)
    print('scene.png', SW, 'x', SH, '| horse.png', S.W * 5, 'x', S.H)
