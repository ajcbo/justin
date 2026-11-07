import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {spawn} from 'node:child_process';
import {DatabaseSync} from 'node:sqlite';
import {mkdtemp,rm} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
const G=createRequire(import.meta.url)('./dist/cosmetics-core.js'),C=G.Cosmetics,P=G.Progression;

// Catalogue and prices fit the economy; cosmetics add no permanent earnings.
assert.deepEqual(C.cosmetics.map(c=>[c.id,c.cost]),[['time',750000],['case',2500000],['hero',8000000],['charge',15000000],['debt',30000000],['trouble',50000000]]);
const rich=G.fresh();rich.lifetime=5e6;rich.bank=2e8;rich.levels.finger=10;rich.levels.chat=10;const before=[G.perClick(rich),G.perSecond(rich)];
for(const c of C.cosmetics)assert.ok(C.buyCosmetic(rich,c.id));assert.deepEqual([G.perClick(rich),G.perSecond(rich)],before,'Owning cosmetics never changes earnings');
assert.equal(C.buyCosmetic(rich,'time'),false,'No double purchase');assert.equal(C.buyCosmetic(G.fresh(),'time'),false,'Purchases need points');assert.equal(C.buyCosmetic(rich,'nope'),false);
assert.equal(rich.cosmetics.equipped,'trouble','Buying equips; one appearance slot');assert.ok(C.equipCosmetic(rich,'time'));assert.ok(C.equipCosmetic(rich,null));assert.equal(rich.cosmetics.equipped,null);assert.equal(C.equipCosmetic(G.fresh(),'time'),false,'Only owned cosmetics can be worn');

// Shared cooldown: switching outfits never resets it, saves keep it, rebirth keeps everything.
const s=G.clean(JSON.parse(JSON.stringify(rich)));s.cosmetics.equipped='time';const t=1e12;
const budget=C.abilityBudget(s);assert.equal(budget,P.scaled(s,15),'Budget is 15 seconds of permanent earning power');
const a=C.startAbility(s,'activation-0001',t);assert.ok(a);assert.equal(s.ability.readyAt,t+C.abilityCooldown);
assert.equal(C.equipCosmetic(s,'case'),false,'No outfit changes while an ability runs');
assert.equal(C.startAbility(s,'activation-0002',t+10),null,'One activity at a time');
for(let i=0;i<20;i++)C.hitAbility(s,'activation-0001',t+1000+i*150);assert.equal(s.ability.active.units,8,'Hits are capped per cosmetic');
assert.equal(C.hitAbility(G.clean(s),'activation-0001',t+1000+20*150+10),false,'Hits closer than the minimum gap are rejected');
const clicks=s.clicks,milestone=s.progress.milestone,bank=s.bank;const done=C.finishAbility(s,'activation-0001',t+5000);assert.equal(done.reward,budget,'Full skill pays exactly the budget');assert.equal(s.bank-bank,budget);assert.equal(s.clicks,clicks,'Ability rewards never count as clicks');assert.equal(s.progress.milestone,milestone);
assert.deepEqual(C.finishAbility(s,'activation-0001',t+6000),done,'Settling twice is idempotent');assert.equal(s.bank-bank,budget,'No duplicate payout');
assert.ok(C.equipCosmetic(s,'case'));assert.equal(C.startAbility(s,'activation-0003',t+60000),null,'Switching outfits keeps the shared cooldown');
assert.equal(G.clean(JSON.parse(JSON.stringify(s))).ability.readyAt,t+C.abilityCooldown,'Cooldown survives saves and other devices');
assert.ok(C.startAbility(s,'activation-0004',t+C.abilityCooldown+1),'Ready again after three minutes (one stored activation)');
// Participation pays something; abandoned activities settle once their window closes.
const bank2=s.bank;P.prepare(s,t+C.abilityCooldown+C.abilityWindow+5);assert.equal(s.ability.active,null);assert.equal(s.bank-bank2,Math.round(C.abilityBudget(s)*C.participation),'Interrupted activities settle with participation only');
assert.equal(C.startAbility(s,'activation-0001',t+C.abilityCooldown*3),null,'Activation ids cannot be reused');
// Budget excludes admin boosts and catch-up, and stays fixed for the activation.
const boosted=G.clean(JSON.parse(JSON.stringify(rich)));boosted.boosts=[{start:0,end:9e15,factor:50}];boosted.lifetime=0;assert.equal(C.abilityBudget(boosted),C.abilityBudget(rich),'Admin boosts and catch-up do not inflate rewards');
// Rebirth keeps cosmetics and the ability state.
const reborn=G.clean(JSON.parse(JSON.stringify(s)));reborn.runPoints=1e6;assert.ok(P.rebirth(reborn,0));assert.deepEqual(reborn.cosmetics,s.cosmetics);assert.equal(reborn.ability.readyAt,s.ability.readyAt);
// Invasions and abilities never share the stage.
const busy=G.clean(JSON.parse(JSON.stringify(rich)));busy.cosmetics.equipped='hero';const start=5900001*P.invasionEvery;P.joinInvasion(busy,start-5000);assert.equal(C.startAbility(busy,'activation-0005',start+1000),null,'No activation during a joined invasion');assert.ok(C.startAbility(busy,'activation-0006',start+P.invasionLength+1000),'Ready charge is kept for after the invasion');
// Saves: forged fields are cleaned.
const forged=G.clean({...G.fresh(),cosmetics:{owned:['time','fake'],equipped:'fake'},ability:{readyAt:'soon',active:{id:'x',cosmetic:'time',start:0,ends:1e15,budget:1e20,units:999}}});assert.deepEqual(forged.cosmetics,{owned:['time'],equipped:null});assert.equal(forged.ability.active,null);assert.equal(forged.ability.readyAt,0);

