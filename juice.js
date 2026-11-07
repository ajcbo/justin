'use strict';
// Feel layer: character personalities, purchase/achievement celebrations, one nearby goal and small surprises.
// Purely presentational. Every reward still comes from clicker-core/progression-core (and the server when ranked).
(()=>{
 const G=JustinGame,P=G.Progression,game=window.justinClicker,el=id=>document.getElementById(id),stage=el('stage');
 const reduced=()=>el('gentle').checked||matchMedia('(prefers-reduced-motion: reduce)').matches;
 const audio=kind=>{if(performance.now()-lastTap<20000)window.JustinGUIAudio?.play(kind)};
 const pick=list=>list[Math.floor(Math.random()*list.length)];
 const icon=name=>'<img class="ui-icon" src="assets/icons/'+name+'.svg" alt="">';
 const fmt=n=>n>=1e12?(n/1e12).toFixed(1)+'T':n>=1e9?(n/1e9).toFixed(1)+'B':n>=1e6?(n/1e6).toFixed(1)+'M':n>=1e4?(n/1e3).toFixed(1)+'K':Math.floor(n).toLocaleString();
 const rate=n=>Number.isInteger(n)?fmt(n):Number(n.toFixed(2)).toLocaleString();
 let lastTap=performance.now(),taps=[];

 /* ---------- Speech bubble that follows Justin ---------- */
 const bubble=document.createElement('div');bubble.className='justin-bubble';bubble.setAttribute('aria-hidden','true');bubble.hidden=true;stage.append(bubble);
 let bubbleUntil=0,lastSay=0;
 function say(text,{force=false,ms=1700}={}){const now=performance.now();if(!force&&now-lastSay<5000)return;lastSay=now;bubble.textContent=text;bubble.hidden=false;bubbleUntil=now+ms;bubble.classList.remove('bubble-pop');void bubble.offsetWidth;bubble.classList.add('bubble-pop')}
 function placeBubble(){if(bubble.hidden)return;if(performance.now()>bubbleUntil){bubble.hidden=true;return}const f=window.justinFace?.();if(!f)return;const r=stage.getBoundingClientRect(),x=Math.max(70,Math.min(r.width-70,f.x+f.size*.32)),y=Math.max(46,f.y-f.size*.72*Math.max(.7,f.sy));bubble.style.transform='translate('+x+'px,'+y+'px) translate(-30%,-100%)'}

 /* ---------- Character personalities (canvas pose hooks called from classic.js) ---------- */
 let personaId='',ev={},sleeping=false,sleepSaid=0,actPending=false;
 const now=()=>performance.now()/1000;
 function resetPersona(t){ev={next:t+4+Math.random()*4}}
 function ease(f){return f<.5?2*f*f:1-Math.pow(-2*f+2,2)/2}
 const persona={
  pose(p,t,dt,gentle){const id=game.skin?.id||'normal',k=gentle?.15:1;if(id!==personaId){personaId=id;resetPersona(t)}if(actPending){actPending=false;ev.next=0;ev.seq=ev.decoy=null;ev.shiver=ev.thwip=0;lastSay=0}ev.base={x:p.x,y:p.y,size:p.size};
   if(sleeping){p.rot+=.14*k;p.y+=7*k;p.sy*=1+Math.sin(t*1.5)*.03*k}
   if(id==='chair'){const r=Math.sin(t*1.75);p.rot+=r*.085*k;p.y-=Math.abs(r)*5*k;if(t>ev.next&&Math.abs(r)>.985){ev.next=t+10+Math.random()*8;say('*creeeak*');audio('creak')}}
   else if(id==='stairs'){const step=Math.min(p.size*.1,24);if(!ev.seq&&t>ev.next&&!gentle){ev.seq={start:t,hop:-1};ev.next=t+9+Math.random()*6;if(Math.random()<.5)say(pick(['side quest!','one step at a time','mind the gap']))}
    if(ev.seq){const age=t-ev.seq.start,hop=.34,hops=3;let along=0,lift=0;if(age<hops*hop){const i=Math.floor(age/hop),f=(age%hop)/hop;if(i!==ev.seq.hop){ev.seq.hop=i;audio('hop')}along=i+ease(f);lift=Math.sin(f*Math.PI)*step*1.3;const land=Math.max(0,1-Math.abs(f-1)*8);p.sy*=1-land*.08;p.sx*=1+land*.06}else if(age<hops*hop+1.1){along=hops*(1-ease((age-hops*hop)/1.1));p.rot+=Math.sin(age*14)*.04}else ev.seq=null;
     p.x+=along*step;p.y+=along*step*.72-lift}}
   else if(id==='loki'){if(!ev.decoy&&t>ev.next&&!gentle){ev.decoy={start:t,popped:[false,false]};ev.next=t+11+Math.random()*6;audio('poof');if(Math.random()<.6)say(pick(['which one is real?','guess.','I am burdened with glorious clicking']))}if(ev.decoy&&t-ev.decoy.start>2.8){const b=ev.base,spread=b.size*.82;for(const side of [-1,1])burst(b.x+side*spread,b.y,6,'loki');ev.decoy=null}}
   else if(id==='hamster'){if(!ev.shiver&&t>ev.next){ev.shiver=t;ev.next=t+8+Math.random()*6;if(Math.random()<.5)say('SKREEEE');audio('squeak')}if(ev.shiver){const age=t-ev.shiver;if(age>.7)ev.shiver=0;else{p.x+=Math.sin(t*95)*3.5*k;p.sy*=1+Math.sin(t*50)*.05*k;p.sx*=1-Math.sin(t*50)*.03*k}}}
   else if(id==='sleepy'){p.sy*=1+Math.sin(t*1.25)*.035*k;if(t>ev.next){ev.next=t+13+Math.random()*8;say(pick(['zzz…','five more minutes','(horizontal noises)']))}}
   else if(id==='miles'){if(!ev.thwip&&t>ev.next){ev.thwip=t;ev.next=t+10+Math.random()*6;if(Math.random()<.6)say('thwip!');audio('hop')}if(ev.thwip){const f=(t-ev.thwip)/.6;if(f>1)ev.thwip=0;else{const s=Math.sin(f*Math.PI);p.rot-=.32*s*k;p.y-=20*s*k;p.x-=10*s*k}}}
   else if(id==='invader'){p.y-=Math.sin(t*2.2)*7*k;p.rot+=Math.sin(t*1.1)*.04*k;if(t>ev.next){ev.next=t+12+Math.random()*8;say(pick(['take me to your clicker','beep boop','I come in peace (for clicks)']))}}
   else if(id==='purple'){p.sx*=1+Math.sin(t*2.4)*.035*k;p.sy*=1-Math.sin(t*2.4)*.03*k}
   else if(id==='announcement'){if(t>ev.next){ev.next=t+14+Math.random()*8;say(pick(['BREAKING: local man clicked','this just in: more clicks','we interrupt this click…']))}}
   else if(id==='sideeye'){if(t>ev.next){ev.next=t+12+Math.random()*8;ev.glance=t;say(pick(['i saw that','…','interesting click choice']))}if(ev.glance&&t-ev.glance<.9){p.x+=Math.sin((t-ev.glance)/.9*Math.PI)*14*k}}
   else if(id==='smug'||id==='thumbsup'){if(t>ev.next){ev.next=t+15+Math.random()*8;say(id==='smug'?pick(['heh.','i know','calculated']):pick(['approved.','solid click','10/10']))}}
   else if(['lucky-gold','gold','platinum','diamond','rainbow'].includes(id)){if(t>ev.next&&!gentle){ev.next=t+5+Math.random()*4;burst(p.x+(Math.random()-.5)*p.size*.8,p.y-p.size*.45,4,'crit')}}
   return p},
  behind(x,y,size,rot,sx,sy,t){const id=personaId;
   if(id==='loki'&&ev.decoy){const age=t-ev.decoy.start,open=ease(Math.min(1,age/.38)),fade=Math.min(1,(2.8-age)/.35),spread=size*.82*open;ev.decoys=[];for(const [i,side] of [[0,-1],[1,1]].entries()){if(ev.decoy.popped[i])continue;const dx=Math.max(size*.42,Math.min(w-size*.42,x+side*spread)),dy=y+Math.sin(t*3+side)*6;ev.decoys.push({x:dx,y:dy,side,i});ctx.save();ctx.globalAlpha=.5*fade;ctx.fillStyle='#38e08c';ctx.beginPath();ctx.ellipse(dx,dy+size*.82,size*.28,6,0,0,Math.PI*2);ctx.fill();ctx.restore();head(dx,dy,size*.92,rot-side*.08,sx,sy,.5*fade)}}
   if(id==='stairs'&&ev.seq&&ev.base){const b=ev.base,step=Math.min(b.size*.1,24),x0=b.x-step*.6,y0=b.y+b.size*.8;ctx.save();ctx.lineCap=ctx.lineJoin='round';ctx.beginPath();ctx.moveTo(x0-step,y0);for(let j=0;j<4;j++){const sx0=x0+j*step,sy0=y0+j*step*.72;ctx.lineTo(sx0+step,sy0+(j%2?1:-1)*.8);ctx.lineTo(sx0+step,sy0+step*.72)}ctx.globalAlpha=.75;ctx.strokeStyle='#fff';ctx.lineWidth=6;ctx.stroke();ctx.globalAlpha=.8;ctx.strokeStyle='#2b2b2b';ctx.lineWidth=2.4;ctx.stroke();ctx.restore()}},
  front(t,dt){placeBubble()},
  act(){actPending=true}
 };
 window.JustinPersona=persona;

 /* ---------- Taps: surprises, idle sleep, click-rate tracking ---------- */
 let pressTimer=0,pressStart=null,lastBoop=0,inflating=false;
 function tap(info){const t=performance.now();lastTap=t;taps.push(t);if(taps.length>40)taps.splice(0,taps.length-40);
  if(sleeping){sleeping=false;say(pick(['I WAS AWAKE','huh? what? clicking. yes.','i was resting my eyes']),{force:true})}
  const f=window.justinFace?.();if(!f)return;
  // Loki decoys: poking a fake one makes it vanish.
  if(personaId==='loki'&&ev.decoy&&ev.decoys)for(const d of ev.decoys)if(Math.hypot(info.x-d.x,info.y-d.y)<f.size*.38){ev.decoy.popped[d.i]=true;burst(d.x,d.y,10,'loki');audio('poof');say(pick(['decoy! I’m over here','that one was fake','nice try']),{force:true});return}
  if(info.reward.bonus){if(Math.random()<.45)say({perfect:pick(['PERFECT??','ow. perfectly.','frame-perfect pain']),great:pick(['nice timing','ow!','ouch, but stylish']),good:pick(['ow','crit?','that one hurt'])}[info.reward.grade]||'ow',{force:true});return}
  // Nose boop: a small hidden spot, rate limited, never during a big combo.
  const dx=(info.x-f.x)/f.size,dy=(info.y-f.y)/f.size;if(info.combo<12&&Math.hypot(dx,dy-.1)<.075&&t-lastBoop>6000){lastBoop=t;say(pick(['boop!','honk','my nose??']),{force:true});window.JustinGUIAudio?.play('boop')}
  if(info.combo===100||info.combo===250||info.combo===500)say(pick(['my face is tired','HELIUM MODE','please hydrate']),{force:true})}
 const face=el('face-button');
 face.addEventListener('pointerdown',e=>{if(e.button!==0)return;pressStart={x:e.clientX,y:e.clientY};clearTimeout(pressTimer);pressTimer=setTimeout(()=>{if(!pressStart||inflating||reduced())return;inflating=true;el('inflate').click();say('do not overfill the justin',{force:true});setTimeout(()=>{const f=window.justinFace?.();if(f)burst(f.x,f.y,24);say('pop.',{force:true});inflating=false},3300)},900)});
 face.addEventListener('pointermove',e=>{if(pressStart&&Math.hypot(e.clientX-pressStart.x,e.clientY-pressStart.y)>10){clearTimeout(pressTimer);pressStart=null}});
 for(const kind of ['pointerup','pointercancel','lostpointercapture'])face.addEventListener(kind,()=>{clearTimeout(pressTimer);pressStart=null});
 const wearing=el('wearing-name');wearing.tabIndex=0;wearing.setAttribute('role','button');wearing.title='Do your thing';const perform=()=>{persona.act();if(['normal','pixel','fried','cool','wide','cursed','bedhead','classroom','neutral'].includes(personaId))say(pick(['ta-da.','that was my move','*does a little spin*']),{force:true})};wearing.addEventListener('click',perform);wearing.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();perform()}});
 el('points').addEventListener('click',()=>{if(!reduced())el('points').animate?.([{transform:'rotate(0)'},{transform:'rotate(-4deg) scale(1.06)'},{transform:'rotate(3deg)'},{transform:'none'}],{duration:380});say(pick(['that’s MY number','don’t touch the number','number go up']),{force:true})});
 setInterval(()=>{if(document.hidden||document.querySelector('dialog[open]'))return;const t=performance.now();if(!sleeping&&t-lastTap>40000){sleeping=true;sleepSaid=0}if(sleeping&&t-sleepSaid>7000){sleepSaid=t;say(pick(['zzz…','z z z','(snoring in 144p)']),{force:true,ms:2200})}},1000);

 /* ---------- Purchases ---------- */
 const statFor=unit=>el(unit==='second'?'per-second':'per-click').parentElement;
 function chip(host,text,cls){const c=document.createElement('span');c.className=cls;c.textContent=text;host.append(c);setTimeout(()=>c.remove(),1300);return c}
 function bought(info){window.JustinGUIAudio?.play('buy');const card=info.card;card.classList.remove('is-pending','just-bought');void card.offsetWidth;card.classList.add('just-bought');setTimeout(()=>card.classList.remove('just-bought'),900);const delta=info.after-info.before,unit=info.unit==='second'?' / sec':' / click';
  if(delta>0){chip(card,'+'+rate(delta)+unit,'buy-stamp');const stat=statFor(info.unit);stat.classList.remove('stat-bump');void stat.offsetWidth;stat.classList.add('stat-bump');chip(stat,'+'+rate(delta),'stat-delta');el('game-message').textContent=info.name+(info.kind==='skin'?' unlocked':' upgraded')+' · '+rate(info.before)+' → '+rate(info.after)+unit}
  if(info.kind==='skin'&&!reduced()){const f=window.justinFace?.();if(f)burst(f.x,f.y,20);say(pick(['new face, who dis','I feel different','upgrade complete']),{force:true})}}
 function affordable(card){if(reduced())return;card.classList.remove('newly-affordable');void card.offsetWidth;card.classList.add('newly-affordable');setTimeout(()=>card.classList.remove('newly-affordable'),1500)}

 /* ---------- Achievement celebration ---------- */
 const pop=document.createElement('button');pop.type='button';pop.id='achievement-pop';pop.hidden=true;pop.innerHTML=icon('star')+'<span><small>ACHIEVEMENT UNLOCKED</small><b></b><em></em></span>';document.body.append(pop);
 const queue=[];let popTimer=0;
 function showNext(){const a=queue.shift();if(!a){pop.hidden=true;return}pop.querySelector('b').textContent=a.name;pop.querySelector('em').textContent=a.desc;pop.hidden=false;pop.classList.remove('pop-in');void pop.offsetWidth;pop.classList.add('pop-in');if(!reduced())burst(w/2,h*.35,26);clearTimeout(popTimer);popTimer=setTimeout(showNext,3600)}
 function achievement(a){if(!a)return;queue.push(a);if(pop.hidden)showNext()}
 pop.onclick=()=>{clearTimeout(popTimer);queue.length=0;pop.hidden=true;el('achievements-open').click()};

 /* ---------- Cutscenes for Justins found outside the roll strip, and for big milestones ---------- */
 const foundQueue=[],tints={mythic:'mythic',legendary:'legendary',epic:'epic',special:'special'};
 function found(skin){foundQueue.push(skin)}
 const big=n=>n>=1e9?n/1e9+' BILLION':n>=1e6?n/1e6+' MILLION':n.toLocaleString();
 const milestones=[...[1e6,1e7,1e8,1e9,1e10,1e11].map((n,i)=>({id:'pts'+n,test:s=>s.lifetime>=n,title:big(n)+' POINTS',sub:['he is worth something now','the economy is concerned','please stop','this is a lot of Justin','financial advisors are crying','ok you win'][i]})),...[10000,50000,100000,250000,1000000].map((n,i)=>({id:'clk'+n,test:s=>s.clicks>=n,title:n.toLocaleString()+' CLICKS',sub:['his face has been pressed','are your fingers ok','a hundred thousand pokes','touch grass (after this)','one million. why.'][i]}))];
 let msProfile='',msSeen=new Set(),msQueue=[],ownedBefore=null;const collectionQueue=[];
 setInterval(()=>{if(document.hidden)return;const s=game.snapshot(),at=window.justinOnline?.serverNow?.()||Date.now(),ev=P.invasion(at),inEvent=ev.active&&s.progress?.invasionJoined===ev.index,key='justin-milestones-'+(window.justinOnline?.user()?.id||'guest');
  if(key!==msProfile)ownedBefore=null;
  // Collection milestones (5/10/15/20 Justins): the final piece slides into place.
  if(ownedBefore&&s.rebirths===ownedBefore.rebirths&&s.owned.length>ownedBefore.ids.length){const goal=[5,10,15,20].find(n=>ownedBefore.ids.length<n&&s.owned.length>=n),newest=s.owned.find(id=>!ownedBefore.ids.includes(id));if(goal&&newest){window.JustinCinema?.preload(s.owned);collectionQueue.push({count:goal,owned:s.owned,newest})}}
  if(!ownedBefore||s.owned.length!==ownedBefore.ids.length||s.rebirths!==ownedBefore.rebirths)ownedBefore={ids:[...s.owned],rebirths:s.rebirths};
  if(key!==msProfile){msProfile=key;let stored=null;try{stored=JSON.parse(localStorage.getItem(key))}catch{}msSeen=new Set(Array.isArray(stored)?stored:milestones.filter(m=>m.test(s)).map(m=>m.id));msQueue=[]}
  let changed=false;for(const m of milestones)if(!msSeen.has(m.id)&&m.test(s)){msSeen.add(m.id);msQueue.push(m);changed=true}if(changed)try{localStorage.setItem(key,JSON.stringify([...msSeen]))}catch{}
  // Never interrupt a combo or a joined invasion; wait for a short pause in clicking.
  if(inEvent||performance.now()-lastTap<1500||window.JustinCutscenes?.playing())return;
  if(foundQueue.length){const skin=foundQueue.shift(),scene=window.JustinCutscenes?.sceneFor(skin.id);if(scene)window.JustinCutscenes.play(scene.name,{tint:scene.tint,title:skin.name.toUpperCase()+'!',sub:'+'+skin.power+' per click, forever',captionAt:scene.captionAt,sound:scene.sound});return}
  if(collectionQueue.length&&!document.querySelector('dialog[open]')&&!window.JustinCinema?.playing()){window.JustinCinema?.collection(collectionQueue.shift());return}
  if(msQueue.length&&!document.querySelector('dialog[open]')){const m=msQueue.shift();window.JustinCutscenes?.play('milestone',{title:m.title,sub:m.sub,captionAt:1.1,sound:'reveal-rare'})}},700);

 window.JustinJuice={tap,bought,affordable,achievement,say,found};

 /* ---------- One nearby goal ---------- */
 const goal=document.createElement('button');goal.type='button';goal.id='goal-card';goal.innerHTML='<span class="goal-art"></span><span class="goal-text"><small>NEXT GOAL</small><b></b><em></em></span><span class="goal-eta"></span><span class="goal-bar" aria-hidden="true"><i></i></span>';
 document.querySelector('.next-face').before(goal);
 let goalAction=null,goalKey='';
 function art(kind,value){if(kind==='skin'){const skin=G.skins.find(s=>s.id===value);return '<img alt="" src="'+(window.JustinSprites?.url(skin)||'assets/friend.png')+'">'}return icon(value)}
 function eta(seconds){if(!Number.isFinite(seconds))return '';if(seconds<1)return 'now';if(seconds<60)return '≈ '+Math.ceil(seconds)+'s';if(seconds<3600)return '≈ '+Math.ceil(seconds/60)+'m';if(seconds<86400*2)return '≈ '+(seconds/3600).toFixed(1)+'h';return 'a while'}
 function clickRate(){const t=performance.now();taps=taps.filter(x=>t-x<15000);return Math.min(6,taps.length/15)}
 function chooseGoal(){const s=game.snapshot(),at=window.justinOnline?.serverNow?.()||Date.now(),p=P.prepare(s,at),cps=clickRate(),perClick=G.perClick(s),perSec=G.perSecond(s),income=perSec+cps*perClick;
  const task=P.tasksAt(at).find(t=>!p.tasks.includes(t.id)&&t.value(s,p)>=t.goal);if(task)return {key:'task:'+task.id,art:['icon','check'],title:'Challenge done: '+task.name,sub:'Tap to claim +'+fmt(P.scaled(s,task.base))+' points',progress:1,ready:true,action:()=>el('tasks-open').click()};
  const book=[5,10,15,20].find(n=>s.owned.length>=n&&!p.book.includes(n));if(book)return {key:'book:'+book,art:['icon','book'],title:book+' Justins collected',sub:'Tap to claim your collection gift',progress:1,ready:true,action:()=>el('collection-open').click()};
  const need=P.rebirthRequirement(s),mult=G.rebirthMultiplier(s);if(Number.isFinite(need)&&s.runPoints>=need)return {key:'rebirth-ready',art:['icon','rebirth'],title:'Rebirth ready',sub:mult+'× → '+(mult+.5)+'× earnings, forever',progress:1,ready:true,action:()=>el('rebirth-open').click()};
  const options=[];const next=G.skins.filter(x=>!x.luckyOnly&&!x.dropOnly&&!s.owned.includes(x.id)).sort((a,b)=>a.cost-b.cost)[0];
  if(next){const missing=Math.max(0,next.cost-s.bank),after=(()=>{const copy=G.clean(s);copy.owned.push(next.id);return G.perClick(copy)})();const ready=missing<=0;options.push({key:'skin:'+next.id+':'+ready,art:['skin',next.id],title:(ready?'Ready: ':'Next Justin: ')+next.name,sub:rate(perClick)+' → '+rate(after)+' per click · '+fmt(next.cost)+' pts',progress:Math.min(1,s.bank/next.cost),ready,score:ready?-1:income>0?missing/income:Infinity,eta:ready?'buy':income>0?eta(missing/income):fmt(Math.ceil(missing/Math.max(perClick,1)))+' clicks',action:()=>{const card=document.querySelector('.face-card[data-skin="'+next.id+'"]');if(ready){card?.querySelector('button')?.click();return}el('faces-tab').click();card?.scrollIntoView({block:'nearest',behavior:reduced()?'auto':'smooth'});card?.classList.add('goal-highlight');setTimeout(()=>card?.classList.remove('goal-highlight'),1600)}})}
  const left=5000-s.clicks%5000;options.push({key:'roll',art:['icon','gift'],title:'Free roll in '+left.toLocaleString()+' clicks',sub:'Golden 20% · Platinum 35% · Diamond 15%',progress:1-left/5000,score:cps>0?left/cps:left<=500?60:Infinity,eta:cps>0?eta(left/cps):'',action:()=>say(pick(['keep clicking!','5,000 is a lot of me','almost… (not really)']),{force:true})});
  if(Number.isFinite(need)&&s.runPoints>=need*.4){const missing=need-s.runPoints;options.push({key:'rebirth',art:['icon','rebirth'],title:'Rebirth at '+fmt(need)+' run points',sub:mult+'× → '+(mult+.5)+'× earnings',progress:s.runPoints/need,score:income>0?missing/income:Infinity,eta:income>0?eta(missing/income):'',action:()=>el('rebirth-open').click()})}
  options.sort((a,b)=>a.score-b.score);return options[0]}
 function updateGoal(){if(document.hidden)return;const g=chooseGoal();if(!g){goal.hidden=true;return}goal.hidden=false;goalAction=g.action;const key=g.key+'|'+g.title+'|'+g.sub;if(key!==goalKey){const fresh=goalKey&&goalKey.split('|')[0]!==g.key;goalKey=key;goal.querySelector('.goal-art').innerHTML=art(g.art[0],g.art[1]);goal.querySelector('b').textContent=g.title;goal.querySelector('em').textContent=g.sub;goal.setAttribute('aria-label','Next goal: '+g.title+'. '+g.sub);if(fresh&&!reduced())goal.animate?.([{transform:'translateY(6px)',opacity:.4},{transform:'none',opacity:1}],{duration:280,easing:'ease-out'})}goal.classList.toggle('is-ready',Boolean(g.ready));goal.querySelector('.goal-eta').textContent=g.eta||'';goal.querySelector('.goal-bar>i').style.transform='scaleX('+Math.max(.02,Math.min(1,g.progress||0)).toFixed(3)+')'}
 goal.onclick=()=>goalAction?.();
 setInterval(updateGoal,400);updateGoal();

 /* ---------- Sticky mini score when the big number scrolls away ---------- */
 const mini=document.createElement('div');mini.id='mini-score';mini.setAttribute('aria-hidden','true');mini.innerHTML='<b></b><span></span>';document.body.append(mini);let scoreVisible=true;
 if(window.IntersectionObserver)new IntersectionObserver(entries=>{scoreVisible=entries[0].isIntersecting;mini.classList.toggle('show',!scoreVisible)}).observe(document.querySelector('.game-score>strong'));
 setInterval(()=>{if(scoreVisible||document.hidden)return;mini.querySelector('b').textContent=el('points').textContent+' pts';mini.querySelector('span').textContent=el('per-click').textContent+' / click · '+el('per-second').textContent+' / sec'},200);

 /* ---------- Consistent hand-drawn icons ---------- */
 for(const b of document.querySelectorAll('.online-dialog-head>button,.dialog-head button')){if(['×','X'].includes(b.textContent.trim()))b.innerHTML=icon('close');if(b.querySelector('img[src*="close.svg"]'))b.classList.add('icon-close')}
 for(const [id,name]of [['achievements-open','star'],['effect-style','sparkle'],['photo-bomb','clones']]){const b=el(id);if(b&&!b.querySelector('.ui-icon'))b.insertAdjacentHTML('afterbegin',icon(name))}
 for(const id of ['faces-tab','business-tab'])el(id)?.classList.add('has-ready-count');
 el('leaderboard-open')?.setAttribute('aria-label','Ranks');document.body.classList.add('juiced');
})();
