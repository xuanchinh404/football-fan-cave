"""Build original Liverpool room kits in metres. Coordinates are (x, up, south).

Run from the repo root: blender -b -t 2 -P tools/blender/liverpool.py
"""
from collections import defaultdict
from math import cos, pi, sin
from pathlib import Path
from random import Random

import sys

import bpy
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'apps/web/public/models/liverpool'
OUT.mkdir(parents=True, exist_ok=True)
rng = Random(1892)
geometry = defaultdict(lambda: ([], []))
scenes = {}

bpy.ops.wm.read_factory_settings(use_empty=True)


def material(name, color, metal=0, roughness=.7, glow=0):
    result = bpy.data.materials.new(name)
    result.diffuse_color = (*color, 1)
    result.use_nodes = True
    shader = result.node_tree.nodes.get('Principled BSDF')
    shader.inputs['Base Color'].default_value = (*color, 1)
    shader.inputs['Metallic'].default_value = metal
    shader.inputs['Roughness'].default_value = roughness
    shader.inputs['Emission Color'].default_value = (*color, 1)
    shader.inputs['Emission Strength'].default_value = glow
    return result


stone = [material(f'Volcanic {i}', c) for i, c in enumerate([
    (.059, .021, .043), (.106, .028, .050), (.17, .04, .066), (.23, .053, .081),
    (.077, .034, .071), (.135, .049, .076), (.076, .021, .041),
])]
paving = [material(f'Paving {i}', (v, v*.43, v*.55), .18, .43) for i, v in enumerate([.09,.13,.17,.20,.24])]
marble = [material(f'Marble {i}', c, .23, .28) for i,c in enumerate([
    (.24,.095,.10), (.34,.15,.146), (.46,.28,.24), (.18,.055,.062), (.36,.19,.18),
])]
gold = material('Brushed brass', (.84,.43,.09), .74, .28)
bronze = material('Cast bronze', (.49,.21,.072), .73, .34)
bronze_dark = material('Bronze patina', (.24,.083,.028), .71, .39)
silver = material('Polished silver', (.68,.78,.84), .82, .18)
black = material('Black lacquer', (.035,.015,.022), .37, .31)
red = material('Kop scarlet velvet', (.49,.014,.03), .02, .88)
red_light = material('Scarlet piping', (.68,.046,.067), .15, .54)
wine = material('Oxblood upholstery', (.21,.018,.043), .04, .76)
plum = material('Plum upholstery', (.21,.027,.34), .09, .76)
plum_light = material('Plum piping', (.36,.071,.51), .09, .65)
wood = material('Dark walnut', (.17,.062,.029), .05, .47)
ivory = material('Warm ivory', (.85,.72,.47), .11, .55)
leaf = [material('Leaves '+str(i), c) for i,c in enumerate([(.025,.15,.04),(.065,.25,.055),(.17,.32,.063)])]
floral = material('Wild scarlet flowers', (.67,.02,.042), 0, .52)
ruby = [material('Ruby '+str(i), c, .35, .21, g) for i,(c,g) in enumerate([
    ((.71,.018,.085),.65),((.39,.012,.054),.34),((1,.047,.18),1.4),((.91,.26,.31),.85)
])]
light = material('Amber inlay', (1,.28,.038), .18, .32, 2)
flame = material('Candle glass', (1,.62,.17), .07, .29, 2.5)
velvet = material('Curtains', (.28,.014,.04), .04, .84)
carpet = material('Woven burgundy', (.16,.007,.019), 0, .93)


def poly(points, faces, mat, smooth=False):
    vertices, polygons = geometry[(mat, smooth)]
    start = len(vertices)
    vertices.extend((x, -z, y) for x,y,z in points)
    polygons.extend(tuple(start+i for i in face) for face in faces)


def block(x, y, z, w, h, d, mat, bevel=.05, yaw=0):
    a, b = w/2, d/2
    t = min(bevel, a*.65, b*.65, h*.24)
    if t <= 0:
        t = .0001
    octagon = [(-a+t,-b), (a-t,-b),(a,-b+t),(a,b-t),(a-t,b),(-a+t,b),(-a,b-t),(-a,-b+t)]
    points = []
    for height, factor in [(-h/2, .93),(-h/2+t, 1),(h/2-t, 1),(h/2, .93)]:
        for dx,dz in octagon:
            points.append((x+factor*(dx*cos(yaw)+dz*sin(yaw)), y+height, z+factor*(dz*cos(yaw)-dx*sin(yaw))))
    faces = [tuple(range(8)), tuple(reversed(range(24,32)))]
    for j in range(3):
        for i in range(8):
            a0, a1 = j*8+i, j*8+(i+1)%8
            faces.append((a0, a0+8, a1+8, a1))
    poly(points, faces, mat)


def lathe(x, y, z, profile, mat, n=24, smooth=True):
    points = [(x + r*cos(2*pi*i/n), y+h, z+r*sin(2*pi*i/n)) for r,h in profile for i in range(n)]
    faces = [(j*n+i,(j+1)*n+i,(j+1)*n+(i+1)%n,j*n+(i+1)%n)
             for j in range(len(profile)-1) for i in range(n)]
    poly(points, faces, mat, smooth)


