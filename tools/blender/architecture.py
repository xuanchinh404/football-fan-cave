"""United gateway, public lighting and modular circulation pieces."""
import math
from random import Random

from geometry import Model


def lantern(model, p, x, y, z, scale=1, post=False):
    bronze, trim, glass = p
    r = scale
    if post:
        model.lathe(bronze, x, y, [(a*r, b*r) for a, b in
                    [(.15, 0), (.15, .17), (.11, .28), (.072, .44), (.059, z-.5),
                     (.105, z-.4), (.105, z-.22), (.15, z-.14)]], 12)
        for h in (.22, .42, z-.47):
            model.lathe(trim, x, y, [(.092*r, (h-.03)*r), (.097*r, (h+.03)*r)], 12)
    profile = [(.14, -.15), (.26, -.11), (.30, -.03), (.23, .06)]
    model.lathe(bronze, x, y, [(a*r, (z+b)*r) for a, b in profile], 6)
    model.lathe(glass, x, y, [(a*r, (z+b)*r) for a, b in
                [(.202, .02), (.25, .18), (.24, .52), (.16, .66)]], 6)
    model.lathe(bronze, x, y, [(a*r, (z+b)*r) for a, b in
                [(.28, .51), (.31, .56), (.27, .65), (.095, .84), (.06, .91)]], 6)
    for i in range(6):
        a = i*math.tau/6
        model.line(trim, [(x+math.cos(a)*w*r, y+math.sin(a)*w*r, (z+h)*r)
                          for w, h in [(.255, -.055), (.263, .19), (.24, .55)]],
                   [.024*r, .021*r, .026*r], 5)
    model.lathe(trim, x, y, [(.31*r, (z+.55)*r), (.29*r, (z+.598)*r)], 6)


def lantern_palette(p):
    return (p.material('Patinated bronze', '62432F', .49, .62),
            p.material('Hammered brass', 'D7953A', .34, .66),
            p.material('Amber lamp glass', 'FFC363', .24, .14, 2.3))


def street_lamp(p, lod=False):
    m = Model()
    palette = lantern_palette(p)
    if lod:
        bronze, trim, glass = palette
        m.lathe(bronze, 0, 0, [(.13, 0), (.09, .25), (.058, .38), (.058, 2.67)], 8)
        m.lathe(trim, 0, 0, [(.17, 2.56), (.29, 2.65), (.26, 2.72)], 6)
        m.lathe(glass, 0, 0, [(.22, 2.67), (.24, 3.17), (.19, 3.25)], 6)
        m.lathe(bronze, 0, 0, [(.31, 3.17), (.26, 3.26), (.04, 3.53)], 6)
    else:
        lantern(m, palette, 0, 0, 2.59, post=True)
    return m


def arch(model, material, rx, spring, rz, width, front, back, n=24, gap=0):
    # Cut voussoirs follow an elliptical vault and remain individual stone profiles.
    for i in range(n):
        a, b = (i + gap)*math.pi/n, (i+1-gap)*math.pi/n
        c = (a+b)/2
        model.profile(material[i % len(material)], [
            (rx*math.cos(a), spring+rz*math.sin(a)),
            ((rx+width)*math.cos(a), spring+(rz+width)*math.sin(a)),
            ((rx+width)*math.cos(c), spring+(rz+width)*math.sin(c)),
            ((rx+width)*math.cos(b), spring+(rz+width)*math.sin(b)),
            (rx*math.cos(b), spring+rz*math.sin(b)),
            (rx*math.cos(c), spring+rz*math.sin(c)),
        ], front, back)


