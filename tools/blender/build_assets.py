"""Generate, export, validate and preview the assets in assets/blender-manifest.json."""
import argparse
import hashlib
import importlib
import json
import os
from pathlib import Path
import struct
import sys
from tempfile import TemporaryDirectory

import bpy
from mathutils import Vector

TOOLS = Path(__file__).resolve().parent
ROOT = TOOLS.parents[1]
sys.path.insert(0, str(TOOLS))

from materials import Palette


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def fingerprint(entry, module):
    h = hashlib.sha256(json.dumps(entry, sort_keys=True).encode())
    h.update(bpy.app.version_string.encode())
    for source in ('build_assets', 'geometry', 'materials', module):
        h.update((TOOLS / (source + '.py')).read_bytes())
    return h.hexdigest()


def validate(path, entry):
    raw = path.read_bytes()
    magic, version, total, size, chunk = struct.unpack_from('<4sIII4s', raw)
    if (magic, version, total, chunk) != (b'glTF', 2, len(raw), b'JSON'):
        raise ValueError(f'{path.name}: malformed GLB header')
    data = json.loads(raw[20:20+size])
    length, kind = struct.unpack_from('<I4s', raw, 20+size)
    payload = raw[28+size:]
    if kind != b'BIN\x00' or length != len(payload) or len(raw) > entry['maxKiB']*1024:
        raise ValueError(f'{path.name}: invalid BIN chunk or exceeded size budget ({len(raw)//1024} KiB)')
    compression = 'EXT_meshopt_compression'
    for i, buffer in enumerate(data['buffers']):
        fallback = buffer.get('extensions', {}).get(compression, {}).get('fallback')
        if 'uri' in buffer or (not fallback and (i != 0 or buffer['byteLength'] > length)):
            raise ValueError(f'{path.name}: buffer must be embedded in the GLB')
    for view in data['bufferViews']:
        encoded = view.get('extensions', {}).get(compression)
        physical = encoded or view
        if physical['buffer'] != 0 or physical.get('byteOffset', 0)+physical['byteLength'] > length:
            raise ValueError(f'{path.name}: buffer view outside BIN chunk')
        if encoded and encoded['count']*encoded['byteStride'] != view['byteLength']:
            raise ValueError(f'{path.name}: mismatched Meshopt decoded buffer size')
    bounds = []
    triangles = 0
    primitives = 0
    for mesh in data['meshes']:
        for part in mesh['primitives']:
            accessor = data['accessors'][part['attributes']['POSITION']]
            count = data['accessors'][part['indices']]['count'] if 'indices' in part else accessor['count']
            if part.get('mode', 4) != 4 or count < 3 or count % 3:
                raise ValueError(f'{path.name}: invalid triangle primitive')
            bounds.append((accessor['min'], accessor['max']))
            triangles += count//3
            primitives += 1
    if not triangles or triangles > entry['triangles']:
        raise ValueError(f'{path.name}: triangle budget exceeded or empty ({triangles})')
    memory = 0
    for image in data.get('images', []):
        view = data['bufferViews'][image['bufferView']]
        start = view.get('byteOffset', 0)
        png = payload[start:start+view['byteLength']]
        if not png.startswith(b'\x89PNG\r\n\x1a\n'):
            raise ValueError(f'{path.name}: expected embedded PNG')
        w, h = struct.unpack_from('>II', png, 16)
        memory += round(w*h*4*4/3)
    return {
        'sha256': hashlib.sha256(raw).hexdigest(), 'bytes': len(raw),
        'triangles': triangles, 'primitives': primitives,
        'meshopt': compression in data.get('extensionsUsed', []),
        'textureRgba8WithMipmapsBytes': memory,
        'bounds': [[round(fn(b[i][axis] for b in bounds), 3) for axis in range(3)]
                   for i, fn in enumerate((min, max))],
    }


