"""Original Football Fan Cave assets. Blender 4.3 background; no third-party artwork.
Run: Blender --background --python scripts/models/build_assets.py -- /absolute/repo
"""
import bpy, math, random, sys, os
from mathutils import Vector
random.seed(73)
ROOT=sys.argv[sys.argv.index('--')+1] if '--' in sys.argv else os.getcwd()
OUT=os.path.join(ROOT,'apps/web/public/models');os.makedirs(OUT,exist_ok=True)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
M={}
def mat(name,color,metal=0,rough=.6,emit=0,texture=False):
 m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True
 p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*color,1);p.inputs['Metallic'].default_value=metal;p.inputs['Roughness'].default_value=rough
 if emit:p.inputs['Emission Color'].default_value=(*color,1);p.inputs['Emission Strength'].default_value=emit
 if texture:
  im=bpy.data.images.new(name+' artisan surface',width=128,height=128); pixels=[]
  for y in range(128):
   for x in range(128):
    n=random.uniform(-.08,.08)+.05*math.sin(x*.31+y*.15)
    line=(x%32<1 or (y+(x//32%2)*16)%32<1) if name=='Stone' else abs(math.sin(y*.15+math.sin(x*.045)))<.07
    f=.64 if line else 1+n
    pixels.extend([min(1,max(0,c*f)) for c in color]+[1])
  im.pixels=pixels;im.pack();t=m.node_tree.nodes.new('ShaderNodeTexImage');t.image=im;m.node_tree.links.new(t.outputs['Color'],p.inputs['Base Color'])
 M[name]=m;return m
mat('Stone',(.46,.53,.62),rough=.9,texture=True);mat('Ivory',(.79,.79,.7),rough=.8,texture=True)
mat('Wood',(.24,.105,.054),texture=True);mat('Gold',(.92,.58,.115),.72,.25);mat('Faction',(.64,.027,.12),.15,.3)
mat('Cream',(.97,.87,.62),rough=.6);mat('Glow',(1,.5,.075),rough=.2,emit=3)
mat('Green',(.07,.29,.13),rough=.9);mat('Pink',(.94,.2,.48),rough=.8);mat('Blossom', (1,.61,.77),rough=.75)
mat('Skin',(.91,.61,.38),rough=.58);mat('Hair',(.065,.025,.013),rough=.45);mat('Black',(.012,.021,.038),rough=.5);mat('White',(.96,.96,.9),rough=.4);mat('Blue',(.08,.3,.7),.1,.45)
objects=[]
def add(obj,name,material):
 obj.name=name;obj.data.materials.append(M[material]);objects.append(obj);return obj

def bevel(o,amount=.06,segments=3):
 mod=o.modifiers.new('Soft artisan edges','BEVEL');mod.width=amount;mod.segments=segments
 bpy.context.view_layer.objects.active=o;bpy.ops.object.modifier_apply(modifier=mod.name)
 return o

def box(name,pos,size,material='Stone',be=.04):
 bpy.ops.mesh.primitive_cube_add(size=1,location=pos);o=bpy.context.object;o.scale=size;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);add(o,name,material)
 if be:bevel(o,be)
 return o

def uv(name,pos,scale,material='Gold',segments=20,rings=12):
 bpy.ops.mesh.primitive_uv_sphere_add(segments=segments,ring_count=rings,radius=1,location=pos);o=bpy.context.object;o.scale=scale;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);add(o,name,material)
 for p in o.data.polygons:p.use_smooth=True
 return o

def cyl(name,pos,r,depth,material='Gold',r2=None,vertices=24):
 bpy.ops.mesh.primitive_cone_add(vertices=vertices,radius1=r,radius2=r if r2 is None else r2,depth=depth,location=pos);o=add(bpy.context.object,name,material);bevel(o,min(.035,r*.2),2)
 for p in o.data.polygons:p.use_smooth=True
 return o

def curve(name,pts,r,material='Gold'):
 c=bpy.data.curves.new(name,'CURVE');c.dimensions='3D';c.resolution_u=12;c.bevel_depth=r;c.bevel_resolution=2;s=c.splines.new('BEZIER');s.bezier_points.add(len(pts)-1)
 for p,co in zip(s.bezier_points,pts):p.co=co;p.handle_left_type='AUTO';p.handle_right_type='AUTO'
 o=bpy.data.objects.new(name,c);bpy.context.collection.objects.link(o);bpy.context.view_layer.objects.active=o;o.select_set(True);bpy.ops.object.convert(target='MESH');o.select_set(False);return add(o,name,material)

def mesh(name,verts,faces,material='Stone',be=0):
 d=bpy.data.meshes.new(name);d.from_pydata(verts,[],faces);d.update();o=bpy.data.objects.new(name,d);bpy.context.collection.objects.link(o);add(o,name,material)
 if be:bevel(o,be,2)
 return o

def export(name,rig=None):
 global objects
 bpy.ops.object.select_all(action='DESELECT')
 if not rig:
  # Batch original modelling parts by material; keep the GLB draw count bounded.
  merged=[]
  groups=[[o for o in objects if o.data.materials and o.data.materials[0]==material] for material in M.values()]
  for group in groups:
   if not group:continue
   bpy.ops.object.select_all(action='DESELECT')
   for o in group:o.select_set(True)
   bpy.context.view_layer.objects.active=group[0];bpy.ops.object.join();merged.append(bpy.context.object)
  objects=merged
 for o in objects:
  o.select_set(True)
  if not rig:
   bpy.context.view_layer.objects.active=o;bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT');bpy.ops.uv.smart_project(angle_limit=1.15,island_margin=.02);bpy.ops.object.mode_set(mode='OBJECT');o.select_set(False)
 for o in objects:o.select_set(True)
 if rig:rig.select_set(True)
 if not os.environ.get('FFC_ONLY_ASSET') or os.environ['FFC_ONLY_ASSET']==name:bpy.ops.export_scene.gltf(filepath=os.path.join(OUT,name+'.glb'),export_format='GLB',use_selection=True,export_animations=bool(rig),export_nla_strips=True,export_force_sampling=True,export_yup=True)
 for o in objects:
  if o.name in bpy.data.objects:bpy.data.objects.remove(o,do_unlink=True)
 if rig:bpy.data.objects.remove(rig,do_unlink=True)
 objects=[]

def lantern(x=0,y=0,z=0,scale=1):
 for k in range(6):
  a=k*math.tau/6;curve('Cage',[(x+.17*scale*math.cos(a),y+.17*scale*math.sin(a),z+.15*scale),(x+.26*scale*math.cos(a),y+.26*scale*math.sin(a),z+.5*scale),(x+.14*scale*math.cos(a),y+.14*scale*math.sin(a),z+.8*scale)],.025*scale)
 uv('Amber glass',(x,y,z+.46*scale),(.15*scale,.15*scale,.3*scale),'Glow')
 cyl('Crown',(x,y,z+.84*scale),.28*scale,.16*scale,'Gold',.05*scale,8);cyl('Foot',(x,y,z+.1*scale),.21*scale,.12*scale,'Gold')
lantern();export('lantern')
# Keystone arch with open, thick stone vault, carved ribs and torch brackets.
for side in [-1,1]:
 for row in range(7):box('Cut ashlar',(side*4.35,0,.38+row*.48),(1.1,2.4,.46),'Stone',.09)
 box('Plinth',(side*4.35,0,.18),(1.6,2.9,.36),'Ivory',.06)
 cyl('Fluted column',(side*4.35,-1.34,2.1),.16,3.6)
 box('Capital',(side*4.35,0,3.5),(1.5,2.8,.35),'Gold',.08)
 curve('Scroll',[(side*5,-.2,4),(side*5.5,-.3,5),(side*4.8,-.4,5.3)],.09)
 lantern(side*5.15,-1.1,1.8,1.2)
for i in range(17):
 a=i*math.pi/17;b=(i+1)*math.pi/17-.016;verts=[]
 for y in [-1.2,1.2]:
  for r in [3.8,4.9]:
   for t in [a,b]:verts.append((r*math.cos(t),y,3.3+r*math.sin(t)))
 mesh('Voussoir',verts,[(0,1,3,2),(4,6,7,5),(0,4,5,1),(2,3,7,6),(0,2,6,4),(1,5,7,3)],'Ivory' if i%4==0 else 'Stone',.05)
for y in [-1.25,1.25]:curve('Gilded vault',[(3.85*math.cos(t),y,3.3+3.85*math.sin(t)) for t in [i*math.pi/32 for i in range(33)]],.065)
box('Name board',(0,-1.7,8.4),(9.9,.5,1.05),'Wood',.14)
for z in [7.9,8.95]:box('Name gold border',(0,-1.99,z),(10.1,.12,.1),'Gold')
for side in [-1,1]:box('Pennant',(side*5,-1.55,4.7),(.68,.1,1.7),'Faction')
export('portal-grand')
# Sculpted displaced cliff, UV mapped rather than flat untextured primitives.
bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=3,radius=1);o=add(bpy.context.object,'Sculpted escarpment','Stone')
for v in o.data.vertices:
 n=v.co.normalized();v.co*=1+.09*math.sin(v.co.x*14+v.co.z*9)+random.uniform(-.04,.04)