def gateway(p):
    m = Model()
    rng = Random(208)
    ashlar = [p.material('Smoky rose ashlar', '987A80', texture='Ashlar'),
              p.material('Basalt blue ashlar', '777791', texture='Ashlar')]
    ebony = p.material('Charred vault', '4B3744', texture='Ashlar')
    red = p.material('Oxblood enamel', '780B1D', .38, .16)
    scarlet = p.material('Scarlet standard', 'B8223C', .92)
    bronze, gold, glass = lantern_palette(p)
    ruby = p.material('Hot ruby inlay', 'FF592A', .24, .22, 2.2)
    ivory = p.material('Carved sandstone', 'D4AF8A', texture='Ashlar')
    # A 2.6m-deep tunnel, with a large outer arch and two recessed gold reveals.
    spring, radius = 3.65, 3.55
    arch(m, ashlar, 3.82, spring, radius, 1.15, -1.2, 1.36, 21, .023)
    arch(m, [ebony], 3.33, spring, 3.24, .52, -.88, 1.36, 22)
    arch(m, [ivory], 3.74, spring, 3.49, .16, -1.35, -.81, 28)
    arch(m, [gold], 3.48, spring, 3.37, .10, -1.02, -.79, 30)
    arch(m, [gold], 4.86, spring, 4.59, .11, -1.33, -1.14, 28)
    arch(m, [ruby], 3.34, spring, 3.25, .065, -.61, -.53, 30)
    for side in (-1, 1):
        m.block(ebony, side*3.57, .24, 1.82, .5, 2.27, 3.64)
        m.block(ashlar[0], side*4.32, .06, 1.82, 1.32, 2.56, 3.64)
        for level in range(6):
            m.block(ashlar[level % 2], side*5.19, 0, .73+level*.59,
                    1.24-level*.048, 2.32, .563, .072)
        for z, w, h in [(.15, 1.32, .3), (.42, 1.17, .17), (3.66, 1.28, .23), (3.91, 1.31, .17)]:
            m.block(ivory, side*5.19, 0, z, w, 2.39, h)
        for x in (3.51, 4.83, 5.48):
            m.block(gold, side*x, -1.16, 1.83, .071, .083, 3.64, .012)
        m.block(bronze, side*5.19, -.04, 4.31, 1.1, 2.1, .62)
        m.jewel(ruby, (side*5.19, 0, 4.93), (.34, .42, .66), rng, 6)
        lantern(m, (bronze, gold, glass), side*5.24, -1.57, 2.35)
        m.line(bronze, [(side*5.24, -1.16, 2.12), (side*5.24, -1.54, 2.12),
                        (side*5.24, -1.57, 2.41)], [.063]*3)
        # Heraldic standards have a peaked hem and raised gold seams.
        cx = side*4.46
        banner = [(cx-.36, 2.46), (cx, 2.2), (cx+.36, 2.46),
                  (cx+.36, 4.5), (cx-.36, 4.5)]
        m.profile(scarlet, banner, -1.49, -1.38)
        m.line(gold, [(x, -1.52, z) for x, z in [*banner, banner[0]]], [.033]*6, 5)
        m.line(gold, [(cx-.48, -1.51, 4.54), (cx+.48, -1.51, 4.54)], [.05]*2)
        for i in range(6):
            angle = .22 + i*.19
            m.jewel(gold, (side*4.24*math.cos(angle), -1.26, spring+3.93*math.sin(angle)),
                    (.105, .14, .116), rng)
    # Threshold is shallow enough for the existing ramp and trigger geometry.
    m.block(gold, 0, -.57, .014, 6.61, .42, .028, .006)
    m.block(ebony, 0, 1.35, 1.85, 6.7, .11, 3.7)
    arch(m, [ebony], .04, spring, .04, 3.58, 1.28, 1.4, 24)
    # Cartouche and original trident, with all lettering supplied by the game.
    plaque = [(-3.41, 7.1), (3.41, 7.1), (3.7, 7.58), (3.46, 7.98), (2.29, 8.13),
              (-2.29, 8.13), (-3.46, 7.98), (-3.7, 7.58)]
    m.profile(gold, plaque, -1.63, -1.16)
    m.profile(red, [(x*.96, 7.62+(z-7.62)*.85) for x, z in plaque], -1.68, -1.62)
    crest = [(-.78, 8.21), (0, 7.99), (.78, 8.21), (.87, 9.15),
             (0, 9.6), (-.87, 9.15)]
    m.profile(gold, crest, -1.31, -.83)
    m.profile(red, [(x*.88, 8.78+(z-8.78)*.88) for x, z in crest], -1.37, -1.29)
    m.line(ruby, [(0, -1.45, 8.26), (0, -1.45, 9.27)], [.057, .064])
    m.profile(gold, [(-.14, 9.17), (.14, 9.17), (0, 9.4)], -1.51, -1.37)
    for s in (-1, 1):
        m.line(gold, [(0, -1.45, 8.56), (s*.42, -1.45, 8.72), (s*.42, -1.45, 9.1)],
               [.045]*3)
        m.profile(gold, [(s*.42-.12, 9.02), (s*.42+.12, 9.02), (s*.42, 9.22)], -1.51, -1.36)
    return m


