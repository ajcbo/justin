import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {spawn} from 'node:child_process';
import {DatabaseSync} from 'node:sqlite';
import {mkdtemp,rm} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
const G=createRequire(import.meta.url)('./dist/progression-core.js'),P=G.Progression,E=P.invasionEvery;

// Schedule: every five minutes, 20s countdown, two-minute event, joins accepted until 90s in.
const k=5900000,start=k*E;
assert.equal(P.invasion(start-20001).joinable,false);
assert.deepEqual([P.invasion(start-20000).joinable,P.invasion(start-20000).countdown,P.invasion(start-20000).index],[true,true,k]);
assert.deepEqual([P.invasion(start).active,P.invasion(start+89999).joinable,P.invasion(start+90000).joinable,P.invasion(start+119999).active],[true,true,false,true]);
assert.equal(P.invasion(start+120000).active,false);assert.equal(P.invasion(start+120000).next,start+E);assert.equal(P.invasion(start+120000).index,k,'The finished event keeps its index until the next countdown');

// Four variants rotate every event with their own target counts.
assert.deepEqual([0,1,2,3,4].map(i=>P.invasion((k+i)*E).variant),['swarm','giant','loki','ufo','swarm']);
assert.deepEqual(P.invasionVariants.map(v=>v.targets),[20,8,6,10]);
assert.equal(P.invasion(start+120000).nextName,'Giant Justin','Between events the strip names the next variant');
assert.deepEqual(G.clean({...G.fresh(),progress:{encounters:[0,19,20,-1,3.5,'2',19]}}).progress.encounters,[0,19],'Saved catches stay within the largest variant');
// Opt-in boost: 2× only inside the event, once per event, strongest-wins with admin boosts.
const s=G.fresh();s.lifetime=5e6;s.levels.chat=10;
assert.equal(P.joinInvasion(s,start-20001),null,'Too early');
assert.ok(P.joinInvasion(s,start-5000));assert.equal(P.joinInvasion(s,start-4000),null,'Join once per event');
assert.deepEqual(s.invasionBoost,{start,end:start+120000,factor:2});
assert.equal(G.multiplier(s,start-1),1,'No boost during the countdown');assert.equal(G.multiplier(s,start+1),2);assert.equal(G.multiplier(s,start+120000),1);
assert.equal(Math.round(G.passiveAmount(s,start-30000,start+150000)),10*(30+120*2+30),'Passive income integrates the 60s boost exactly');
s.boosts=[{start:start-1,end:start+120000,factor:5}];assert.equal(G.multiplier(s,start+1),5,'Admin and invasion boosts never stack');s.boosts=[];

// Escapees need a join; all three raise the boost to 3× and roll for Invader Justin with server randomness.
const outsider=G.fresh();assert.equal(P.catchJustin(outsider,0,start+1000,.01),null,'Escapees require joining');
const n=P.invasion(start).targets,last=n-1,upTo=(state,at,roll)=>{for(let slot=0;slot<last;slot++)assert.equal(P.catchJustin(state,slot,at+slot,roll).label,'Escapee caught')};upTo(s,start+1000,.01);
assert.equal(s.owned.includes('invader'),false,'No roll before the third catch');
assert.equal(P.catchJustin(s,1,start+1500,.01),null,'Each escapee once');assert.equal(P.catchJustin(s,n,start+1500,.01),null,'Slots beyond this variant are rejected');
const win=P.catchJustin(s,last,start+2000,.01);assert.equal(win.skin,'invader');assert.ok(s.owned.includes('invader'));assert.equal(s.invasionBoost.factor,3);assert.equal(G.multiplier(s,start+3000),3);
assert.equal(P.catchJustin(s,0,start+121000,.01),null,'No catches after the event');
const unlucky=G.fresh();P.joinInvasion(unlucky,start+1000);upTo(unlucky,start+2000,.5);const miss=P.catchJustin(unlucky,last,start+2000,P.invaderChance);assert.equal(miss.skin,null);assert.equal(unlucky.owned.includes('invader'),false,'Roll boundary is exclusive');assert.equal(unlucky.invasionBoost.factor,3);
const dup=G.clean(s);dup.invasionBoost=null;const next=start+E;P.joinInvasion(dup,next);const m=P.invasion(next).targets;for(let slot=0;slot<m-1;slot++)P.catchJustin(dup,slot,next+1000,.9);const before=dup.bank;assert.match(P.catchJustin(dup,m-1,next+1000,.01).label,/duplicate/);assert.ok(dup.bank-before>0,'Duplicate Invader becomes points');
assert.equal(P.catchJustin(G.fresh(),0,start+1000,Number.NaN),null);