// Live server: purchases, equipment, activations, hits and settlement are all checked with server time.
const directory=await mkdtemp(path.join(os.tmpdir(),'justin-cosmetics-test-')),file=path.join(directory,'test.sqlite'),origin='http://127.0.0.1:8794';
let server;const boot=async()=>{server=spawn(process.execPath,['server/server.mjs'],{cwd:new URL('.',import.meta.url),env:{...process.env,PORT:'8794',PUBLIC_ORIGIN:origin,JUSTIN_DB:file},stdio:['ignore','pipe','pipe'],windowsHide:true});await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Startup timed out')),15000);server.stdout.on('data',c=>{if(String(c).includes('Justin accounts')){clearTimeout(timer);resolve()}});server.once('error',reject)})};
const halt=()=>server.exitCode===null?new Promise(resolve=>{server.once('exit',resolve);server.kill('SIGTERM')}):null;
let db;const jar=()=>{let cookie='',csrf='';return async(route,body)=>{const response=await fetch(origin+route,{method:body?'POST':'GET',headers:{Origin:origin,...(cookie?{Cookie:cookie}:{}),...(body?{'Content-Type':'application/json','X-CSRF-Token':csrf}:{})},...(body?{body:JSON.stringify(body)}:{})});const data=await response.json();if(response.headers.has('set-cookie'))cookie=response.headers.get('set-cookie').split(';')[0];if(data.csrf)csrf=data.csrf;return {status:response.status,data}}};
const owner=jar(),player=jar();let n=0;const play=(who,actions)=>who('/api/play',{requestId:'cos-req-'+String(++n).padStart(4,'0'),active:true,actions});
try{
 await boot();await owner('/api/register',{username:'jacob',password:'Local-cosmetics-owner-only!'});await halt();await boot();const me=(await player('/api/register',{username:'Cosmetic_Test',password:'Local-cosmetics-test-only!'})).data.user;db=new DatabaseSync(file);
 const seed=G.fresh();seed.bank=1e6;seed.lifetime=5e6;seed.levels.finger=5;db.prepare('UPDATE players SET state=?,updated_at=? WHERE user_id=?').run(JSON.stringify(seed),Date.now(),me.id);
 let r=await play(player,[{kind:'cosmetic-buy',id:'case'},{kind:'cosmetic-buy',id:'time',cost:1},{kind:'cosmetic-equip',id:'case'}]);
 assert.equal(r.data.rejected,2,'Unaffordable purchase and unowned equip are rejected; client prices ignored');assert.deepEqual(r.data.state.cosmetics,{owned:['time'],equipped:'time'});
 const id='server-activation-01';r=await play(player,[{kind:'ability-start',id},{kind:'ability-start',id:'server-activation-02'}]);assert.equal(r.data.rejected,1,'Second activation rejected');const serverBudget=r.data.state.ability.active.budget;
 const bankBefore=r.data.state.bank;const now=Date.now();
 r=await play(player,[{kind:'ability-hit',id,at:now},{kind:'ability-hit',id,at:now+20},{kind:'ability-hit',id,at:now+200},{kind:'ability-hit',id:'wrong-activation',at:now+400},{kind:'ability-finish',id,reward:1e12}]);
 assert.equal(r.data.rejected,2,'Too-fast and wrong-id hits are rejected');const paid=r.data.state.ability.last.reward;assert.equal(paid,Math.round(serverBudget*(C.participation+(1-C.participation)*2/8)),'Server pays participation plus validated skill');assert.ok(r.data.state.bank-bankBefore>=paid-1,'Client reward fields are ignored');
 const replay=await player('/api/play',{requestId:'cos-req-'+String(n).padStart(4,'0'),active:true,actions:[{kind:'ability-finish',id}]});assert.deepEqual(replay.data,r.data,'Retries return the original receipt');
 r=await play(player,[{kind:'ability-start',id:'server-activation-03'}]);assert.equal(r.data.rejected,1,'Cooldown is enforced on the server');
 r=await play(player,[{kind:'cosmetic-equip',id:null}]);assert.equal(r.data.state.cosmetics.equipped,null);
 const g=await owner('/api/admin/grant',{requestId:'cos-grant-0001',username:'Cosmetic_Test',kind:'cosmetic',item:'trouble'});assert.equal(g.status,200,JSON.stringify(g.data));
 const t1=await owner('/api/admin/take',{requestId:'cos-take-0001',username:'Cosmetic_Test',kind:'cosmetic',item:'time'});assert.equal(t1.status,200,JSON.stringify(t1.data));
 r=await play(player,[]);assert.deepEqual(r.data.state.cosmetics.owned,['trouble'],'Owner grant/remove of cosmetics');
 const denied=await player('/api/admin/grant',{requestId:'cos-grant-0002',username:'Cosmetic_Test',kind:'cosmetic',item:'hero'});assert.notEqual(denied.status,200,'Players cannot grant cosmetics');
 console.log('Cosmetic catalogue, no permanent earnings, one slot, shared cooldown across outfits/saves/devices, capped and spaced hits, idempotent settlement, participation on interruption, budget without boosts or catch-up, no click milestones, rebirth retention, invasion coordination, forged saves, server validation, retries and owner grant/remove passed.');
}finally{
 db?.close();if(server)await halt();
 if(!path.resolve(directory).startsWith(path.resolve(os.tmpdir())+path.sep+'justin-cosmetics-test-'))throw Error('Unexpected cleanup directory');
 await rm(directory,{recursive:true,force:true});
}
