(function(root){
 'use strict';
 // Cosmetics: one appearance slot. Each cosmetic is a complete package (outfit, effects, animations, one ability) that
 // layers over the selected Justin. Owning cosmetics adds no permanent earnings. Abilities share one three-minute
 // cooldown and pay at most ~15 seconds of permanent earning power per activation (no admin boosts, no catch-up).
 // Shared by the browser (guest prediction) and the server (authority).
 const G=typeof module!=='undefined'&&module.exports?require('./progression-core.js'):root.JustinGame,P=G.Progression;
 const cosmetics=[
  {id:'time',name:'Justin Time',cost:750000,ability:'Time Loop',units:8,desc:'Your clicks leave clock marks. Time rewinds; tap each mark as its ghost cursor arrives.'},
  {id:'case',name:'Justincase',cost:2500000,ability:'Excess Baggage',units:14,desc:'A tiny conveyor belt of luggage. Open bags and match tags before the giant suitcase arrives.'},
  {id:'hero',name:'Justincredible',cost:8000000,ability:'Human Pinball',units:9,desc:'Pull Justin back and launch him at the bumpers. Three launches, tokens and a golden bumper.'},
  {id:'charge',name:'Justin Charge',cost:15000000,ability:'Chain Reaction',units:8,desc:'Wire three silly machines in the right order, then release the charge.'},
  {id:'debt',name:'Justin Debt',cost:30000000,ability:'Borrowed Equipment',units:10,desc:'A truck lends you a giant copy of an upgrade for 20 seconds. Collect receipts before it is repossessed.'},
  {id:'trouble',name:'Justin Trouble',cost:50000000,ability:'Getaway',units:8,desc:'Place portals to guide mini Justin past the spotlights, through tokens and out the exit.'}
 ];
 const abilityCooldown=180000,abilityWindow=75000,abilityBudgetSeconds=15,participation=.35,minHitGap=100;
 const byId=id=>cosmetics.find(c=>c.id===id);
 const int=(n,max=1e15)=>Number.isFinite(Number(n))?Math.max(0,Math.min(max,Math.floor(Number(n)))):0;
 const validId=id=>typeof id==='string'&&/^[A-Za-z0-9-]{8,80}$/.test(id);
 function cleanActive(a){if(!a||!validId(a.id)||!byId(a.cosmetic)||![a.start,a.ends,a.budget].every(Number.isFinite)||a.ends<=a.start||a.ends-a.start>abilityWindow)return null;return {id:a.id,cosmetic:a.cosmetic,start:a.start,ends:a.ends,budget:int(a.budget,1e12),units:Math.min(int(a.units),byId(a.cosmetic).units),lastHit:Number.isFinite(a.lastHit)?a.lastHit:0}}
 function fields(raw={}){const c=raw.cosmetics||{},a=raw.ability||{},owned=Array.isArray(c.owned)?cosmetics.filter(x=>c.owned.includes(x.id)).map(x=>x.id):[];
  return {cosmetics:{owned,equipped:owned.includes(c.equipped)?c.equipped:null},ability:{readyAt:Number.isFinite(a.readyAt)?Math.max(0,a.readyAt):0,active:cleanActive(a.active),settled:Array.isArray(a.settled)?a.settled.filter(validId).slice(-20):[],last:a.last&&validId(a.last.id)&&byId(a.last.cosmetic)?{id:a.last.id,cosmetic:a.last.cosmetic,reward:int(a.last.reward,1e12),units:int(a.last.units),at:Number(a.last.at)||0}:null}}}
 const originalFresh=G.fresh,originalClean=G.clean,originalPrepare=P.prepare;
 G.fresh=()=>Object.assign(originalFresh(),fields());
 G.clean=raw=>Object.assign(originalClean(raw),fields(raw||{}));
 function ensure(s){if(!s.cosmetics||!s.ability)Object.assign(s,fields(s));return s}
 // Interrupted or abandoned activities settle with whatever was earned once their window closes.
 P.prepare=(s,at=Date.now())=>{const p=originalPrepare(s,at);ensure(s);const a=s.ability.active;if(a&&at>a.ends)settle(s,at);return p};

 function buyCosmetic(s,id){ensure(s);const c=byId(id);if(!c||s.cosmetics.owned.includes(id)||s.bank<c.cost)return false;s.bank-=c.cost;s.cosmetics.owned.push(id);s.cosmetics.equipped=id;return true}
 function equipCosmetic(s,id){ensure(s);if(s.ability.active)return false;if(id===null||id===''){s.cosmetics.equipped=null;return true}if(!s.cosmetics.owned.includes(id))return false;s.cosmetics.equipped=id;return true}
 const abilityBudget=s=>P.scaled(s,abilityBudgetSeconds);
 const abilityReady=(s,at=Date.now())=>{ensure(s);return !s.ability.active&&at>=s.ability.readyAt};
 function invasionBusy(s,at){const ev=P.invasion(at);return (ev.active||ev.countdown&&ev.joinable)&&s.progress?.invasionJoined===ev.index}
 function startAbility(s,id,at=Date.now()){P.prepare(s,at);const cosmetic=s.cosmetics.equipped;if(!validId(id)||!cosmetic||s.ability.settled.includes(id)||!abilityReady(s,at)||invasionBusy(s,at))return null;
  s.ability.active={id,cosmetic,start:at,ends:at+abilityWindow,budget:abilityBudget(s),units:0,lastHit:0};s.ability.readyAt=at+abilityCooldown;return s.ability.active}
 function hitAbility(s,id,at=Date.now()){ensure(s);const a=s.ability.active;if(!a||a.id!==id||!Number.isFinite(at)||at<a.start||at>a.ends||at-a.lastHit<minHitGap)return false;const cap=byId(a.cosmetic).units;if(a.units>=cap)return false;a.units++;a.lastHit=at;return true}
 function settle(s,at){const a=s.ability.active;if(!a)return null;const cap=byId(a.cosmetic).units,reward=Math.round(a.budget*(participation+(1-participation)*Math.min(1,a.units/cap)));
  // Rewards go straight to the wallet: no clicks, no full-value milestones, no Golden-roll attempts.
  G.earn(s,reward);s.ability.settled=[...s.ability.settled,a.id].slice(-20);s.ability.last={id:a.id,cosmetic:a.cosmetic,reward,units:a.units,at};s.ability.active=null;return s.ability.last}
 function finishAbility(s,id,at=Date.now()){ensure(s);const a=s.ability.active;if(a&&a.id===id)return settle(s,Math.min(at,a.ends));return s.ability.last?.id===id?s.ability.last:null}

 G.cosmetics=cosmetics;G.Cosmetics={cosmetics,byId,buyCosmetic,equipCosmetic,abilityBudget,abilityReady,startAbility,hitAbility,finishAbility,invasionBusy,abilityCooldown,abilityWindow,abilityBudgetSeconds,participation,minHitGap};
 if(typeof module!=='undefined'&&module.exports)module.exports=G;
})(typeof window!=='undefined'?window:globalThis);
