// Isolated local Auth/PostgREST test double. Production auth.ts is imported unchanged by the server.
import { createServer } from 'node:http';
import { createHmac,createHash,timingSafeEqual } from 'node:crypto';
const secret='football-fan-cave-isolated-test-fixture-only';
const encode=(v:unknown)=>Buffer.from(JSON.stringify(v)).toString('base64url');
export function testSession(name='Fan QA') {
 const hash=createHash('sha256').update(name).digest('hex');
 const id=`${hash.slice(0,8)}-${hash.slice(8,12)}-4${hash.slice(13,16)}-a${hash.slice(17,20)}-${hash.slice(20,32)}`;
 const exp=Math.floor(Date.now()/1000)+3600;
 const payload=encode({sub:id,exp,role:'authenticated',nickname:name,aud:'authenticated'}),prefix=`${encode({alg:'HS256',typ:'JWT'})}.${payload}`;
 const token=`${prefix}.${createHmac('sha256',secret).update(prefix).digest('base64url')}`;
 const user={id,aud:'authenticated',role:'authenticated',email:`${hash.slice(0,12)}@fixture.invalid`,email_confirmed_at:new Date().toISOString(),is_anonymous:false,app_metadata:{provider:'email',providers:['email']},user_metadata:{nickname:name},identities:[],created_at:new Date().toISOString()};
 return {access_token:token,refresh_token:'test-only-refresh',token_type:'bearer',expires_in:3600,expires_at:exp,user};
}
function verify(header:string|undefined) {
 const token=header?.replace(/^Bearer /,'')||'',pieces=token.split('.');if(pieces.length!==3)throw new Error('INVALID');
 const signature=createHmac('sha256',secret).update(`${pieces[0]}.${pieces[1]}`).digest();const actual=Buffer.from(pieces[2],'base64url');if(actual.length!==signature.length||!timingSafeEqual(actual,signature))throw new Error('INVALID');
 const data=JSON.parse(Buffer.from(pieces[1],'base64url').toString());if(data.exp*1000<Date.now())throw new Error('EXPIRED');return data;
}
export async function startAuthFixture(port=0){
 const server=createServer((req,res)=>{
 res.setHeader('Access-Control-Allow-Origin','*');res.setHeader('Access-Control-Allow-Headers','authorization,apikey,x-client-info,content-type');res.setHeader('Access-Control-Allow-Methods','GET,POST,OPTIONS');res.setHeader('Content-Type','application/json');
 if(req.method==='OPTIONS'){res.writeHead(204);res.end();return;}
 try{const claims=verify(req.headers.authorization);const session=testSession(claims.nickname);
 if(req.url?.startsWith('/auth/v1/user'))res.end(JSON.stringify(session.user));
 else if(req.url?.startsWith('/rest/v1/profiles'))res.end(JSON.stringify({id:claims.sub,nickname:claims.nickname,favorite_team:'united',avatar_key:0}));
 else {res.writeHead(404);res.end('{}');}
 }catch{res.writeHead(401);res.end(JSON.stringify({message:'Invalid fixture token'}));}
 });
 await new Promise<void>(resolve=>server.listen(port,'127.0.0.1',resolve));
 const address=server.address() as {port:number};
 return {server,url:`http://127.0.0.1:${address.port}`,close:()=>new Promise<void>(resolve=>server.close(()=>resolve()))};
}
