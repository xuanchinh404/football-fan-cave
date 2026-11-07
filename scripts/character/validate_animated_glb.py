"""Verify the exported GLB, then evaluate the skin and morphs in Blender."""
import json
from math import isfinite
from pathlib import Path
import struct
import sys

import bpy


path = Path(sys.argv[sys.argv.index('--')+1]).resolve()
raw = path.read_bytes()
magic, version, size, json_size, kind = struct.unpack_from('<4sIII4s', raw)
assert (magic, version, size, kind) == (b'glTF', 2, len(raw), b'JSON')
doc = json.loads(raw[20:20+json_size])
skin, = doc['skins']
assert len(skin['joints']) == 18
bind = doc['accessors'][skin['inverseBindMatrices']]
assert bind['count'] == len(skin['joints']) and bind['type'] == 'MAT4'
primitive, = doc['meshes'][0]['primitives']
assert {'JOINTS_0','WEIGHTS_0','POSITION','TEXCOORD_0'} <= primitive['attributes'].keys()
assert len(primitive['targets']) == 6 and len(doc['images']) == 2
assert all(i.get('bufferView') is not None for i in doc['images'])
clips = {anim['name']: anim for anim in doc['animations']}
assert set(clips) == {'Idle','Walk','Run','Jump','SitDown','SitIdle','StandUp','Wave','Cheer',
                      'Sad','Cry','Laugh','Taunt','Angry','Celebrate'}
print('GLB', len(raw), 'bytes;', doc['accessors'][primitive['indices']]['count']//3, 'triangles')
for name, a in clips.items():
    assert all(c['target']['node'] in skin['joints'] for c in a['channels'])
    duration = max(doc['accessors'][s['input']]['max'][0] for s in a['samplers'])
    assert duration > 0
    print(name, round(duration, 3), 's,', len(a['channels']), 'channels')

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(path))
rig, = [obj for obj in bpy.context.scene.objects if obj.type == 'ARMATURE']
mesh, = [obj for obj in bpy.context.scene.objects if obj.type == 'MESH' and any(m.type == 'ARMATURE' for m in obj.modifiers)]
assert len(rig.data.bones) == 18
assert all(b.matrix_local.determinant() > .99 for b in rig.data.bones)
assert any(m.type == 'ARMATURE' and m.object == rig for m in mesh.modifiers)
assert all(abs(sum(g.weight for g in v.groups)-1) < .001 for v in mesh.data.vertices)
assert len(mesh.data.shape_keys.key_blocks) == 7
for target in list(mesh.data.shape_keys.key_blocks)[1:]:
    basis = mesh.data.shape_keys.key_blocks[0]
    delta = max((v.co-ref.co).length for v, ref in zip(target.data, basis.data))
    assert .0002 < delta < .03
    print(target.name, 'max displacement', round(delta, 4))

ad = rig.animation_data
ad.action = None
ad.use_nla = True
for track in ad.nla_tracks:
    track.mute = True
    track.is_solo = False
rest = [mesh.matrix_world @ v.co for v in mesh.data.vertices]
for name in ['Walk','Run','Jump','SitIdle','Wave','Cheer','Sad','Laugh']:
    track = next(t for t in ad.nla_tracks if t.name == name)
    track.mute = False
    track.is_solo = True
    bpy.context.scene.frame_set(round(track.strips[0].frame_start+(track.strips[0].frame_end-track.strips[0].frame_start)*.30))
    evaluated = mesh.evaluated_get(bpy.context.evaluated_depsgraph_get())
    posed = [evaluated.matrix_world @ v.co for v in evaluated.data.vertices]
    motion = max((v-ref).length for v,ref in zip(posed,rest))
    assert motion > .006 and all(isfinite(c) for v in posed for c in v)
    print(name, 'evaluated skin displacement', round(motion, 4),
          'lowest vertex', round(min(v.z for v in posed), 4))
    track.mute = True
    track.is_solo = False