def oval(x, y, z, w, h, d, mat, n=12, rows=8, rotation=0, smooth=True):
    points = []
    for j in range(rows+1):
        a = pi*j/rows
        for i in range(n):
            angle = 2*pi*i/n
            px, py = w*sin(a)*cos(angle), h*cos(a)
            points.append((x+px*cos(rotation)-py*sin(rotation), y+px*sin(rotation)+py*cos(rotation), z+d*sin(a)*sin(angle)))
    poly(points, [(j*n+i,j*n+(i+1)%n,(j+1)*n+(i+1)%n,(j+1)*n+i)
                  for j in range(rows) for i in range(n)], mat, smooth)


def tube(path, radius, mat, n=8):
    points = []
    for i, point in enumerate(map(Vector,path)):
        tangent = Vector(path[min(i+1,len(path)-1)]) - Vector(path[max(i-1,0)])
        tangent.normalize()
        up = Vector((0,0,1)) if abs(tangent.z)<.95 else Vector((0,1,0))
        side = tangent.cross(up).normalized()
        up = side.cross(tangent).normalized()
        r = radius[i] if isinstance(radius, list) else radius
        points.extend(point + r*(cos(2*pi*j/n)*side+sin(2*pi*j/n)*up) for j in range(n))
    faces = [(i*n+j,i*n+(j+1)%n,(i+1)*n+(j+1)%n,(i+1)*n+j)
             for i in range(len(path)-1) for j in range(n)]
    faces.extend((tuple(reversed(range(n))), tuple(range(len(points)-n,len(points)))))
    poly(points, [tuple(reversed(face)) for face in faces], mat, True)


def ring(x,y,z,r,thickness,mat, vertical=False):
    tube([(x+r*cos(i*pi/20),y+(r*sin(i*pi/20) if vertical else 0),
           z+(0 if vertical else r*sin(i*pi/20))) for i in range(41)], thickness, mat)


def save(name):
    collection = bpy.data.collections.new(name)
    bpy.context.scene.collection.children.link(collection)
    for (mat, smooth), (vertices, faces) in geometry.items():
        mesh = bpy.data.meshes.new(name + ' · ' + mat.name)
        mesh.from_pydata(vertices, [], faces)
        mesh.update()
        mesh.materials.append(mat)
        for face in mesh.polygons:
            face.use_smooth = smooth
        obj = bpy.data.objects.new(mesh.name, mesh)
        collection.objects.link(obj)
        obj.select_set(True)
    export = bpy.ops.export_scene.gltf
    compression = {'export_meshopt_compression_enable': True} if (
        'export_meshopt_compression_enable' in export.get_rna_type().properties
    ) else {}
    export(filepath=str(OUT / (name + '.glb')), use_selection=True, export_format='GLB',
           export_animations=False, **compression)
    bpy.ops.object.select_all(action='DESELECT')
    geometry.clear()
    scenes[name] = collection