// Saves: the boost survives a clean, forged factors and windows do not, and rebirth keeps Invader Justin.
assert.deepEqual(G.clean(JSON.parse(JSON.stringify(s))).invasionBoost,s.invasionBoost);
for(const forged of [{start,end:start+60000,factor:10},{start,end:start+3600000,factor:2},{start:'x',end:1,factor:2}])assert.equal(G.clean({...G.fresh(),invasionBoost:forged}).invasionBoost,null);
const reborn=G.clean(s);reborn.runPoints=1e6;assert.ok(P.rebirth(reborn,0));assert.ok(reborn.owned.includes('invader'),'Roll-only Invader Justin survives rebirth');
assert.ok(G.skins.find(x=>x.id==='invader').dropOnly);assert.equal(G.buySkin(Object.assign(G.fresh(),{bank:1e15}),'invader'),false,'Invader Justin cannot be bought');

// Live server: joins and catches are checked against server time; client-sent boosts are ignored.
const directory=await mkdtemp(path.join(os.tmpdir(),'justin-invasion-test-')),file=path.join(directory,'test.sqlite'),origin='http://127.0.0.1:8793';
const server=spawn(process.execPath,['server/server.mjs'],{cwd:new URL('.',import.meta.url),env:{...process.env,PORT:'8793',PUBLIC_ORIGIN:origin,JUSTIN_DB:file},stdio:['ignore','pipe','pipe'],windowsHide:true});
let db,cookie='',csrf='';
async function call(route,body){const response=await fetch(origin+route,{method:body?'POST':'GET',headers:{Origin:origin,...(cookie?{Cookie:cookie}:{}),...(body?{'Content-Type':'application/json','X-CSRF-Token':csrf}:{})},...(body?{body:JSON.stringify(body)}:{})});const data=await response.json();if(response.headers.has('set-cookie'))cookie=response.headers.get('set-cookie').split(';')[0];if(data.csrf)csrf=data.csrf;assert.equal(response.status,200,JSON.stringify(data));return data}
try{
 await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Startup timed out')),15000);server.stdout.on('data',c=>{if(String(c).includes('Justin accounts')){clearTimeout(timer);resolve()}});server.once('error',reject)});
 await call('/api/register',{username:'Invasion_Test',password:'Local-invasion-test-only!'});
 const ev=P.invasion(Date.now()),edge=ev.joinable&&(ev.start+P.invasionJoinUntil-Date.now()<3000||Date.now()-(ev.start-P.invasionLead)<1000);
 if(!edge){
  const forged=await call('/api/play',{requestId:'invasion-forged-01',active:true,actions:[{kind:'catch-justin',slot:0},{kind:'click',at:Date.now(),invasionBoost:{start:0,end:9e15,factor:3}}]});
  assert.equal(forged.rejected,1,'A catch without joining is rejected');assert.equal(forged.state.invasionBoost,null,'Client-sent boosts are ignored');
  const joined=await call('/api/play',{requestId:'invasion-join-01',active:true,actions:[{kind:'invasion-join'},{kind:'invasion-join'}]});
  if(ev.joinable){assert.equal(joined.rejected,1,'Second join in the same event is rejected');assert.equal(joined.state.progress.invasionJoined,ev.index);assert.equal(joined.state.invasionBoost.factor,2)}
  else{assert.equal(joined.rejected,2,'Joining outside the window is rejected');assert.equal(joined.state.invasionBoost,null)}
  const replay=await call('/api/play',{requestId:'invasion-join-01',active:true,actions:[{kind:'invasion-join'}]});assert.deepEqual(replay,joined,'Retries return the original receipt');
 }
 console.log('Rotating swarm/giant/Loki/UFO variants with per-variant targets, five-minute invasion schedule, opt-in 2× boost, no stacking with admin boosts, exact passive integration, joined-only escapees, 3× clear, Invader Justin odds/duplicates, save validation, rebirth retention and server-side join checks passed.');
}finally{
 db?.close();if(server.exitCode===null)await new Promise(resolve=>{server.once('exit',resolve);server.kill('SIGTERM')});
 if(!path.resolve(directory).startsWith(path.resolve(os.tmpdir())+path.sep+'justin-invasion-test-'))throw Error('Unexpected cleanup directory');
 await rm(directory,{recursive:true,force:true});
}