o.scale=(1, .7, 1.3);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
bevel(o,.025,2);export('cliff-sculpted')
# Original flowering tree, tapered branches and individual petal clusters.
for j in range(6):
 a=j*math.tau/6;end=(math.cos(a)*1.55,math.sin(a)*1.55,3.1+random.random())
 curve('Branch',[(0,0,0),(.15,.08,1.5),end],.16 if j else .28,'Wood')
 uv('Leaf crown',end,(1.1,1.1,.7),'Green',12,8)
 for k in range(15):
  pos=(end[0]+random.uniform(-.9,.9),end[1]+random.uniform(-.9,.9),end[2]+random.uniform(-.3,.8))
  for q in range(4):
   t=q*math.tau/4;uv('Cherry blossom',(pos[0]+math.cos(t)*.15,pos[1]+math.sin(t)*.15,pos[2]),(.23,.14,.09),'Blossom' if k%3 else 'Pink',8,5)
export('cherry-tree')
# Layered golden truncated-icosahedron football panels.
bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1,radius=1);ico=bpy.context.object;vs=[v.co.copy() for v in ico.data.vertices];fs=[list(p.vertices) for p in ico.data.polygons];bpy.data.objects.remove(ico,do_unlink=True)
adj={i:set() for i in range(len(vs))}
for f in fs:
 for i in f:
  adj[i].update(j for j in f if j!=i)
