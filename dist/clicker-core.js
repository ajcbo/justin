(function(root){
 'use strict';
 const skins=[
  {id:'normal',name:'Factory settings',cost:0,power:0,tag:'the guy who started it all',filter:'none'},
  {id:'pixel',name:'144p Justin',cost:400,power:1,tag:'now available in 12 pixels',filter:'none'},
  {id:'fried',name:'Deep-fried Justin',cost:1500,power:2,tag:'left in the air fryer',filter:'saturate(5) contrast(2.3) sepia(.3)'},
  {id:'cool',name:'Employed-looking Justin',cost:4000,power:4,tag:'the glasses are doing all the work',filter:'none'},
  {id:'wide',name:'Wide Justin',cost:20000,power:9,tag:'bro is in landscape mode',filter:'none'},
  {id:'gold',dropOnly:true,name:'24-karat Justin',cost:null,power:18,tag:'financially irresponsible face',filter:'sepia(1) saturate(4) hue-rotate(4deg) brightness(1.15)'},
  {id:'cursed',name:'Printer error Justin',cost:800000,power:50,tag:'we have lost the original file',filter:'invert(1) hue-rotate(90deg)'},
  {id:'smug',name:'Smug Justin',cost:9000,power:6,tag:'he knows your search history',filter:'none'},
  {id:'sideeye',name:'Side-eye Justin',cost:45000,power:13,tag:'he heard what you said',filter:'none'},
  {id:'sleepy',name:'Horizontal Justin',cost:200000,power:26,tag:'working hard or hardly awake',filter:'none'},
  {id:'thumbsup',name:'Approved by Justin',cost:400000,power:36,tag:'one thumb. unlimited approval.',filter:'none'},
  {id:'bedhead',name:'Just Woke Up Justin',cost:1500000,power:70,tag:'the alarm has lost',filter:'none'},
  {id:'announcement',name:'Breaking News Justin',cost:3000000,power:95,tag:'the microphone is his face',filter:'none'},
  {id:'classroom',name:'Computer Lab Justin',cost:6000000,power:130,tag:'bro is waiting for Windows Update',filter:'none'},
  {id:'neutral',name:'Passport Photo Justin',cost:12000000,power:180,tag:'permission to leave the group chat',filter:'none'},
  {id:'miles',name:'Miles Morales Justin',cost:25000000,power:250,tag:'with great clicking comes no responsibility',filter:'none'},
  {id:'hamster',name:'Hamster Justin',cost:50000000,power:350,tag:'the scream is coming from inside the hamster',filter:'none'},
  {id:'chair',name:'Chairman Justin',cost:75000000,power:80,tag:'board meeting',filter:'none'},
  {id:'stairs',name:'Stairwell Justin',cost:100000000,power:110,tag:'side quest',filter:'none'},
  {id:'purple',name:'Purple Incident Justin',cost:150000000,power:140,tag:'a questionable art project',filter:'none'},
  {id:'platinum',dropOnly:true,name:'Platinum Justin',cost:null,power:100,tag:'daily gift 20% · mystery box 40% · guaranteed gift 7',filter:'none',rarity:'epic'},
  {id:'diamond',dropOnly:true,name:'Diamond Justin',cost:null,power:175,tag:'daily gift 8% · mystery box 15% · guaranteed gift 30',filter:'none',rarity:'legendary'},
  {id:'rainbow',dropOnly:true,name:'Rainbow Justin',cost:null,power:300,tag:'daily gift 2% · mystery box 5% · guaranteed gift 90',filter:'none',rarity:'mythic'},
  {id:'party',name:'Party Justin',cost:null,power:0,tag:'community milestone: 50,000 clicks',filter:'none',dropOnly:true,rarity:'special'},
  {id:'lucky-gold',name:'Golden Justin',cost:null,power:250,tag:'20% chance at each 5,000-click roll.',filter:'golden',luckyOnly:true}
 ];
 const backdrops=[{"id":"plain","name":"Original white void","group":"Basics","cost":0,"tag":"the original workplace"},{"id":"bg-6143","name":"Ocean drift","group":"Minecraft","cost":2500,"src":"assets/backdrops/bg-6143.jpg","thumb":"assets/backdrops/bg-6143-thumb.jpg","tag":"blue"},{"id":"bg-6148","name":"Moonlit plains","group":"Minecraft","cost":4000,"src":"assets/backdrops/bg-6148.jpg","thumb":"assets/backdrops/bg-6148-thumb.jpg","tag":"blue"},{"id":"bg-6149","name":"Pond lights","group":"Minecraft","cost":6500,"src":"assets/backdrops/bg-6149.jpg","thumb":"assets/backdrops/bg-6149-thumb.jpg","tag":"blue"},{"id":"bg-6150","name":"Reef vacation","group":"Minecraft","cost":9000,"src":"assets/backdrops/bg-6150.jpg","thumb":"assets/backdrops/bg-6150-thumb.jpg","tag":"blue"},{"id":"bg-6144","name":"Rainbow ghast","group":"Minecraft","cost":12000,"src":"assets/backdrops/bg-6144.jpg","thumb":"assets/backdrops/bg-6144-thumb.jpg","tag":"cute"},{"id":"bg-6140","name":"Meadow daytrip","group":"Minecraft","cost":18000,"src":"assets/backdrops/bg-6140.jpg","thumb":"assets/backdrops/bg-6140-thumb.jpg","tag":"green"},{"id":"bg-6145","name":"Bee break","group":"Minecraft","cost":23000,"src":"assets/backdrops/bg-6145.jpg","thumb":"assets/backdrops/bg-6145-thumb.jpg","tag":"green"},{"id":"bg-6146","name":"Lavender fields","group":"Minecraft","cost":30000,"src":"assets/backdrops/bg-6146.jpg","thumb":"assets/backdrops/bg-6146-thumb.jpg","tag":"purple"},{"id":"bg-6147","name":"Blocky golden hour","group":"Minecraft","cost":40000,"src":"assets/backdrops/bg-6147.jpg","thumb":"assets/backdrops/bg-6147-thumb.jpg","tag":"purple"},{"id":"bg-6157","name":"Stellar nursery","group":"NASA","cost":55000,"src":"assets/backdrops/bg-6157.jpg","thumb":"assets/backdrops/bg-6157-thumb.jpg","tag":"NASA"},{"id":"bg-6158","name":"The cosmic eye","group":"NASA","cost":75000,"src":"assets/backdrops/bg-6158.jpg","thumb":"assets/backdrops/bg-6158-thumb.jpg","tag":"NASA"},{"id":"bg-6159","name":"Galaxy trio","group":"NASA","cost":100000,"src":"assets/backdrops/bg-6159.jpg","thumb":"assets/backdrops/bg-6159-thumb.jpg","tag":"NASA"},{"id":"bg-6151","name":"Red alert","group":"Project Hail Mary","cost":220000,"src":"assets/backdrops/bg-6151.jpg","thumb":"assets/backdrops/bg-6151-thumb.jpg","tag":"Project Hail Mary"},{"id":"bg-6152","name":"Alien greenhouse","group":"Project Hail Mary","cost":300000,"src":"assets/backdrops/bg-6152.jpg","thumb":"assets/backdrops/bg-6152-thumb.jpg","tag":"Project Hail Mary"},{"id":"bg-6141","name":"Flower power","group":"Odds & ends","cost":1500,"src":"assets/backdrops/bg-6141.jpg","thumb":"assets/backdrops/bg-6141-thumb.jpg","tag":"Odds & ends"},{"id":"bg-6142","name":"Cosmic flower shop","group":"Odds & ends","cost":12000,"src":"assets/backdrops/bg-6142.jpg","thumb":"assets/backdrops/bg-6142-thumb.jpg","tag":"Odds & ends"},{"id":"bg-6153","name":"City under fire","group":"Star Wars","cost":125000,"src":"assets/backdrops/bg-6153.jpg","thumb":"assets/backdrops/bg-6153-thumb.jpg","tag":"Star Wars"},{"id":"bg-6154","name":"Eclipse city","group":"Star Wars","cost":160000,"src":"assets/backdrops/bg-6154.jpg","thumb":"assets/backdrops/bg-6154-thumb.jpg","tag":"Star Wars"},{"id":"bg-6155","name":"Cockpit privileges","group":"Star Wars","cost":200000,"src":"assets/backdrops/bg-6155.jpg","thumb":"assets/backdrops/bg-6155-thumb.jpg","tag":"Star Wars"},{"id":"bg-6156","name":"Galactic commute","group":"Star Wars","cost":300000,"src":"assets/backdrops/bg-6156.jpg","thumb":"assets/backdrops/bg-6156-thumb.jpg","tag":"Star Wars"},{"id":"bg-6160","name":"Punch it, Justin","group":"Star Wars","cost":350000,"src":"assets/backdrops/bg-6160.jpg","thumb":"assets/backdrops/bg-6160-thumb.jpg","tag":"Star Wars"},{"id":"bg-6161","name":"Two-sun holiday","group":"Star Wars","cost":450000,"src":"assets/backdrops/bg-6161.jpg","thumb":"assets/backdrops/bg-6161-thumb.jpg","tag":"Star Wars"},{"id":"bg-6162","name":"A very distant problem","group":"Star Wars","cost":600000,"src":"assets/backdrops/bg-6162.jpg","thumb":"assets/backdrops/bg-6162-thumb.jpg","tag":"Star Wars"},{"id":"bg-6163","name":"Do not touch the lava","group":"Star Wars","cost":800000,"src":"assets/backdrops/bg-6163.jpg","thumb":"assets/backdrops/bg-6163-thumb.jpg","tag":"Star Wars"},{"id":"bg-6164","name":"Forest moon","group":"Star Wars","cost":1000000,"src":"assets/backdrops/bg-6164.jpg","thumb":"assets/backdrops/bg-6164-thumb.jpg","tag":"Star Wars"},{"id":"bg-6165","name":"Small passenger","group":"Star Wars","cost":1250000,"src":"assets/backdrops/bg-6165.jpg","thumb":"assets/backdrops/bg-6165-thumb.jpg","tag":"Star Wars"},{"id":"bg-6166","name":"Precious cargo","group":"Star Wars","cost":2000000,"src":"assets/backdrops/bg-6166.jpg","thumb":"assets/backdrops/bg-6166-thumb.jpg","tag":"Star Wars"},{"id":"justinverse","name":"The Justin Dimension","group":"Special","cost":null,"adminOnly":true,"animated":true,"tag":"animated · an admin has to let you in"}];
 const businesses=[
  {id:'finger',name:'Stronger clicking finger',base:60,growth:1.65,rate:0,power:1,kind:'click',tag:'the original finger. now unionised.'},
  {id:'mouse',name:'Suspicious gaming mouse',base:1100,growth:1.7,rate:0,power:3,kind:'click',tag:'RGB does not improve your grades'},
  {id:'keyboard',name:'Mechanical keyboard',base:10000,growth:1.75,rate:0,power:8,kind:'click',tag:'the entire room can hear you clicking'},
  {id:'glove',name:'Professional clicking glove',base:100000,growth:1.8,rate:0,power:25,kind:'click',tag:'an extremely specific career path'},
  {id:'caffeine',name:'Questionable energy drink',base:1100000,growth:1.85,rate:0,power:70,kind:'click',tag:'probably not approved by anyone'},
  {id:'prism',name:'Prismatic gaming mouse',base:8000000,growth:1.85,rate:0,power:500,kind:'click',tag:'a very expensive mouse'},
  {id:'chat',name:'The group chat',base:250,growth:1.45,rate:1,power:0,kind:'passive',tag:'they occasionally do something useful'},
  {id:'autoclicker',name:'Rubber-band contraption',base:2400,growth:1.5,rate:4,power:0,kind:'passive',tag:'held together with hope'},
  {id:'intern',name:'Tiny Justin intern',base:14000,growth:1.55,rate:14,power:0,kind:'passive',tag:'paid in exposure and printer paper'},
  {id:'wifi',name:'Neighbour Wi-Fi',base:65000,growth:1.6,rate:42,power:0,kind:'passive',tag:'the password is still password'},
  {id:'factory',name:'Justin factory',base:360000,growth:1.65,rate:130,power:0,kind:'passive',tag:'a slower, more responsible manufacturing problem'},
  {id:'datacenter',name:'Potato data centre',base:2500000,growth:1.7,rate:450,power:0,kind:'passive',tag:'cooled by one very tired desk fan'},
  {id:'satellite',name:'Definitely legal satellite',base:18000000,growth:1.75,rate:1400,power:0,kind:'passive',tag:'Justin has escaped the local network'},
  {id:'supply',name:'Global nonsense supply chain',base:140000000,growth:1.8,rate:5000,power:0,kind:'passive',tag:'the economy may never recover'},
  {id:'reactor',name:'Justin reactor',base:25000000,growth:1.85,rate:3000,power:0,kind:'passive',tag:'continuous production'},
  {id:'orbital',name:'Orbital studio',base:250000000,growth:1.9,rate:12000,power:0,kind:'passive',tag:'now broadcasting from orbit'},
  {id:'rift',name:'Reality server',base:2500000000,growth:1.95,rate:50000,power:0,kind:'passive',tag:'multiple dimensions. one guy.'},
  {id:'time',name:'Time machine',base:25000000000,growth:2,rate:200000,power:0,kind:'passive',tag:'tomorrow is already clicking'}
 ];
 const fresh=()=>({version:1,rebirths:0,runPoints:0,bank:0,lifetime:0,clicks:0,offlineTotal:0,luckyHits:0,badges:[],owned:['normal'],equipped:'normal',backdrops:['plain'],backdrop:'plain',levels:Object.fromEntries(businesses.map(b=>[b.id,0])),savedAt:Date.now(),tapMeter:{at:0,tokens:6},critical:null,nextCriticalAt:0,criticalCycle:0});
 function clean(raw){const s=fresh();if(!raw||raw.version!==1)return s;for(const key of ['bank','lifetime','clicks','offlineTotal','luckyHits'])s[key]=Math.max(0,Math.min(1e15,Number(raw[key])||0));s.rebirths=Math.max(0,Math.min(13,Math.floor(Number(raw.rebirths)||0)));s.runPoints=Math.max(0,Math.min(1e15,Number(raw.runPoints??raw.lifetime)||0));s.clicks=Math.floor(s.clicks);s.owned=skins.filter(x=>x.id==='normal'||(Array.isArray(raw.owned)&&raw.owned.includes(x.id))).map(x=>x.id);s.equipped=s.owned.includes(raw.equipped)?raw.equipped:'normal';s.backdrops=backdrops.filter(b=>b.id==='plain'||Array.isArray(raw.backdrops)&&raw.backdrops.includes(b.id)).map(b=>b.id);s.backdrop=s.backdrops.includes(raw.backdrop)?raw.backdrop:'plain';s.badges=achievements.filter(a=>Array.isArray(raw.badges)&&raw.badges.includes(a.id)).map(a=>a.id);for(const b of businesses)s.levels[b.id]=Math.max(0,Math.min(100,Math.floor(Number(raw.levels?.[b.id])||0)));s.boosts=Array.isArray(raw.boosts)?raw.boosts.filter(b=>Number.isFinite(b.start)&&Number.isFinite(b.end)&&Number.isFinite(b.factor)&&b.factor>=1&&b.factor<=100).slice(0,200):[];s.savedAt=Math.max(0,Number(raw.savedAt)||Date.now());s.tapMeter={at:Math.max(0,Number(raw.tapMeter?.at)||0),tokens:Math.max(0,Math.min(6,Number(raw.tapMeter?.tokens) || 0))};if(!raw.tapMeter)s.tapMeter.tokens=6;const c=raw.critical;if(c&&typeof c.id==='string'&&c.id.length<=80&&[c.x,c.y,c.opens,c.expires].every(Number.isFinite)&&c.x>=.1&&c.x<=.9&&c.y>=.12&&c.y<=.85&&c.expires>c.opens&&c.expires-c.opens<=5000&&[5,10,20,50].includes(c.bonus))s.critical={...c};s.nextCriticalAt=Math.max(0,Number(raw.nextCriticalAt)||0);s.criticalCycle=Math.max(0,Math.floor(Number(raw.criticalCycle)||0));return s}
 const rebirthMultiplier=s=>1+Math.max(0,Math.min(13,s.rebirths||0))*.5;const justinMultiplier=rebirthMultiplier;
 const basePerClick=s=>(1+businesses.reduce((sum,b)=>sum+b.power*s.levels[b.id],0)+skins.filter(x=>s.owned.includes(x.id)).reduce((sum,x)=>sum+x.power,0))*rebirthMultiplier(s);
 const basePerSecond=s=>businesses.reduce((sum,b)=>sum+b.rate*s.levels[b.id],0)*rebirthMultiplier(s);
 const multiplier=(s,at=Date.now())=>(s.boosts||[]).reduce((n,b)=>at>=b.start&&at<b.end?Math.max(n,b.factor):n,1);
 const perClick=(s,at=Date.now())=>basePerClick(s)*multiplier(s,at);
 const perSecond=(s,at=Date.now())=>basePerSecond(s)*multiplier(s,at);
 // Integrate only the overlap with each event. Strongest wins; boosts never stack.
 function passiveAmount(s,start,end,rate=1){if(!(end>start))return 0;const cuts=[start,end];for(const b of s.boosts||[]){if(b.start>start&&b.start<end)cuts.push(b.start);if(b.end>start&&b.end<end)cuts.push(b.end)}cuts.sort((a,b)=>a-b);let weighted=0;for(let i=1;i<cuts.length;i++)weighted+=(cuts[i]-cuts[i-1])*multiplier(s,(cuts[i]+cuts[i-1])/2);return basePerSecond(s)*weighted/1000*rate}
 const price=(s,b)=>Math.ceil(b.base*Math.pow(b.growth,s.levels[b.id]));
 function earn(s,amount){if(!Number.isFinite(amount)||amount<0)return;s.runPoints=Math.min(1e15,(s.runPoints||0)+amount);s.bank=Math.min(1e15,s.bank+amount);s.lifetime=Math.min(1e15,s.lifetime+amount)}
 function click(s,at=Date.now()){const amount=perClick(s,at);s.clicks++;earn(s,amount);return amount}
 // Six full-value taps per second; extra taps keep the joke going at 10% value.
 // Only full-value taps advance click milestones, so rapid automation cannot farm Golden rolls.
 function rewardClick(s,at=Date.now(),hit=null){
  const meter=s.tapMeter||(s.tapMeter={at:0,tokens:6});at=Math.max(meter.at,Number(at)||0);
  meter.tokens=Math.min(6,meter.tokens+Math.max(0,at-meter.at)*.006);meter.at=at;
  const full=meter.tokens>=1-1e-9;if(full)meter.tokens=Math.max(0,meter.tokens-1);
  const bonus=claimCritical(s,hit,at),amount=perClick(s,at)*((full?1:.1)+bonus);
  if(full)s.clicks++;earn(s,amount);return {amount,full,bonus};
 }
 function claimCritical(s,hit,at){const c=s.critical;if(!c||!hit||hit.targetId!==c.id||!Number.isFinite(hit.x)||!Number.isFinite(hit.y)||at<c.opens||at>c.expires||Math.hypot(hit.x-c.x,hit.y-c.y)>.075)return 0;s.critical=null;return c.bonus}
 // Targets are skill rewards, not RNG: every fifth target is worth ten clicks.
 function scheduleCritical(s,now,id=()=>String(now)){
  if(s.critical&&now>s.critical.expires)s.critical=null;
  if(!s.nextCriticalAt||s.nextCriticalAt>now+10000)s.nextCriticalAt=now+10000;
  if(!s.critical&&now>=s.nextCriticalAt){const cycle=(s.criticalCycle||0)+1;s.criticalCycle=cycle;s.critical={id:id(),x:[.14,.83,.23,.7,.48,.87,.35,.12,.77,.53][(cycle-1)%10],y:[.23,.68,.78,.19,.52,.38,.16,.62,.82,.3][(cycle-1)%10],bonus:cycle%5===0?50:20,opens:now+500,expires:now+5500};s.nextCriticalAt=now+10000}
  return s.critical;
 }
 function buySkin(s,id){const skin=skins.find(x=>x.id===id);if(!skin||skin.luckyOnly||skin.dropOnly||s.owned.includes(id)||s.bank<skin.cost)return false;s.bank-=skin.cost;s.owned.push(id);s.equipped=id;return true}
 function buyBusiness(s,id){const b=businesses.find(x=>x.id===id);if(!b||s.levels[id]>=100)return false;const cost=price(s,b);if(s.bank<cost)return false;s.bank-=cost;s.levels[id]++;return true}
 function buyBackdrop(s,id){const b=backdrops.find(b=>b.id===id);if(!b||b.adminOnly||s.backdrops.includes(id)||s.bank<b.cost)return false;s.bank-=b.cost;s.backdrops.push(id);s.backdrop=id;return true}
 const comboWindow=650;
 function comboHit(previous,now){const count=previous&&now>=previous.at&&now-previous.at<=comboWindow?Math.min(previous.count+1,9999):1;return {count,at:now,rate:Math.pow(2,Math.min(24,Math.max(0,count-10)*.12)/12),tier:count>=200?4:count>=110?3:count>=50?2:count>=15?1:0}}
 const offlineRate=.25,offlineCap=86400;
 const offlinePerDay=(s,at=Date.now())=>passiveAmount(s,at,at+86400000,offlineRate);
 function accrueOffline(s,seconds,end=Date.now()){const amount=passiveAmount(s,end-Math.min(offlineCap,Math.max(0,Number(seconds)||0))*1000,end,offlineRate);earn(s,amount);s.offlineTotal=(s.offlineTotal||0)+amount;return amount}
 function rollGolden(s,roll){if(!Number.isFinite(roll)||!s.clicks||s.clicks%5000!==0||s.owned.includes('lucky-gold')||roll>=.2||roll<0)return false;s.owned.push('lucky-gold');s.equipped='lucky-gold';s.luckyHits=(s.luckyHits||0)+1;return true}
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
 const goatScore=(s,bestCombo=0)=>Math.floor(100*(4*Math.log10(s.lifetime+1)+3*Math.log10(basePerSecond(s)+1)+2*Math.log10(s.clicks+1)+2*(s.owned.length-1)+Math.log10(bestCombo+1)));
 const api={rebirthMultiplier,justinMultiplier,rewardClick,claimCritical,scheduleCritical,skins,backdrops,buyBackdrop,businesses,achievements,award,fresh,clean,perClick,perSecond,price,earn,click,buySkin,buyBusiness,comboWindow,comboHit,goatScore,basePerClick,basePerSecond,multiplier,passiveAmount,offlineRate,offlineCap,offlinePerDay,accrueOffline,rollGolden};root.JustinGame=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
