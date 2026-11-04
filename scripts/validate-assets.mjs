import fs from 'node:fs';
import {createHash} from 'node:crypto';
const manifest=[];
const files=fs.readdirSync('apps/web/public/models').filter(f=>f.endsWith('.glb'));
let failed=false;
for(const file of files){const b=fs.readFileSync('apps/web/public/models/'+file),len=b.readUInt32LE(12),g=JSON.parse(b.subarray(20,20+len).toString()),start=20+len+8;
 let invalid=0,triangles=0;
 for(const a of g.accessors||[]){if(a.componentType!==5126||a.bufferView===undefined)continue;const v=g.bufferViews[a.bufferView];const size={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT4:16}[a.type];for(let i=0;i<a.count;i++)for(let k=0;k<size;k++){const offset=start+(v.byteOffset||0)+(a.byteOffset||0)+i*(v.byteStride||size*4)+k*4;if(!Number.isFinite(b.readFloatLE(offset)))invalid++;}}
 for(const m of g.meshes||[])for(const p of m.primitives){triangles+=(p.indices!==undefined?g.accessors[p.indices].count:g.accessors[p.attributes.POSITION].count)/3;}
 const clips=(g.animations||[]).map(a=>a.name);
 const entry={file,bytes:b.length,sha256:createHash('sha256').update(b).digest('hex'),triangles:Math.round(triangles),meshes:g.meshes?.length,skins:g.skins?.length||0,textures:g.textures?.length||0,clips,invalid,source:'scripts/models/build_assets.py',license:'original-project-kit'};manifest.push(entry);console.log(JSON.stringify(entry));if(invalid)failed=true;
 if(file==='fan-chibi.glb'&&(!g.skins?.length||['Idle','Walk','Run','Turn','Wave','Cheer','Laugh','Sad','Celebrate'].some(n=>!clips.includes(n))))failed=true;
}
if(process.argv.includes('--write'))fs.writeFileSync('assets/models/manifest.json',JSON.stringify({authoring:'Blender 4.3.2',assets:manifest},null,2));
process.exitCode=failed?1:0;