faces=[]
for f in fs:
 points=[]
 for i in f:
  for j in f:
   if i!=j:points.append((vs[i]*2+vs[j])/3)
 faces.append((points,'Gold'))
for i,neighbours in adj.items():faces.append(([(vs[i]*2+vs[j])/3 for j in neighbours],'Glow'))
for pts,ma in faces:
 center=sum(pts,Vector())/len(pts);normal=center.normalized();u=(pts[0]-center).normalized();v=normal.cross(u)
 pts.sort(key=lambda p: math.atan2((p-center).dot(v),(p-center).dot(u)))
 out=[tuple((center+(p-center)*.94)*2.8+Vector((0,0,4))) for p in pts]
 mesh('Football stitched panel',out,[list(range(len(out)))],ma,.025)
for r,z,depth in [(3.35,.2,.4),(3,.5,.2),(2.6,.75,.25),(1.4,1.05,.4),(.7,1.8,1.3),(1,2.4,.3)]:cyl('Turned pedestal',(0,0,z),r,depth,'Gold' if z>.7 else 'Ivory')
for i in range(12):
 a=i*math.tau/12;curve('Laurel leaf',[(math.cos(a)*1.1,math.sin(a)*1.1,1.2),(math.cos(a)*1.6,math.sin(a)*1.6,1.9),(math.cos(a)*1.3,math.sin(a)*1.3,2.6)],.09)
