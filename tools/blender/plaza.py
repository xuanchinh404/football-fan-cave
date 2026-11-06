"""Hero football sculpture and patterned stonework for the arrival route."""
from itertools import combinations
import math
from random import Random

from mathutils import Vector

from geometry import Model


def football(m, center, radius, gold, pentagon, lining):
    # The 32 curved panels come from directed edges of a regular icosahedron.
    g = (1 + math.sqrt(5))/2
    points = [Vector(v) for a in (-1,1) for b in (-g,g)
              for v in [(0,a,b), (b,0,a), (a,b,0)]]
    neighbors = [[j for j,q in enumerate(points) if abs((p-q).length-2)<.001]
                 for p in points]
    edge = {(i,j): (2*points[i]+points[j])/3 for i, ns in enumerate(neighbors) for j in ns}
    panels = [(pentagon, [edge[i,j] for j in ns]) for i,ns in enumerate(neighbors)]
    for a,b,c in combinations(range(12), 3):
        if b in neighbors[a] and c in neighbors[a] and c in neighbors[b]:
            panels.append((gold, [edge[i,j] for i,j in [(a,b),(b,a),(b,c),(c,b),(c,a),(a,c)]]))
    origin = Vector(center)
    for material, corners in panels:
        normal = sum(corners, Vector()).normalized()
        u = (corners[0]-normal*normal.dot(corners[0])).normalized()
        v = normal.cross(u)
        corners.sort(key=lambda pt: math.atan2(pt.dot(v), pt.dot(u)))
        rim = [q for a,b in zip(corners, corners[1:]+corners[:1]) for q in (a,(a+b)*.5)]
        for mat, size, r in [(lining, 1.01, .982), (material, .944, 1)]:
            vertices = [origin+normal*radius*r]
            for t in (.54, 1):
                vertices.extend(origin+(normal.lerp(point.normalized(), t*size)).normalized()
                                *radius*(r-.004*t*t) for point in rim)
            n = len(rim)
            faces = [(0,1+i,1+(i+1)%n) for i in range(n)]
            faces += [(1+i,1+n+i,1+n+(i+1)%n,1+(i+1)%n) for i in range(n)]
            m.add(mat, vertices, faces, True)


def statue(p):
    m = Model()
    rng = Random(53)
    gold = p.material('Brushed trophy gold', 'E4A32E', .26, .78)
    light = p.material('Pale gold panels', 'FFD573', .33, .65)
    seam = p.material('Recessed bronze seams', '7F4424', .43, .58)
    rim = p.material('Polished edges', 'FFB64D', .29, .71)
    stone = p.material('Warm travertine', 'B59287', texture='Ashlar')
    red = p.material('Plinth garnet', '762939', .48, .24, texture='Ashlar')
    glow = p.material('Plinth lanterns', 'FFB142', .29, .12, 2)
    soil = p.material('Dark earth', '4B403A')
    greens = [p.material('Planter · green', '536831'), p.material('Planter · light', '769649')]
    petals = [p.material('Garden · magenta', 'D83D88'), p.material('Garden · coral', 'FF7A79'),
              p.material('Garden · gold', 'FFCC68')]
    for material, profile in [
        (stone, [(3.24,.012),(3.27,.075),(3.27,.20),(3.17,.31),(3.03,.32)]),
        (rim, [(3.19,.29),(3.18,.34),(3.10,.36),(3.06,.40)]),
        (soil, [(3.07,.33),(3.07,.38),(1.82,.38)]),
        (red, [(1.92,.34),(1.95,.42),(1.92,.61),(1.66,.67),(1.52,.87),(1.49,1.14)]),
        (stone, [(1.58,1.06),(1.66,1.15),(1.66,1.32),(1.54,1.44),(1.12,1.48)]),
        (gold, [(1.38,1.34),(1.49,1.38),(1.52,1.44),(1.38,1.51),(.83,1.55),
                (.71,1.69),(.62,1.88),(.63,2.0),(.82,2.11),(.84,2.18),(.65,2.24)]),
    ]:
        m.lathe(material, 0, 0, profile, 56, True)
    football(m, (0,0,3.46), 1.39, light, gold, seam)
    for i in range(24):
        a = i*math.tau/24
        ux, uy = math.cos(a), math.sin(a)
        m.jewel(rim, (ux*1.62,uy*1.62,.84), (.076,.077,.17), rng, 6, 3)
        if i%3 == 0:
            x,y = ux*2.74, uy*2.74
            m.lathe(seam,x,y,[(.19,.33),(.18,.48),(.14,.53)],8)
            m.lathe(glow,x,y,[(.125,.48),(.16,.61),(.12,.73)],8)
            m.lathe(rim,x,y,[(.18,.72),(.14,.80),(.053,.87)],8)
    for i in range(96):
        a = i*2.39996
        r = rng.uniform(2.04, 3.01)
        x,y = math.cos(a)*r, math.sin(a)*r
        z = rng.uniform(.43,.65)
        m.jewel(greens[i%2], (x,y,.445), (.14,.16,.1), rng, 5, 3)
        for j in range(5):
            b = j*math.tau/5
            m.jewel(petals[i%3], (x+.065*math.cos(b),y+.065*math.sin(b),z),
                    (.066,.057,.041), rng, 5, 3)
    return m


