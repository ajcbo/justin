(function(root){
 'use strict';
 const skins=[
  {id:'normal',name:'Factory settings',cost:0,power:0,tag:'the guy who started it all',filter:'none'},
  {id:'pixel',name:'144p Justin',cost:25,power:1,tag:'now available in 12 pixels',filter:'none'},
  {id:'fried',name:'Deep-fried Justin',cost:100,power:3,tag:'left in the air fryer',filter:'saturate(5) contrast(2.3) sepia(.3)'},
  {id:'cool',name:'Employed-looking Justin',cost:350,power:7,tag:'the glasses are doing all the work',filter:'none'},
  {id:'wide',name:'Wide Justin',cost:1000,power:15,tag:'bro is in landscape mode',filter:'none'},
  {id:'gold',name:'24-karat Justin',cost:4000,power:40,tag:'financially irresponsible face',filter:'sepia(1) saturate(4) hue-rotate(4deg) brightness(1.15)'},
  {id:'cursed',name:'Printer error Justin',cost:15000,power:100,tag:'we have lost the original file',filter:'invert(1) hue-rotate(90deg)'},
  {id:'smug',name:'Smug Justin',cost:750,power:10,tag:'he knows your search history',filter:'none'},
  {id:'sideeye',name:'Side-eye Justin',cost:1800,power:22,tag:'he heard what you said',filter:'none'},
  {id:'sleepy',name:'Horizontal Justin',cost:6000,power:55,tag:'working hard or hardly awake',filter:'none'},
  {id:'thumbsup',name:'Approved by Justin',cost:10000,power:80,tag:'one thumb. unlimited approval.',filter:'none'},
  {id:'bedhead',name:'Just Woke Up Justin',cost:25000,power:150,tag:'the alarm has lost',filter:'none'},
  {id:'announcement',name:'Breaking News Justin',cost:60000,power:260,tag:'the microphone is his face',filter:'none'},
  {id:'classroom',name:'Computer Lab Justin',cost:120000,power:420,tag:'bro is waiting for Windows Update',filter:'none'},
  {id:'neutral',name:'Passport Photo Justin',cost:250000,power:700,tag:'permission to leave the group chat',filter:'none'},
  {id:'miles',name:'Miles Morales Justin',cost:600000,power:1100,tag:'with great clicking comes no responsibility',filter:'none'},
  {id:'hamster',name:'Hamster Justin',cost:1000000,power:1800,tag:'the scream is coming from inside the hamster',filter:'none'},
  {id:'lucky-gold',name:'Golden Justin',cost:null,power:250,tag:'1 in 1,500 clicks. pure accidental excellence.',filter:'golden',luckyOnly:true}
 ];
 const businesses=[
  {id:'finger',name:'Stronger clicking finger',base:15,growth:1.65,rate:0,power:1,tag:'+1 point every click'},
  {id:'chat',name:'The group chat',base:50,growth:1.3,rate:1,power:0,tag:'they click so you don’t have to'},
  {id:'intern',name:'Tiny Justin intern',base:500,growth:1.35,rate:10,power:0,tag:'paid in exposure'},
  {id:'factory',name:'Justin factory',base:5000,growth:1.4,rate:100,power:0,tag:'a serious manufacturing problem'}
 ];
 const fresh=()=>({version:1,bank:0,lifetime:0,clicks:0,offlineTotal:0,luckyHits:0,badges:[],owned:['normal'],equipped:'normal',levels:{finger:0,chat:0,intern:0,factory:0},savedAt:Date.now()});
 function clean(raw){const s=fresh();if(!raw||raw.version!==1)return s;for(const key of ['bank','lifetime','clicks','offlineTotal','luckyHits'])s[key]=Math.max(0,Math.min(1e15,Number(raw[key])||0));s.clicks=Math.floor(s.clicks);s.owned=skins.filter(x=>x.id==='normal'||(Array.isArray(raw.owned)&&raw.owned.includes(x.id))).map(x=>x.id);s.equipped=s.owned.includes(raw.equipped)?raw.equipped:'normal';s.badges=achievements.filter(a=>Array.isArray(raw.badges)&&raw.badges.includes(a.id)).map(a=>a.id);for(const b of businesses)s.levels[b.id]=Math.max(0,Math.min(100,Math.floor(Number(raw.levels?.[b.id])||0)));s.savedAt=Math.max(0,Number(raw.savedAt)||Date.now());return s}
 const perClick=s=>1+s.levels.finger+skins.filter(x=>s.owned.includes(x.id)).reduce((sum,x)=>sum+x.power,0);
 const perSecond=s=>businesses.reduce((sum,b)=>sum+b.rate*s.levels[b.id],0);
 const price=(s,b)=>Math.ceil(b.base*Math.pow(b.growth,s.levels[b.id]));
 function earn(s,amount){if(!Number.isFinite(amount)||amount<0)return;s.bank=Math.min(1e15,s.bank+amount);s.lifetime=Math.min(1e15,s.lifetime+amount)}
 function click(s){const amount=perClick(s);s.clicks++;earn(s,amount);return amount}
 function buySkin(s,id){const skin=skins.find(x=>x.id===id);if(!skin||skin.luckyOnly||s.owned.includes(id)||s.bank<skin.cost)return false;s.bank-=skin.cost;s.owned.push(id);s.equipped=id;return true}
 function buyBusiness(s,id){const b=businesses.find(x=>x.id===id);if(!b||s.levels[id]>=100)return false;const cost=price(s,b);if(s.bank<cost)return false;s.bank-=cost;s.levels[id]++;return true}
 const comboWindow=650;
 function comboHit(previous,now){const count=previous&&now>=previous.at&&now-previous.at<=comboWindow?Math.min(previous.count+1,9999):1;return {count,at:now,rate:Math.pow(2,Math.min(24,Math.max(0,count-10)*.12)/12),tier:count>=200?4:count>=110?3:count>=50?2:count>=15?1:0}}
 const offlineRate=.25,offlineCap=86400;
 const offlinePerDay=s=>perSecond(s)*offlineRate*86400;
 function accrueOffline(s,seconds){const amount=perSecond(s)*offlineRate*Math.min(offlineCap,Math.max(0,Number(seconds)||0));earn(s,amount);s.offlineTotal=(s.offlineTotal||0)+amount;return amount}
 function rollGolden(s,roll){if(!Number.isFinite(roll)||s.owned.includes('lucky-gold')||roll>=1/1500||roll<0)return false;s.owned.push('lucky-gold');s.equipped='lucky-gold';s.luckyHits=(s.luckyHits||0)+1;return true}
 const achievements=[
  {id:'first',name:'Patient zero',desc:'Click Justin once.',goal:1,value:s=>s.clicks},
  {id:'hundred',name:'A minor inconvenience',desc:'100 total clicks.',goal:100,value:s=>s.clicks},
  {id:'thousand',name:'Finger employment',desc:'1,000 total clicks.',goal:1000,value:s=>s.clicks},
  {id:'tenkclicks',name:'Please go outside',desc:'10,000 total clicks.',goal:10000,value:s=>s.clicks},
  {id:'rich',name:'Small business owner',desc:'Earn 1,000 lifetime points.',goal:1000,value:s=>s.lifetime},
  {id:'million',name:'The Justin economy',desc:'Earn 1,000,000 lifetime points.',goal:1000000,value:s=>s.lifetime},
  {id:'passive',name:'Delegation specialist',desc:'Reach 1 point per second.',goal:1,value:s=>perSecond(s)},
  {id:'factory',name:'Questionable enterprise',desc:'Reach 100 points per second.',goal:100,value:s=>perSecond(s)},
  {id:'fivefaces',name:'Identity crisis',desc:'Collect 5 Justins.',goal:5,value:s=>s.owned.length},
  {id:'tenfaces',name:'The multiverse is leaking',desc:'Collect 10 Justins.',goal:10,value:s=>s.owned.length},
  {id:'combo50',name:'Still a normal voice',desc:'Reach a 50-hit combo.',goal:50,value:(s,best)=>best},
  {id:'combo200',name:'Helium department',desc:'Reach a 200-hit combo.',goal:200,value:(s,best)=>best},
  {id:'offline',name:'Paid to do nothing',desc:'Earn points while away.',goal:1,value:s=>s.offlineTotal||0},
  {id:'golden',name:'One lucky individual',desc:'Find the rare Golden Justin.',goal:1,value:s=>s.owned.includes('lucky-gold')?1:0},
  {id:'spider',name:'Into the Justin-verse',desc:'Unlock Miles Morales Justin.',goal:1,value:s=>s.owned.includes('miles')?1:0},
  {id:'hamster',name:'The final squeak',desc:'Unlock Hamster Justin.',goal:1,value:s=>s.owned.includes('hamster')?1:0}
 ];
 function award(s,best=0){s.badges=s.badges||[];const added=[];for(const a of achievements)if(!s.badges.includes(a.id)&&a.value(s,best)>=a.goal){s.badges.push(a.id);added.push(a.id)}return added}
 const goatScore=(s,bestCombo=0)=>Math.floor(100*(4*Math.log10(s.lifetime+1)+3*Math.log10(perSecond(s)+1)+2*Math.log10(s.clicks+1)+2*(s.owned.length-1)+Math.log10(bestCombo+1)));
 const api={skins,businesses,achievements,award,fresh,clean,perClick,perSecond,price,earn,click,buySkin,buyBusiness,comboWindow,comboHit,goatScore,offlineRate,offlineCap,offlinePerDay,accrueOffline,rollGolden};root.JustinGame=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