export('golden-football')
# Market kiosk with curved cloth canopy, open back and stocked shelves.
box('Counter',(0,0,.65),(5.5,3.2,1.3),'Wood',.1);box('Counter slab',(0,0,1.35),(5.8,3.4,.18),'Gold')
for x in [-2.6,2.6]:
 for y in [-1.4,1.4]:cyl('Carved post',(x,y,2.1),.12,4,'Wood');lantern(x,y-.3,2.5,.7)
for i in range(12):
 x=-3+i*.5;verts=[]
 for dx in [0,.5]:
  for j in range(9):
   y=-2+j*.5;z=4.1-.4*abs(y)/2+.08*math.cos(y*2);verts.append((x+dx,y,z))
 mesh('Striped textile canopy',verts,[(j,j+1,j+10,j+9) for j in range(8)],'Faction' if i%2==0 else 'Cream')
 # scalloped 3D valance, not a flat facade.
 uv('Scalloped fringe',(x+.25,-2,3.65),(.25,.04,.25),'Faction' if i%2==0 else 'Cream',10,6)
for z in [1.9,2.6,3.3]:
 box('Shelf',(0,1.5,z),(4.9,.7,.09),'Wood')
 for i in range(7):cyl('Potion bottle',(-2+i*.65,1.45,z+.22),.12,.33,'Blue' if i%2 else 'Gold',.07)
for i in range(5):uv('Display football',(-1.6+i*.8,-.4,1.65),(.23,.23,.23),'Cream' if i%2 else 'Faction',12,8)
export('market-stall')
# Pavilion with curved tiled roof and decorative ridge.
for x in [-4,4]:
 for y in [-3,3]:
  cyl('Column',(x,y,2.5),.23,5,'Wood');cyl('Column foot',(x,y,.22),.44,.44,'Gold');lantern(x,y,2.5,.9)
for side in [-1,1]:
 verts=[]
 for i in range(13):
  x=-5+i*10/12
  for j in range(9):
   y=side*j*.5;z=6.4-abs(y)*.4+.05*y*y+.025*x*x;verts.append((x,y,z))
 mesh('Swept tiled roof',verts,[(i*9+j,i*9+j+1,(i+1)*9+j+1,(i+1)*9+j) for i in range(12) for j in range(8)],'Faction')
 for i in range(13):
  x=-5+i*10/12;curve('Roof tile rib',[(x,side*j*.5,6.4-j*.5*.4+.05*(j*.5)**2+.025*x*x+.02) for j in range(9)],.045,'Gold')
curve('Ridge',[(-5,0,7.2),(-3,0,6.6),(0,0,6.5),(3,0,6.6),(5,0,7.2)],.12)
export('pavilion')
# Sloped bridge deck and balustrades. Scene origin is centre of span, Blender Y = -scene Z.
for i in range(42):
 y=-7+i/3;z=(y+7)*.5
 box('Bridge stone tread',(0,y,z-.12),(6,.32,.24),'Ivory',.025)
for side in [-1,1]:
 for i in range(15):
  y=-7+i;z=(y+7)*.5;cyl('Baluster',(side*2.9,y,z+.6),.09,1.2,'Wood')
 curve('Handrail',[(side*2.9,y,(y+7)*.5+1.3) for y in range(-7,8)],.1,'Gold')
export('bridge-stone')
# Second bridge: original timber planks and rope balustrade, same shared rise/span.
for i in range(35):
 y=-7+(i+.5)*14/35;z=(y+7)*.5
 box('Timber plank',(0,y,z-.12),(6,.38,.24),'Wood',.035)
