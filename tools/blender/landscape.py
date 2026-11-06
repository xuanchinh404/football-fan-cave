"""Layered slate escarpment, terraced cascades, and ornamental cherry trees."""
import math
from random import Random

from geometry import Model


def cliff(p, seed=19):
    m = Model()
    rng = Random(seed)
    rock = [p.material('Slate · lavender', '77728B', texture='Cliff'),
            p.material('Slate · shadow', '565A78', texture='Cliff'),
            p.material('Slate · sunlit', '9C8996', texture='Cliff')]
    moss = [p.material('Moss · jade', '597440'), p.material('Moss · gold green', '8A9F4B')]
    # Each reusable 11m module has deep recesses, alternating bed thickness,
    # asymmetric overhangs, and smaller wedges crossing the major fractures.
    for j, (z, height) in enumerate([(-.05, 1.0), (1.35, .82), (2.57, .72),
                                     (3.63, .66), (4.58, .61), (5.44, .58), (6.27, .66)]):
        x = -5.43
        while x < 5.25:
            w = min(rng.uniform(.86, 3.1), 5.43-x)
            center = x + w/2
            y = .24 + math.sin(center*.55 + seed)*.54 + rng.uniform(-.41, .41)
            m.jewel(rock[rng.randrange(3)], (center, y, z+rng.uniform(-.12, .10)),
                    (w*.42, rng.uniform(.97, 1.72), height), rng, rng.choice((7, 8, 9)), 5)
            if rng.random() < (.21 if j < 4 else .67):
                m.jewel(moss[rng.randrange(2)], (center, y-.7, z+height*.61),
                        (w*.33, .85, .25), rng, 8)
            x += w*.87
    for _ in range(25):
        x, z = rng.uniform(-5, 5), rng.uniform(0, 6.5)
        m.jewel(rock[1], (x, -.92, z),
                (rng.uniform(.11, .39), .53, rng.uniform(.21, .6)), rng, 6)
    return m


def waterfall(p):
    m = Model()
    rng = Random(62)
    stone = p.material('Wet blue slate', '4D6074', .47, .04, texture='Cliff')
    moss = p.material('Streambank green', '718D47')
    flowing = p.material('Cascade flow', '3ABFDD', .32, .12, .38)
    pool = p.material('Deep turquoise pool', '188B99', .24, .18, .12)
    foam = p.material('Aerated water', 'A3ECEB', .52, 0, .75)
    # A stepped channel with irregular edges and space for a shallower second fall.
    for z, y, w in [(6.17, .95, 2.0), (3.51, -1.28, 2.68), (.18, -3.56, 3.4)]:
        for side in (-1, 1):
            for i in range(6):
                m.jewel(stone, (side*(w + rng.uniform(-.23,.54)), y+rng.uniform(-.75,.67),
                               z+rng.uniform(-.25,.18)),
                        (rng.uniform(.37,.8), rng.uniform(.45,.97), rng.uniform(.27,.66)), rng)
            m.jewel(moss, (side*(w+.37), y, z+.44), (.53,.63,.2), rng)
    for i in range(16):
        a = i*math.tau/16
        if math.sin(a) > .55:
            continue
        m.jewel(stone, (3.31*math.cos(a), -3.55+1.97*math.sin(a), -.42),
                (.59,.57,rng.uniform(.46,.91)), rng, 8)
    m.rings(pool, [[(3.45*math.cos(a), -3.55+2.15*math.sin(a), z)
                    for a in [i*math.tau/32 for i in range(32)]] for z in (-.38, .12)], True)
    for y, z, w, d in [(.65, 6.47, 1.8, .7), (-1.47, 3.77, 2.18, .75)]:
        m.rings(pool, [[(w*math.cos(a), y+d*math.sin(a), z+h)
                         for a in [i*math.tau/20 for i in range(20)]] for h in (-.38, 0)], True)
    for z, y, width, drop, spread in [(6.48,.62,3.15,2.72,1.92),
                                      (3.77,-1.25,3.98,3.61,2.35)]:
        for ribbon in range(6):
            pts = []
            rows = 15
            for j in range(rows):
                t = j/(rows-1)
                for col in range(4):
                    u = (ribbon+col/3)/6-.5
                    x = width*u*(1+.27*t) + .14*math.sin(u*25+t*8)
                    pts.append((x, y-spread*t**.62+.075*math.sin(u*29+t*11), z-drop*t**1.5))
            faces = [(i*4+j, i*4+j+1, (i+1)*4+j+1, (i+1)*4+j)
                     for i in range(rows-1) for j in range(3)]
            m.add(flowing, pts, faces, True)
            # Rear-facing sheets keep water readable from the bridge and atlas.
            m.add(flowing, [(x, y+.014, z) for x,y,z in pts],
                  [tuple(reversed(face)) for face in faces], True)
    for i in range(48):
        a = i*2.399
        high = i >= 31
        w, d, y, z = (1.97,.42,-1.63,3.78) if high else (2.87,1.58,-3.56,.16)
        r = rng.uniform(.47, 1)
        m.jewel(foam, (math.cos(a)*w*r, y+math.sin(a)*d*r, z),
                (rng.uniform(.06,.19), rng.uniform(.07,.2), rng.uniform(.02,.08)), rng, 6, 3)
    return m


