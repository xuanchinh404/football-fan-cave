"""Export modular Red Devils Cave visuals. The game owns colliders and walkable bounds."""
import math
from pathlib import Path
from random import Random
import sys

import bpy

sys.path.insert(0, str(Path(__file__).resolve().parent))
from architecture import arch, lantern, lantern_palette
from geometry import Model
from materials import Palette

OUT = Path(__file__).resolve().parents[2] / "public/assets/3d/red-devils"
OUT.mkdir(parents=True, exist_ok=True)
rng = Random(2707)
p = Palette()
rock = [
    p.material("Wine basalt", "432637", texture="Ashlar"),
    p.material("Red-veined basalt", "67303C", texture="Ashlar"),
    p.material("Smoky slate", "382D40", texture="Ashlar"),
]
gold = p.material("Hammered gold", "CB843D", .34, .58)
red = p.material("Hot ruby", "EC1647", .28, .27, 1.5)
hot = p.material("Ruby facets", "FF4C68", .24, .17, 2.4)
ember = p.material("Gold ember trim", "FF972C", .4, .12, 2.6)
wood = p.material("Dark carved oak", "663322", .52)
leather = p.material("Burgundy upholstery", "741B3C", .43)
cushion = p.material("Crimson upholstery", "A0314B", .52)

def export(name, model):
    for obj in list(bpy.context.scene.objects):
        bpy.data.objects.remove(obj, do_unlink=True)
    model.build(name)
    bpy.ops.export_scene.gltf(filepath=str(OUT / f"{name}.glb"), export_format="GLB",
                              export_materials="EXPORT", export_cameras=False, export_lights=False)

# Basalt walls and an irregular canopy occupy the shell above head height.
vault = Model()
for side in (-1, 1):
    for i in range(17):
        y = -8 + 1.95 * i
        for row in range(3):
            vault.jewel(rock[(i + row) % 3],
                        (side * (20.3 - .25 * row), y + rng.uniform(-.3, .3), 2 + 3.6 * row),
                        (rng.uniform(1.1, 2.1), rng.uniform(1.45, 2.2), rng.uniform(2.5, 3.6)), rng)
for i in range(14):
    for y in (-7, 1, 10, 19, 23.5):
        x = -19.5 + i * 3
        height = 12 - abs(x) * .15
        vault.jewel(rock[(i + int(y)) % 3], (x, y, height),
                    (rng.uniform(1.6, 2.6), rng.uniform(3.5, 5.1), rng.uniform(1.0, 2.7)), rng)
for i in range(16):
    x = -17 + i * 2.3
    vault.jewel(rock[i % 3], (x, rng.choice((4, 13, 20)), 8.8 + rng.random()),
                (.45 + rng.random() * .55, .7, 1.3 + rng.random() * 1.4), rng, sides=5)
for y in (-8.75, 23.85):
    for i in range(15):
        x = -19.2 + i * 2.75
        for z in (2.6, 7, 11.4):
            vault.jewel(rock[i % 3], (x, y, z), (2.25, .9, 3), rng)
export("vault", vault)

# Walkable face is flush with the existing Rapier ground. Edges reveal mortar.
floor = Model()
slate = [p.material(f"Paving {i}", color, .83, texture="Ashlar")
         for i, color in enumerate(("57404E", "68434C", "734C53", "503846"))]
left, right, front, back = -19.6, 19.9, -8.625, 23.5
for row in range(25):
    y = front + (row + .5) * (back - front) / 25
    for col in range(32):
        x = left + (col + .5) * (right - left) / 32
        floor.block(rng.choice(slate), x, y, -.04, 1.216, 1.262, .1, .025)
export("floor", floor)

door = Model()
for side in (-1, 1):
    for i in range(6):
        door.block(rock[i % 3], side * 2.36, 0, .305 + i * .61, .72, 1.12, .60, .09)
    door.block(gold, side * 2.36, -.03, .17, .9, 1.2, .31, .04)
    door.line(ember, [(side * 2.055, -.58, .36), (side * 2.055, -.58, 3.63)], [.026, .026])
arch(door, rock, 2.03, 3.65, 1.56, .67, -.56, .56, n=16, gap=.065)
arch(door, [ember], 2.03, 3.65, 1.56, .04, -.585, -.56, n=16)
export("arch", door)

