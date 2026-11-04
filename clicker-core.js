(function(root){
 'use strict';
 const skins=[
  {id:'normal',name:'Factory settings',cost:0,power:0,tag:'the guy who started it all',filter:'none'},
  {id:'pixel',name:'144p Justin',cost:25,power:1,tag:'now available in 12 pixels',filter:'none'},
  {id:'fried',name:'Deep-fried Justin',cost:100,power:3,tag:'left in the air fryer',filter:'saturate(5) contrast(2.3) sepia(.3)'},
  {id:'cool',name:'Employed-looking Justin',cost:350,power:7,tag:'the glasses are doing all the work',filter:'none'},
  {id:'wide',name:'Wide Justin',cost:1000,power:15,tag:'bro is in landscape mode',filter:'none'},
  {id:'gold',name:'24-karat Justin',cost:4000,power:40,tag:'financially irresponsible face',filter:'sepia(1) saturate(4) hue-rotate(4deg) brightness(1.15)'},
  {id:'cursed',name:'Printer error Justin',cost:15000,power:100,tag:'we have lost the original file',filter:'invert(1) hue-rotate(90deg)'}
 ];
 const businesses=[
  {id:'finger',name:'Stronger clicking finger',base:15,growth:1.65,rate:0,power:1,tag:'+1 point every click'},
  {id:'chat',name:'The group chat',base:50,growth:1.3,rate:1,power:0,tag:'they click so you don’t have to'},
  {id:'intern',name:'Tiny Justin intern',base:500,growth:1.35,rate:10,power:0,tag:'paid in exposure'},
  {id:'factory',name:'Justin factory',base:5000,growth:1.4,rate:100,power:0,tag:'a serious manufacturing problem'}
 ];
 const fresh=()=>({version:1,bank:0,lifetime:0,clicks:0,owned:['normal'],equipped:'normal',levels:{finger:0,chat:0,intern:0,factory:0},savedAt:Date.now()});
 function clean(raw){const s=fresh();if(!raw||raw.version!==1)return s;for(const key of ['bank','lifetime','clicks'])s[key]=Math.max(0,Math.min(1e15,Number(raw[key])||0));s.clicks=Math.floor(s.clicks);s.owned=skins.filter(x=>x.id==='normal'||(Array.isArray(raw.owned)&&raw.owned.includes(x.id))).map(x=>x.id);s.equipped=s.owned.includes(raw.equipped)?raw.equipped:'normal';for(const b of businesses)s.levels[b.id]=Math.max(0,Math.min(100,Math.floor(Number(raw.levels?.[b.id])||0)));s.savedAt=Math.max(0,Number(raw.savedAt)||Date.now());return s}
 const perClick=s=>1+s.levels.finger+skins.filter(x=>s.owned.includes(x.id)).reduce((sum,x)=>sum+x.power,0);
 const perSecond=s=>businesses.reduce((sum,b)=>sum+b.rate*s.levels[b.id],0);
 const price=(s,b)=>Math.ceil(b.base*Math.pow(b.growth,s.levels[b.id]));
 function earn(s,amount){if(!Number.isFinite(amount)||amount<0)return;s.bank=Math.min(1e15,s.bank+amount);s.lifetime=Math.min(1e15,s.lifetime+amount)}
 function click(s){const amount=perClick(s);s.clicks++;earn(s,amount);return amount}
 function buySkin(s,id){const skin=skins.find(x=>x.id===id);if(!skin||s.owned.includes(id)||s.bank<skin.cost)return false;s.bank-=skin.cost;s.owned.push(id);s.equipped=id;return true}
 function buyBusiness(s,id){const b=businesses.find(x=>x.id===id);if(!b||s.levels[id]>=100)return false;const cost=price(s,b);if(s.bank<cost)return false;s.bank-=cost;s.levels[id]++;return true}
 const comboWindow=650;
 function comboHit(previous,now){const count=previous&&now>=previous.at&&now-previous.at<=comboWindow?Math.min(previous.count+1,9999):1;return {count,at:now,rate:Math.pow(2,Math.min(24,(count-1)*.6)/12),tier:count>=40?4:count>=25?3:count>=12?2:count>=5?1:0}}
 const api={skins,businesses,fresh,clean,perClick,perSecond,price,earn,click,buySkin,buyBusiness,comboWindow,comboHit};root.JustinGame=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
