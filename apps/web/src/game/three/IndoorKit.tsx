import { useEffect, useMemo } from 'react';
import { CuboidCollider, RigidBody } from '@react-three/rapier';
import { useThree } from '@react-three/fiber';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import * as THREE from 'three';
import { Box, Label, Torch } from './Models';
import { sceneBounds, sceneObstacles, type SceneId } from './worldLayout';

export type V3 = [number, number, number];
export const GOLD = '#d9a441';
/** Small object labels are canvas textures; the architecture and exhibits are meshes. */
export function Plaque({ lines, width = 4, height = 1.5, position = [0, 0, 0], dark = false }: {
  lines: string[]; width?: number; height?: number; position?: V3; dark?: boolean;
}) {
  const texture = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = 1024; c.height = Math.round(1024 * height / width);
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = dark ? '#171119' : '#5b1723'; ctx.fillRect(0, 0, c.width, c.height);
    ctx.strokeStyle = '#d5a34c'; ctx.lineWidth = 10; ctx.strokeRect(8, 8, c.width - 16, c.height - 16);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    lines.forEach((line, i) => {
      ctx.fillStyle = i === 0 ? '#ffdb83' : '#f1e0bf';
      ctx.font = `${i === 0 ? 'bold ' : ''}${Math.min(76, (c.height - 35) / lines.length * .68)}px Arial`;
      ctx.fillText(line, 512, 20 + (c.height - 40) / lines.length * (i + .5), 950);
    });
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  }, [lines.join('|'), width, height, dark]);
  useEffect(() => () => texture.dispose(), [texture]);
  return <group position={position}>
    <Box size={[width + .1, height + .1, .18]} color={GOLD} />
    <mesh position={[0, 0, .1]}><planeGeometry args={[width, height]} /><meshBasicMaterial map={texture} /></mesh>
  </group>;
}
export function IndoorLight({ museum = false }: { museum?: boolean }) {
  const { gl, scene } = useThree();
  useEffect(() => {
    const generator = new THREE.PMREMGenerator(gl), room = new RoomEnvironment();
    const target = generator.fromScene(room, .04), previous = scene.environment;
    scene.environment = target.texture;
    return () => { scene.environment = previous; target.dispose(); generator.dispose(); room.dispose(); };
  }, [gl, scene]);
  return <>
    <color attach="background" args={[museum ? '#21151d' : '#1c101d']} />
    <fog attach="fog" args={[museum ? '#291d25' : '#27131c', 27, 72]} />
    <hemisphereLight args={['#f6d5c4', '#482137', museum ? 1.2 : .85]} />
    <directionalLight position={[3, 10, 7]} color="#ffe1b6" intensity={1.7} />
    {[[-10, -10], [10, -10], [-10, 8], [10, 8]].map(([x,z],i) =>
      <pointLight key={i} position={[x, 5.5, z]} color={museum ? '#ffc779' : '#ff7850'} intensity={150} distance={28} decay={2} />)}
  </>;
}
export function IndoorShell({ map, museum = false }: { map: SceneId; museum?: boolean }) {
  const b = sceneBounds(map), w = b.right - b.left, d = b.bottom - b.top, cx = (b.left + b.right) / 2, cz = (b.top + b.bottom) / 2;
  return <group name={`${map}-shell`}>
    <RigidBody type="fixed" colliders={false}>
      <CuboidCollider args={[w/2+.8, .4, d/2+.8]} position={[cx,-.4,cz]} />
      <CuboidCollider args={[.4,6,d/2+.8]} position={[b.left-.4,6,cz]} />
      <CuboidCollider args={[.4,6,d/2+.8]} position={[b.right+.4,6,cz]} />
      <CuboidCollider args={[w/2+.8,6,.4]} position={[cx,6,b.top-.4]} />
      <CuboidCollider args={[w/2+.8,6,.4]} position={[cx,6,b.bottom+.4]} />
      <CuboidCollider args={[w/2+.8,.3,d/2+.8]} position={[cx,11.8,cz]} />
    </RigidBody>
    <Box position={[cx,-.2,cz]} size={[w,.4,d]} color={museum ? '#362b30' : '#443139'} solid={false} />
    {[b.left-.4,b.right+.4].map(x => <Box key={x} position={[x,5.9,cz]} size={[.8,11.8,d+1]} color={museum ? '#46232d' : '#402430'} />)}
    {[b.top-.4,b.bottom+.4].map(z => <Box key={z} position={[cx,5.9,z]} size={[w+1,11.8,.8]} color={museum ? '#512333' : '#402430'} />)}
    <Box position={[cx,12,cz]} size={[w+1,.6,d+1]} color="#261a26" />
    {/* Instanced paving gives a real broken-stone floor with hundreds of independently lit tiles. */}
    <Paving bounds={b} museum={museum} />
    {museum && [b.left+.16,b.right-.16].map(x => <group key={x}>
      <Box position={[x,.5,cz]} size={[.22,.2,d]} color={GOLD} />
      <Box position={[x,8.2,cz]} size={[.22,.15,d]} color={GOLD} />
    </group>)}
  </group>;
}
function Paving({ bounds:b, museum }: { bounds: ReturnType<typeof sceneBounds>; museum: boolean }) {
  const tiles = useMemo(() => {
    const matrices: THREE.Matrix4[] = [], colors: THREE.Color[] = [];
    for(let x=b.left+.7;x<b.right-.6;x+=1.4) for(let z=b.top+.7;z<b.bottom-.6;z+=1.4){
      matrices.push(new THREE.Matrix4().makeScale(1.36,.025,1.36).setPosition(x,.01,z));
      colors.push(new THREE.Color(museum ? '#958080' : '#79616a').multiplyScalar(.7+(Math.sin(x*35+z*19)+1)*.12));
    }
    return {matrices,colors};
  },[b.left,b.right,b.top,b.bottom,museum]);
  return <instancedMesh args={[undefined,undefined,tiles.matrices.length]} receiveShadow ref={mesh=>{
    if(!mesh)return;tiles.matrices.forEach((m,i)=>{mesh.setMatrixAt(i,m);mesh.setColorAt(i,tiles.colors[i]);});mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;
  }}><boxGeometry/><meshStandardMaterial roughness={museum?.36:.92} metalness={museum?.25:0}/></instancedMesh>;
}
/** One source of footprints for the renderer, Rapier and the existing room server. */
export function InteriorColliders({ map }: { map: SceneId }) {
  return <RigidBody type="fixed" colliders={false}>{sceneObstacles(map).map(o =>
    <CuboidCollider key={o.index} args={[o.w/2, o.height/2, o.d/2]} position={[o.x,o.height/2,o.z]} />
  )}</RigidBody>;
}
export function Doorway({ position, title, subtitle, rotation=0, width=4 }: { position:V3; title:string; subtitle:string; rotation?:number; width?:number }) {
  return <group position={position} rotation={[0,rotation,0]}>
    {[-1,1].map(s=><group key={s}>
      <Box position={[s*(width/2+.3),2.4,0]} size={[.6,4.8,1]} color="#762b34" />
      <Box position={[s*(width/2+.3),.2,0]} size={[.95,.4,1.3]} color={GOLD}/>
      <Torch position={[s*(width/2+.8),1.2,.65]}/>
    </group>)}
    <mesh position={[0,4.7,0]} userData={{cameraSolid:true}}><torusGeometry args={[width/2+.3,.35,6,20,Math.PI]}/><meshStandardMaterial color={GOLD} metalness={.65} roughness={.3}/></mesh>
    <Plaque lines={[title,subtitle]} position={[0,6.15,.1]} width={width+2} height={1.25}/>
    <mesh rotation={[-Math.PI/2,0,0]} position={[0,.045,0]}><ringGeometry args={[.8,1.3,32]}/><meshBasicMaterial color="#ffc56a" transparent opacity={.7}/></mesh>
  </group>;
}
export function Banner({ position, rotation=0 }: {position:V3;rotation?:number}) {
  return <group position={position} rotation={[0,rotation,0]}>
    <Box size={[1.8,3.8,.1]} color="#9c1832" />
    <Box position={[0,2,0]} size={[2.2,.14,.2]} color={GOLD}/>
    <Trident position={[0,-.7,.12]} scale={.65}/>
    <Label text="UNITED" position={[0,1.3,.07]} width={1.55} background="#8e1527" />
  </group>;
}
export function Trident({ position, scale=1 }: {position:V3;scale?:number}) {
  return <group position={position} scale={scale}>
    <Box position={[0,1,0]} size={[.12,2.8,.12]} color={GOLD} solid={false}/>
    <Box position={[0,1.3,0]} size={[1.5,.12,.12]} color={GOLD} solid={false}/>
    {[-1,0,1].map(s=><group key={s} position={[s*.7,1.9,0]}>
      <Box size={[.12,1.2,.12]} color={GOLD} solid={false}/>
      <mesh position={[0,.8,0]}><coneGeometry args={[.19,.5,4]}/><meshStandardMaterial color="#f6b456" emissive="#c8510a" emissiveIntensity={.6} metalness={.5}/></mesh>
    </group>)}
  </group>;
}
