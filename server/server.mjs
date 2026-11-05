import http from 'node:http';
import {DatabaseSync} from 'node:sqlite';
import {randomBytes,createHash,scrypt,timingSafeEqual} from 'node:crypto';
import {promisify} from 'node:util';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import fs from 'node:fs';
import {isIP} from 'node:net';
const require=createRequire(import.meta.url),G=require('../dist/clicker-core.js'),derive=promisify(scrypt);
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../dist');
const dbPath=process.env.JUSTIN_DB||path.join(path.dirname(fileURLToPath(import.meta.url)),'data/game.sqlite');
if(process.env.RAILWAY_ENVIRONMENT_ID){
 const mount=process.env.RAILWAY_VOLUME_MOUNT_PATH;
 if(!mount||!path.resolve(dbPath).startsWith(path.resolve(mount)+path.sep))throw Error('Attach a persistent Railway volume at /data before starting the public game.');
}
if(dbPath!==':memory:')fs.mkdirSync(path.dirname(dbPath),{recursive:true});
const db=new DatabaseSync(dbPath);db.exec('PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;');
db.exec(`CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY, username TEXT NOT NULL, username_key TEXT NOT NULL UNIQUE, salt TEXT NOT NULL, password_hash TEXT NOT NULL, created_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS sessions(token_hash TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id),csrf TEXT NOT NULL,expires INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS players(user_id TEXT PRIMARY KEY REFERENCES users(id),state TEXT NOT NULL,combo TEXT,lifetime REAL NOT NULL DEFAULT 0,pps REAL NOT NULL DEFAULT 0,goat INTEGER NOT NULL DEFAULT 0,best_combo INTEGER NOT NULL DEFAULT 0,updated_at INTEGER NOT NULL,active INTEGER NOT NULL DEFAULT 0,budget REAL NOT NULL DEFAULT 20,budget_at INTEGER NOT NULL,last_click INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS receipts(user_id TEXT NOT NULL,request_id TEXT NOT NULL,response TEXT NOT NULL,created_at INTEGER NOT NULL,PRIMARY KEY(user_id,request_id));`);
const port=Number(process.env.PORT||8765),host=process.env.HOST||'127.0.0.1',publicOrigin=process.env.PUBLIC_ORIGIN||(process.env.RAILWAY_PUBLIC_DOMAIN?`https://${process.env.RAILWAY_PUBLIC_DOMAIN}`:`http://127.0.0.1:${port}`);
if(host!=='127.0.0.1'&&!publicOrigin.startsWith('https://'))throw Error('A public server requires PUBLIC_ORIGIN=https://your-domain');
const secure=publicOrigin.startsWith('https://'),cookieName='justin_session',hash=s=>createHash('sha256').update(s).digest('hex');
const json=(res,status,data,headers={})=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store',...headers});res.end(JSON.stringify(data))};
const fail=(status,message)=>Object.assign(Error(message),{status});
const buckets=new Map();
// Railway's public HTTP edge replaces X-Real-IP with the client's address.
// Do not add a TCP proxy or untrusted services to this single-service deployment.
function clientAddress(req){const ip=req.headers['x-real-ip'];return process.env.RAILWAY_ENVIRONMENT_ID&&typeof ip==='string'&&isIP(ip)?ip:req.socket.remoteAddress}
function limit(key,max,windowMs){const now=Date.now(),entry=buckets.get(key);if(!entry||entry.until<now){buckets.set(key,{until:now+windowMs,count:1});return}if(++entry.count>max)throw fail(429,'Too many attempts. Please wait a few minutes.');}
setInterval(()=>{const now=Date.now();for(const [key,value]of buckets)if(value.until<now)buckets.delete(key);db.prepare('DELETE FROM sessions WHERE expires < ?').run(now);db.prepare('DELETE FROM receipts WHERE created_at < ?').run(now-86400000)},60000).unref();
async function body(req){if(!req.headers['content-type']?.startsWith('application/json'))throw fail(415,'Send JSON.');let size=0,chunks=[];for await(const chunk of req){size+=chunk.length;if(size>40000)throw fail(413,'Request is too large.');chunks.push(chunk)}try{return JSON.parse(Buffer.concat(chunks).toString())}catch{throw fail(400,'Invalid request.')}}
function session(req){const token=String(req.headers.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith(cookieName+'='))?.slice(cookieName.length+1);if(!token)return null;return db.prepare('SELECT s.*,u.username FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires>?').get(hash(token),Date.now())}
function cookie(value,seconds){return `${cookieName}=${value}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${seconds}${secure?'; Secure':''}`}
function issue(userId){const token=randomBytes(32).toString('hex'),csrf=randomBytes(24).toString('hex');db.prepare('INSERT INTO sessions VALUES(?,?,?,?)').run(hash(token),userId,csrf,Date.now()+7*86400000);return {csrf,cookie:cookie(token,7*86400)}}
function player(userId){return db.prepare('SELECT * FROM players WHERE user_id=?').get(userId)}
function publicPlayer(userId){const row=player(userId);return {state:G.clean(JSON.parse(row.state)),bestCombo:row.best_combo}}
function requireSession(req){const s=session(req);if(!s)throw fail(401,'Please log in again.');if(req.headers['x-csrf-token']!==s.csrf)throw fail(403,'Session check failed. Refresh and try again.');return s}
function originCheck(req){if(req.headers.origin!==publicOrigin)throw fail(403,'This request must come from the game website.');}
async function auth(req,res,mode){originCheck(req);limit('auth:'+clientAddress(req),20,600000);const data=await body(req),username=typeof data.username==='string'?data.username.trim():'',password=typeof data.password==='string'?data.password:'';
 if(!/^[A-Za-z0-9_]{3,20}$/.test(username))throw fail(400,'Use 3–20 letters, numbers, or underscores for your username.');
 if(password.length<10||password.length>128)throw fail(400,'Use a password between 10 and 128 characters.');
 const usernameKey=username.toLowerCase();let user=db.prepare('SELECT * FROM users WHERE username_key=?').get(usernameKey);
 if(mode==='register'){
  limit('register:'+clientAddress(req),5,3600000);if(user)throw fail(409,'That username is taken. Try another.');const id=randomBytes(16).toString('hex'),salt=randomBytes(16).toString('hex'),passwordHash=(await derive(password,salt,64,{N:32768,r:8,p:1,maxmem:67108864})).toString('hex'),now=Date.now();
  db.exec('BEGIN IMMEDIATE');try{db.prepare('INSERT INTO users VALUES(?,?,?,?,?,?)').run(id,username,usernameKey,salt,passwordHash,now);db.prepare('INSERT INTO players(user_id,state,updated_at,budget_at) VALUES(?,?,?,?)').run(id,JSON.stringify(G.fresh()),now,now);db.exec('COMMIT')}catch(error){db.exec('ROLLBACK');if(String(error).includes('UNIQUE'))throw fail(409,'That username is taken. Try another.');throw error}user={id,username};
 }else{
  const salt=user?.salt||'1'.repeat(32),candidate=await derive(password,salt,64,{N:32768,r:8,p:1,maxmem:67108864}),expected=Buffer.from(user?.password_hash||'0'.repeat(128),'hex');if(!timingSafeEqual(candidate,expected)||!user)throw fail(401,'Username or password is incorrect.');
 }
 const old=session(req);if(old)db.prepare('DELETE FROM sessions WHERE token_hash=?').run(old.token_hash);const issued=issue(user.id);json(res,200,{user:{id:user.id,username:user.username},csrf:issued.csrf,...publicPlayer(user.id),serverNow:Date.now()},{'Set-Cookie':issued.cookie});
}
function play(req,res,data,s){
 if(typeof data.requestId!=='string'||!/^[A-Za-z0-9-]{8,80}$/.test(data.requestId)||!Array.isArray(data.actions)||data.actions.length>100)throw fail(400,'Invalid game update.');
 const prior=db.prepare('SELECT response FROM receipts WHERE user_id=? AND request_id=?').get(s.user_id,data.requestId);if(prior){json(res,200,JSON.parse(prior.response));return}
 const now=Date.now(),row=player(s.user_id),state=G.clean(JSON.parse(row.state)),elapsed=(now-row.updated_at)/1000;let best=row.best_combo,combo=row.combo?JSON.parse(row.combo):null,budget=Math.min(25,row.budget+(now-row.budget_at)*.02),lastClick=row.last_click,rejected=0;
 if(row.active&&elapsed>=0&&elapsed<=5.5)G.earn(state,G.perSecond(state)*elapsed);
 for(const action of data.actions){if(action.kind==='click'){
   const at=Math.round(Number(action.at));if(!Number.isFinite(at)||at>now+500||at<now-15000||at<=lastClick||budget<1){rejected++;continue}budget--;lastClick=at;G.click(state);combo=G.comboHit(combo,at);best=Math.max(best,combo.count);
  }else if(action.kind==='skin'){if(!G.buySkin(state,action.id))rejected++}
  else if(action.kind==='business'){if(!G.buyBusiness(state,action.id))rejected++}
  else if(action.kind==='equip'){if(state.owned.includes(action.id))state.equipped=action.id;else rejected++}
  else throw fail(400,'Unknown game action.');
 }
 const result={...{state,bestCombo:best},rejected,serverNow:now};state.savedAt=now;
 db.exec('BEGIN IMMEDIATE');try{db.prepare('UPDATE players SET state=?,combo=?,lifetime=?,pps=?,goat=?,best_combo=?,updated_at=?,active=?,budget=?,budget_at=?,last_click=? WHERE user_id=?').run(JSON.stringify(state),JSON.stringify(combo),state.lifetime,G.perSecond(state),G.goatScore(state,best),best,now,data.active===true?1:0,budget,now,lastClick,s.user_id);db.prepare('INSERT INTO receipts VALUES(?,?,?,?)').run(s.user_id,data.requestId,JSON.stringify(result),now);db.exec('COMMIT')}catch(e){db.exec('ROLLBACK');throw e}json(res,200,result);
}
function leaderboard(req,res,url){const metric=url.searchParams.get('metric')||'lifetime',column={lifetime:'lifetime',pps:'pps',goat:'goat'}[metric];if(!column)throw fail(400,'Unknown leaderboard.');const query=`SELECT RANK() OVER(ORDER BY p.${column} DESC) AS rank,u.id,u.username,p.lifetime,p.pps,p.goat,p.best_combo,p.state FROM players p JOIN users u ON u.id=p.user_id ORDER BY p.${column} DESC,u.username_key ASC`;const rows=db.prepare(query).all().map(r=>({id:r.id,rank:r.rank,username:r.username,lifetime:r.lifetime,pps:r.pps,goat:r.goat,bestCombo:r.best_combo,faces:JSON.parse(r.state).owned.length}));const s=session(req);json(res,200,{metric,rows:rows.slice(0,100),total:rows.length,me:s?rows.find(r=>r.id===s.user_id):null,serverNow:Date.now()})}
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.mp3':'audio/mpeg','.wav':'audio/wav','.svg':'image/svg+xml'};
const server=http.createServer(async(req,res)=>{
 res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','strict-origin-when-cross-origin');res.setHeader('X-Frame-Options','DENY');
 try{const url=new URL(req.url,publicOrigin);
  // Railway probes this path with its own Host header. It exposes no player data.
  if(url.pathname==='/health'&&req.method==='GET'){db.prepare('SELECT 1').get();json(res,200,{ok:true});return}
  if(req.headers.host!==new URL(publicOrigin).host)throw fail(403,'Invalid host.');
  if(url.pathname==='/api/session'&&req.method==='GET'){const s=session(req);json(res,200,s?{user:{id:s.user_id,username:s.username},csrf:s.csrf,...publicPlayer(s.user_id),serverNow:Date.now()}:{user:null,serverNow:Date.now()});return}
  if(url.pathname==='/api/register'&&req.method==='POST'){await auth(req,res,'register');return}
  if(url.pathname==='/api/login'&&req.method==='POST'){await auth(req,res,'login');return}
  if(url.pathname==='/api/logout'&&req.method==='POST'){originCheck(req);const s=requireSession(req);db.prepare('UPDATE players SET active=0,updated_at=? WHERE user_id=?').run(Date.now(),s.user_id);db.prepare('DELETE FROM sessions WHERE token_hash=?').run(s.token_hash);json(res,200,{ok:true},{'Set-Cookie':cookie('',0)});return}
  if(url.pathname==='/api/play'&&req.method==='POST'){originCheck(req);const s=requireSession(req);limit('play:'+s.user_id,180,60000);const data=await body(req);play(req,res,data,s);return}
  if(url.pathname==='/api/leaderboard'&&req.method==='GET'){limit('board:'+clientAddress(req),240,60000);leaderboard(req,res,url);return}
  if(url.pathname.startsWith('/api/'))throw fail(404,'Unknown endpoint.');
  if(!['GET','HEAD'].includes(req.method))throw fail(405,'Method not allowed.');
  const pathname=decodeURIComponent(url.pathname),filename=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));if(!filename.startsWith(root+path.sep)||!fs.existsSync(filename)||!fs.statSync(filename).isFile())throw fail(404,'Not found.');res.writeHead(200,{'Content-Type':mime[path.extname(filename)]||'application/octet-stream','Cache-Control':'no-cache'});if(req.method==='HEAD')res.end();else fs.createReadStream(filename).pipe(res);
 }catch(error){if(!res.headersSent)json(res,error.status||500,{error:error.status?error.message:'The game server had a problem. Try again.'});else res.end()}
});
server.listen(port,host,()=>console.log(`Justin accounts + leaderboards: ${publicOrigin}`));
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>server.close(()=>{db.close();process.exit(0)}));