def cherry(p, lod=False):
    m = Model()
    rng = Random(32)
    bark = p.material('Cherry bark', '724659', .9, texture=None if lod else 'Ashlar')
    dark = p.material('Cherry bark ribs', '4C3445')
    leaf = [p.material('Petal shadow', 'B42A6D'), p.material('Petal midtone', 'ED548F'),
            p.material('Petal tip', 'FF96BC'), p.material('Sunlit blush', 'FFBDD6')]
    twig = [(0,0,-.05),(.15,.04,.77),(-.17,.11,1.66),(-.11,.17,2.62),(.23,.1,3.65)]
    m.line(bark, twig, [.43,.35,.28,.21,.10], 10)
    for i in range(5):
        a = i*math.tau/5
        m.line(dark, [(x+math.cos(a)*r,y+math.sin(a)*r,z)
                      for (x,y,z),r in zip(twig,[.4,.34,.27,.19,.08])], [.045,.035,.029,.02,.01], 5)
    crown = []
    for i in range(8):
        a = i*2.39996
        ux, uy = math.cos(a), math.sin(a)
        span = rng.uniform(1.42, 2.5)
        high = 3.67 + rng.random()*1.3
        base = twig[2+i%2]
        branch = [base,(ux*.75,uy*.75,base[2]+.55),(ux*span*.8,uy*span*.8,high-.46),
                  (ux*span,uy*span,high)]
        m.line(bark, branch, [.17,.13,.075,.034])
        for s in (-1, 1):
            x, y, z = branch[-1]
            tip = (x-uy*s*.7,y+ux*s*.7,z+s*.31)
            m.line(bark, [branch[2], (x*.93,y*.93,z-.23), tip], [.06,.043,.018], 6)
            crown.append(tip)
        crown.append(branch[-1])
    crown.extend([(-.68,-.21,4.82),(.61,.36,5.23),(-.1,.17,5.37)])
    for i,(x,y,z) in enumerate(crown):
        if lod and i%3 == 1:
            continue
        m.jewel(leaf[i%3], (x,y,z), (.87,.79,.48), rng, 7 if lod else 10)
        for j in range(3 if lod else 16):
            a = j*2.39996
            radius = rng.uniform(.22,.91)
            bx, by = x+math.cos(a)*radius, y+math.sin(a)*radius*.83
            bz = z+rng.uniform(-.23,.42)
            m.jewel(leaf[rng.randrange(1,4)], (bx,by,bz),
                    (rng.uniform(.15,.34),rng.uniform(.12,.27),rng.uniform(.085,.23)),
                    rng, 6, 3)
    return m


def spire(p):
    m = Model()
    rng = Random(403)
    face = [p.material('Ridge · smoky basalt', '4D5C79', texture='Cliff'),
            p.material('Ridge · weathered lavender', '707693', texture='Cliff'),
            p.material('Ridge · sandstone shoulder', '8C8294', texture='Cliff')]
    moss = p.material('Ridge · olive canopy', '66884F')
    for j, (x,y,height,width) in enumerate([(-1.4,.67,15.6,2.23), (.82,.08,17.0,2.55),
                                           (2.07,-.67,10.6,1.69)]):
        n = 9
        ribs = [rng.uniform(.67,1.20) for _ in range(n)]
        rings = []
        levels = [(0,1), (.15,.93), (.30,.79), (.42,.86), (.52,.73),
                  (.65,.75), (.71,.63), (.80,.61), (.93,.49), (1,.32)]
        for i,(z,r) in enumerate(levels):
            rings.append([(x + width*math.cos(a)*r*ribs[k] + .7*z*math.sin(j*3),
                           y + width*math.sin(a)*r*ribs[k]*.85 + .52*z,
                           height*z+rng.uniform(-.64,.64))
                          for k,a in enumerate([k*math.tau/n+j for k in range(n)])])
        for i in range(len(rings)-1):
            for k in range(n):
                a,b = k,(k+1)%n
                m.add(face[(k//2+j)%3 if i < 7 else (k//2+j+1)%3], [rings[i][a],rings[i][b],
                      rings[i+1][b],rings[i+1][a]], [(0,1,2,3)])
        m.add(face[1], rings[-1], [tuple(range(n))])
        for i in (2, 5, 7):
            for k in (3, 6):
                x0,y0,z0 = rings[i][k]
                m.jewel(face[1], (x0,y0,z0), (width*.59,.57,.44), rng, 7)
                m.jewel(moss, (x0,y0,z0+.37), (width*.49,.44,.16), rng, 8)
    return m


def flower_bed(p):
    m = Model()
    rng = Random(220)
    stone = p.material('Garden border sandstone', 'B99B87', texture='Ashlar')
    soil = p.material('Garden earth', '4D4643')
    leaves = [p.material('Sage leaves', '62783E'), p.material('Apple leaves', '93AE54')]
    flowers = [p.material('Azalea · violet', 'A23997'), p.material('Azalea · rose', 'F569A5'),
               p.material('Azalea · marigold', 'F5B74C')]
    n = 28
    m.rings(stone, [[(r*1.38*math.cos(a), r*.85*math.sin(a), z)
                    for a in [i*math.tau/n for i in range(n)]]
                    for r,z in [(1,0),(1,.14),(.95,.27),(.86,.27),(.81,.16)]])
    m.rings(soil, [[(1.2*math.cos(a), .73*math.sin(a), z)
                   for a in [i*math.tau/n for i in range(n)]] for z in (.11,.22)])
    for i in range(48):
        a = i*2.39996
        r = math.sqrt((i+.5)/48)
        x,y = r*1.12*math.cos(a),r*.68*math.sin(a)
        h = rng.uniform(.33,.64)
        m.jewel(leaves[i%2], (x,y,.29), (.21,.17,.13), rng, 6, 3)
        for j in range(5):
            angle = j*math.tau/5
            cx,cy = x+.066*math.cos(angle),y+.066*math.sin(angle)
            m.jewel(flowers[i%3], (cx,cy,h), (.069,.068,.044), rng, 5, 3)
        m.jewel(flowers[2], (x,y,h+.025), (.048,.045,.039), rng, 5, 3)
    return m