for side in [-1,1]:
 for i in range(15):
  y=-7+i;z=(y+7)*.5;cyl('Timber post',(side*2.9,y,z+.6),.12,1.2,'Wood')
 curve('Rope handrail',[(side*2.9,y,(y+7)*.5+1.3) for y in range(-7,8)],.065,'Cream')
 curve('Lower rope',[(side*2.9,y,(y+7)*.5+.6) for y in range(-7,8)],.045,'Cream')
export('bridge-wood')
# Fan furniture.
cyl('Round tabletop',(0,0,1),1,.15,'Wood');cyl('Table leg',(0,0,.5),.18,1,'Gold')
for a in [i*math.tau/4 for i in range(4)]:
 x,y=math.cos(a)*1.6,math.sin(a)*1.6;box('Chair seat',(x,y,.55),(.7,.7,.12),'Wood')
 for dx in [-.25,.25]:
  for dy in [-.25,.25]:box('Chair leg',(x+dx,y+dy,.25),(.08,.08,.5),'Gold')
export('fan-table')
# Chibi mesh, articulated with an original armature and nine named animation clips.
parts={}
def part(bone,fn,*args,**kwargs):
 start=len(objects);o=fn(*args,**kwargs)
 for ob in objects[start:]:parts.setdefault(bone,[]).append(ob)
 return o
part('root',uv,'Shorts',(0,0,.82),(.31,.21,.2),'Black')
part('spine',uv,'Tailored shirt',(0,0,1.16),(.37,.23,.4),'Faction',32,20)
part('spine',cyl,'Collar',(0,0,1.49),.17,.06,'Cream')
part('head',uv,'Chibi head',(0,-.015,1.9),(.49,.4,.49),'Skin',40,28)
part('head',uv,'Hair cap',(0,.05,2.09),(.51,.4,.36),'Hair',32,20)
for i in range(14):
 a=i*math.tau/14;pts=[(.4*math.cos(a),.28*math.sin(a),2.18),(.44*math.cos(a+.25),.31*math.sin(a+.25),2.4),(.23*math.cos(a+.5),.2*math.sin(a+.5),2.48)]
 start=len(objects);curve('Sculpted hair lock',pts,.065,'Hair');parts.setdefault('head',[]).extend(objects[start:])
for side in [-1,1]:
 part('head',uv,'Eye white',(side*.17,-.367,1.93),(.11,.045,.145),'White',24,16)
 part('head',uv,'Warm iris',(side*.17,-.405,1.92),(.072,.025,.102),'Hair',20,16)
 part('head',uv,'Eye glint',(side*.15,-.43,1.965),(.025,.012,.035),'White',12,8)
 part('head',uv,'Ear',(side*.47,0,1.88),(.08,.08,.12),'Skin')
 part('head',uv,'Cheek',(side*.29,-.35,1.78),(.07,.02,.035),'Pink',12,8)
 for bone,z,sz,ma in [('leg',.52,(.115,.12,.3),'Skin'),('leg',.25,(.125,.13,.16),'White'),('leg',.09,(.15,.25,.1),'Black')]:part(('left_' if side<0 else 'right_')+bone,uv,'Football kit '+bone,(side*.18,-.04 if z>.1 else -.12,z),sz,ma)
 bone=('left_' if side<0 else 'right_')+'arm'
 part(bone,uv,'Sleeve',(side*.43,0,1.28),(.15,.15,.2),'Faction');part(bone,uv,'Arm',(side*.48,-.01,1.05),(.1,.1,.22),'Skin');part(bone,uv,'Hand',(side*.49,-.02,.89),(.12,.105,.12),'Skin')
