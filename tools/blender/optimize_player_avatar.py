"""Build the web avatar from the original unrigged TRELLIS export."""
import argparse
from pathlib import Path
import sys

import bpy


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source', type=Path)
    parser.add_argument('output', type=Path)
    args = parser.parse_args(sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else [])
    if args.source.resolve() == args.output.resolve():
        parser.error('Choose a separate output to preserve the source export.')
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=str(args.source.resolve()))
    meshes = [obj for obj in bpy.context.scene.objects if obj.type == 'MESH']
    if len(meshes) != 1 or any(obj.type == 'ARMATURE' for obj in bpy.context.scene.objects):
        parser.error('Expected the single-mesh, unrigged TRELLIS avatar.')
    mesh = meshes[0]
    bpy.context.view_layer.objects.active = mesh
    modifier = mesh.modifiers.new('Web triangle budget', 'DECIMATE')
    modifier.ratio = 0.22
    bpy.ops.object.modifier_apply(modifier=modifier.name)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.export_scene.gltf(
        filepath=str(args.output.resolve()),
        export_format='GLB',
        export_meshopt_compression_enable=True,
    )


if __name__ == '__main__':
    main()
