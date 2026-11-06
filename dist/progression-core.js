(function(root){
 'use strict';
 const G=typeof module!=='undefined'&&module.exports?require('./clicker-core.js'):root.JustinGame;
 const toyItems=[
 {id:'dvd',name:'DVD Justin',cost:1500,desc:'A bouncing face. It is trying to hit the corner.',icon:'mouse'},
 {id:'runner',name:'Tiny runner',cost:5000,desc:'He has somewhere to be.',icon:'glove'},
 {id:'marbles',name:'Marble race',cost:15000,desc:'Pick a colour. Watch it lose.',icon:'caffeine'},
 {id:'fish',name:'Justin aquarium',cost:50000,desc:'A deeply unqualified fish.',icon:'wifi'},
 {id:'loading',name:'Download simulator',cost:150000,desc:'99%. Any minute now.',icon:'datacenter'},
 {id:'portal',name:'Portal window',cost:500000,desc:'A small hole in the page.',icon:'satellite'},
 {id:'peek',name:'Side-eye peek',cost:8000,desc:'He is checking on you.',icon:'intern'},
 {id:'spinner',name:'Spinning Justin',cost:25000,desc:'A tiny rotating Justin.',icon:'mouse'},
 {id:'cursors',name:'Justin cursors',cost:100000,desc:'A few extra pointers. None of them help.',icon:'finger'},
 {id:'orbit',name:'Pocket solar system',cost:2000000,desc:'All planets are now Justin.',icon:'supply'}
 ];
 function buyToy(s,id){const item=toyItems.find(t=>t.id===id);if(!item||s.toys?.includes(id)||s.bank<item.cost)return false;s.bank-=item.cost;s.toys=[...(s.toys||[]),id];return true}
 const dayMs=86400000,day=at=>Math.floor((at+8*3600000)/dayMs);
 const originalFresh=G.fresh,originalClean=G.clean,originalTap=G.rewardClick,originalBuy=G.buyBusiness;
 const integer=n=>Number.isFinite(Number(n))?Math.max(0,Math.min(1e12,Math.floor(Number(n)))):0;
 function cleanRoll(raw){return raw&&typeof raw.id==='string'&&['box','milestone'].includes(raw.kind)?{id:raw.id.slice(0,100),kind:raw.kind,skin:G.skins.some(x=>x.id===raw.skin)?raw.skin:null,amount:integer(raw.amount),fresh:raw.fresh===true,milestone:integer(raw.milestone)}:null}
 function fields(raw={}){const p=raw.progress||{};return {toys:Array.isArray(raw.toys)?raw.toys.filter(id=>toyItems.some(t=>t.id===id)):[],critHits:integer(raw.critHits),purchases:integer(raw.purchases),progress:{giftDay:Number.isSafeInteger(p.giftDay)?p.giftDay:-1,gifts:integer(p.gifts),boxDay:Number.isSafeInteger(p.boxDay)?p.boxDay:-1,boxesToday:integer(p.boxesToday),boxes:integer(p.boxes),milestone:integer(p.milestone),week:Number.isSafeInteger(p.week)?p.week:-1,weekDays:Array.isArray(p.weekDays)?[...new Set(p.weekDays.filter(Number.isSafeInteger))].slice(0,7):[],weekBonus:p.weekBonus===true,taskDay:Number.isSafeInteger(p.taskDay)?p.taskDay:-1,startClicks:integer(p.startClicks),startCrits:integer(p.startCrits),startBuys:integer(p.startBuys),tasks:Array.isArray(p.tasks)?p.tasks.filter(x=>['tap','crit','buy'].includes(x)).slice(0,3):[],book:Array.isArray(p.book)?p.book.filter(x=>[5,10,15,20].includes(x)).slice(0,4):[],community:Array.isArray(p.community)?p.community.filter(x=>[10000,50000,200000,1000000].includes(x)).slice(0,4):[],encounterHour:integer(p.encounterHour),encounters:Array.isArray(p.encounters)?[...new Set(p.encounters.filter(x=>[0,1,2].includes(x)))]:[]},lastGift:raw.lastGift&&typeof raw.lastGift.id==='string'?{id:raw.lastGift.id.slice(0,100),label:String(raw.lastGift.label||'').slice(0,160),amount:integer(raw.lastGift.amount),skin:G.skins.some(x=>x.id===raw.lastGift.skin)?raw.lastGift.skin:null}:null,lastRoll:cleanRoll(raw.lastRoll),rollQueue:Array.isArray(raw.rollQueue)?raw.rollQueue.map(cleanRoll).filter(Boolean).slice(-10):[],lastReward:raw.lastReward&&typeof raw.lastReward.id==='string'?{id:raw.lastReward.id.slice(0,100),label:String(raw.lastReward.label||'').slice(0,160),skin:G.skins.some(x=>x.id===raw.lastReward.skin)?raw.lastReward.skin:null,amount:integer(raw.lastReward.amount)}:null}}
 G.fresh=()=>Object.assign(originalFresh(),fields());
 G.clean=raw=>Object.assign(originalClean(raw),fields(raw||{}));
 G.rewardClick=(s,at,hit)=>{const result=originalTap(s,at,hit);if(result.bonus)s.critHits=(s.critHits||0)+1;return result};
 G.buyBusiness=(s,id)=>{const ok=originalBuy(s,id);if(ok)s.purchases=(s.purchases||0)+1;return ok};
 function prepare(s,at=Date.now()){if(!s.progress)Object.assign(s,fields(s));const p=s.progress,today=day(at),week=Math.floor(today/7);if(p.boxDay!==today){p.boxDay=today;p.boxesToday=0}if(p.week!==week){p.week=week;p.weekDays=[];p.weekBonus=false}if(p.taskDay!==today){p.taskDay=today;p.startClicks=s.clicks;p.startCrits=s.critHits||0;p.startBuys=s.purchases||0;p.tasks=[]}return p}
 function grant(s,id){if(!s.owned.includes(id)){s.owned.push(id);return true}return false}
 function prize(s,label,amount,at,skin=null){G.earn(s,amount);s.lastReward={id:label+':'+at,label,amount,skin};return s.lastReward}
 const earningRate=s=>G.basePerClick(s)*2+G.basePerSecond(s);const scaled=(s,seconds)=>Math.min(1e12,Math.round(Math.max(seconds,earningRate(s)*seconds)));
 const rebirthRequirement=s=>s.rebirths>=13?Infinity:Math.round(1e6*Math.pow(5,s.rebirths||0));
 function rebirth(s,count){if(count!==s.rebirths||s.runPoints<rebirthRequirement(s))return false;const keep=s.owned.filter(id=>G.skins.find(x=>x.id===id)?.dropOnly||id==='lucky-gold'||id==='normal');s.rebirths++;s.bank=0;s.runPoints=0;s.levels=Object.fromEntries(G.businesses.map(b=>[b.id,0]));s.owned=keep;s.equipped=keep.includes(s.equipped)?s.equipped:'normal';s.critical=null;s.nextCriticalAt=0;s.tapMeter={at:Date.now(),tokens:6};return true}
 function gift(s,at=Date.now(),roll=Math.random()){
  const p=prepare(s,at),today=day(at);if(p.giftDay>=today||!Number.isFinite(roll)||roll<0||roll>=1)return null;
  p.giftDay=today;p.gifts++;if(!p.weekDays.includes(today))p.weekDays.push(today);
  const giftAmount=scaled(s,60),weekAmount=scaled(s,120),duplicateAmount=scaled(s,30);const found=[];let skin=roll<.02?'rainbow':roll<.10?'diamond':roll<.30?'platinum':roll<.40?'gold':null;
  if(skin&&grant(s,skin))found.push(skin);
  for(const [count,id]of [[7,'platinum'],[30,'diamond'],[90,'rainbow']])if(p.gifts===count&&grant(s,id))found.push(id);
  let amount=giftAmount;if(p.weekDays.length>=5&&!p.weekBonus){p.weekBonus=true;amount+=weekAmount}
  const label=found.length?found.map(id=>G.skins.find(x=>x.id===id).name).join(' + '):skin?'Duplicate → bonus points':'Daily delivery';
  if(skin&&!found.length)amount+=duplicateAmount;
  const result=prize(s,label,amount,at,found.at(-1)||null);s.lastGift={...result};return result;
 }
 const boxCost=25000,boxDailyLimit=3;
 function resolveRoll(s,kind,skin,at,ordinal){const amount=kind==='box'?Math.min(boxCost*.5,scaled(s,10)):scaled(s,60),fresh=skin?grant(s,skin):false;const reward=prize(s,skin?G.skins.find(x=>x.id===skin).name:'Points',amount,at,skin);reward.id=kind+':'+ordinal+':'+at;s.lastRoll={id:reward.id,kind,skin,amount,fresh,milestone:kind==='milestone'?ordinal:0};s.rollQueue=[...(s.rollQueue||[]),s.lastRoll].slice(-10);return s.lastRoll}
 function mysteryBox(s,at=Date.now(),roll=Math.random()){const p=prepare(s,at);if(!Number.isFinite(roll)||roll<0||roll>=1||p.boxesToday>=boxDailyLimit||s.bank<boxCost)return null;s.bank-=boxCost;p.boxesToday++;p.boxes++;const skin=roll<.05?'rainbow':roll<.20?'diamond':roll<.60?'platinum':roll<.70?'gold':null;return resolveRoll(s,'box',skin,at,p.boxes)}
 function milestoneRoll(s,at=Date.now(),roll=Math.random()){const p=prepare(s,at);if(!Number.isFinite(roll)||roll<0||roll>=1||!s.clicks||s.clicks%5000||p.milestone>=s.clicks)return null;p.milestone=s.clicks;const skin=roll<.2?'lucky-gold':roll<.35?'diamond':roll<.7?'platinum':null;const result=resolveRoll(s,'milestone',skin,at,s.clicks);if(skin==='lucky-gold'&&result.fresh)s.luckyHits=(s.luckyHits||0)+1;return result}
 const tasks=[{id:'tap',name:'500 clicks',goal:500,value:(s,p)=>s.clicks-p.startClicks,base:250},{id:'crit',name:'20 critical clicks',goal:20,value:(s,p)=>(s.critHits||0)-p.startCrits,base:400},{id:'buy',name:'Buy 10 upgrades',goal:10,value:(s,p)=>(s.purchases||0)-p.startBuys,base:350}];
 function tasksAt(at=Date.now()){const goals=[[500,20,10],[750,25,12],[1000,30,15]][day(at)%3];return tasks.map((t,i)=>({...t,goal:goals[i],name:t.id==='tap'?goals[i]+' clicks':t.id==='crit'?goals[i]+' critical clicks':'Buy '+goals[i]+' upgrades'}))}
 function task(s,id,at=Date.now()){const p=prepare(s,at),t=tasksAt(at).find(x=>x.id===id);if(!t||p.tasks.includes(id)||t.value(s,p)<t.goal)return null;p.tasks.push(id);return prize(s,'Challenge complete',scaled(s,t.base),at)}
 function book(s,count,at=Date.now()){const p=prepare(s,at);if(![5,10,15,20].includes(count)||p.book.includes(count)||s.owned.length<count)return null;p.book.push(count);return prize(s,count+' Justins collected',scaled(s,count*20),at)}
 function community(s,total,goal,at=Date.now()){const p=prepare(s,at);if(![10000,50000,200000,1000000].includes(goal)||p.community.includes(goal)||total<goal||s.clicks<1)return null;p.community.push(goal);const skin=goal===50000&&grant(s,'party')?'party':null;return prize(s,'Community milestone',scaled(s,goal/100),at,skin)}
 function invasion(at=Date.now()){const hour=Math.floor(at/3600000),start=hour*3600000;return {hour,active:at-start<120000,ends:start+120000,next:start+3600000}}
 function catchJustin(s,slot,at=Date.now()){const p=prepare(s,at),event=invasion(at);if(!event.active||![0,1,2].includes(slot))return null;if(p.encounterHour!==event.hour){p.encounterHour=event.hour;p.encounters=[]}if(p.encounters.includes(slot))return null;p.encounters.push(slot);return prize(s,'Escapee caught',scaled(s,15),at)}
 G.Progression={toyItems,buyToy,earningRate,scaled,rebirthRequirement,rebirth,boxCost,boxDailyLimit,mysteryBox,milestoneRoll,day,prepare,gift,tasks,tasksAt,task,book,community,invasion,catchJustin,nextDay:at=>(day(at)+1)*dayMs-8*3600000};
 if(typeof module!=='undefined'&&module.exports)module.exports=G;
})(typeof window!=='undefined'?window:globalThis);