part('head',uv,'Nose',(0,-.4,1.82),(.055,.05,.055),'Skin')
# Original number seven on the back (real raised geometry).
part('spine',box,'Seven top',(0,.225,1.3),(.21,.02,.045),'Cream',.01)
o=part('spine',box,'Seven stem',(.035,.225,1.17),(.04,.02,.25),'Cream',.01);o.rotation_euler[1]=-.23
bpy.ops.object.armature_add(location=(0,0,0));rig=bpy.context.object;rig.name='FFC_Chibi_Rig';bpy.ops.object.mode_set(mode='EDIT');arm=rig.data;arm.edit_bones.remove(arm.edit_bones[0])
for name,head,tail,parent in [('root',(0,0,0),(0,0,.8),None),('spine',(0,0,.8),(0,0,1.5),'root'),('head',(0,0,1.5),(0,0,2.3),'spine'),('left_arm',(-.36,0,1.4),(-.48,0,.9),'spine'),('right_arm',(.36,0,1.4),(.48,0,.9),'spine'),('left_leg',(-.18,0,.8),(-.18,0,.1),'root'),('right_leg',(.18,0,.8),(.18,0,.1),'root')]:
 b=arm.edit_bones.new(name);b.head=head;b.tail=tail
 if parent:b.parent=arm.edit_bones[parent]
bpy.ops.object.mode_set(mode='OBJECT')
for name,obs in parts.items():
 for o in obs:
  g=o.vertex_groups.new(name=name);g.add(range(len(o.data.vertices)),1,'REPLACE');mod=o.modifiers.new('Skeletal deformation','ARMATURE');mod.object=rig;o.parent=rig
# Merge all pieces; weights survive joining and glTF remains a true SkinnedMesh.
bpy.ops.object.select_all(action='DESELECT')
for o in objects:o.select_set(True)
bpy.context.view_layer.objects.active=objects[0];bpy.ops.object.join();objects=[bpy.context.object];objects[0].name='FFC_Chibi_Skinned'
rig.animation_data_create()
for name in ['Idle','Walk','Run','Turn','Wave','Cheer','Laugh','Sad','Celebrate','Sit']:
 action=bpy.data.actions.new(name);rig.animation_data.action=action
 for f in [1,9,17,25,33]:
  phase=(f-1)/32*math.tau
  for p in rig.pose.bones:
   p.rotation_mode='XYZ';p.rotation_euler=(0,0,0);p.location=(0,0,0)
   if name in ['Walk','Run']:
    amount=.55 if name=='Walk' else .9
    if 'leg' in p.name:p.rotation_euler.x=math.sin(phase)*(1 if p.name.startswith('left') else -1)*amount
    if 'arm' in p.name:p.rotation_euler.x=math.sin(phase)*(1 if p.name.startswith('right') else -1)*amount*.7
    if p.name=='root':p.location.z=abs(math.sin(phase))* (.045 if name=='Walk' else .09)
   if name=='Idle' and p.name=='spine':p.rotation_euler.x=math.sin(phase)*.02
   if name in ['Wave','Cheer','Celebrate'] and 'arm' in p.name:p.rotation_euler.y=(1 if p.name.startswith('left') else -1)*(2.4+math.sin(phase)*.25)
   if name=='Wave' and p.name=='right_arm':p.rotation_euler.x=math.sin(phase)*.5
   if name=='Turn' and p.name=='spine':p.rotation_euler.z=math.sin(phase)*.35
   if name=='Laugh' and p.name=='head':p.rotation_euler.x=math.sin(phase*2)*.12
   if name=='Sad' and p.name=='head':p.rotation_euler.x=.25
   if name=='Sit' and 'leg' in p.name:p.rotation_euler.x=-1.2
   if name=='Sit' and p.name=='root':p.location.z=-.35
   if name=='Celebrate' and p.name=='root':p.location.z=abs(math.sin(phase))*.18
   p.keyframe_insert('rotation_euler',frame=f);p.keyframe_insert('location',frame=f)
 track=rig.animation_data.nla_tracks.new();track.name=name;strip=track.strips.new(name,1,action)
rig.animation_data.action=None;bpy.context.scene.frame_start=1;bpy.context.scene.frame_end=33
export('fan-chibi',rig)
print('FFC: authored assets exported to',OUT)
