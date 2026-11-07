"""Build the deforming rig for the TRELLIS red #7 avatar in Blender."""
import argparse
import sys
from pathlib import Path

import bpy
from mathutils import Vector

sys.path.insert(0, str(Path(__file__).resolve().parent))
from build_animations import animate


def smooth(lo, hi, x):
    t = min(1, max(0, (x - lo) / (hi - lo)))
    return t * t * (3 - 2 * t)


def weights(x, z):
    side = '.L' if x > 0 else '.R'
    x = abs(x)
    # Below the crotch, the feet and two legs are spatially separate.
    leg = 1 - smooth(.245, .325, z)
    knee = smooth(.172, .229, z)
    ankle = 1 - smooth(.073, .114, z)
    # Inside the sleeve use a wider transition. Below it the arm is separate.
    sleeve = .137 - .041 * smooth(.47, .61, z)
    arm = smooth(sleeve-.012, sleeve+.012, x) * smooth(.276, .318, z) * (1-smooth(.604,.662,z))
    elbow = smooth(.448, .504, z)
    wrist = 1 - smooth(.374, .421, z)
    head = smooth(.685, .751, z)
    neck = smooth(.627, .691, z)
    chest = smooth(.417, .49, z)
    spine = smooth(.324, .397, z)
    body = (1-leg)*(1-arm)
    return {
        'Thigh'+side: leg*(1-arm)*knee,
        'Shin'+side: leg*(1-arm)*(1-knee)*(1-ankle),
        'Foot'+side: leg*(1-arm)*(1-knee)*ankle,
        'UpperArm'+side: arm*elbow,
        'Forearm'+side: arm*(1-elbow)*(1-wrist),
        'Hand'+side: arm*(1-elbow)*wrist,
        'Head': body*head,
        'Neck': body*(1-head)*neck,
        'Chest': body*(1-head)*(1-neck)*chest,
        'Spine': body*(1-head)*(1-neck)*(1-chest)*spine,
        'Hips': body*(1-head)*(1-neck)*(1-chest)*(1-spine),
    }


def build_face(mesh):
    """Small surface shapes for this textured face. No eye or mouth separation."""
    base = mesh.shape_key_add(name='Basis')
    keys = {name: mesh.shape_key_add(name=name)
            for name in ('Blink','Smile','Sad','Angry','Surprised','Cry')}
    for index, v in enumerate(base.data):
        x,y,z = v.co
        ax = abs(x)
        front = 1-smooth(-.086,-.045,y)
        eye = front * (1-smooth(.014,.034,abs(ax-.048))) * (1-smooth(.012,.035,abs(z-.816)))
        mouth = front * (1-smooth(.02,.047,ax)) * (1-smooth(.009,.033,abs(z-.777)))
        brow = front * (1-smooth(.019,.036,abs(ax-.049))) * (1-smooth(.008,.024,abs(z-.848)))
        corner = smooth(.007,.033,ax)
        offsets = {
            'Blink': -(z-.816)*eye*.65,
            'Smile': .014*mouth*corner,
            'Sad': -.012*mouth*corner+.012*brow*(1-corner),
            'Angry': -.011*brow*(1-corner)+.007*brow*corner,
            'Surprised': .012*brow+(z-.777)*mouth*.4,
            'Cry': -(z-.816)*eye*.48-.012*mouth*corner,
        }
        for name,dz in offsets.items():
            keys[name].data[index].co.z += dz


def build_rig(mesh):
    data = bpy.data.armatures.new('Chibi #7 skeleton')
    rig = bpy.data.objects.new('Chibi #7', data)
    bpy.context.collection.objects.link(rig)
    bpy.context.view_layer.objects.active = rig
    bpy.ops.object.mode_set(mode='EDIT')

    def bone(name, head, tail, parent=None):
        b = data.edit_bones.new(name)
        b.head, b.tail = head, tail
        if parent:
            b.parent = data.edit_bones[parent]

    bone('Root', (0,0,0), (0,0,.12))
    bone('Hips', (0,.014,.304), (0,.005,.388), 'Root')
    bone('Spine', (0,.005,.388), (0,-.01,.481), 'Hips')
    bone('Chest', (0,-.01,.481), (0,-.005,.623), 'Spine')
    bone('Neck', (0,-.005,.623), (0,.008,.718), 'Chest')
    bone('Head', (0,.008,.718), (0,.005,.964), 'Neck')
    for suffix, s in [('.L', 1), ('.R', -1)]:
        shoulder, elbow, wrist, tip = [(s*x,y,z) for x,y,z in
            [(.105,.006,.566),(.164,.001,.477),(.18,-.018,.402),(.19,-.028,.331)]]
        hip,knee,ankle,toe = [(s*x,y,z) for x,y,z in
            [(.066,.013,.312),(.078,.018,.201),(.102,.017,.079),(.132,-.089,.025)]]
        bone('UpperArm'+suffix,shoulder,elbow,'Chest')
        bone('Forearm'+suffix,elbow,wrist,'UpperArm'+suffix)
        bone('Hand'+suffix,wrist,tip,'Forearm'+suffix)
        bone('Thigh'+suffix,hip,knee,'Hips')
        bone('Shin'+suffix,knee,ankle,'Thigh'+suffix)
        bone('Foot'+suffix,ankle,toe,'Shin'+suffix)
    bpy.ops.object.mode_set(mode='OBJECT')
    groups = {b.name: mesh.vertex_groups.new(name=b.name) for b in data.bones}
    for v in mesh.data.vertices:
        influences = sorted(weights(v.co.x, v.co.z).items(), key=lambda item: -item[1])[:4]
        total = sum(w for _,w in influences)
        for name,w in influences:
            if w > 0:
                groups[name].add([v.index], w/total, 'REPLACE')
    mesh.parent = rig
    modifier = mesh.modifiers.new('Chibi deform', 'ARMATURE')
    modifier.object = rig
    return rig


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source', type=Path)
    parser.add_argument('output', type=Path)
    parser.add_argument('--blend', type=Path)
    a = parser.parse_args(sys.argv[sys.argv.index('--')+1:])
    if a.source.resolve() == a.output.resolve():
        parser.error('Use separate source and output paths.')
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=str(a.source.resolve()))
    mesh, = [o for o in bpy.context.scene.objects if o.type == 'MESH']
    transform = mesh.matrix_world.copy()
    mesh.parent = None
    mesh.matrix_world.identity()
    mesh.data.transform(transform)
    low = Vector(tuple(min(v.co[i] for v in mesh.data.vertices) for i in range(3)))
    high = Vector(tuple(max(v.co[i] for v in mesh.data.vertices) for i in range(3)))
    center = (low+high)/2
    for v in mesh.data.vertices:
        v.co = (v.co-Vector((center.x, center.y, low.z)))/(high.z-low.z)
    build_face(mesh)
    rig = build_rig(mesh)
    animate(rig)
    bpy.ops.object.select_all(action='DESELECT')
    rig.select_set(True)
    mesh.select_set(True)
    if a.blend:
        a.blend.parent.mkdir(parents=True,exist_ok=True)
        bpy.ops.file.pack_all()
        bpy.context.preferences.filepaths.save_version = 0
        bpy.ops.wm.save_as_mainfile(filepath=str(a.blend.resolve()))
    a.output.parent.mkdir(parents=True,exist_ok=True)
    bpy.ops.export_scene.gltf(filepath=str(a.output.resolve()), export_format='GLB',
        use_selection=True, export_animation_mode='NLA_TRACKS',
        export_meshopt_compression_enable=True)


if __name__ == '__main__':
    main()
