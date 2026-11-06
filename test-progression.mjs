import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {spawn} from 'node:child_process';
import {DatabaseSync} from 'node:sqlite';
import {mkdtemp,rm} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
const G=createRequire(import.meta.url)('./dist/progression-core.js'),P=G.Progression,ms=86400000;
const reset=Date.UTC(2026,10,6,16);assert.notEqual(P.day(reset-1),P.day(reset));assert.equal(P.nextDay(reset-1),reset);
const s=G.fresh();
for(let i=0;i<90;i++){const at=reset+i*ms;assert.ok(P.gift(s,at,.9));assert.equal(P.gift(s,at,.001),null);if(i===5)assert.ok(!s.owned.includes('platinum'));if(i===6)assert.ok(s.owned.includes('platinum'));if(i===29)assert.ok(s.owned.includes('diamond'))}
assert.ok(s.owned.includes('rainbow'));assert.equal(s.progress.gifts,90);
const restored=G.clean(JSON.parse(JSON.stringify(s)));assert.equal(restored.progress.gifts,90);assert.equal(P.gift(restored,reset+89*ms,0),null);
for(const [roll,id]of [[0,'rainbow'],[.02,'diamond'],[.10,'platinum'],[.299999,'platinum']]){const n=G.fresh();P.gift(n,reset,roll);assert.ok(n.owned.includes(id));assert.equal(G.basePerClick(n),1+G.skins.find(x=>x.id===id).power,'Justin adds click power')}
const common=G.fresh();P.gift(common,reset,.40);assert.equal(common.owned.length,1);common.bank=0;assert.equal(G.buySkin(common,'diamond'),false);common.bank=300000000;assert.equal(G.buySkin(common,'diamond'),false);
const week=G.fresh(),weekStart=(P.day(reset)-P.day(reset)%7)*ms-8*3600000+1000;for(const d of [0,1,3,5,6])P.gift(week,weekStart+d*ms,.9);assert.equal(week.progress.weekDays.length,5);assert.equal(week.progress.weekBonus,true);assert.equal(week.progress.gifts,5);
for(let i=0;i<3;i++){const goals=P.tasksAt(reset+i*ms);assert.ok(goals[0].goal>=500&&goals[0].goal<=1000);assert.ok(goals[1].goal>=20&&goals[1].goal<=30);assert.ok(goals[2].goal>=10&&goals[2].goal<=15);const state=G.fresh();P.prepare(state,reset+i*ms);state.clicks=goals[0].goal-1;assert.equal(P.task(state,'tap',reset+i*ms),null,'Harder goal must be met before claiming');state.clicks++;assert.ok(P.task(state,'tap',reset+i*ms))}
const tasks=G.fresh();P.prepare(tasks,reset);assert.equal(P.task(tasks,'tap',reset),null);tasks.clicks=P.tasksAt(reset).find(t=>t.id==='tap').goal;assert.ok(P.task(tasks,'tap',reset));assert.equal(P.task(tasks,'tap',reset),null);P.prepare(tasks,reset+ms);assert.equal(P.task(tasks,'tap',reset+ms),null);
const event=G.fresh(),hour=Math.floor(reset/3600000)*3600000;assert.ok(P.catchJustin(event,0,hour+100));assert.equal(P.catchJustin(event,0,hour+101),null);assert.equal(P.catchJustin(event,1,hour+120000),null);assert.equal(P.catchJustin(event,4,hour+100),null);
assert.equal(P.community(event,1e6,50000,hour),null);event.clicks=1;assert.ok(P.community(event,50000,50000,hour));assert.ok(event.owned.includes('party'));assert.equal(P.community(event,50000,50000,hour),null);

const directory=await mkdtemp(path.join(os.tmpdir(),'justin-progression-test-')),file=path.join(directory,'test.sqlite'),origin='http://127.0.0.1:8786';
const server=spawn(process.execPath,['server/server.mjs'],{cwd:new URL('.',import.meta.url),env:{...process.env,PORT:'8786',PUBLIC_ORIGIN:origin,JUSTIN_DB:file},stdio:['ignore','pipe','pipe'],windowsHide:true});
let db,cookie='',csrf='';
async function call(route,body){const r=await fetch(origin+route,{method:body?'POST':'GET',headers:{Origin:origin,...(cookie?{Cookie:cookie}:{}),...(body?{'Content-Type':'application/json','X-CSRF-Token':csrf}:{})},...(body?{body:JSON.stringify(body)}:{})});const d=await r.json();if(r.headers.has('set-cookie'))cookie=r.headers.get('set-cookie').split(';')[0];if(d.csrf)csrf=d.csrf;assert.equal(r.status,200,JSON.stringify(d));return d}
try{
 await new Promise((resolve,reject)=>{const t=setTimeout(()=>reject(Error('Startup timed out')),15000);server.stdout.on('data',c=>{if(String(c).includes('Justin accounts')){clearTimeout(t);resolve()}});server.once('error',reject)});
 const user=await call('/api/register',{username:'Rewards_Test',password:'Local-rewards-test-only!'});db=new DatabaseSync(file);
 const gift=await call('/api/play',{requestId:'daily-gift-test01',active:true,actions:[{kind:'daily-gift',roll:0,amount:1e12,giftDay:0}]});assert.equal(gift.state.progress.gifts,1);assert.ok(gift.state.bank>=70&&gift.state.bank<1000);
 const retry=await call('/api/play',{requestId:'daily-gift-test01',active:true,actions:[{kind:'daily-gift'}]});assert.deepEqual(retry,gift);
 const duplicate=await call('/api/play',{requestId:'daily-gift-test02',active:true,actions:[{kind:'daily-gift'},{kind:'challenge',id:'tap'},{kind:'book-reward',count:20},{kind:'community-reward',goal:50000}]});assert.equal(duplicate.rejected,4);assert.equal(duplicate.state.bank,gift.state.bank);
 const session=await call('/api/session');assert.equal(session.state.progress.gifts,1);
 const at=Date.now(),click=await call('/api/play',{requestId:'community-click1',active:true,actions:[{kind:'click',at}]});
 const total=await call('/api/community');assert.equal(total.total,1);assert.equal(total.state,undefined);
 await call('/api/play',{requestId:'community-click1',active:true,actions:[{kind:'click',at}]});assert.equal((await call('/api/community')).total,1);
 db.prepare('UPDATE community_progress SET total=50000 WHERE epoch=1').run();
 const reward=await call('/api/play',{requestId:'community-prize1',active:true,actions:[{kind:'community-reward',goal:50000}]});assert.ok(reward.state.owned.includes('party'));
 const double=await call('/api/play',{requestId:'community-prize2',active:true,actions:[{kind:'community-reward',goal:50000}]});assert.equal(double.rejected,1);
 console.log('Daily reset/once-only gifts, exact rarity boundaries, guaranteed variants, forgiving delivery track, challenges, collection gates, event windows, cosmetic power, server authority, shared counts and retry-safe rewards passed.');
}finally{
 db?.close();if(server.exitCode===null)await new Promise(resolve=>{server.once('exit',resolve);server.kill('SIGTERM')});
 if(!path.resolve(directory).startsWith(path.resolve(os.tmpdir())+path.sep+'justin-progression-test-'))throw Error('Unexpected cleanup directory');await rm(directory,{recursive:true,force:true});
}
