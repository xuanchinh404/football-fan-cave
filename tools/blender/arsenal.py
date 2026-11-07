"""Original fortress props in metres. No club crest or third-party artwork."""
import math
import random
from geometry import Model


def fortress_arch(palette):
    m = Model()
    stones = [palette.material('Sandstone '+str(i), c, texture='Cliff')
              for i,c in enumerate(('746064','8D7473','6A515A'))]
    gold = palette.material('Antique brass', 'C68A34', .28, .7)
    for side in (-1, 1):
        x = side*4.23
        for i in range(9):
            m.block(stones[i%3], x, 0, .25+i*.49, 1.15, 1.32, .47, .09)
        for z,w in ((.18,1.48),(.49,1.35),(4.28,1.42),(4.48,1.58)):
            m.block(gold, x, 0, z, w, 1.53, .14, .045)
    for i in range(19):
        a,b = (i+.025)*math.pi/19,(i+.975)*math.pi/19
        r = 3.65
        outer = 4.46 + (.16 if i == 9 else 0)
        pts = [(radius*math.cos(t),4.38+radius*math.sin(t)) for radius,t in
               ((r,a),(outer,a),(outer,b),(r,b))]
        m.profile(stones[i%3],pts,-.64,.64)
    for radius in (3.7,4.43):
        points = [(radius*math.cos(i*math.pi/36),-.67,4.38+radius*math.sin(i*math.pi/36))
                  for i in range(37)]
        m.line(gold,points,[.055]*37)
    return m


def cannon(palette, emblem=False):
    m = Model()
    gold = palette.material('Engraved brass', 'EDA846', .26, .68, .44 if emblem else 0)
    iron = palette.material('Patinated iron', '473137', .49, .65)
    oak = palette.material('Carriage walnut', '693A27', .65)
    if emblem:
        # A freestanding heraldic ornament, distinct from the Arsenal badge.
        m.profile(gold,[(-1.63,.70),(-.4,1.05),(1.67,1.46),(1.82,1.26),(.07,.77),(-1.63,.48)],-.08,.08)
        rim=[(.7*math.cos(i*math.tau/32),-.15,.74+.7*math.sin(i*math.tau/32)) for i in range(33)]
        m.line(gold,rim,[.065]*33)
        for i in range(8):
            angle=i*math.tau/8
            m.line(gold,[(0,-.15,.74),(.67*math.cos(angle),-.15,.74+.67*math.sin(angle))],[.035]*2)
        return m
    for y in (-.67,.67):
        m.block(oak,-.26,y,.63,2.35,.22,.31,.08)
        wheel=[(.63*math.cos(i*math.tau/32),y,.67+.63*math.sin(i*math.tau/32)) for i in range(33)]
        m.line(iron,wheel,[.094]*33)
        m.line(gold,[(x,y-.045,z) for x,_,z in wheel],[.038]*33)
        for i in range(10):
            a=i*math.tau/10
            m.line(oak,[(0,y,.67),(.59*math.cos(a),y,.67+.59*math.sin(a))],[.075,.035])
    m.line(iron,[(0,-.85,.67),(0,.85,.67)],[.14,.14],16)
    m.line(gold,[(-.98,0,1.02),(-.77,0,1.08),(-.43,0,1.14),(.58,0,1.39),(1.45,0,1.66)],[.20,.31,.27,.19,.21],24)
    for x,z,r in ((-.57,1.11,.31),(.42,1.35,.233),(1.37,1.64,.247)):
        m.line(gold,[(x-.08,0,z-.02),(x+.08,0,z+.02)],[r,r],24)
    m.line(iron,[(1.45,0,1.66),(1.48,0,1.67)],[.137,.137],24)
    return m


def sofa(palette):
    m = Model()
    leather = palette.material('Oxblood leather', '9E283D', .42)
    dark = palette.material('Oxblood seam', '611529', .55)
    brass = palette.material('Upholstery brass', 'BB793C', .36, .55)
    m.block(dark,0,0,.30,5.7,1.7,.42,.15)
    m.block(leather,0,.60,1.03,5.6,.54,1.34,.18)
    for i in range(4):
        x=(i-1.5)*1.23
        m.block(leather,x,-.20,.62,1.19,1.15,.29,.15)
        m.block(leather,x,.31,1.1,1.19,.24,.69,.12)
        for j in (-1,0,1):
            m.line(brass,[(x+j*.28,.175,1.12),(x+j*.28,.14,1.12)],[.022]*2)
    for x in (-2.65,2.65):
        m.block(leather,x,-.11,.92,.52,1.45,.61,.16)
        for y in (-.6,.61):
            m.lathe(brass,x,y,[(.12,.02),(.09,.22)],12)
    return m


