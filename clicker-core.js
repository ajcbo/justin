(function(root){
 'use strict';
 const skins=[
  {id:'normal',name:'Factory settings',cost:0,power:0,tag:'the guy who started it all',filter:'none'},
  {id:'pixel',name:'144p Justin',cost:400,power:1,tag:'now available in 12 pixels',filter:'none'},
  {id:'fried',name:'Deep-fried Justin',cost:1500,power:2,tag:'left in the air fryer',filter:'saturate(5) contrast(2.3) sepia(.3)'},
  {id:'cool',name:'Employed-looking Justin',cost:4000,power:4,tag:'the glasses are doing all the work',filter:'none'},
  {id:'wide',name:'Wide Justin',cost:20000,power:9,tag:'bro is in landscape mode',filter:'none'},
  {id:'gold',name:'24-karat Justin',cost:100000,power:18,tag:'financially irresponsible face',filter:'sepia(1) saturate(4) hue-rotate(4deg) brightness(1.15)'},
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
  {id:'lucky-gold',name:'Golden Justin',cost:null,power:250,tag:'10% chance at each 5,000-click milestone.',filter:'golden',luckyOnly:true}
 ];
 const businesses=[
  {id:'finger',name:'Stronger clicking finger',base:150,growth:1.85,rate:0,power:1,kind:'click',tag:'the original finger. now unionised.'},
  {id:'mouse',name:'Suspicious gaming mouse',base:2500,growth:1.8,rate:0,power:3,kind:'click',tag:'RGB does not improve your grades'},
  {id:'keyboard',name:'Mechanical keyboard',base:18000,growth:1.85,rate:0,power:8,kind:'click',tag:'the entire room can hear you clicking'},
  {id:'glove',name:'Professional clicking glove',base:120000,growth:1.9,rate:0,power:25,kind:'click',tag:'an extremely specific career path'},
  {id:'caffeine',name:'Questionable energy drink',base:900000,growth:1.9,rate:0,power:70,kind:'click',tag:'probably not approved by anyone'},
  {id:'chat',name:'The group chat',base:800,growth:1.5,rate:.5,power:0,kind:'passive',tag:'they occasionally do something useful'},
  {id:'autoclicker',name:'Rubber-band contraption',base:8000,growth:1.55,rate:4,power:0,kind:'passive',tag:'held together with hope'},
  {id:'intern',name:'Tiny Justin intern',base:45000,growth:1.6,rate:12,power:0,kind:'passive',tag:'paid in exposure and printer paper'},
  {id:'wifi',name:'Neighbour Wi-Fi',base:180000,growth:1.65,rate:30,power:0,kind:'passive',tag:'the password is still password'},
  {id:'factory',name:'Justin factory',base:1000000,growth:1.7,rate:100,power:0,kind:'passive',tag:'a slower, more responsible manufacturing problem'},
  {id:'datacenter',name:'Potato data centre',base:6000000,growth:1.75,rate:350,power:0,kind:'passive',tag:'cooled by one very tired desk fan'},
  {id:'satellite',name:'Definitely legal satellite',base:35000000,growth:1.8,rate:1000,power:0,kind:'passive',tag:'Justin has escaped the local network'},
  {id:'supply',name:'Global nonsense supply chain',base:200000000,growth:1.85,rate:3500,power:0,kind:'passive',tag:'the economy may never recover'}
 ];
 const fresh=()=>({version:1,bank:0,lifetime:0,clicks:0,offlineTotal:0,luckyHits:0,badges:[],owned:['normal'],equipped:'normal',levels:Object.fromEntries(businesses.map(b=>[b.id,0])),savedAt:Date.now()});
 function clean(raw){const s=fresh();if(!raw||raw.version!==1)return s;for(const key of ['bank','lifetime','clicks','offlineTotal','luckyHits'])s[key]=Math.max(0,Math.min(1e15,Number(raw[key])||0));s.clicks=Math.floor(s.clicks);s.owned=skins.filter(x=>x.id==='normal'||(Array.isArray(raw.owned)&&raw.owned.includes(x.id))).map(x=>x.id);s.equipped=s.owned.includes(raw.equipped)?raw.equipped:'normal';s.badges=achievements.filter(a=>Array.isArray(raw.badges)&&raw.badges.includes(a.id)).map(a=>a.id);for(const b of businesses)s.levels[b.id]=Math.max(0,Math.min(100,Math.floor(Number(raw.levels?.[b.id])||0)));s.boosts=Array.isArray(raw.boosts)?raw.boosts.filter(b=>Number.isFinite(b.start)&&Number.isFinite(b.end)&&Number.isFinite(b.factor)&&b.factor>=1&&b.factor<=100).slice(0,200):[];s.savedAt=Math.max(0,Number(raw.savedAt)||Date.now());return s}
 const basePerClick=s=>1+businesses.reduce((sum,b)=>sum+b.power*s.levels[b.id],0)+skins.filter(x=>s.owned.includes(x.id)).reduce((sum,x)=>sum+x.power,0);
 const basePerSecond=s=>businesses.reduce((sum,b)=>sum+b.rate*s.levels[b.id],0);
 const multiplier=(s,at=Date.now())=>(s.boosts||[]).reduce((n,b)=>at>=b.start&&at<b.end?Math.max(n,b.factor):n,1);
 const perClick=(s,at=Date.now())=>basePerClick(s)*multiplier(s,at);
 const perSecond=(s,at=Date.now())=>basePerSecond(s)*multiplier(s,at);
 // Integrate only the overlap with each event. Strongest wins; boosts never stack.
 function passiveAmount(s,start,end,rate=1){if(!(end>start))return 0;const cuts=[start,end];for(const b of s.boosts||[]){if(b.start>start&&b.start<end)cuts.push(b.start);if(b.end>start&&b.end<end)cuts.push(b.end)}cuts.sort((a,b)=>a-b);let weighted=0;for(let i=1;i<cuts.length;i++)weighted+=(cuts[i]-cuts[i-1])*multiplier(s,(cuts[i]+cuts[i-1])/2);return basePerSecond(s)*weighted/1000*rate}
 const price=(s,b)=>Math.ceil(b.base*Math.pow(b.growth,s.levels[b.id]));
 function earn(s,amount){if(!Number.isFinite(amount)||amount<0)return;s.bank=Math.min(1e15,s.bank+amount);s.lifetime=Math.min(1e15,s.lifetime+amount)}
 function click(s,at=Date.now()){const amount=perClick(s,at);s.clicks++;earn(s,amount);return amount}
 function buySkin(s,id){const skin=skins.find(x=>x.id===id);if(!skin||skin.luckyOnly||s.owned.includes(id)||s.bank<skin.cost)return false;s.bank-=skin.cost;s.owned.push(id);s.equipped=id;return true}
 function buyBusiness(s,id){const b=businesses.find(x=>x.id===id);if(!b||s.levels[id]>=100)return false;const cost=price(s,b);if(s.bank<cost)return false;s.bank-=cost;s.levels[id]++;return true}
 const comboWindow=650;
 function comboHit(previous,now){const count=previous&&now>=previous.at&&now-previous.at<=comboWindow?Math.min(previous.count+1,9999):1;return {count,at:now,rate:Math.pow(2,Math.min(24,Math.max(0,count-10)*.12)/12),tier:count>=200?4:count>=110?3:count>=50?2:count>=15?1:0}}
 const offlineRate=.25,offlineCap=86400;
 const offlinePerDay=(s,at=Date.now())=>passiveAmount(s,at,at+86400000,offlineRate);
 function accrueOffline(s,seconds,end=Date.now()){const amount=passiveAmount(s,end-Math.min(offlineCap,Math.max(0,Number(seconds)||0))*1000,end,offlineRate);earn(s,amount);s.offlineTotal=(s.offlineTotal||0)+amount;return amount}
 function rollGolden(s,roll){if(!Number.isFinite(roll)||!s.clicks||s.clicks%5000!==0||s.owned.includes('lucky-gold')||roll>=.1||roll<0)return false;s.owned.push('lucky-gold');s.equipped='lucky-gold';s.luckyHits=(s.luckyHits||0)+1;return true}
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
 const api={skins,businesses,achievements,award,fresh,clean,perClick,perSecond,price,earn,click,buySkin,buyBusiness,comboWindow,comboHit,goatScore,basePerClick,basePerSecond,multiplier,passiveAmount,offlineRate,offlineCap,offlinePerDay,accrueOffline,rollGolden};root.JustinGame=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
