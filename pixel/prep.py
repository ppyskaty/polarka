#!/usr/bin/env python3
"""Připraví vygenerované obrázky koně pro appku:
   odstraní bílé pozadí (záplavou od okrajů, takže bílé odznaky zůstanou),
   ořízne na obrys, zmenší a uloží PNG s alfou."""
import zlib, struct, sys, os
from collections import deque

def read_png(path):
    d = open(path, 'rb').read()
    assert d[:8] == b'\x89PNG\r\n\x1a\n', 'není PNG'
    i, idat, w = 8, b'', None
    while i < len(d):
        ln = struct.unpack('>I', d[i:i+4])[0]; typ = d[i+4:i+8]; data = d[i+8:i+8+ln]
        if typ == b'IHDR':
            w, h, bd, ct, cm, fl, il = struct.unpack('>IIBBBBB', data)
            assert bd == 8 and ct in (2, 6) and il == 0, f'nepodporováno bd={bd} ct={ct} il={il}'
            ch = 4 if ct == 6 else 3
        elif typ == b'IDAT': idat += data
        elif typ == b'IEND': break
        i += 12 + ln
    raw = zlib.decompress(idat)
    px = bytearray(w * h * 4)
    stride = w * ch
    prev = bytearray(stride)
    pos = 0
    for y in range(h):
        f = raw[pos]; pos += 1
        line = bytearray(raw[pos:pos+stride]); pos += stride
        for x in range(stride):
            a = line[x - ch] if x >= ch else 0
            b = prev[x]
            c = prev[x - ch] if x >= ch else 0
            if f == 1: line[x] = (line[x] + a) & 255
            elif f == 2: line[x] = (line[x] + b) & 255
            elif f == 3: line[x] = (line[x] + (a + b) // 2) & 255
            elif f == 4:
                p = a + b - c; pa, pb, pc = abs(p-a), abs(p-b), abs(p-c)
                pr = a if (pa <= pb and pa <= pc) else (b if pb <= pc else c)
                line[x] = (line[x] + pr) & 255
        o = y * w * 4
        if ch == 4: px[o:o+stride] = line
        else:
            for x in range(w):
                px[o+x*4:o+x*4+3] = line[x*3:x*3+3]; px[o+x*4+3] = 255
        prev = line
    return w, h, px

def write_png(path, w, h, px):
    rows = b''.join(b'\x00' + bytes(px[y*w*4:(y+1)*w*4]) for y in range(h))
    def ch(t, d):
        c = t + d
        return struct.pack('>I', len(d)) + c + struct.pack('>I', zlib.crc32(c) & 0xffffffff)
    out = b'\x89PNG\r\n\x1a\n' + ch(b'IHDR', struct.pack('>IIBBBBB', w, h, 8, 6, 0, 0, 0))
    out += ch(b'IDAT', zlib.compress(bytes(rows), 9)) + ch(b'IEND', b'')
    open(path, 'wb').write(out)

def key_white(w, h, px, thr=234, soft=205):
    """Záplava od okrajů: průhledné je jen bílé spojené s okrajem."""
    seen = bytearray(w * h)
    q = deque()
    def light(i):
        o = i * 4
        return px[o] >= thr and px[o+1] >= thr and px[o+2] >= thr
    for x in range(w):
        for i in (x, (h-1)*w + x):
            if not seen[i] and light(i): seen[i] = 1; q.append(i)
    for y in range(h):
        for i in (y*w, y*w + w - 1):
            if not seen[i] and light(i): seen[i] = 1; q.append(i)
    while q:
        i = q.popleft(); x, y = i % w, i // w
        for nx, ny in ((x+1,y),(x-1,y),(x,y+1),(x,y-1)):
            if 0 <= nx < w and 0 <= ny < h:
                j = ny*w + nx
                if not seen[j] and light(j): seen[j] = 1; q.append(j)
    for i in range(w*h):
        if seen[i]: px[i*4+3] = 0
    # změkčení okraje: polotmavé pixely sousedící s průhlednem dostanou částečnou alfu
    for y in range(1, h-1):
        for x in range(1, w-1):
            i = y*w + x
            if seen[i] or px[i*4+3] == 0: continue
            if not (seen[i-1] or seen[i+1] or seen[i-w] or seen[i+w]): continue
            o = i*4
            lum = (px[o]*299 + px[o+1]*587 + px[o+2]*114) // 1000
            if lum > soft:
                px[o+3] = max(0, min(255, int(255 * (thr - lum) / max(1, thr - soft))))
    return px

def bbox(w, h, px, pad=2):
    x0, y0, x1, y1 = w, h, -1, -1
    for y in range(h):
        o = y*w*4
        for x in range(w):
            if px[o + x*4 + 3] > 8:
                if x < x0: x0 = x
                if x > x1: x1 = x
                if y < y0: y0 = y
                if y > y1: y1 = y
    return max(0, x0-pad), max(0, y0-pad), min(w-1, x1+pad), min(h-1, y1+pad)

def scale(w, h, px, nw, nh):
    """Box filtr s přednásobenou alfou, ať nevzniká bílý lem."""
    out = bytearray(nw * nh * 4)
    for ny in range(nh):
        sy0, sy1 = ny * h // nh, max(ny * h // nh + 1, (ny+1) * h // nh)
        for nx in range(nw):
            sx0, sx1 = nx * w // nw, max(nx * w // nw + 1, (nx+1) * w // nw)
            r = g = b = a = n = 0
            for y in range(sy0, sy1):
                o = y*w*4
                for x in range(sx0, sx1):
                    al = px[o+x*4+3]
                    r += px[o+x*4] * al; g += px[o+x*4+1] * al; b += px[o+x*4+2] * al
                    a += al; n += 1
            i = (ny*nw + nx) * 4
            if a:
                out[i] = min(255, r // a); out[i+1] = min(255, g // a); out[i+2] = min(255, b // a)
            out[i+3] = a // max(1, n)
    return out

def prep(src, dst, target_h):
    w, h, px = read_png(src)
    px = key_white(w, h, px)
    x0, y0, x1, y1 = bbox(w, h, px)
    cw, chh = x1-x0+1, y1-y0+1
    crop = bytearray(cw*chh*4)
    for y in range(chh):
        crop[y*cw*4:(y+1)*cw*4] = px[((y+y0)*w + x0)*4 : ((y+y0)*w + x0 + cw)*4]
    nh = target_h; nw = max(1, round(cw * nh / chh))
    small = scale(cw, chh, crop, nw, nh)
    write_png(dst, nw, nh, small)
    print(f'{os.path.basename(dst)}: {w}x{h} → ořez {cw}x{chh} → {nw}x{nh}  ({os.path.getsize(dst)//1024} kB)')
    return nw, nh

if __name__ == '__main__':
    os.makedirs('assets', exist_ok=True)
    H = int(sys.argv[1]) if len(sys.argv) > 1 else 460
    src = os.path.expanduser(os.environ.get('KONE', '~/Downloads'))
    prep(os.path.join(src, 'kun1.png'), 'assets/horse-stand.png', H)
    prep(os.path.join(src, 'kun2.png'), 'assets/horse-run.png', H)
