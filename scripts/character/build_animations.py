"""Keyframe the chibi skeleton. All authored displacement stays under Hips."""
from math import cos, pi, sin, radians

import bpy
from mathutils import Euler, Vector

FPS = 30


def pose(rig, rotations, offset):
    for b in rig.pose.bones:
        basis = b.bone.matrix_local.to_quaternion()
        q = Euler(tuple(radians(a) for a in rotations.get(b.name,(0,0,0)))).to_quaternion()
        b.rotation_mode = 'QUATERNION'
        b.rotation_quaternion = basis.inverted() @ q @ basis
        b.location = basis.inverted() @ Vector(offset) if b.name == 'Hips' else Vector((0,0,0))


def clip(rig, name, length, sample):
    ad = rig.animation_data_create()
    action = bpy.data.actions.new(name)
    ad.action = action
    for frame in range(0,length+1):
        r, offset = sample(frame/length)
        pose(rig,r,offset)
        if name in {'Walk', 'Run'}:
            # Keep the lower sole near the floor without moving the root node.
            bpy.context.view_layer.update()
            floor = min(
                (b.matrix @ b.bone.matrix_local.inverted() @ Vector((x,y,.003))).z
                for b, x in [(rig.pose.bones['Foot.L'], .108), (rig.pose.bones['Foot.R'], -.108)]
                for y in (-.089,.061)
            )
            pose(rig,r,(offset[0],offset[1],offset[2]-floor+.003))
        for b in rig.pose.bones:
            b.keyframe_insert('rotation_quaternion',frame=frame,group=b.name)
            if b.name == 'Hips':
                b.keyframe_insert('location',frame=frame,group=b.name)
    track = ad.nla_tracks.new()
    track.name = name
    ad.action = None
    track.strips.new(name,0,action)
    track.mute = True


def gait(t, running):
    swing = sin(2*pi*t)
    angles = {}
    stride = 38 if running else 23
    for side, sign in [('.L',1),('.R',-1)]:
        phase = swing*sign
        # Rest limbs have a slight A pose. Swing mostly in the sagittal plane.
        thigh = stride*phase
        knee = (46 if running else 28)*max(0, sin(2*pi*t*1 + (0 if sign == 1 else pi) - .65))
        angles['Thigh'+side] = (thigh,0,-sign*2)
        angles['Shin'+side] = (knee,0,0)
        angles['Foot'+side] = (-thigh-knee,0,0)
        angles['UpperArm'+side] = (-phase*(32 if running else 20),0,sign*3)
        angles['Forearm'+side] = (-20-max(0, -phase)*(42 if running else 12),0,0)
    angles['Chest'] = (8 if running else 2, 0, swing*5)
    angles['Head'] = (-5 if running else -1,0,-swing*3)
    return angles, (swing*.009,0,(.016 if running else .006)*abs(swing))


def sitting(t):
    return {'Thigh.L':(-72*t,0,-5*t),'Thigh.R':(-72*t,0,5*t),
            'Shin.L':(84*t,0,0),'Shin.R':(84*t,0,0),
            'Foot.L':(-12*t,0,0),'Foot.R':(-12*t,0,0),
            'Chest':(-9*t,0,0),'Forearm.L':(-43*t,0,0),'Forearm.R':(-43*t,0,0)}, (0,.045*t,-.091*t)


def expression(name,t):
    amount=sin(pi*t)**.65
    wave=sin(8*pi*t)*amount
    if name == 'Wave':
        return {'UpperArm.R':(12*amount, 64*amount, 0),
                'Forearm.R':(-95*amount, -18*wave, 0),'Hand.R':(0,24*wave,0),
                'Head':(0,-6*amount,-11*amount)}, (0,0,0)
    if name in {'Cheer','Celebrate'}:
        lift = 120 if name == 'Cheer' else 146
        return {'UpperArm.L':(-lift*amount,28*amount,0),'UpperArm.R':(-lift*amount,-28*amount,0),
                'Forearm.L':(-28*amount,0,0),'Forearm.R':(-28*amount,0,0),
                'Head':(-12*amount,0,0)}, (0,0,.012*abs(wave))
    if name in {'Sad','Cry'}:
        return {'Head':(21*amount,6*wave,0),'Chest':(9*amount,0,0),
                'Forearm.L':(-55*amount if name=='Cry' else 10*amount,0,0),
                'Forearm.R':(-55*amount if name=='Cry' else 10*amount,0,0)}, (0,0,-.008*amount)
    if name == 'Taunt':
        return {'Head':(0,17*amount,8*wave),'UpperArm.L':(-38*amount,0,0),
                'Forearm.L':(-32*amount,0,0),'Hand.L':(0,25*wave,0)}, (0,0,0)
    if name == 'Angry':
        return {'Head':(14*amount,0,0),'Chest':(-12*amount,0,0),
                'UpperArm.R':(0,-20*amount,0),'UpperArm.L':(0,20*amount,0),
                'Forearm.L':(-55*amount,0,0),'Forearm.R':(-55*amount,0,0)}, (0,0,-.007*amount)
    return {'Head':(-9*amount,0,6*wave),'Chest':(9*wave,0,0),
            'Forearm.L':(-40*amount,0,0),'Forearm.R':(-38*amount,0,0)}, (0,0,.005*wave)


def animate(rig):
    bpy.context.scene.render.fps=FPS
    clip(rig,'Idle',75,lambda t: (
        {'Chest':(1.5*sin(2*pi*t),0,0),'Head':(1.3*sin(2*pi*t),1.5*sin(2*pi*t),0)},
        (0,0,.0025*(1-cos(2*pi*t)))))
    clip(rig,'Walk',30,lambda t:gait(t,False))
    clip(rig,'Run',20,lambda t:gait(t,True))
    def jump(t):
        a = sin(pi*t)
        return {'Thigh.L':(-30*a,0,0),'Thigh.R':(-20*a,0,0),
                'Shin.L':(43*a,0,0),'Shin.R':(33*a,0,0),
                'Foot.L':(12*a,0,0),'Foot.R':(10*a,0,0),
                'UpperArm.L':(-46*a,0,0),'UpperArm.R':(-42*a,0,0),
                'Forearm.L':(-30*a,0,0),'Forearm.R':(-30*a,0,0),
                'Chest':(-6*a,0,0)}, (0,0,0)
    clip(rig,'Jump',22,jump)
    clip(rig,'SitDown',17,lambda t:sitting(t*t*(3-2*t)))
    clip(rig,'SitIdle',60,lambda t:sitting(1))
    clip(rig,'StandUp',16,lambda t:sitting(1-t*t*(3-2*t)))
    for name in ('Wave','Cheer','Sad','Cry','Laugh','Taunt','Angry','Celebrate'):
        clip(rig,name,54,lambda t,name=name:expression(name,t))
    pose(rig,{},(0,0,0))