def render(path):
    scene = bpy.context.scene
    points = [obj.matrix_world @ Vector(c) for obj in scene.objects if obj.type == 'MESH'
              for c in obj.bound_box]
    lo, hi = (Vector([fn(p[i] for p in points) for i in range(3)]) for fn in (min, max))
    center = (lo+hi)/2
    extent = max(hi-lo)
    bpy.ops.mesh.primitive_plane_add(size=extent*200, location=(0, 0, lo.z-.02))
    floor = Palette().material('Preview ground', '41394D')
    bpy.context.object.data.materials.append(floor)
    scene.world = bpy.data.worlds.new("Preview world")
    scene.world.color = (.23, .23, .23)
    for position, energy, color, size in [
        ((-1.0,-1.8,2.3), 1150, (1,.79,.6), 1.1),
        ((1.4,-1.1,.8), 480, (.53,.72,1), 1.5),
        ((.6,1.3,1.8), 900, (.77,.80,1), 1),
    ]:
        bpy.ops.object.light_add(type='AREA', location=center+Vector(position)*extent)
        light = bpy.context.object
        light.rotation_euler = (center-light.location).to_track_quat('-Z','Y').to_euler()
        light.data.energy = energy*(extent/5)**2
        light.data.color = color
        light.data.shape = 'DISK'
        light.data.size = extent*size
    position = Vector((1.12,-2.4,1.0)) if hi.z-lo.z > 1 else Vector((.48,-1.8,2.1))
    bpy.ops.object.camera_add(location=center+position*extent)
    camera = scene.camera = bpy.context.object
    camera.rotation_euler = (center-camera.location).to_track_quat('-Z','Y').to_euler()
    camera.data.type = 'ORTHO'
    matrix = camera.rotation_euler.to_matrix().transposed()
    width = max(abs((matrix @ (p-center)).x) for p in points)*2
    height = max(abs((matrix @ (p-center)).y) for p in points)*2
    camera.data.ortho_scale = max(width, height*4/3)*1.18
    camera.data.clip_end = extent*20
    scene.render.engine = 'CYCLES'
    scene.cycles.samples = 16
    scene.cycles.use_denoising = True
    scene.view_settings.view_transform = 'AgX'
    scene.render.resolution_x = 800
    scene.render.resolution_y = 600
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = 'PNG'
    scene.render.filepath = str(path)
    bpy.ops.render.render(write_still=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--validate', action='store_true', help='Validate the checked-in GLBs only')
    parser.add_argument('--force', action='store_true', help='Replace modified generated outputs')
    args = parser.parse_args(sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else [])
    manifest = json.loads((ROOT/'assets/blender-manifest.json').read_text())
    output, previews = (ROOT/manifest[k] for k in ('output', 'previews'))
    report_path = previews/'manifest-report.json'
    previous = json.loads(report_path.read_text()).get('assets', {}) if report_path.exists() else {}
    report = {}
    if args.validate:
        for entry in manifest['assets']:
            print(entry['id'], validate(output/(entry['id']+'.glb'), entry))
        return
    output.mkdir(parents=True, exist_ok=True)
    previews.mkdir(parents=True, exist_ok=True)
    with TemporaryDirectory(prefix='.blender-', dir=ROOT) as directory:
        scratch = Path(directory)
        writes = []
        for entry in manifest['assets']:
            name = entry['id']
            module, builder = entry['generator'].split(':')
            key = fingerprint(entry, module)
            target = output/(name+'.glb')
            image = previews/(name+'.png')
            old = previous.get(name, {})
            glb_matches = target.exists() and digest(target) == old.get('sha256')
            want_preview = entry.get('preview', True)
            png_matches = image.exists() and digest(image) == old.get('previewSha256')
            if (target.exists() and not glb_matches or want_preview and image.exists() and not png_matches) and not args.force:
                raise ValueError(f'{name}: generated output changed outside the factory. Back it up before using --force.')
            if not args.force and key == old.get('fingerprint') and glb_matches and (not want_preview or png_matches):
                report[name] = old
                print(f'Unchanged: {name}', flush=True)
                continue
            bpy.ops.wm.read_factory_settings(use_empty=True)
            model = getattr(importlib.import_module(module), builder)(Palette(), **entry.get('args', {}))
            model.build(name)
            temp_glb = scratch/target.name
            export = bpy.ops.export_scene.gltf
            meshopt = {'export_meshopt_compression_enable': True} if (
                'export_meshopt_compression_enable' in export.get_rna_type().properties
            ) else {}
            export(filepath=str(temp_glb), export_format='GLB', export_animations=False,
                   export_yup=True, **meshopt)
            report[name] = {'fingerprint': key, **validate(temp_glb, entry)}
            writes.append((temp_glb, target))
            if want_preview:
                temp_png = scratch/image.name
                render(temp_png)
                report[name]['previewSha256'] = digest(temp_png)
                writes.append((temp_png, image))
            print(f'Built: {name} ({report[name]["triangles"]} triangles)', flush=True)
        temp_report = scratch/report_path.name
        temp_report.write_text(json.dumps({'blender': bpy.app.version_string, 'assets': report}, indent=2)+'\n')
        if not report_path.exists() or report_path.read_bytes() != temp_report.read_bytes():
            writes.append((temp_report, report_path))
        for source, target in writes:
            os.replace(source, target)


if __name__ == '__main__':
    main()