def arch(x,z,spread=3.5,spring=3.4,thick=.92,depth=1.05, dressed=False):
    inner = spread-thick/2
    outer = spread+thick/2
    for s in [-1,1]:
        px = x+s*spread
        block(px,.18,z,thick*1.24,.36,depth*1.18,stone[1])
        for j in range(5):
            block(px,.37+(j+.5)*(spring-.37)/5,z,thick*(1+.11*sin(j*2)),(spring-.39)/5,depth,rng.choice(stone),.12)
        block(px,spring-.06,z,thick*1.25,.2,depth*1.16,gold)
    n = 17
    for j in range(n):
        a0, a1 = (j+.03)*pi/n, (j+.97)*pi/n
        a = (a0+a1)/2
        rad = outer+(.28 if j==n//2 else rng.uniform(-.03,.1))
        points = [(x+r*cos(aa),spring+r*sin(aa),z+dz)
                  for dz in [-depth/2,depth/2] for r,aa in [(inner,a0),(rad,a0),(rad+.01,a),(rad,a1),(inner,a1)]]
        poly(points,[(4,3,2,1,0),(5,6,7,8,9),(1,6,5,0),(2,7,6,1),(3,8,7,2),(4,9,8,3),(0,5,9,4)],
             gold if j==n//2 else rng.choice(marble if dressed else stone))
    for offset, mat in [(0,light),(.14,gold)]:
        r = inner+offset
        tube([(x-r,.18,z+depth*.52)]+[(x-r*cos(i*pi/32),spring+r*sin(i*pi/32),z+depth*.52)
             for i in range(33)]+[(x+r,.18,z+depth*.52)],.035 if offset==0 else .065,mat)


def masonry(x,z,length,height, axis='x', refined=False):
    palette = marble if refined else stone
    block(x,height*.5,z,length if axis=='x' else .95,height,.95 if axis=='x' else length,palette[0])
    rows = round(height/(.68 if refined else 1.1))
    for j in range(rows):
        h = height/rows
        left = -length/2
        while left < length/2-.03:
            w = min(rng.uniform(1.1,2.1) if refined else rng.uniform(1.6,3.45),length/2-left)
            if w > .09:
                p = left+w/2
                dy = rng.uniform(-.06,.06) if not refined else 0
                y = (j+.5)*h+dy
                thickness = rng.uniform(1.03,1.2)
                block(x+(p if axis=='x' else 0),y,z+(0 if axis=='x' else p),
                      w-.055 if axis=='x' else thickness,h-.06,thickness if axis=='x' else w-.055,
                      rng.choice(palette),.09)
            left += w


def tile_floor(x0,x1,z0,z1,museum=False):
    palette = marble if museum else paving
    step = 2 if museum else 1.65
    nx, nz = round((x1-x0)/step),round((z1-z0)/step)
    w, d = (x1-x0)/nx,(z1-z0)/nz
    for i in range(nx):
        for j in range(nz):
            x, z = x0+(i+.5)*w,z0+(j+.5)*d
            block(x,-.092,z,w-.035,.18,d-.04,rng.choice(palette),.025)
            if museum and rng.random()<.26:
                tube([(x-w*.48,.002,z-d*.33),(x-w*.17,.002,z-d*.08),(x+w*.05,.002,z-d*.14),
                      (x+w*.42,.002,z+d*.43)],.011,marble[2],4)


def crystal(x,y,z,scale=1,hanging=False):
    sign = -1 if hanging else 1
    for j in range(5):
        angle = j*2.4
        height = (1.15 if j==0 else rng.uniform(.43,.86))*scale
        r = (0.24 if j==0 else .16)*scale
        dx, dz = cos(angle)*height*.38, sin(angle)*height*.38
        shift_x, shift_z = (0,0) if j==0 else (cos(angle)*scale*.21,sin(angle)*scale*.21)
        points = []
        for fraction, radius in [(0,r*.57),(.15,r),(0.73,r*.76)]:
            points.extend((x+shift_x+dx*fraction+radius*cos(i*pi/3),y+sign*height*fraction,
                           z+shift_z+dz*fraction+radius*sin(i*pi/3)) for i in range(6))
        points.append((x+shift_x+dx,y+sign*height,z+shift_z+dz))
        for i in range(6):
            for j in range(2):
                k, n = i+j*6, (i+1)%6+j*6
                poly(points,[(k,k+6,n+6,n) if sign>0 else (n,n+6,k+6,k)],ruby[i%4])
            poly(points,[(12+i,18,12+(i+1)%6) if sign>0 else (12+(i+1)%6,18,12+i)],ruby[(i+2)%4])


def planter(x,z,s=1):
    lathe(x,0,z,[(.0,.01),(.48*s,.01),(.55*s,.12*s),(.68*s,.44*s),(.7*s,.52*s),(.58*s,.52*s),(.0,.49*s)],bronze_dark,12)
    for i in range(10):
        a = i*2.399
        end = (x+cos(a)*s*rng.uniform(.3,.62),s*rng.uniform(.58,1.2),z+sin(a)*s*rng.uniform(.3,.62))
        start=(x,.37*s,z)
        tube([start,end],.018*s,leaf[0],5)
        oval(*end,.14*s,.21*s,.13*s,leaf[i%3],8,4,cos(a)*.88)
        if i%3==0:
            for j in range(5):
                b=2*pi*j/5
                oval(end[0]+.07*s*cos(b),end[1]+.15*s,end[2]+.07*s*sin(b),.072*s,.043*s,.072*s,floral,7,4)


def lantern(x,y,z,scale=1):
    def h(v): return y+v*scale
    lathe(x,y,z,[(0,0),(.25*scale,0),(.28*scale,.08*scale),(.21*scale,.15*scale)],gold,6)
    lathe(x,y,z,[(.19*scale,.11*scale),(.24*scale,.63*scale),(.14*scale,.68*scale)],flame,6)
    lathe(x,y,z,[(.28*scale,.63*scale),(.31*scale,.72*scale),(.09*scale,.93*scale),(0,.98*scale)],gold,6)
    for i in range(6):
        a=i*pi/3
        tube([(x+.205*scale*cos(a),h(.10),z+.205*scale*sin(a)),
              (x+.251*scale*cos(a),h(.67),z+.251*scale*sin(a))],.023*scale,bronze_dark,5)


def column(x,z,height=9.8):
    block(x,.17,z,1.55,.34,1.55,marble[3])
    lathe(x,0,z,[(.72,.31),(.69,.49),(.56,.55),(.54,height-.65),(.65,height-.52),(.74,height-.26)],marble[1])
    for y,r in [(.49,.68),(.71,.59),(height-.7,.59),(height-.33,.73)]:
        ring(x,y,z,r,.047,gold)
    for i in range(12):
        a=i*pi/6
        tube([(x+.54*cos(a),.68,z+.54*sin(a)),(x+.54*cos(a),height-.72,z+.54*sin(a))],.031,bronze_dark,6)
    block(x,height-.12,z,1.48,.24,1.48,marble[3])


def curtain(x,z,width,height,bottom):
    for i in range(36):
        px=x-width/2+width*(i+.5)/36
        offset=.12*cos(i*pi*.64)
        block(px,bottom+height/2,z+offset,width/35,height,.3,velvet,.028)
    tube([(x-width/2,bottom+height,z),(x+width/2,bottom+height,z)],.10,gold)


def bird():
    # Original heraldic relief. Swept feathers and a botanical branch are separate solids.
    oval(-.18,1.05,0,.41,.67,.22,gold,18,12,-.55)
    tube([(.1,1.03,0),(.36,1.46,0),(.31,1.86,0),(.56,2.16,0),(.78,2.12,0)],
         [.27,.21,.14,.17,.1],gold,14)
    oval(.77,2.15,0,.23,.18,.15,gold)
    tube([(.85,2.15,0),(1.14,2.1,0),(1.24,2.04,0)],[.1,.07,.01],gold)
    oval(.82,2.18,.139,.045,.042,.018,black)
    for i in range(7):
        tube([(-.2,1.08,.08+i*.015),(-.42-i*.11,1.34+i*.08,.12),
              (-.76-i*.095,1.75+i*.13,.07),(-.85-i*.073,1.92+i*.18,.02)],
             [.14,.13,.09,.013],gold if i%2 else bronze,9)
    for i in range(4):
        tube([(-.3,.83,-.035*i),(-.77,.72-i*.075,.025*i),(-1.28-i*.12,.78-i*.10,0)],
             [.13,.09,.012],gold,8)
    for dx in [-.24,.17]:
        tube([(dx,.64,0),(dx-.08,.34,0),(dx+.13,.06,0)],.057,gold)
        for j in range(3):
            tube([(dx+.11,.07,0),(dx+.34,.04,(j-1)*.11)],.037,gold,7)
    tube([(1.0,2.11,.015),(1.16,1.92,.015),(1.39,1.77,.015),(1.60,1.78,.015)],.033,bronze)
    for i in range(5):
        oval(1.18+i*.1,1.83+i*.024,.022,.12,.041,.031,gold,9,5,(-1)**i*.55)


def sofa(body, piping):
    block(0,.31,0,3.54,.47,1.05,body,.16)
    block(0,.9,-.41,3.52,.99,.31,body,.12)
    for s in [-1,1]:
        block(s*1.6,.68,.035,.35,.59,1.0,body,.13)
        tube([(s*1.61,.94,-.31),(s*1.61,.96,.32),(s*1.61,.88,.49)],.035,piping)
        for z in [-.35,.38]:
            lathe(s*1.43,0,z,[(.1,.0),(.1,.09),(.075,.15)],gold,9)
    for x in [-.99,0,.99]:
        block(x,.47,.105,.97,.20,.75,body,.09)
        oval(x,1.00,-.248,.49,.42,.145,body,16,10)
        for dx in [-.26,0,.26]:
            for y in [.86,1.1]:
                oval(x+dx,y,-.118,.025,.026,.024,piping,9,6)
        tube([(x-.44,.48,.465),(x,.49,.491),(x+.44,.48,.465)],.022,piping)
    for x,angle in [(-1.15,.35),(1.14,-.37)]:
        oval(x,.73,-.11,.29,.32,.15,piping,14,8,angle)
    tube([(-1.43,1.4,-.39),(0,1.43,-.43),(1.43,1.4,-.39)],.029,piping)


def person(style=0, raised=False):
    # A stylized bronze portrait or standing sculpture with individually shaped features.
    floor=1.36 if raised else 0
    if raised:
        for x in [-.27,.27]:
            tube([(x,.19,.0),(x,.78,-.03),(x*.75,1.45,0)],[.17,.155,.18],bronze,13)
            oval(x,.115,.13,.183,.12,.29,bronze_dark,15,9)
    oval(0,floor+.48,0,.59,.68,.30,bronze,20,12)
    block(0,floor+.12,.025,1,.32,.61,bronze,.1)
    for side in [-1,1]:
        tube([(side*.31,floor+.90,.16),(side*.27,floor+.69,.283),(side*.13,floor+.30,.304)],
             [.069,.085,.016],bronze_dark,8)
    tube([(0,floor+.81,.296),(0,floor+.51,.328),(0,floor+.37,.318)],[.086,.053,.032],bronze_dark)
    for y in [.25,.38,.51]:
        oval(.11,floor+y,.30,.033,.032,.029,bronze_dark)
    neck = floor+1.02
    lathe(0,neck-.16,0,[(.19,0),(.16,.27)],bronze,15)
    skull = .31+(.017*(style%3))
    oval(0,neck+.32,.02,skull,.43,.294,bronze,20,14)
    oval(0,neck+.11,.115,.25,.195,.205,bronze,16,10)
    for s in [-1,1]:
        oval(s*skull,neck+.25,.01,.077,.124,.075,bronze,13,7)
        oval(s*.124,neck+.335,.282,.077,.038,.035,bronze_dark,12,8)
        tube([(s*.048,neck+.39,.285),(s*.13,neck+.41,.302),(s*.22,neck+.38,.269)],.025,bronze_dark)
    oval(0,neck+.235,.323,.077,.10,.089,bronze,14,9)
    tube([(-.112,neck+.123,.292),(0,neck+.117,.329),(.109,neck+.12,.292)],.025,bronze_dark)
    if style not in (8,):
        oval(-.024,neck+.596,-.031,skull*.97,.19 if style%3 else .135,.268,bronze_dark,18,10,.15)
        for i in range(6):
            px=-.19+i*.067
            tube([(px,neck+.62,.15),(px+.06,neck+.707,.01),(px+.048,neck+.66,-.14)],.015,bronze)
    if style in (5,7):
        oval(0,neck+.075,.258,.231,.145,.107,bronze_dark,16,9)
    if style==7:
        for x in [-.13,.13]:
            ring(x,neck+.339,.321,.087,.017,bronze_dark,True)
    if raised:
        tube([(-.47,2.15,0),(-.89,2.4,.05),(-1.16,2.83,.07),(-.98,3.21,.075)],
             [.205,.172,.142,.129],bronze,15)
        oval(-.99,3.35,.087,.154,.186,.127,bronze,16,10,.31)
        for i in range(3):
            tube([(-1.10+i*.07,3.38,.187),(-1.08+i*.07,3.48,.174)],.025,bronze_dark)
        tube([(.47,2.09,.0),(.62,1.62,-.03),(.48,1.22,.2)],[.19,.145,.112],bronze,15)
        oval(.46,1.13,.21,.125,.182,.12,bronze,15,8,.21)
        for side in [-1,1]:
            for i in range(3):
                tube([(side*(.28+i*.075),2.14,.257),(side*(.26+i*.08),1.78,.308),(side*(.21+i*.085),1.55,.269)],.024,bronze_dark)


def cup(style):
    bases = [(.5,.04),(.52,.08),(.50,.19),(.36,.24),(.33,.27)]
    lathe(0,0,0,bases,black,20)
    profiles = [
        [(.27,.25),(.25,.38),(.18,.5),(.30,.67),(.45,.82),(.55,1.22),(.55,1.41),(.51,1.42),(.49,1.22),(.3,.7),(.1,.51)],
        [(.29,.25),(.33,.35),(.30,.43),(.42,.63),(.55,.97),(.65,1.55),(.61,1.56),(.52,1.12),(.39,.71),(.08,.47)],
        [(.31,.25),(.31,.33),(.16,.48),(.16,.63),(.30,.73),(.45,.87),(.47,1.06),(.37,1.24),(.31,1.34)],
        [(.32,.25),(.30,.34),(.19,.51),(.28,.68),(.48,.79),(.59,.99),(.61,1.24),(.56,1.24),(.50,1.0),(.28,.72)],
        [(.36,.25),(.32,.42),(.31,.62),(.39,.93),(.54,1.27),(.65,1.56),(.61,1.57),(.49,1.27),(.29,.71)],
        [(.31,.25),(.23,.37),(.15,.66),(.23,.91),(.40,1.19),(.46,1.41),(.41,1.43),(.36,1.24),(.13,.91)],
        [(.31,.25),(.30,.35),(.24,.48),(.17,.59),(.10,.79),(.13,1.01),(.34,1.38),(.37,1.48),(.18,1.32)],
        [(.30,.25),(.28,.35),(.18,.54)],
    ]
    mat = gold if style in (0,6,7) else silver
    lathe(0,0,0,profiles[style],mat,12 if style==4 else 32,style!=4)
    if style in (0,1,2,3):
        high = [1.42,1.97,1.33,1.32][style]
        for s in [-1,1]:
            tube([(s*.42,.87,0),(s*.67,.90,0),(s*.84,1.13,0),(s*.84,high-.08,0),
                  (s*.72,high,0),(s*.58,high-.10,0),(s*.54,high-.21,0)],.062 if style!=1 else .072,mat,10)
            if style in (0,2):
                tube([(s*.64,1.27,.035),(s*.76,1.02,.08),(s*.78,.83,.13),(s*.83,.61,.12)],
                     [.056,.081,.074,.065],red_light)
    if style==0:
        lathe(0,0,0,[(.49,1.44),(.44,1.51),(.38,1.58),(.14,1.63),(.08,1.74),(0,1.79)],gold)
        for j in range(5):
            a=2*pi*j/5
            tube([(.39*cos(a),1.58,.39*sin(a)),(.36*cos(a),1.79,.36*sin(a)),(.16*cos(a),1.66,.16*sin(a))],
                 [.043,.037,.035],gold)
    if style==2:
        lathe(0,0,0,[(.33,1.33),(.36,1.38),(.25,1.49),(.09,1.55),(.045,1.67),(0,1.74)],silver)
        oval(0,1.65,0,.08,.086,.08,silver)
    if style==4:
        for j in range(12):
            a = j*pi/6
            tube([(r*cos(a),y,r*sin(a)) for r,y in profiles[style][:-3]],.024,bronze_dark,6)
    if style==5:
        for j in [-1,1]:
            tube([(j*.19,.42,0),(j*.35,.73,0),(j*.49,1.12,0),(j*.38,1.38,0)],.035,silver)
    if style==6:
        oval(0,1.46,0,.285,.277,.285,gold,20,12)
        for a in [0,pi*2/3,pi*4/3]:
            tube([(r*cos(a),y,r*sin(a)) for r,y in [(.18,.38),(.29,.67),(.15,.92),(.41,1.40),(.31,1.59)]],
                 [.07,.07,.056,.06,.02],silver)
    if style==7:
        oval(0,1.03,.03,.73,.73,.14,silver,28,16)
        ring(0,1.03,.156,.58,.04,gold,True)
        oval(0,1.03,.179,.24,.24,.075,bronze,18,12)


def banner():
    width, height = 1.8, 3.5
    columns = 20
    for i in range(columns):
        x0, x1 = width*(i/columns-.5),width*((i+1)/columns-.5)
        def edge(x):
            return -height+abs(x)*.55
        def wave(x):
            return .085*sin(x*10)
        poly([(x0,0,wave(x0)),(x0,edge(x0),wave(x0)),(x1,edge(x1),wave(x1)),(x1,0,wave(x1))],
             [(0,1,2,3),(3,2,1,0)],red)
    for s in [-1,1]:
        tube([(s*.89,0,wave(s*.89)),(s*.89,edge(s*.89),wave(s*.89)),(0,-height,0)],.044,gold)
    tube([(-1.11,.06,0),(1.11,.06,0)],.065,gold,12)
    for s in [-1,1]:
        oval(s*1.13,.06,0,.095,.092,.092,gold)


def pedestal(x,z,w,d,height):
    block(x,.13,z,w,.26,d,marble[3],.09)
    block(x,height*.49,z,w-.21,height*.74,d-.21,stone[1],.12)
    block(x,height-.16,z,w+.02,.22,d+.02,marble[1],.09)
    block(x,height-.038,z,w+.08,.08,d+.08,gold,.03)
    for side in [-1,1]:
        block(x+side*(w/2-.26),height*.5,z+d/2-.03,.08,height*.52,.07,light,.01)


def outcrop(x,z,height,scale=1):
    for i in range(3):
        oval(x+rng.uniform(-.36,.36),height*.48+rng.uniform(-.24,.24),z+rng.uniform(-1,1),
             rng.uniform(.5,1.25)*scale,height*.64,rng.uniform(.6,1.6)*scale,
             rng.choice(stone),rng.randrange(6,9),4,rng.uniform(-.19,.19),False)


def vault(width,z0,z1,height,museum=False):
    spring=7.4 if museum else 5.1
    for side in [-1,1]:
        for j in range(6):
            a0,a1=j*pi/12,(j+1)*pi/12
            for k in range(14):
                depth=(z1-z0)/14
                z=z0+k*depth
                x0,x1=side*width*cos(a0),side*width*cos(a1)
                y0,y1=spring+height*sin(a0),spring+height*sin(a1)
                px=side*.12*cos(k*12.9+j)
                py=.16*cos(k*21.3+j)
                points=[(x0,y0,z-.04),(x1,y1,z-.04),(x1,y1,z+depth+.04),(x0,y0,z+depth+.04),
                        ((x0+x1)/2+px,(y0+y1)/2+py,z+depth*.5)]
                faces=[(i,(i+1)%4,4) for i in range(4)]
                if side>0:
                    faces=[tuple(reversed(face)) for face in faces]
                poly(points,faces,velvet if museum else rng.choice(stone[:5]))
    # End caps meet the masonry above both thresholds, where the vault rises
    # above the top of the straight wall.
    for z in [z0, z1]:
        for i in range(32):
            a,b = i*pi/32,(i+1)*pi/32
            x0,x1 = width*cos(a),width*cos(b)
            y0,y1 = spring+height*sin(a),spring+height*sin(b)
            points = [(x0,spring-.12,z),(x1,spring-.12,z),(x1,y1,z),(x0,y0,z)]
            poly(points,[(0,1,2,3),(3,2,1,0)],marble[3] if museum else rng.choice(stone[:4]))
    if museum:
        for z in [-17,-6,4,14]:
            for dz in [-.18,.18]:
                tube([(width*cos(i*pi/48),spring+height*sin(i*pi/48),z+dz) for i in range(49)],
                     .12,gold,8)
    else:
        for j in range(28):
            a=rng.uniform(.3,2.85)
            crystal(width*cos(a),spring+height*sin(a)-.20,rng.uniform(z0+2,z1-2),rng.uniform(.7,2.65),True)


def cave():
    tile_floor(-20.4,20.4,-14.1,19.5)
    tile_floor(8.4,15.6,-28.5,-14.1)
    for x in [-20.15,20.15]:
        masonry(x,2.4,33.4,9,'z')
        for z in [-12,-8,-3,2,7,12,16]:
            outcrop(x+(-.1 if x<0 else .1),z,rng.uniform(3.8,8.5))
    masonry(-5.35,-13.8,29.3,11)
    masonry(17.35,-13.8,5.3,11)
    for x in [8.9,15.1]:
        masonry(x,-21.1,13.8,7.5,'z')
    masonry(12,-28.2,6.8,7.5)
    block(12,8.72,-13.8,5.45,4.55,1.02,stone[1],.17)
    for i in range(5):
        block(12,6.55+i*.81,-13.25,5.55,.74,.55,stone[i],.19)
    block(12,6.88,-21.15,6.7,.44,14.1,stone[0],.16)
    masonry(-18.1,-10,7.1,5,'z')
    masonry(-7.9,-10,7.1,5,'z')
    masonry(4.2,15.8,9,8.5)
    masonry(18.6,15.8,2.8,8.5)
    masonry(-10.5,19.25,20,8)
    vault(20.1,-13.9,19.4,8.3)
    for x,z,h in [(-18.9,-11,9.5),(-17.6,-12.9,10.8),(-7.8,-12.8,9.1),
                  (-6.7,-13.1,8.3),(7.3,-13,9.4),(17.8,-13,9.6),(19.4,-9.3,11.2)]:
        outcrop(x,z,h,.78)
    for x,z,scale in [(-7.1,-12,2.45),(6.75,-11.9,2.55),(-17.15,9.9,2.35),
                      (-17.45,-6.7,2.35),(18.7,12,2.2),(9.4,12.6,1.6)]:
        crystal(x,.012,z,scale)
    lathe(0,0,4.7,[(0,.012),(3.61,.012),(3.68,.022),(3.69,.038),(3.51,.042),(0,.042)],red,64)
    for r in [3.28,3.57]:
        ring(0,.048,4.7,r,.043,gold)
    for i in range(12):
        a = pi*i/6
        x,z = 3.42*cos(a),4.7+3.42*sin(a)
        block(x,.05,z,.13,.024,.13,gold,.02,a)
    for s in [-1,1]:
        for i in range(5):
            a = i*.23
            x,z=s*(2.3+.48*cos(a)),4.7+(.2+i*.38)
            oval(x,.052,z,.17,.02,.34,gold,9,4,s*a)

    arch(-13,-6.2,3.5,2.72,1.02)
    arch(-13,10.3,3.65,2.6,1.02)
    arch(13,15.8,3.75,3.25,1.02)
    arch(12,-13.5,3.0,3.25,1.04)
    for z in [-16.8,-20.4,-24,-26.9]:
        arch(12,z,2.7,3.05,.53,.58)
        lantern(12,5.1,z+.17,.7)
        for x in [9.45,14.55]:
            tube([(x,.021,z-1.8),(x,.021,z+1.8)],.04,light)
    for i in range(5):
        height=(i+1)*.16
        z=-4.25-i*.5
        block(0,height/2,z,7.6,height,.5,marble[i],.026)
        block(0,height+.004,z+.19,7.45,.018,.045,light,.008)
    block(0,.4,-9.25,7.6,.8,5.5,marble[1],.05)
    for side in [-1,1]:
        block(side*4.06,.23,-8,.48,.46,8.1,marble[3])
        tube([(side*4.06,.49,-4),(side*4.06,.49,-12)],.055,light)
    pedestal(0,-11,4.18,1.54,1.56)
    for x in [-17.9,17.8]:
        for z in [-12,-5,.2,9,13]:
            crystal(x,.0,z,rng.uniform(1.25,2.15))
            planter(x+(.8 if x<0 else -.8),z+.9,.88)
    for x,z in [(-7,-5),(6.9,-5),(-9.7,10.7),(-16.7,10.8),(-16.9,-6.0),(-9.2,-6.0),(8.9,14.9),(17.2,15.4)]:
        pedestal(x,z,.58,.58,.8)
        lantern(x,.85,z,1.2)
    for side in [-1,1]:
        tube([(side*4.2,.024,14),(side*4.2,.024,2),(side*3.55,.024,-3.9)],.043,light)
    tube([(4.25,.024,.2),(11.6,.024,-6.9),(12,.024,-13.5)],.044,light)
    tube([(4.3,.024,8),(9.5,.024,9.5),(13,.024,13.3),(13,.024,15.9)],.046,light)
    for x in [-19.25,-7.4]:
        for z in [-4,2,11]:
            lantern(x,2.5,z)


def museum():
    tile_floor(-23.4,23.4,-23.4,22.4,True)
    for x in [-22.9,22.9]:
        masonry(x,-.5,46,10,'z',True)
        for z in [-18.6,-10,-.5,9.5,17.5]:
            block(x+(.53 if x<0 else -.53),4.7,z,.17,7.5,6.6,velvet,.065)
        for z in [-17,-6,4,14]:
            column(x+ (1.3 if x<0 else -1.3),z)
            lantern(x+ (2.08 if x<0 else -2.08),3.4,z+.8,1.16)
    masonry(0,-23,46,11,'x',True)
    for x in [-13.4,13.4]:
        masonry(x,20.2,19,10,'x',True)
    arch(0,20.2,3.3,3.7,1,1.1,True)
    vault(22.8,-23,21.6,7,True)
    curtain(0,-15.9,36,4.4,4.6)
    # Raised fabric weave and inlaid flooring remain below the character capsule.
    block(0,.02,9.6,8,.037,19.9,carpet,.022)
    for x in [-3.92,-3.77,3.77,3.92]:
        tube([(x,.052,-.32),(x,.052,19.4)],.032,gold)
    for z in [6.8,13.9]:
        for x in [-2.12,2.12]:
            ring(x,.052,z,1.2,.021,bronze)
            ring(x,.052,z,1.13,.014,gold)
            for i in range(8):
                a=i*pi/4
                block(x+1.02*cos(a),.051,z+1.02*sin(a),.075,.015,.075,gold,.012,a)
    for x in [-5,-4.5,4.5,5]:
        tube([(x,.016,19.1),(x,.016,-1.8)],.022,bronze)
    for z in [13,4.2,-6.5,-17.4]:
        for r,h in [(1.25,8.2),(1.02,8.38),(.63,8.91)]:
            ring(0,h,z,r,.074,gold)
        for i in range(10):
            a=i*pi/5
            x,d=1.25*cos(a),z+1.25*sin(a)
            lantern(x,8.18,d,.57)
            tube([(x,8.25,d),(.88*x,8.35,z+(d-z)*.88),(0,9.4,z)],.046,gold,6)
        tube([(0,9.3,z),(0,14,z)],.062,bronze_dark)
        lathe(0,7.65,z,[(0,0),(.14,.17),(.25,.43),(.30,.61)],gold)
    for x,z in [(-14,0),(-18.8,-4),(14.1,.8),(20.2,-4.9),(-18,17),(18,17),(-20,-19),(20,-19)]:
        planter(x,z,.9)
    pedestal(-15,-3.8,3.3,2.8,1.07)
    for x in [-18,-12]:
        lantern(x,.06,-2,1.12)
    pedestal(16.7,-3.5,5.9,2.4,.73)
    block(16.7,2.8,-4.43,5.65,4.35,.34,black,.12)
    for x in [14.05,19.35]:
        block(x,2.74,-4.20,.064,4.12,.085,light)
    for x in [-11.3,11.3]:
        pedestal(x,-8.4,1.1,1.1,.8)
        lantern(x,.84,-8.4,1.22)
    for x in [-19.7,19.7]:
        for z in [18.1,-9.8]:
            lantern(x,0,z,1.45)


def tea_table():
    lathe(0,0,0,[(.32,0),(.31,.12),(.21,.23),(.21,.53),(.36,.58)],wood)
    block(0,.59,0,1.78,.18,.94,wood,.11)
    for x,z in [(-.49,.16),(.26,-.13),(.55,.19)]:
        lathe(x,.68,z,[(.08,0),(.075,.035),(.10,.23),(.084,.23),(.07,.08)],ivory,12)
        lathe(x,.68,z,[(0,.175),(.086,.175)],wood,12)
    block(-.13,.701,.02,.35,.035,.27,red_light,.02,.21)


def shirt():
    points = [(-.34,1.45),(-.7,1.37),(-.99,1.09),(-.81,.77),(-.55,.87),(-.53,.10),
              (.53,.1),(.55,.87),(.81,.77),(.99,1.09),(.7,1.37),(.34,1.45),
              (.23,1.30),(0,1.22),(-.23,1.30)]
    v = [(x,y,z) for z in [-.08,.08] for x,y in points]
    n=len(points)
    poly(v,[tuple(range(n)),tuple(reversed(range(n,2*n)))]+
         [(i,i+n,(i+1)%n+n,(i+1)%n) for i in range(n)],red)
    tube([(-.34,1.45,.086),(-.23,1.30,.09),(0,1.22,.096),(.23,1.30,.09),(.34,1.45,.086)],.029,ivory)
    for s in [-1,1]:
        tube([(s*.81,.78,.087),(s*.99,1.09,.087)],.034,ivory)
        tube([(s*.47,.13,.085),(s*.45,.93,.085)],.018,red_light)


cave()
save('cave')
if '--cave-only' in sys.argv:
    sys.exit(0)
museum()
save('museum')
bird()
save('bird')
banner()
save('banner')
sofa(wine,red_light)
save('sofa')
sofa(plum,plum_light)
save('sofa-plum')
tea_table()
save('table')
person(0, True)
save('shankly')
shirt()
save('shirt')
for i in range(10):
    person(i)
    save('coach-'+str(i))
for i, name in enumerate(['league','europe','fa','league-cup','uefa','super','world','shield']):
    cup(i)
    save('cup-'+name)

# Retain editable meshes and material sets in a single source file.
# Separate cave, museum and prop collections so either room can be inspected on its own.
for name, collection in scenes.items():
    if name != 'cave':
        collection.hide_viewport = True
        collection.hide_render = True
source = ROOT / 'assets/source/liverpool.blend'
bpy.context.preferences.filepaths.save_version = 0
bpy.ops.wm.save_as_mainfile(filepath=str(source), compress=True)
