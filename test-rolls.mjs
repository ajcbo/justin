import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {spawn} from 'node:child_process';
import {DatabaseSync} from 'node:sqlite';
import {mkdtemp,rm} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
const G=createRequire(import.meta.url)('./dist/progression-core.js'),P=G.Progression;
const s=G.fresh();s.levels.finger=1;s.levels.chat=2;s.owned.push('wide');
assert.equal(G.rebirthMultiplier(s),1);assert.equal(G.basePerClick(s),11);assert.equal(G.basePerSecond(s),2);
assert.equal(s.levels.finger,1);assert.equal(s.levels.chat,2);s.owned.push('fried');s.equipped='normal';assert.equal(G.basePerClick(s),13,'Owned Justins add click power; appearance is independent');
assert.equal(G.skins.find(x=>x.id==='pixel').cost,400);assert.equal(G.skins.find(x=>x.id==='hamster').cost,50000000);assert.ok(G.skins.find(x=>x.id==='chair').cost>50000000);
for(const [roll,skin]of [[0,'rainbow'],[.005,'diamond'],[.025,'platinum'],[.105,'gold'],[.15,null]]){const n=G.fresh();n.bank=P.boxCost;assert.equal(P.mysteryBox(n,Date.now(),roll).skin,skin);assert.equal(n.progress.boxes,1);assert.equal(n.levels.finger,0)}
const boxes=G.fresh();boxes.bank=1e6;for(let i=0;i<3;i++)assert.ok(P.mysteryBox(boxes,Date.now(),.99));assert.equal(P.mysteryBox(boxes,Date.now(),.99),null);assert.equal(P.mysteryBox(G.fresh(),Date.now(),0),null);
for(const [roll,skin]of [[0,'lucky-gold'],[.2,'diamond'],[.35,'platinum'],[.7,null]]){const n=G.fresh();n.clicks=5000;assert.equal(P.milestoneRoll(n,Date.now(),roll).skin,skin);assert.equal(P.milestoneRoll(n,Date.now(),0),null);assert.equal(P.milestoneRoll(G.clean(n),Date.now(),0),null)}
assert.equal(P.milestoneRoll(G.fresh(),Date.now(),0),null);

const directory=await mkdtemp(path.join(os.tmpdir(),'justin-rolls-test-')),file=path.join(directory,'test.sqlite'),origin='http://127.0.0.1:8788';
const server=spawn(process.execPath,['server/server.mjs'],{cwd:new URL('.',import.meta.url),env:{...process.env,PORT:'8788',PUBLIC_ORIGIN:origin,JUSTIN_DB:file},stdio:['ignore','pipe','pipe'],windowsHide:true});let db,cookie='',csrf='';
async function call(route,body){const r=await fetch(origin+route,{method:body?'POST':'GET',headers:{Origin:origin,...(cookie?{Cookie:cookie}:{}),...(body?{'Content-Type':'application/json','X-CSRF-Token':csrf}:{})},...(body?{body:JSON.stringify(body)}:{})});const d=await r.json();if(r.headers.has('set-cookie'))cookie=r.headers.get('set-cookie').split(';')[0];if(d.csrf)csrf=d.csrf;assert.equal(r.status,200,JSON.stringify(d));return d}
try{
 await new Promise((resolve,reject)=>{const t=setTimeout(()=>reject(Error('Startup timed out')),15000);server.stdout.on('data',c=>{if(String(c).includes('Justin accounts')){clearTimeout(t);resolve()}});server.once('error',reject)});
 const account=await call('/api/register',{username:'Roll_Test',password:'Local-roll-test-only!'});db=new DatabaseSync(file);
 const seed=G.fresh();seed.bank=1000000;seed.clicks=4999;P.prepare(seed);db.prepare('UPDATE players SET state=?,updated_at=? WHERE user_id=?').run(JSON.stringify(seed),Date.now(),account.user.id);
 const batch={requestId:'roll-milestone01',active:true,actions:[{kind:'click',at:Date.now()},{kind:'mystery-box',expectedCost:P.boxCost,roll:0,skin:'rainbow',cost:0}]};
 const result=await call('/api/play',batch);assert.equal(result.state.clicks,5000);assert.equal(result.state.progress.milestone,5000);assert.equal(result.state.progress.boxes,1);assert.equal(result.state.rollQueue.length,2,'Both cutscenes survive a combined batch');assert.equal(result.state.rollQueue[0].kind,'milestone');assert.equal(result.state.rollQueue[1].kind,'box');
 assert.equal(result.state.bank,1000002-P.boxCost+result.state.rollQueue.reduce((sum,r)=>sum+r.amount,0));
 assert.deepEqual(await call('/api/play',batch),result,'Retry cannot award or charge twice');
 for(const [id,expectedCost]of [['stale-price-0001',undefined],['forged-price-001',0]]){const stale=await call('/api/play',{requestId:id,actions:[{kind:'mystery-box',...(expectedCost===undefined?{}:{expectedCost})}]});assert.equal(stale.state.bank,result.state.bank,'Old/unconfirmed prices cannot charge a different amount');assert.equal(stale.state.progress.boxes,1);assert.equal(stale.rejected,1);assert.match(stale.notice,/pricing changed/)}
 const forged=await call('/api/play',{requestId:'roll-forged0001',actions:[],state:{clicks:10000,lastRoll:{skin:'rainbow'}},roll:0});assert.equal(forged.state.progress.milestone,5000);assert.equal(forged.state.rollQueue.length,2);
 const reborn=G.clean(forged.state);reborn.runPoints=1000000;reborn.bank=1000000;reborn.levels.finger=2;reborn.owned=[...new Set([...reborn.owned,'pixel','diamond'])];db.prepare('UPDATE players SET state=? WHERE user_id=?').run(JSON.stringify(reborn),account.user.id);
 const rebirthBody={requestId:'rebirth-test-001',actions:[{kind:'rebirth',count:0,confirm:'REBIRTH'}],active:true};const done=await call('/api/play',rebirthBody);assert.equal(done.state.rebirths,1);assert.equal(done.state.bank,0);assert.equal(done.state.runPoints,0);assert.equal(done.state.levels.finger,0);assert.ok(!done.state.owned.includes('pixel'));assert.ok(done.state.owned.includes('diamond'));assert.equal(done.state.clicks,5000);assert.equal(done.state.progress.boxes,1);assert.equal(G.rebirthMultiplier(done.state),1.5);assert.deepEqual(await call('/api/play',rebirthBody),done);
 const again=await call('/api/play',{requestId:'rebirth-test-002',actions:[{kind:'rebirth',count:0,confirm:'REBIRTH'}]});assert.equal(again.rejected,1);assert.equal(again.state.rebirths,1);
 console.log('Additive Justins, rebirth resets/preservation, server eligibility, retry safety passed.');
 console.log('Additive character boosts, unchanged gear counts, restored prices, higher-tier variants, exact loot boundaries, box costs/limits, single-use milestones, queued results, server randomness and retry safety passed.');
}finally{db?.close();if(server.exitCode===null)await new Promise(resolve=>{server.once('exit',resolve);server.kill('SIGTERM')});if(!path.resolve(directory).startsWith(path.resolve(os.tmpdir())+path.sep+'justin-rolls-test-'))throw Error('Unexpected cleanup directory');await rm(directory,{recursive:true,force:true})}
