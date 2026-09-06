#!/usr/bin/env python3
"""Vygeneruje ikony aplikace (podkova) bez externích knihoven."""
import math, zlib, struct, os

def png(path, w, h, px):
    raw = b''.join(b'\x00' + bytes(px[y*w*4:(y+1)*w*4]) for y in range(h))
    def chunk(t, d):
        c = t + d
        return struct.pack('>I', len(d)) + c + struct.pack('>I', zlib.crc32(c) & 0xffffffff)
    out = b'\x89PNG\r\n\x1a\n'
    out += chunk(b'IHDR', struct.pack('>IIBBBBB', w, h, 8, 6, 0, 0, 0))
    out += chunk(b'IDAT', zlib.compress(raw, 9))
    out += chunk(b'IEND', b'')
    open(path, 'wb').write(out)

def lerp(a, b, t): return tuple(round(a[i] + (b[i] - a[i]) * t) for i in range(3))

TOP, BOT = (255, 209, 102), (255, 143, 178)
WHITE = (255, 255, 255)

def shoe(u, v):
    """u,v v <0,1>; vrátí True uvnitř podkovy."""
    dx, dy = u - .5, v - .53
    r = math.hypot(dx, dy)
    RO, RI = .315, .195
    RM, RW = (RO + RI) / 2, (RO - RI) / 2
    if RI <= r <= RO:
        if dy > 0 and math.degrees(math.atan2(abs(dx), dy)) < 33:
            pass  # mezera dole
        else:
            return True
    for s in (-1, 1):
        a = math.radians(33)
        cx, cy = .5 + s * RM * math.sin(a), .53 + RM * math.cos(a)
        if math.hypot(u - cx, v - cy) <= RW:
            return True
    return False

def hole(u, v):
    RM = (.315 + .195) / 2
    for s in (-1, 1):
        for deg in (68, 108, 148):
            a = math.radians(deg)
            cx, cy = .5 + s * RM * math.sin(a), .53 + RM * math.cos(a)
            if math.hypot(u - cx, v - cy) <= .026:
                return True
    return False

def star(u, v, cx, cy, sz):
    dx, dy = (u - cx) / sz, (v - cy) / sz
    a = math.atan2(dy, dx)
    rr = math.hypot(dx, dy)
    k = .5 + .5 * abs(math.cos(a * 2)) ** .35
    return rr <= k * (abs(math.cos(a * 2)) ** 3 * .6 + .38)

def render(size, path):
    SS = 3
    px = bytearray(size * size * 4)
    for y in range(size):
        for x in range(size):
            acc = [0.0, 0.0, 0.0]
            for sy in range(SS):
                for sx in range(SS):
                    u = (x + (sx + .5) / SS) / size
                    v = (y + (sy + .5) / SS) / size
                    c = lerp(TOP, BOT, v)
                    if star(u, v, .795, .225, .085) or star(u, v, .225, .30, .055):
                        c = (255, 250, 225)
                    if shoe(u, v):
                        c = WHITE if not hole(u, v) else lerp(TOP, BOT, v)
                    acc[0] += c[0]; acc[1] += c[1]; acc[2] += c[2]
            n = SS * SS
            i = (y * size + x) * 4
            px[i] = round(acc[0] / n); px[i+1] = round(acc[1] / n); px[i+2] = round(acc[2] / n); px[i+3] = 255
    png(path, size, size, px)
    print('->', path)

os.makedirs('icons', exist_ok=True)
for s in (180, 192, 512):
    render(s, 'icons/icon-%d.png' % s)