def promenade(p):
    m = Model()
    rng = Random(27)
    tile = [p.material('Paving · warm rose', 'A08288', texture='Ashlar'),
            p.material('Paving · lavender granite', '877F97', texture='Ashlar'),
            p.material('Paving · shell limestone', 'AD9590', texture='Ashlar')]
    band = p.material('Paving · ochre inlay', 'BD965F', .67, .16, texture='Ashlar')
    dark = p.material('Paving · purple border', '695A78', texture='Ashlar')
    # 12.2 by 38 metres centered on the spawn-to-stair axis, with its own
    # staggered stonework. Kept within 4cm of the shared floor.
    def paving_tile(mat, x, y, width, depth, z):
        a,b = width/2, depth/2
        c = min(.045, a*.29)
        corners = [(-a+c,-b),(a-c,-b),(a,-b+c),(a,b-c),
                   (a-c,b),(-a+c,b),(-a,b-c),(-a,-b+c)]
        m.rings(mat, [[(x+u,y+v,h) for u,v in corners] for h in (.003,z)])

    for row in range(38):
        y = row-18.5
        edges = [-5.78, *[x+(.6 if row%2 else 0) for x in
                          [-4.8,-3.6,-2.4,-1.2,0,1.2,2.4,3.6,4.8]], 5.78]
        for a,b in zip(edges, edges[1:]):
            paving_tile(tile[rng.randrange(3)], (a+b)/2, y, b-a-.024, .974, .025)
        for side in (-1, 1):
            paving_tile(dark, side*5.88, y, .22, .983, .03)
            paving_tile(band, side*6.02, y, .07, .987, .034)
            if row%2 == 0:
                x = side*5.89
                m.add(band, [(x-.066,y,.039),(x,y-.13,.039),(x+.066,y,.039),(x,y+.13,.039)],
                      [(0,1,2,3)])
    for y,r in [(8,1.35),(-5.6,1.15)]:
        for mat,w in [(dark,.115),(band,.042)]:
            for i in range(48):
                a,b = i*math.tau/48,(i+1)*math.tau/48
                rr = r - (.15 if mat == band else 0)
                m.add(mat, [(math.cos(t)*d,y+math.sin(t)*d,.038)
                            for t,d in [(a,rr-w),(a,rr),(b,rr),(b,rr-w)]], [(0,1,2,3)])
        for i in range(8):
            a = i*math.tau/8
            u,v = math.cos(a),math.sin(a)
            m.add(band, [(0,y,.038),(.44*u-.125*v,y+.44*v+.125*u,.038),
                         (u,y+v,.038),(.44*u+.125*v,y+.44*v-.125*u,.038)], [(3,2,1,0)])
    return m
