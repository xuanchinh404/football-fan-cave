"""Small mesh builders in metres, Z up and -Y facing the player (GLB +Z)."""
import math
from collections import defaultdict

import bpy
from mathutils import Vector


class Model:
    def __init__(self):
        self.parts = defaultdict(lambda: ([], [], []))

    def add(self, material, vertices, faces, smooth=False):
        points, polygons, smoothing = self.parts[material]
        polygons.extend(tuple(i + len(points) for i in f) for f in faces)
        points.extend(vertices)
        smoothing.extend([smooth] * len(faces))

    def build(self, name):
        for material, (points, polygons, smoothing) in self.parts.items():
            mesh = bpy.data.meshes.new(material.name)
            mesh.from_pydata(points, [], polygons)
            mesh.update()
            uv = mesh.uv_layers.new(name='Surface')
            for poly, smooth in zip(mesh.polygons, smoothing):
                poly.use_smooth = smooth
                axis = max(range(3), key=lambda i: abs(poly.normal[i]))
                a, b = [(1, 2), (0, 2), (0, 1)][axis]
                for i in poly.loop_indices:
                    v = mesh.vertices[mesh.loops[i].vertex_index].co
                    uv.data[i].uv = (v[a] * .55, v[b] * .55)
            obj = bpy.data.objects.new(name + ' · ' + material.name, mesh)
            mesh.materials.append(material)
            bpy.context.collection.objects.link(obj)

    def block(self, material, x, y, z, w, d, h, bevel=.04):
        bevel = min(w * .2, d * .2, h * .2, bevel)
        outline = [(-w/2+bevel, -d/2), (w/2-bevel, -d/2), (w/2, -d/2+bevel),
                   (w/2, d/2-bevel), (w/2-bevel, d/2), (-w/2+bevel, d/2),
                   (-w/2, d/2-bevel), (-w/2, -d/2+bevel)]
        levels = [(-h/2, .92), (-h/2+bevel, 1), (h/2-bevel, 1), (h/2, .92)]
        self.rings(material, [[(x + a * s, y + b * s, z + t) for a, b in outline]
                              for t, s in levels])

    def rings(self, material, loops, smooth=False, cap=True):
        n = len(loops[0])
        faces = [(j*n+i, j*n+(i+1)%n, (j+1)*n+(i+1)%n, (j+1)*n+i)
                 for j in range(len(loops)-1) for i in range(n)]
        if cap:
            faces += [tuple(reversed(range(n))),
                      tuple(range((len(loops)-1)*n, len(loops)*n))]
        self.add(material, [v for ring in loops for v in ring], faces, smooth)

    def lathe(self, material, x, y, profile, n=32, smooth=False):
        self.rings(material, [[(x + r * math.cos(i*math.tau/n), y + r * math.sin(i*math.tau/n), z)
                               for i in range(n)] for r, z in profile], smooth)

    def line(self, material, points, radii, n=8):
        """Tube along a polyline with a transported cross-section."""
        points = list(map(Vector, points))
        loops = []
        u = None
        for i, (p, r) in enumerate(zip(points, radii)):
            tangent = (points[min(i+1, len(points)-1)] - points[max(0, i-1)]).normalized()
            if u is None or abs(u.dot(tangent)) > .98:
                u = tangent.cross(Vector((0, 0, 1) if abs(tangent.z) < .9 else (1, 0, 0)))
            u = (u - tangent * u.dot(tangent)).normalized()
            v = tangent.cross(u)
            loops.append([p + r * (u * math.cos(k*math.tau/n) + v * math.sin(k*math.tau/n))
                          for k in range(n)])
        self.rings(material, loops, True)

    def profile(self, material, coords, front, back):
        """Extrude a CCW polygon in the X/Z plane. Front is the negative Y face."""
        n = len(coords)
        faces = [tuple(range(n)), tuple(reversed(range(n, 2*n)))]
        faces.extend((i, n+i, n+(i+1)%n, (i+1)%n) for i in range(n))
        self.add(material, [(x, y, z) for y in (front, back) for x, z in coords], faces)

    def jewel(self, material, center, scale, rng, sides=7, layers=4):
        x, y, z = center
        a, b, c = scale
        outline = [rng.uniform(.76, 1.22) for _ in range(sides)]
        phase = rng.uniform(0, math.tau)
        loops = []
        for j in range(layers):
            t = -1 + 2*j/(layers-1)
            width = .28 + .75 * math.sqrt(1 - t*t)
            shift = rng.uniform(-.19, .19)
            loops.append([(x+a*(math.cos(i*math.tau/sides+phase)*width*outline[i]+shift),
                           y+b*math.sin(i*math.tau/sides+phase)*width*outline[i],
                           z+c*(t+rng.uniform(-.11, .11))) for i in range(sides)])
        self.rings(material, loops)