def stairs(p, width=10, depth=14, rise=7):
    m = Model()
    slabs = [p.material('Stair limestone', 'C3A88A', texture='Ashlar'),
             p.material('Stair slate', '9F92A0', texture='Ashlar')]
    metal = p.material('Dark gilded rail', 'AB773D', .4, .63)
    stone, gold, glass = lantern_palette(p)
    count = round(rise/.162)
    for i in range(count):
        y = (i+.5)*depth/count-depth/2
        z = (i+.5)*rise/count
        for col in range(5):
            m.block(slabs[(col+i*3) % 2], (col-2)*width/5, y, z-.115, width/5,
                    depth/count+.015, .20, .016)
    for side in (-1, 1):
        x = side*(width/2+.12)
        for dz, radius in [(0, .105), (.63, .065)]:
            m.line(metal, [(x, -depth/2, 1.05-dz), (x, depth/2, rise+1.05-dz)],
                   [radius, radius])
        for i in range(9):
            t = i/8
            y = (t-.5)*depth
            z = t*rise
            m.block(slabs[0], x, y, z+.20, .42, .42, .54)
            m.block(metal, x, y, z+.66, .14, .14, .87)
            if i in (0, 4, 8):
                m.lathe(glass, x, y, [(.10, z+1.10), (.14, z+1.2), (.09, z+1.3)], 8)
                m.lathe(gold, x, y, [(.14, z+1.3), (.035, z+1.43)], 8)
    return m


def bridge(p, width=6, depth=14, rise=7):
    m = Model()
    stone = [p.material('Bridge sandstone', 'BE9A87', texture='Ashlar'),
             p.material('Bridge granite', '8C8294', texture='Ashlar')]
    metal = p.material('Aged gold', 'C39352', .39, .64)
    lamp = lantern_palette(p)
    # Define the span from the same dimensions used by the walkable ramp.
    def deck(t):
        return rise*t

    for i in range(22):
        t0, t1 = i/22, (i+1)/22
        for col in range(4):
            x0, x1 = (col/4-.5)*width, ((col+1)/4-.5)*width
            loops = [[(x, depth*(t-.5), deck(t)+z)
                      for x, t in [(x0+.014,t0+.001),(x1-.014,t0+.001),
                                   (x1-.014,t1-.001),(x0+.014,t1-.001)]]
                     for z in (-.27, .025)]
            m.rings(stone[(col+i//3) % 2], loops)
    # Masonry spandrels wrap a true void, opening underneath the span.
    def underside(t):
        return deck(t)-5.2+4.7*math.sin(math.pi*t)**.53

    for i in range(30):
        t0, t1 = i/30, (i+1)/30
        pts = []
        for x in (-width/2, width/2):
            pts += [(x, depth*(t-.5), h) for t, h in
                    [(t0, underside(t0)), (t1, underside(t1)),
                     (t1, deck(t1)-.22), (t0, deck(t0)-.22)]]
        m.add(stone[(i//4) % 2], pts, [(3,2,1,0), (4,5,6,7), (0,1,5,4),
                                      (2,3,7,6), (1,2,6,5), (0,4,7,3)])
    for side in (-1, 1):
        x = side*(width/2+.12)
        for i in range(11):
            t = i/10
            z = deck(t)
            y = (t-.5)*depth
            m.block(stone[0], x, y, z+.48, .34, .38, .96)
            m.block(stone[1], x, y, z+.99, .43, .46, .15)
            if i in (1, 9):
                lantern(m, lamp, x, y, z+1.17)
        for height in (.24, .91):
            m.line(metal, [(x,-depth/2,height), (x,depth/2,rise+height)], [.095]*2)
        for offset in (-.10, .12):
            points = [(x, depth*(i/30-.5), underside(i/30)+offset) for i in range(31)]
            m.line(stone[0], points, [.12]*len(points), 7)
    return m
