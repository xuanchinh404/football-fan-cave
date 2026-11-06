"""Exportable Principled materials and small deterministic, seamless PBR maps."""
import struct
import zlib
from pathlib import Path
from tempfile import TemporaryDirectory

import bpy
import numpy as np


def srgb(hex_color):
    rgb = [int(hex_color[i:i+2], 16) / 255 for i in (0, 2, 4)]
    return tuple(v / 12.92 if v <= .04045 else ((v + .055) / 1.055) ** 2.4 for v in rgb)


def png_bytes(pixels):
    height, width, _ = pixels.shape

    def chunk(kind, data):
        return (struct.pack('>I', len(data)) + kind + data
                + struct.pack('>I', zlib.crc32(kind + data)))

    rows = b''.join(b'\x00' + row.tobytes() for row in pixels)
    return (b'\x89PNG\r\n\x1a\n'
            + chunk(b'IHDR', struct.pack('>IIBBBBB', width, height, 8, 2, 0, 0, 0))
            + chunk(b'IDAT', zlib.compress(rows, 9)) + chunk(b'IEND', b''))


def stone_maps(kind):
    size = 256
    x, y = np.meshgrid(*(2 * np.pi * np.arange(size) / size,) * 2)
    rng = np.random.default_rng(861)
    grain = rng.normal(0, .045, x.shape)
    warp = np.sin(x * 3 - y) * .73 + np.cos(x * 5 + y * 4) * .19
    beds = np.sin(y * 9 + x + warp)
    broad = np.sin(x * 3 - y * 2 + np.sin(y * 5)) * .07 + np.cos(y * 3 + x) * .045
    height = broad + beds * (.08 if kind == 'Cliff' else .025) + grain * .4
    vein = np.maximum(0, (beds - .8) * 5)
    luma = np.clip(.76 + height + grain + vein * .06, 0, 1)
    rgb = np.stack((luma * .96, luma * .98, luma), axis=2)
    dx = (np.roll(height, -1, axis=1) - np.roll(height, 1, axis=1)) * .76
    dy = (np.roll(height, -1, axis=0) - np.roll(height, 1, axis=0)) * .76
    normal = np.stack((-dx, dy, np.ones_like(dx)), axis=2)
    normal /= np.linalg.norm(normal, axis=2, keepdims=True)
    return rgb, normal * .5 + .5


def packed_image(name, pixels, space):
    with TemporaryDirectory() as scratch:
        path = Path(scratch) / (name + '.png')
        path.write_bytes(png_bytes(np.rint(pixels * 255).astype(np.uint8)))
        image = bpy.data.images.load(str(path))
        image.colorspace_settings.name = space
        image.pack()
    return image


class Palette:
    def __init__(self):
        self.maps = {}

    def material(self, name, color, roughness=.78, metal=0, emission=0, texture=None):
        material = bpy.data.materials.new(name)
        rgba = (*srgb(color), 1)
        material.diffuse_color = rgba
        material.use_nodes = True
        nodes = material.node_tree.nodes
        link = material.node_tree.links.new
        shader = nodes.get('Principled BSDF')
        shader.inputs['Base Color'].default_value = rgba
        shader.inputs['Roughness'].default_value = roughness
        shader.inputs['Metallic'].default_value = metal
        if emission:
            shader.inputs['Emission Color'].default_value = rgba
            shader.inputs['Emission Strength'].default_value = emission
        if texture:
            key = (texture, color)
            if key not in self.maps:
                rgb, normal = stone_maps(texture)
                if texture not in self.maps:
                    self.maps[texture] = packed_image(texture + ' micro-normal', normal, 'Non-Color')
                rgb *= [int(color[i:i+2], 16) / 255 for i in (0, 2, 4)]
                self.maps[key] = packed_image(name + ' albedo', rgb, 'sRGB')
            albedo = nodes.new('ShaderNodeTexImage')
            albedo.image = self.maps[key]
            link(albedo.outputs['Color'], shader.inputs['Base Color'])
            bump = nodes.new('ShaderNodeTexImage')
            bump.image = self.maps[texture]
            normal_map = nodes.new('ShaderNodeNormalMap')
            normal_map.inputs['Strength'].default_value = .72
            link(bump.outputs['Color'], normal_map.inputs['Color'])
            link(normal_map.outputs['Normal'], shader.inputs['Normal'])
        return material