def ruby(palette):
    m=Model()
    materials=[palette.material('Ruby '+str(i),c,.22,.22,1.15)
               for i,c in enumerate(('F02052','C10C41','FF7477'))]
    rng=random.Random(144)
    for i in range(8):
        x=rng.uniform(-.69,.69)
        y=rng.uniform(-.36,.36)
        h=rng.uniform(.37,1.29)
        m.jewel(materials[i%3],(x,y,h),(.23,.24,h),rng,sides=6,layers=4)
    return m


def cup(palette, kind):
    m=Model()
    silver=palette.material('Chased silver','E7DFDA',.23,.84)
    gold=palette.material('Gilt','EEAA44',.25,.77)
    dark=palette.material('Ebonized wood','351E24',.42)
    ribbon=palette.material('Crimson enamel','C20E36',.43)
    m.lathe(dark,0,0,[(.47,.01),(.46,.14),(.37,.19)],32)
    if kind == 'shield':
        for i,(r,y) in enumerate(((.79,0),(.7,-.07),(.47,-.10),(.24,-.14))):
            pts=[(r*math.cos(t*math.tau/48),y,.99+r*math.sin(t*math.tau/48)) for t in range(48)]
            m.profile(silver if i%2==0 else gold,[(x,z) for x,_,z in pts],y-.05,y+.06)
        m.block(dark,0,.06,.30,.35,.38,.38)
        return m
    profiles = {
        'league':[(.37,.19),(.19,.35),(.22,.64),(.49,.83),(.53,1.58),(.58,1.77),(.43,1.85)],
        'fa':[(.32,.19),(.16,.48),(.33,.66),(.48,.88),(.39,1.35),(.51,1.52),(.36,1.64),(.13,1.80)],
        'league-cup':[(.36,.19),(.16,.54),(.25,.75),(.43,.94),(.54,1.42),(.47,1.50)],
        'winners':[(.32,.19),(.22,.44),(.32,.75),(.56,1.56),(.61,1.76),(.53,1.81)],
        'fairs':[(.41,.19),(.31,.54),(.48,.88),(.46,1.19),(.37,1.38),(.54,1.63),(.47,1.71)],
    }
    m.lathe(silver,0,0,profiles[kind],40,True)
    if kind in ('fa','league'):
        m.lathe(gold,0,0,[(.10,1.75),(.12,1.88),(.05,2.03)],20,True)
    for s in (-1,1):
        m.line(gold,[(s*.44,0,1.46),(s*.76,0,1.62),(s*.83,0,1.22),(s*.53,0,.94)],[.052]*4,12)
        if kind in ('league','fa'):
            m.profile(ribbon,[(s*.61,.91),(s*.74,.83),(s*.80,1.49),(s*.68,1.53)],-.12,-.08)
    return m


def keepsake(palette):
    m=Model()
    fabric=palette.material('Heritage scarlet','A81734',.64)
    white=palette.material('Ivory sleeves','F2DFCA',.65)
    m.profile(fabric,[(-.45,.04),(.45,.04),(.48,1.04),(.23,1.16),(0,1.01),(-.23,1.16),(-.48,1.04)],-.10,.10)
    for side in (-1,1):
        pts=[(.42*side,.61),(.75*side,.76),(.60*side,1.02),(.44*side,1.05)]
        m.profile(white,pts if side==1 else pts[::-1],-.10,.10)
    return m


def masonry(palette):
    """Staggered, bevelled stonework tile. Front projects out over the structural wall."""
    m=Model()
    rng=random.Random(1603)
    stones=[palette.material('Fortress masonry '+str(i), c, texture='Cliff')
            for i,c in enumerate(('75616B','856E74','6E5663','927478'))]
    width=4.8
    for row in range(11):
        start = -width/2
        cuts = [start]
        while cuts[-1] < width/2:
            step = rng.uniform(.91,1.38)
            if row%2 == 1 and len(cuts)==1:
                step *= .53
            cuts.append(min(width/2,cuts[-1]+step))
        if cuts[-1]-cuts[-2] < .28:
            cuts.pop(-2)
        for lo,hi in zip(cuts,cuts[1:]):
            m.block(stones[rng.randrange(len(stones))],(lo+hi)/2,rng.uniform(-.1,.09),
                    .50+row,hi-lo-.038,.32+rng.uniform(0,.09),.95,.095)
    return m
