import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {spawn} from 'node:child_process';
import {DatabaseSync} from 'node:sqlite';
import {mkdtemp,rm} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
const G=createRequire(import.meta.url)('./dist/clicker-core.js');

function tapping(cps){const s=G.fresh();for(let t=1000;t<61000;t+=1000/cps)G.rewardClick(s,t);return s}
const relaxed=tapping(2),fast=tapping(6),automated=tapping(20);
assert.equal(relaxed.clicks,120);
assert.ok(automated.lifetime/fast.lifetime<1.25,'Automation has at most a small advantage over six taps/sec');
assert.ok(automated.clicks<=fast.clicks+6,'Golden milestone speed stays within the six-tap burst allowance');
const roundTrip=G.clean(JSON.parse(JSON.stringify(automated)));
assert.equal(roundTrip.tapMeter.tokens,automated.tapMeter.tokens,'Reconciliation cannot refill tap budget');
const beginner=G.fresh();for(let t=1000;t<31000;t+=500)G.rewardClick(beginner,t);
assert.ok(G.buyBusiness(beginner,'finger'),'First gear is affordable in 30 seconds at two taps/sec');
const target=G.fresh();G.scheduleCritical(target,1000,()=> 'test-target');
assert.equal(target.critical,null);G.scheduleCritical(target,10999,()=> 'test-target');assert.equal(target.critical,null,'Target cannot spawn before ten seconds');G.scheduleCritical(target,11000,()=> 'test-target');assert.equal(target.nextCriticalAt,21000);
const c={...target.critical};assert.equal(c.bonus,20);
for(const [at,hit] of [[c.opens-1,{targetId:c.id,x:c.x,y:c.y}],[c.opens,{targetId:c.id,x:0,y:0}],[c.opens,{targetId:'forged',x:c.x,y:c.y}],[c.expires+1,{targetId:c.id,x:c.x,y:c.y}]])assert.equal(G.claimCritical(target,hit,at),0);
target.levels.finger=3;
const critical=G.rewardClick(target,c.opens,{targetId:c.id,x:c.x,y:c.y});
assert.equal(critical.bonus,20);assert.equal(critical.amount,84);
assert.equal(G.rewardClick(target,c.opens+200,{targetId:c.id,x:c.x,y:c.y}).bonus,0,'One reward per target');
for(let i=2;i<=5;i++){G.scheduleCritical(target,11000+(i-1)*10000,()=>String(i));assert.equal(target.critical.bonus,i===5?50:20);target.critical=null}

const directory=await mkdtemp(path.join(os.tmpdir(),'justin-balance-test-')),file=path.join(directory,'test.sqlite'),origin='http://127.0.0.1:8784';
const server=spawn(process.execPath,['server/server.mjs'],{cwd:new URL('.',import.meta.url),env:{...process.env,PORT:'8784',PUBLIC_ORIGIN:origin,JUSTIN_DB:file},stdio:['ignore','pipe','pipe'],windowsHide:true});
let db,cookie='',csrf='';
async function call(route,body){const response=await fetch(origin+route,{method:body?'POST':'GET',headers:{Origin:origin,...(cookie?{Cookie:cookie}:{}),...(body?{'Content-Type':'application/json','X-CSRF-Token':csrf}:{})},...(body?{body:JSON.stringify(body)}:{})});const data=await response.json();if(response.headers.has('set-cookie'))cookie=response.headers.get('set-cookie').split(';')[0];if(data.csrf)csrf=data.csrf;assert.equal(response.status,200,JSON.stringify(data));return data}
try{
 await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Startup timed out')),15000);server.stdout.on('data',c=>{if(String(c).includes('Justin accounts')){clearTimeout(timer);resolve()}});server.once('error',reject)});
 const user=await call('/api/register',{username:'Balance_Test',password:'Local-balance-test-only!'});db=new DatabaseSync(file);
 const seed=G.fresh(),now=Date.now();seed.nextCriticalAt=now-1;
 db.prepare('UPDATE players SET state=?,updated_at=? WHERE user_id=?').run(JSON.stringify(seed),now,user.user.id);
 const session=await call('/api/session'),challenge=session.state.critical;
 assert.ok(challenge,'Server issues a target');assert.equal(challenge.bonus,20);
 // Fixed client time stays inside the existing 500ms server tolerance.
 const hit={kind:'click',at:challenge.opens,targetId:challenge.id,x:challenge.x,y:challenge.y,bonus:1e12,amount:1e12};
 const result=await call('/api/play',{requestId:'critical-server-01',active:true,actions:[hit,{...hit,at:hit.at+1}]});
 assert.equal(result.state.bank,22,'Client reward fields ignored; target cannot be claimed twice');
 assert.equal(result.state.critical,null);
 const replay=await call('/api/play',{requestId:'critical-server-01',active:true,actions:[hit]});assert.deepEqual(replay,result,'Retry cannot repeat a critical payout');
 const invalid=await call('/api/play',{requestId:'critical-server-02',active:true,actions:[{kind:'click',at:hit.at+2,targetId:'invented',x:.5,y:.4,bonus:1e12}]});
 assert.equal(invalid.state.bank,23,'Invented targets never grant bonuses');
 console.log('Beginner affordability, diminishing click rewards, Golden milestone fairness, deterministic skill targets, coordinate/time checks, server authority and retry safety passed.');
}finally{
 db?.close();if(server.exitCode===null)await new Promise(resolve=>{server.once('exit',resolve);server.kill('SIGTERM')});
 if(!path.resolve(directory).startsWith(path.resolve(os.tmpdir())+path.sep+'justin-balance-test-'))throw Error('Unexpected cleanup directory');
 await rm(directory,{recursive:true,force:true});
}

