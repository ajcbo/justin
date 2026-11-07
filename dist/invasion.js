'use strict';
// Justin Invasion every five minutes: an opt-in popup, a countdown, then a two-minute 2×
// event that spills out across the whole screen. Four variants rotate (swarm, giant, Loki, UFO). Rules, target counts
// and rewards live in progression-core and are re-checked by the server; this file only presents them.
(()=>{
 const G=JustinGame,P=G.Progression,game=window.justinClicker,el=id=>document.getElementById(id),stage=el('stage');
 const serverNow=()=>window.justinOnline?.serverNow?.()||Date.now();
 const reduced=()=>el('gentle').checked||matchMedia('(prefers-reduced-motion: reduce)').matches;
 const sfx=kind=>window.JustinGUIAudio?.play(kind);
 const rand=(a,b)=>a+Math.random()*(b-a);
 const copy={
  swarm:{tag:'TINY JUSTIN SWARM',body:'Twenty tiny Justins, in two waves, are about to escape all over your screen.',stamp:'SWARM!',hint:'Catch the tiny Justins before they get away!'},
  giant:{tag:'GIANT JUSTIN',body:'One enormous face rises from below. Hit all eight glowing weak spots.',stamp:'GIANT JUSTIN!',hint:'Hit the glowing weak spots on Giant Justin!'},
  loki:{tag:'LOKI INVASION',body:'Six real Lokis, each hiding between decoys. Decoys glitch.',stamp:'LOKI INVASION!',hint:'Find the real Loki. Decoys glitch.'},
  ufo:{tag:'UFO INVASION',body:'Ten Justins keep landing in tiny flying saucers.',stamp:'UFOS!',hint:'Click the saucers before they land!'}};

 const call=document.createElement('section');call.id='invasion-call';call.hidden=true;call.setAttribute('aria-label','Justin Invasion');call.setAttribute('aria-live','polite');
 call.innerHTML='<img src="assets/props/ufo.png" alt=""><div class="invasion-call-text"><small></small><b>Join Justin Invasion?</b><span class="invasion-call-body"></span><span>2× earnings for two minutes. Catch them all for 3× and a 12% shot at Invader Justin.</span><em class="invasion-call-clock"></em></div><div class="invasion-call-actions"><button type="button" class="invasion-join">Join</button><button type="button" class="invasion-skip">Not now</button></div>';
 document.body.append(call);
 const count=document.createElement('div');count.className='invasion-count';count.hidden=true;count.setAttribute('aria-live','assertive');count.innerHTML='<small></small><b></b>';stage.append(count);
 const hud=document.createElement('div');hud.id='invasion-bar';hud.hidden=true;hud.setAttribute('aria-live','polite');hud.innerHTML='<div><b class="bar-name"></b><span class="invasion-time"></span></div><b class="invasion-mult"></b><div class="bar-health"></div>';document.body.append(hud);
 function showBar(name,total){hud.querySelector('.bar-name').textContent=name;const health=hud.querySelector('.bar-health');if(health.children.length!==total)health.replaceChildren(...Array.from({length:total},()=>document.createElement('i')));hud.hidden=false;if(!reduced()){hud.classList.remove('slam');void hud.offsetWidth;hud.classList.add('slam')}}
 function setBar(caught,total,seconds,mult){hud.querySelector('.invasion-time').textContent=seconds+'s · '+caught+'/'+total;hud.querySelector('.invasion-mult').textContent=mult+'×';[...hud.querySelector('.bar-health').children].forEach((bar,i)=>bar.classList.toggle('down',i<caught));hud.classList.toggle('maxed',caught>=total)}
 const layer=document.createElement('div');layer.id='invasion-layer';layer.hidden=true;document.body.append(layer);
 let dismissed=-1,joining=-1,joiningUntil=0,announced=-1,started=-1,cleared=-1,ended=-1,lastSecond=null,arena=null,intro=-1,barFor=-1,outroFor=-1,previewing=false,musicFor=-1,finalFor=-1;
 function report(a,caught){const ev=P.invasion(serverNow());window.JustinCinema?.result({name:P.invasionVariants.find(v=>v.id===a.variant)?.name||'Invasion',caught,total:a.total,cleared:caught>=a.total,next:a.preview?'':ev.nextName+' in about '+Math.max(1,Math.round((ev.next+P.invasionEvery*(ev.active?1:0)-serverNow())/60000))+' min'})}
 const cinema=()=>window.JustinCinema&&!reduced();

 call.querySelector('.invasion-join').onclick=()=>{const ev=P.invasion(serverNow());if(!ev.joinable)return;joining=ev.index;joiningUntil=Date.now()+8000;game.featureAction('invasion-join');sfx('crit-great');update()};
 call.querySelector('.invasion-skip').onclick=()=>{dismissed=P.invasion(serverNow()).index;call.hidden=true};

 function stamp(text){if(reduced())return;const s=document.createElement('span');s.className='invasion-stamp';s.textContent=text;stage.append(s);setTimeout(()=>s.remove(),1300)}
 function pop(x,y,text,kind=''){const p=document.createElement('span');p.className='inv-pop '+kind;p.textContent=text;p.style.left=x+'px';p.style.top=y+'px';layer.append(p);setTimeout(()=>p.remove(),reduced()?500:800)}
 const face=id=>window.JustinSprites?.url(G.skins.find(x=>x.id===id))||'assets/friend.png';

 /* ---------- Full-screen arena ---------- */
 function target(a,slot,kind,html,label,parent=layer){const b=document.createElement('button');b.type='button';b.className='inv-target inv-'+kind;b.innerHTML=html;b.setAttribute('aria-label',label);parent.append(b);const t={slot,kind,el:b,x:0,y:0,vx:0,vy:0,size:0,rot:0,done:false,decoy:slot<0};
  b.addEventListener('pointerdown',e=>{if(e.button!==0)return;e.preventDefault();hit(a,t,e.clientX,e.clientY)});
  b.addEventListener('click',e=>{if(e.detail===0){const r=b.getBoundingClientRect();hit(a,t,r.x+r.width/2,r.y+r.height/2)}});
  (t.decoy?a.decoys:a.targets).push(t);return t}
 function place(t,x,y,rot=0){t.x=x;t.y=y;t.rot=rot;t.el.style.transform='translate3d('+x.toFixed(1)+'px,'+y.toFixed(1)+'px,0) rotate('+rot.toFixed(1)+'deg)'}
 function spot(W,H,size,taken){for(let i=0;i<20;i++){const x=rand(24,W-size-24),y=rand(80,H-size-90);if(taken.every(p=>Math.hypot(p[0]-x,p[1]-y)>size*1.6))return [x,y]}return [rand(24,W-size-24),rand(80,H-size-90)]}

 function hit(a,t,x,y){if(t.done||a!==arena)return;
  if(t.decoy){t.done=true;t.el.classList.add('poof');pop(x,y,'DECOY!','miss');sfx('glitch');setTimeout(()=>{t.el.remove();a.decoys=a.decoys.filter(d=>d!==t);if(arena===a&&a.variant==='loki')lokiShuffle(a,true)},280);return}
  t.done=true;t.el.disabled=true;t.el.classList.add('caught');if(!a.preview)game.featureAction('catch-justin',{slot:t.slot});sfx({swarm:'squish',giant:'ow',loki:'zap',ufo:'zap'}[a.variant]||'boop');try{navigator.vibrate?.(12)}catch{}
  pop(x,y,a.variant==='giant'?'OW!':'+1');a.caughtLocal++;setTimeout(()=>t.el.remove(),420);
  if(a.variant==='giant'){a.giant.classList.remove('flinch');void a.giant.offsetWidth;a.giant.classList.add('flinch');openSpot(a)}
  if(a.variant==='loki'){for(const d of a.decoys){d.done=true;d.el.classList.add('poof');setTimeout(()=>d.el.remove(),280)}a.decoys=[];setTimeout(()=>{if(arena===a)lokiRound(a)},450)}}

 function lokiRound(a){const slot=[...Array(a.total).keys()].find(i=>!a.caughtSlots.has(i)&&!a.targets.some(t=>t.slot===i&&t.done));if(slot===undefined)return;const img='<img alt="" src="'+face('loki')+'">';target(a,slot,'loki',img,'Catch the real Loki Justin');for(let i=0;i<2;i++)target(a,-1,'loki',img,'Loki Justin (maybe a decoy)');lokiShuffle(a,false)}
 function lokiShuffle(a,refill){const W=innerWidth,H=innerHeight,size=Math.min(96,W*.22);if(refill)while(a.decoys.length<2)target(a,-1,'loki','<img alt="" src="'+face('loki')+'">','Loki Justin (maybe a decoy)');const live=[...a.targets.filter(t=>!t.done),...a.decoys.filter(d=>!d.done)],taken=[];for(const t of live){const [x,y]=spot(W,H,size,taken);taken.push([x,y]);t.size=size;t.homeX=x;t.homeY=y;t.glitchAt=t.decoy?performance.now()/1000+rand(.3,1.3):Infinity;place(t,x,y);t.el.classList.remove('poof');if(!reduced()){t.el.classList.remove('arrive');void t.el.offsetWidth;t.el.classList.add('arrive')}}a.shuffleAt=performance.now()/1000+2.6}
 function openSpot(a){const open=a.targets.filter(t=>!t.done);for(const t of a.targets)t.el.classList.remove('open');if(!open.length)return;a.spotIndex=(a.spotIndex+1)%open.length;open[a.spotIndex].el.classList.add('open');a.spotAt=performance.now()/1000+2.3}

 function build(ev,s,o={}){const a={index:ev.index,variant:ev.variant,total:ev.targets,preview:Boolean(o.preview),targets:[],decoys:[],caughtLocal:0,caughtSlots:new Set(!o.preview&&s.progress.encounterHour===ev.index?s.progress.encounters:[]),last:performance.now(),t0:performance.now()/1000,raf:0,spotIndex:-1};
  layer.replaceChildren();layer.classList.remove('leaving');layer.hidden=false;layer.dataset.variant=ev.variant;if(ev.variant==='ufo'){const m=o.mothership||window.JustinCinema?.mothership(layer);if(m){m.classList.add('inv-mothership','open','beam');m.style.transform='';layer.append(m);a.mothership=m}}const W=innerWidth,H=innerHeight,r=stage.getBoundingClientRect(),cx=Math.max(40,Math.min(W-80,r.x+r.width/2)),cy=Math.max(80,Math.min(H-120,r.y+r.height/2)),still=reduced(),taken=[];
  if(ev.variant==='swarm'){const size=W<650?44:48;for(let slot=0;slot<ev.targets;slot++){if(a.caughtSlots.has(slot))continue;const t=target(a,slot,'swarm','<img alt="" src="'+face('normal')+'">','Catch tiny Justin '+(slot+1)),angle=rand(0,Math.PI*2),speed=rand(130,250);t.size=size;if(!still&&slot>=10){t.delay=Math.max(0,30-(o.elapsed||0));if(t.delay>0)t.el.style.visibility='hidden'}t.vx=Math.cos(angle)*speed;t.vy=Math.sin(angle)*speed;if(still){const [x,y]=spot(W,H,size,taken);taken.push([x,y]);place(t,x,y)}else place(t,cx-size/2,cy-size/2)}}
  if(ev.variant==='ufo'){const size=W<650?78:92;let n=0;for(let slot=0;slot<ev.targets;slot++){if(a.caughtSlots.has(slot))continue;const t=target(a,slot,'ufo','<span class="mini-dome"><img alt="" src="'+face('normal')+'"></span><span class="mini-body"><i></i><i></i><i></i></span>','Catch the Justin in flying saucer '+(slot+1));t.size=size;t.delay=n<3?n*.35:3+(n-3)*2.6;n++;t.baseX=rand(10,W-size-10);t.vy=rand(48,82);const hatch=a.mothership?.querySelector('.ms-hatch')?.getBoundingClientRect();if(still){const [x,y]=spot(W,H,size,taken);taken.push([x,y]);place(t,x,y)}else if(hatch){place(t,hatch.x+hatch.width/2-size/2,hatch.y)}else place(t,t.baseX,-size-20)}}
  if(ev.variant==='loki')lokiRound(a);
  if(ev.variant==='giant'){const g=document.createElement('div');g.className='inv-giant';g.setAttribute('aria-label','Giant Justin');g.innerHTML='<img alt="" src="'+face('normal')+'">';if(o.instant)g.classList.add('instant');layer.append(g);a.giant=g;
   const spots=[[50,16,'forehead'],[34,29,'left eyebrow'],[66,29,'right eyebrow'],[31,41,'left eye'],[69,41,'right eye'],[50,53,'nose'],[24,58,'left cheek'],[50,70,'mouth']];for(let slot=0;slot<ev.targets;slot++){if(a.caughtSlots.has(slot))continue;const t=target(a,slot,'spot','<span></span>','Hit Giant Justin\'s '+spots[slot][2],g);t.el.style.left=spots[slot][0]+'%';t.el.style.top=spots[slot][1]+'%'}openSpot(a)}
  arena=a;if(!still)a.raf=requestAnimationFrame(frame)}

 function frame(now){const a=arena;if(!a)return;a.raf=requestAnimationFrame(frame);if(document.hidden){a.last=now;return}const dt=Math.min(.05,(now-a.last)/1000),t=now/1000;a.last=now;const W=innerWidth,H=innerHeight;
  if(a.variant==='swarm')for(const g of a.targets){if(g.done)continue;if(g.delay){if(t-a.t0<g.delay)continue;g.delay=0;g.el.style.visibility='';const r=stage.getBoundingClientRect();g.x=r.x+r.width/2-g.size/2;g.y=r.y+r.height/2-g.size/2;if(a.variant==='swarm'&&!a.wave2){a.wave2=true;pop(W/2,H*.3,'WAVE 2!');sfx('brass')}}const turn=Math.sin(t*1.7+g.slot*2.1)*1.4*dt,c=Math.cos(turn),s=Math.sin(turn),vx=g.vx*c-g.vy*s;g.vy=g.vx*s+g.vy*c;g.vx=vx;let x=g.x+g.vx*dt,y=g.y+g.vy*dt;if(x<4){x=4;g.vx=Math.abs(g.vx)}if(x>W-g.size-4){x=W-g.size-4;g.vx=-Math.abs(g.vx)}if(y<56){y=56;g.vy=Math.abs(g.vy)}if(y>H-g.size-4){y=H-g.size-4;g.vy=-Math.abs(g.vy)}place(g,x,y,Math.sin(t*9+g.slot)*16)}
  if(a.variant==='ufo')for(const g of a.targets){if(g.done)continue;const age=t-a.t0-g.delay;if(age<0)continue;let y=g.y+g.vy*dt;if(y>H+10){y=-g.size-20;g.baseX=rand(10,W-g.size-10);g.x=g.baseX}g.x+=(g.baseX+Math.sin(t*1.3+g.slot)*60-g.x)*Math.min(1,dt*1.8);place(g,Math.max(4,Math.min(W-g.size-4,g.x)),y,Math.cos(t*1.3+g.slot)*10)}
  if(a.variant==='loki'){for(const g of [...a.targets,...a.decoys]){if(g.done)continue;place(g,g.homeX+Math.sin(t*2+g.slot)*6,g.homeY+Math.sin(t*2.6+g.x)*8);if(g.decoy&&t>g.glitchAt){g.glitchAt=t+rand(.8,1.6);g.el.classList.remove('glitch');void g.el.offsetWidth;g.el.classList.add('glitch')}}if(t>a.shuffleAt)lokiShuffle(a,true)}
  if(a.variant==='giant'&&t>a.spotAt)openSpot(a)}

 function ending(a){const info={points:a.targets.filter(t=>!t.done&&t.kind!=='spot').map(t=>[t.x,t.y]),decoys:a.decoys.filter(d=>!d.done).map(d=>[d.x+d.size/2,d.y+d.size/2])};const real=a.targets.find(t=>!t.done&&t.kind==='loki');if(real)info.real=[real.x+real.size/2,real.y+real.size/2];if(a.giant&&!a.giant.classList.contains('defeated')){info.giant=a.giant;a.giant.classList.remove('instant')}if(a.mothership)info.mothership=a.mothership;teardown(true);if(window.JustinCinema&&!reduced())return window.JustinCinema.invasionOutro(a.variant,info);return Promise.resolve()}
 function teardown(){const a=arena;if(!a)return;arena=null;cancelAnimationFrame(a.raf);layer.classList.add('leaving');setTimeout(()=>{if(!arena){layer.replaceChildren();layer.hidden=true}layer.classList.remove('leaving')},600)}
 window.addEventListener('resize',()=>{if(arena?.variant==='loki')lokiShuffle(arena,false)});

 function update(){if(document.hidden)return;const at=serverNow(),ev=P.invasion(at),s=game.snapshot(),p=s.progress||{},joined=p.invasionJoined===ev.index,caught=p.encounterHour===ev.index?p.encounters.length:0,online=!game.ranked()||window.justinOnline.connected(),text=copy[ev.variant];
  // 1. Opt-in popup while the join window is open.
  const offer=ev.joinable&&!joined&&dismissed!==ev.index&&online;call.hidden=!offer;
  if(offer){const wait=Math.ceil((ev.start-at)/1000),left=Math.ceil((ev.ends-at)/1000),busy=joining===ev.index&&Date.now()<joiningUntil;call.querySelector('small').textContent=text.tag+(ev.countdown?' · INCOMING':' · HAPPENING NOW');call.querySelector('.invasion-call-body').textContent=text.body;call.dataset.variant=ev.variant;call.querySelector('.invasion-call-clock').textContent=ev.countdown?'starts in '+wait+'s':left+'s left';const join=call.querySelector('.invasion-join');join.disabled=busy;join.textContent=busy?'Joining…':'Join';
   if(announced!==ev.index){announced=ev.index;call.classList.remove('call-in');void call.offsetWidth;call.classList.add('call-in');sfx('notification')}}
  // 2. Countdown over the UFO clip once joined.
  const counting=joined&&ev.countdown;count.hidden=!counting;if(counting){if(musicFor!==ev.index){musicFor=ev.index;}window.JustinCinema?.tease(ev.variant)}
  if(joined&&ev.active&&ev.ends-at<10000&&finalFor!==ev.index){finalFor=ev.index;}
  if(counting){const sec=Math.max(1,Math.ceil((ev.start-at)/1000));count.querySelector('small').textContent=text.tag+' IN';if(sec!==lastSecond){lastSecond=sec;count.querySelector('b').textContent=String(sec);count.classList.toggle('final',sec<=3);if(!reduced()){count.classList.remove('tick');void count.offsetWidth;count.classList.add('tick')}if(sec<=3)sfx('crit-good')}}
  // 3. Start: the invaders spill out across the whole screen.
  const live=joined&&ev.active;
  const abilityBusy=window.JustinAbilities?.running();
  if(live&&started!==ev.index&&!abilityBusy){started=ev.index;lastSecond=null;const fresh=at-ev.start<2500;if(cinema()&&fresh){intro=ev.index;let ship=null;window.JustinCinema.invasionIntro(ev.variant,{onSlam:()=>{barFor=ev.index;showBar(ev.name,ev.targets)},deploy:m=>{ship=m}}).then(()=>{if(intro!==ev.index)return;intro=-1;const now=P.invasion(serverNow());if(now.index===ev.index&&now.active&&!arena)build(now,game.snapshot(),{instant:true,mothership:ship,elapsed:(serverNow()-now.start)/1000})})}else{barFor=ev.index;showBar(ev.name,ev.targets)}stamp(text.stamp);sfx('reveal-rare');const f=window.justinFace?.();if(f&&!reduced())burst(f.x,f.y,24);window.JustinJuice?.say({swarm:'there are so many of me',giant:'is that… me? but big?',loki:'which one is real??',ufo:'they look familiar'}[ev.variant],{force:true});el('game-message').textContent=text.hint+' 2× earnings now; catch them all for 3×.'}
  if(live&&!abilityBusy&&intro!==ev.index&&!arena&&caught<ev.targets&&cleared!==ev.index)build(ev,s,{instant:true,elapsed:(at-ev.start)/1000});
  // 4. HUD during the event.
  if(!previewing){if(!live||barFor!==ev.index)hud.hidden=true;else setBar(caught,ev.targets,Math.ceil((ev.ends-at)/1000),Math.max(2,G.multiplier(s)))}
  if(live&&caught>=ev.targets&&cleared!==ev.index){cleared=ev.index;stamp('3× BOOST!');sfx('reveal-epic');el('game-message').textContent='Invasion cleared! 3× earnings until it ends.';if(arena&&!arena.preview){const a=arena;outroFor=a.index;ending(a).then(()=>report(a,ev.targets))}}
  // 5. Wrap-up.
  if(arena&&!arena.preview&&(!live||arena.index!==ev.index)){if(outroFor!==arena.index){const a=arena;outroFor=a.index;ending(a).then(()=>report(a,P.invasion(serverNow()).index===a.index?(game.snapshot().progress?.encounterHour===a.index?game.snapshot().progress.encounters.length:a.caughtLocal):a.caughtLocal))}else teardown()}
  if(started===ev.index&&!ev.active&&ended!==ev.index){ended=ev.index;const missed=ev.targets-caught;el('game-message').textContent=missed>0?missed+' invader'+(missed===1?'':'s')+' got away. Next invasion: '+ev.nextName+' in about '+Math.round((ev.next-at)/60000)+' minutes.':'The invasion is over. Next: '+ev.nextName+'.'}
}
 setInterval(update,200);update();
 // Owner Cutscene Lab: the same intro, a short practice round with no rewards, then the ending.
 async function preview(variant){if(arena||previewing)return false;previewing=true;try{const v=P.invasionVariants.find(x=>x.id===variant);if(!v)return false;const ev={index:-1-Math.floor(Math.random()*1e6),variant:v.id,name:v.name,targets:v.targets},s=game.snapshot();let ship=null;
  if(window.JustinCinema)await window.JustinCinema.invasionIntro(variant,{onSlam:()=>showBar(v.name+' · PREVIEW',v.targets),deploy:m=>{ship=m}});else showBar(v.name+' · PREVIEW',v.targets);
  build(ev,s,{preview:true,instant:true,mothership:ship});const a=arena,end=performance.now()+40000;
  await new Promise(resolve=>{const tick=setInterval(()=>{if(arena!==a){clearInterval(tick);resolve();return}setBar(a.caughtLocal,a.total,Math.max(0,Math.ceil((end-performance.now())/1000)),a.caughtLocal>=a.total?3:2);if(a.caughtLocal>=a.total||performance.now()>end){clearInterval(tick);resolve()}},200)});
  hud.hidden=true;if(arena===a)await ending(a);report(a,a.caughtLocal);return true}finally{previewing=false;hud.hidden=true}}
 window.JustinInvasion={preview,variants:P.invasionVariants};
})();