ruby = Model()
for i, (x, y, h) in enumerate(((-.42, .04, .83), (-.2, -.16, 1.22), (0, .02, 1.8),
                                (.29, .08, 1.08), (.46, -.18, .73))):
    radius = .18 + h * .10
    offset = x * .56
    loops = [[(x + offset*t + radius*s*math.cos(j*math.tau/6),
               y + radius*s*math.sin(j*math.tau/6), h*t) for j in range(6)]
             for t, s in ((0, .7), (.26, 1), (.76, .75), (1, .04))]
    ruby.rings(hot if i in (1, 3) else red, loops)
ruby.jewel(rock[1], (0, 0, .15), (.72, .51, .25), rng)
export("ruby", ruby)

sofa = Model()
sofa.block(wood, 0, 0, .22, 4, 1.4, .37, .15)
sofa.block(leather, 0, .52, .84, 4, .42, 1.38, .18)
for side in (-1, 1):
    sofa.block(leather, side * 1.77, 0, .64, .44, 1.48, .91, .19)
    for y in (-.52, .52):
        sofa.block(gold, side * 1.61, y, .13, .16, .16, .22, .03)
for i in (-1, 0, 1):
    sofa.block(cushion, i * 1.04, -.05, .56, 1, 1.02, .27, .14)
    sofa.block(cushion, i * 1.04, .27, 1.03, 1, .29, .65, .14)
    for x in (i * 1.04 - .2, i * 1.04 + .2):
        sofa.jewel(leather, (x, .11, 1.04), (.043, .035, .043), rng, sides=5)
export("sofa", sofa)

table = Model()
table.lathe(wood, 0, 0, [(.39, .03), (.4, .1), (.15, .2), (.14, .5), (.53, .56),
                         (.62, .59), (.62, .68), (.57, .71)], n=24)
table.lathe(gold, 0, 0, [(.619, .615), (.626, .63), (.624, .646)], n=24)
export("coffee-table", table)

plant = Model()
terracotta = p.material("Terracotta planter", "8E3A38", .75)
foliage = [p.material("Broad cave foliage", "3D7746", .62),
           p.material("Young foliage", "85A745", .55)]
plant.lathe(terracotta, 0, 0, [(.25, 0), (.26, .06), (.37, .47), (.38, .55)], n=12)
plant.lathe(gold, 0, 0, [(.379, .49), (.39, .52), (.38, .54)], n=12)
plant.lathe(wood, 0, 0, [(.355, .535), (.355, .545)], n=12)
for i in range(11):
    a = i * 2.399
    r, h = rng.uniform(.32, .68), rng.uniform(.86, 1.44)
    x, y = math.cos(a), math.sin(a)
    stem = (x*.24, y*.24, .74)
    plant.line(foliage[i % 2], [(0, 0, .5), stem, (x*r, y*r, h)], [.019, .014, .006], n=5)
    plant.rings(foliage[i % 2], [[(x*d-y*w, y*d+x*w, z) for w in (-width, 0, width)]
                for d, z, width in ((.12,.68,.02), (r*.68,h-.1,.16), (r,h,.012))], cap=False)
export("plant", plant)

plinth = Model()
for z, w, d, h in ((.12, 4.5, 1.92, .24), (.36, 4.35, 1.78, .24), (.71, 4.14, 1.67, .46), (1.01, 4.5, 1.92, .14)):
    plinth.block(rock[1], 0, 0, z, w, d, h, .075)
plinth.block(gold, 0, 0, 1.145, 4.5, 1.92, .13)
plinth.line(ember, [(-2.03,-.852,.68),(2.03,-.852,.68)], [.025,.025])
export("plinth", plinth)

lamp = Model()
lantern(lamp, lantern_palette(p), 0, 0, .18, scale=.88)
# Mount the lantern on a slender stand rising from floor or pedestal.
lamp.lathe(gold, 0, 0, [(.20, -.72), (.21, -.65), (.075, -.58), (.054, .11)], n=12)
export("lantern", lamp)

trident = Model()
metal = p.material("Fire-forged trident", "FF3027", .32, .32, 1.9)
trident.line(gold, [(0, 0, .03), (0, 0, 1.06)], [.056, .075])
trident.line(metal, [(0, 0, .1), (0, 0, 2.2)], [.035, .053])
for side in (-1, 1):
    trident.line(metal, [(0, 0, 1.23), (side*.25, 0, 1.28),
                        (side*.48, 0, 1.45), (side*.49, 0, 2.02)],
                 [.054, .065, .065, .052])
for x, z in ((-.49, 2.02), (0, 2.2), (.49, 2.02)):
    trident.profile(ember, [(x-.13,z-.025),(x+.13,z-.025),(x,z+.25)], -.06, .06)
trident.lathe(gold, 0, 0, [(.30, 0), (.30, .06), (.24, .13), (.11, .19)], n=16)
export("trident", trident)
