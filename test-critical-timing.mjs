import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {spawn} from 'node:child_process';
import {DatabaseSync} from 'node:sqlite';
import {mkdtemp,rm} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
const G=createRequire(import.meta.url)('./dist/progression-core.js'),P=G.criticalPeriod;

// Grades depend only on the press time relative to the target's own open time.
const target={id:'t',x:.5,y:.16,bonus:20,opens:10000,expires:15000};
assert.equal(G.criticalGrade(target,10000).grade,'good','Pressing the instant a target opens is not a timing hit');
assert.equal(G.criticalGrade(target,10000+P).grade,'perfect');
assert.equal(G.criticalGrade(target,10000+P+90).grade,'perfect');
assert.equal(G.criticalGrade(target,10000+P-91).grade,'great');
assert.equal(G.criticalGrade(target,10000+2*P+220).grade,'great');
assert.equal(G.criticalGrade(target,10000+2*P+221).grade,'good');
assert.equal(G.criticalGrade(target,10000+P*1.5).grade,'good');
const grade=(at,bonus=20)=>{const s=G.fresh();s.critical={...target,bonus};const r=G.rewardClick(s,at,{targetId:'t',x:.5,y:.16});return [r.bonus,r.grade,s.critical,s.critHits]};
assert.deepEqual(grade(10000+P),[40,'perfect',null,1],'Perfect doubles the bonus and still counts once toward critical challenges');
assert.deepEqual(grade(10000+P+150),[30,'great',null,1]);
assert.deepEqual(grade(10000+P*1.5),[20,'good',null,1]);
assert.deepEqual(grade(10000+P,50),[100,'perfect',null,1],'Every fifth target scales the same way');
assert.deepEqual(grade(15001),[0,null,{...target},0],'Expired targets pay nothing and stay unclaimed');
const plain=G.fresh();assert.equal(G.rewardClick(plain,1000).grade,null,'Ordinary clicks have no grade');
for(let cycle=1;cycle<=10;cycle++){const s=G.fresh();s.criticalCycle=cycle-1;G.scheduleCritical(s,s.nextCriticalAt=5000,()=>'x');const c=s.critical;assert.ok(c.x>=.1&&c.x<=.9&&c.y>=.12&&c.y<=.85,'Targets remain inside the saved-target bounds');assert.ok(!(Math.abs(c.x-.5)<.12&&Math.abs(c.y-.5)<.15),'No target spawns on Justin\'s face')}

// The live server grades the same timestamp and ignores any client-supplied grade or bonus.
const directory=await mkdtemp(path.join(os.tmpdir(),'justin-critical-test-')),file=path.join(directory,'test.sqlite'),origin='http://127.0.0.1:8792';
const server=spawn(process.execPath,['server/server.mjs'],{cwd:new URL('.',import.meta.url),env:{...process.env,PORT:'8792',PUBLIC_ORIGIN:origin,JUSTIN_DB:file},stdio:['ignore','pipe','pipe'],windowsHide:true});
let db,cookie='',csrf='';
async function call(route,body){const response=await fetch(origin+route,{method:body?'POST':'GET',headers:{Origin:origin,...(cookie?{Cookie:cookie}:{}),...(body?{'Content-Type':'application/json','X-CSRF-Token':csrf}:{})},...(body?{body:JSON.stringify(body)}:{})});const data=await response.json();if(response.headers.has('set-cookie'))cookie=response.headers.get('set-cookie').split(';')[0];if(data.csrf)csrf=data.csrf;assert.equal(response.status,200,JSON.stringify(data));return data}
const wait=ms=>new Promise(resolve=>setTimeout(resolve,Math.max(0,ms)));
try{
 await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Startup timed out')),15000);server.stdout.on('data',c=>{if(String(c).includes('Justin accounts')){clearTimeout(timer);resolve()}});server.once('error',reject)});
 const user=await call('/api/register',{username:'Timing_Test',password:'Local-timing-test-only!'});db=new DatabaseSync(file);
 async function issue(){const seed=G.fresh(),now=Date.now();seed.nextCriticalAt=now-1;seed.lifetime=3e6;db.prepare('UPDATE players SET state=?,updated_at=?,budget=25,budget_at=? WHERE user_id=?').run(JSON.stringify(seed),now,now,user.user.id);const session=await call('/api/session');assert.ok(session.state.critical,'Server issues a target');return session.state.critical}
 let c=await issue();await wait(c.opens+P-Date.now());
 let result=await call('/api/play',{requestId:'timing-perfect-01',active:true,actions:[{kind:'click',at:c.opens+P,targetId:c.id,x:c.x,y:c.y,bonus:1e9,grade:'perfect'}]});
 assert.equal(result.state.bank,41,'Perfect timing pays 1 + 2×20 clicks on the server');assert.equal(result.state.critHits,1);
 c=await issue();await wait(c.opens+P+160-Date.now());
 result=await call('/api/play',{requestId:'timing-great-01',active:true,actions:[{kind:'click',at:c.opens+P+160,targetId:c.id,x:c.x,y:c.y,grade:'perfect'}]});
 assert.equal(result.state.bank,31,'A claimed grade is ignored; the server recomputes great timing');
 c=await issue();await wait(c.opens+P*1.5-Date.now());
 result=await call('/api/play',{requestId:'timing-good-01',active:true,actions:[{kind:'click',at:c.opens+P*1.5,targetId:c.id,x:c.x,y:c.y}]});
 assert.equal(result.state.bank,21,'Off-beat presses still earn the base critical bonus');
 console.log('Critical timing grades (perfect/great/good), exact server recomputation, forged grade rejection, single claim per target and off-face target positions passed.');
}finally{
 db?.close();if(server.exitCode===null)await new Promise(resolve=>{server.once('exit',resolve);server.kill('SIGTERM')});
 if(!path.resolve(directory).startsWith(path.resolve(os.tmpdir())+path.sep+'justin-critical-test-'))throw Error('Unexpected cleanup directory');
 await rm(directory,{recursive:true,force:true});
}
