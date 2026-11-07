'use strict';
// Cosmetic abilities: short activities inside Justin's stage. The server (cosmetics-core) validates the activation,
// cooldown, each scored interaction and the final settlement; this file only presents and reports them.
(()=>{
 const G=JustinGame,C=G.Cosmetics,game=window.justinClicker,el=id=>document.getElementById(id),stage=el('stage');
 const reduced=()=>el('gentle').checked||matchMedia('(prefers-reduced-motion: reduce)').matches;
 const sfx=k=>window.JustinGUIAudio?.play(k),serverNow=()=>window.justinOnline?.serverNow?.()||Date.now();
 const rand=(a,b)=>a+Math.random()*(b-a),INK='#202020';
 const fmt=n=>n>=1e9?(n/1e9).toFixed(1)+'B':n>=1e6?(n/1e6).toFixed(1)+'M':n>=1e4?(n/1e3).toFixed(1)+'K':Math.floor(n).toLocaleString();
 const images=new Map(),image=src=>{if(!images.has(src)){const i=new Image();i.src=src;images.set(src,i)}return images.get(src)};
 const factories={};let run=null;
 function message(text){el('game-message').textContent=text;window.JustinJuice?.say(text.length<28?text:'not yet!',{force:true})}
 function rr(c,x,y,w,h,r){c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath()}
 function ink(c,w=2.5){c.strokeStyle=INK;c.lineWidth=w;c.lineJoin=c.lineCap='round'}

 function activate(id,{demo=false}={}){
  if(run||!factories[id]||window.JustinCinema?.playing()||document.querySelector('dialog[open]'))return;
  const s=game.snapshot(),at=serverNow();
  if(!demo){if(s.cosmetics?.equipped!==id)return;if(s.ability?.active){message('Your last ability is still settling.');return}if(!C.abilityReady(s,at)){message('Ability is still charging.');return}if(C.invasionBusy(s,at)){message('Wait for the invasion to end. Your charge is saved.');return}if(game.ranked()&&!window.justinOnline.connected()){message('Reconnecting first. Your charge is saved.');return}}
  const activation=demo?'demo':(crypto.randomUUID?crypto.randomUUID():String(Date.now())+Math.random().toString(16).slice(2,10));
  if(!demo)game.featureAction('ability-start',{id:activation});
  start(id,activation,demo,s)}

 function start(id,activation,demo,s){const cos=C.byId(id),arena=document.createElement('div');arena.className='ability-arena';arena.dataset.ability=id;
  arena.innerHTML='<canvas aria-hidden="true"></canvas><div class="ab-hud" aria-live="polite"><b></b><span></span><em></em></div>'+(demo?'<i class="ab-demo">PREVIEW · no rewards</i>':'')+'<button type="button" class="ab-stop">End</button>';stage.append(arena);
  const r=stage.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,1.75),canvas=arena.querySelector('canvas');canvas.width=Math.round(r.width*d);canvas.height=Math.round(r.height*d);const c=canvas.getContext('2d');c.setTransform(d,0,0,d,0,0);
  document.body.classList.add('ability-running');window.JustinCosmetic?.setMode('active');sfx('tierup');
  const pops=[],queue=[];let pumping=false,lastSent=0,ended=false,raf=0,t0=performance.now(),last=t0,held=false;
  const api={W:r.width,H:r.height,S:Math.max(.6,Math.min(1.4,r.width/600)),units:0,cap:cos.units,demo,budget:C.abilityBudget(s),image,rand,sfx:k=>{if(!reduced()||!['boom','whoosh'].includes(k))sfx(k)},
   face:window.JustinSprites?.get(game.skin||G.skins[0])||null,
   banner(title,sub){arena.querySelector('.ab-hud b').textContent=title;if(sub!=null)arena.querySelector('.ab-hud span').textContent=sub},
   sub(text){const e=arena.querySelector('.ab-hud span');if(e.textContent!==text)e.textContent=text},
   pop(x,y,text,kind=''){pops.push({x,y,text,kind,life:1});if(pops.length>14)pops.shift()},
   // Each scored interaction is reported once; the server applies its own cap and spacing.
   hit(){if(api.units>=api.cap)return false;api.units++;hud();if(!demo){queue.push(1);pump()}return true},
   drawFace(c,x,y,w,rot=0){if(!api.face)return;c.save();c.translate(x,y);c.rotate(rot);c.drawImage(api.face,-w/2,-w*.78,w,w*1.56);c.restore()},
   end(){finish(false)}};
  function hud(){arena.querySelector('.ab-hud em').textContent='★ '+api.units+' / '+api.cap}
  function pump(){if(pumping)return;pumping=true;const next=()=>{if(!queue.length){pumping=false;return}queue.shift();const at=Math.max(serverNow(),lastSent+C.minHitGap+15);lastSent=at;game.featureAction('ability-hit',{id:activation,at});setTimeout(next,125)};next()}
  api.banner(cos.ability,'');hud();
  const act=factories[id](api);
  const point=e=>{const b=arena.getBoundingClientRect();return {x:(e.clientX-b.left)*api.W/b.width,y:(e.clientY-b.top)*api.H/b.height}};
  const tNow=()=>(performance.now()-t0)/1000;
  arena.addEventListener('pointerdown',e=>{if(e.target.closest('.ab-stop'))return;e.preventDefault();held=true;try{arena.setPointerCapture(e.pointerId)}catch{}act.down?.(point(e),tNow())});
  arena.addEventListener('pointermove',e=>{if(held)act.move?.(point(e),tNow())});
  arena.addEventListener('pointerup',e=>{if(!held)return;held=false;act.up?.(point(e),tNow())});
  arena.addEventListener('pointercancel',()=>{held=false});
  arena.querySelector('.ab-stop').onclick=()=>finish(true);
  function loop(now){if(ended)return;raf=requestAnimationFrame(loop);if(document.hidden){last=now;return}const dt=Math.min(.05,(now-last)/1000);last=now;const t=(now-t0)/1000;act.update?.(dt,t);c.clearRect(0,0,api.W,api.H);act.draw?.(c,t);
   for(const p of pops){p.life-=dt*1.1;c.save();c.globalAlpha=Math.max(0,Math.min(1,p.life*2));c.translate(p.x,p.y-(1-p.life)*40);c.font='900 '+Math.round(15*api.S+6)+'px sans-serif';c.textAlign='center';c.lineWidth=4;c.strokeStyle='#fff';c.strokeText(p.text,0,0);c.fillStyle=p.kind==='miss'?'#888':p.kind==='soft'?'#5d6470':'#c4006e';c.fillText(p.text,0,0);c.restore()}for(let i=pops.length-1;i>=0;i--)if(pops[i].life<=0)pops.splice(i,1)}
  raf=requestAnimationFrame(loop);const guard=setTimeout(()=>finish(true),C.abilityWindow-3000);
  // Settle after every queued hit has been sent, then show what the server (or guest prediction) paid.
  function finish(stopped){if(ended)return;ended=true;clearTimeout(guard);cancelAnimationFrame(raf);window.JustinCosmetic?.setMode('finish');if(stopped)sfx('powerdown');
   const card=document.createElement('div');card.className='ab-result';card.innerHTML='<small></small><b></b><span></span>';arena.append(card);card.querySelector('small').textContent=cos.ability.toUpperCase();
   const show=(reward)=>{card.querySelector('b').textContent=demo?'Preview complete':reward==null?'Settling…':'+'+fmt(reward)+' points';card.querySelector('span').textContent=demo?'No rewards or cooldown changes in previews.':'★ '+api.units+' / '+api.cap+' · participation + skill (max '+fmt(api.budget)+')';if(reward!=null&&!demo)sfx('reveal-rare')};show(null);
   const done=()=>{setTimeout(()=>{arena.classList.add('leaving');setTimeout(()=>{arena.remove();document.body.classList.remove('ability-running');window.JustinCosmetic?.setMode('idle');run=null},320)},2200)};
   if(demo){show(0);done();return}
   const send=()=>{if(queue.length||pumping){setTimeout(send,140);return}game.featureAction('ability-finish',{id:activation});const t1=performance.now(),poll=()=>{const last=game.snapshot().ability?.last;if(last?.id===activation){show(last.reward);done();return}if(performance.now()-t1>9000){card.querySelector('span').textContent='Saved. Your reward will appear when the server confirms it.';done();return}setTimeout(poll,200)};poll()};send()}
  run={id,activation,finish}}

 window.JustinAbilities={register:(id,factory)=>{factories[id]=factory},activate,running:()=>Boolean(run),cancel:()=>run?.finish(true)};
 const reg=window.JustinAbilities.register;

 /* ---------- Justin Time: Time Loop ---------- */
 reg('time',api=>{const {W,H,S}=api,marks=[];let phase='record',t0=0;api.banner('Time Loop','Click around for 5 seconds. Each click leaves a clock mark.');
  const R=18*S+4;const clock=(c,x,y,r,spin,alpha=1)=>{c.save();c.globalAlpha=alpha;c.translate(x,y);c.fillStyle='#fff6d8';ink(c);c.beginPath();c.arc(0,0,r,0,Math.PI*2);c.fill();c.stroke();c.beginPath();c.moveTo(0,0);c.lineTo(Math.sin(spin)*r*.7,-Math.cos(spin)*r*.7);c.moveTo(0,0);c.lineTo(Math.sin(spin/12)*r*.45,-Math.cos(spin/12)*r*.45);c.stroke();c.restore()};
  return {update(dt,t){if(phase==='record'){api.sub('Click around! '+Math.max(0,Math.ceil(5-t))+'s · '+marks.length+' / 8 marks');if(t>=5){while(marks.length<3)marks.push({x:rand(.15,.85)*W,y:rand(.25,.8)*H,t:5});phase='rewind';t0=t;api.banner('◀◀ REWIND','');api.sfx('whoosh')}}
    else if(phase==='rewind'&&t-t0>1.4){phase='replay';t0=t;let at=1;marks.forEach((m,i)=>{if(i)at+=Math.max(.6,Math.min(1.2,m.t-marks[i-1].t));m.arrive=at});api.banner('Time Loop','Tap each clock as its ghost cursor reaches it.')}
    else if(phase==='replay'){const k=t-t0;for(const m of marks)if(!m.done&&k>m.arrive+.45){m.done='miss';api.pop(m.x,m.y-R,'missed','miss')}if(marks.every(m=>m.done)){phase='snap';t0=t;api.sfx('gong')}}
    else if(phase==='snap'&&t-t0>1.3)api.end()},
   down(p,t){if(phase==='record'){if(marks.length<8){marks.push({x:p.x,y:p.y,t});api.sfx('tick')}return}if(phase!=='replay')return;const k=t-t0,m=marks.filter(m=>!m.done).sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y))[0];if(!m||Math.hypot(m.x-p.x,m.y-p.y)>R*2.4)return;const off=k-m.arrive;if(Math.abs(off)<=.45){m.done='hit';api.hit();api.pop(m.x,m.y-R*1.6,Math.abs(off)<.15?'PERFECT':'ON TIME');api.sfx('crit-great')}else if(off<0)api.pop(m.x,m.y-R*1.6,'too early','miss')},
   draw(c,t){const k=t-t0;if(phase==='rewind'){c.fillStyle='rgba(120,90,40,.2)';c.fillRect(0,0,W,H);c.strokeStyle='rgba(255,255,255,.35)';c.lineWidth=1;for(let y=(t*260)%12;y<H;y+=12){c.beginPath();c.moveTo(0,y);c.lineTo(W,y);c.stroke()}c.fillStyle='#fff';c.strokeStyle=INK;c.lineWidth=4;c.font='900 '+Math.round(54*S)+'px sans-serif';c.textAlign='center';c.strokeText('◀◀',W/2,H/2);c.fillText('◀◀',W/2,H/2)}
    marks.forEach(m=>{const spin=phase==='rewind'?-t*16:t*2;clock(c,m.x,m.y,R,spin,m.done==='miss'?.25:m.done==='hit'?.45:1);if(phase==='replay'&&!m.done){const left=m.arrive-k;if(left<1.3&&left>-.45){ink(c,3);c.strokeStyle=Math.abs(left)<=.45?'#ff2d8f':INK;c.beginPath();c.arc(m.x,m.y,R+Math.max(0,left)*55*S,0,Math.PI*2);c.stroke()}}});
    if(phase==='replay'){let i=marks.findIndex(m=>m.arrive>k);if(i<0)i=marks.length-1;const to=marks[i],from=i?marks[i-1]:{x:W/2,y:H/2,arrive:0},f=Math.max(0,Math.min(1,(k-from.arrive)/Math.max(.01,to.arrive-from.arrive))),x=from.x+(to.x-from.x)*f,y=from.y+(to.y-from.y)*f;c.save();c.globalAlpha=.65;c.translate(x,y);c.fillStyle='#fff';ink(c,2);c.beginPath();c.moveTo(0,0);c.lineTo(0,22*S+6);c.lineTo(6*S+2,16*S+4);c.lineTo(10*S+3,25*S+6);c.lineTo(14*S+4,23*S+5);c.lineTo(10*S+3,14*S+4);c.lineTo(17*S+5,14*S+4);c.closePath();c.fill();c.stroke();c.restore()}
    if(phase==='snap'){const p=Math.min(1,k/1.3),big=60*S+24;clock(c,W/2,H/2,big,p<.5?-p*20:Math.PI*2*Math.round(p*8)/8+Math.PI*4,1);c.fillStyle='#c4006e';c.font='900 '+Math.round(30*S+6)+'px sans-serif';c.textAlign='center';if(p>.5)c.fillText('SNAP!',W/2,H/2+big+30*S)}}}});

 /* ---------- Justincase: Excess Baggage ---------- */
 reg('case',api=>{const {W,H,S}=api,belt=H*.7,colors=['#ff5fb1','#5ec9ff','#ffd400','#8dff6a'],contents=['mini','peanuts','tag','mini','sock'],bags=[],peanuts=[],photo=api.image('assets/cosmetics/justincase.png');let spawned=0,next=.5,lastColor=-1,matches=0,phase='belt',final=null;const speed=W/5.4;
  api.banner('Excess Baggage','Tap bags to open them. Two of the same tag colour in a row is a MATCH.');
  const burst=(x,y,n)=>{for(let i=0;i<(reduced()?Math.min(n,8):n);i++)peanuts.push({x,y,vx:rand(-160,160)*S,vy:rand(-260,-80)*S,life:rand(.8,1.4),r:rand(4,8)*S})};
  return {update(dt,t){if(phase==='belt'){if(spawned<10&&t>next){const w=(62+rand(0,16))*S+14;bags.push({x:W+w,y:belt-(26*S+10),w,h:42*S+16,color:Math.floor(rand(0,4)),content:contents[spawned%5],opened:0});spawned++;next=t+1.15}for(const b of bags)b.x-=speed*dt;api.sub(Math.max(0,10-spawned)+' bags still coming · matches '+matches+' / 4');
     if(spawned===10&&bags.every(b=>b.x<-b.w||b.opened&&t-b.opened>.8)){phase='final';final={x:W*1.5,t,popped:0};api.sfx('thud');api.banner('Excess Baggage','…one more bag. Tap it!')}}
    if(phase==='final'){final.x+=(W/2-final.x)*Math.min(1,dt*3.5);if(!final.popped&&t-final.t>5)api.end();if(final.popped&&t-final.popped>1.5)api.end()}
    for(const p of peanuts){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=520*S*dt}for(let i=peanuts.length-1;i>=0;i--)if(peanuts[i].life<=0)peanuts.splice(i,1)},
   down(p,t){if(phase==='belt'){const b=bags.find(b=>!b.opened&&Math.abs(p.x-b.x)<b.w/2+8&&p.y>b.y-b.h/2-26*S&&p.y<b.y+b.h/2+8);if(!b)return;b.opened=t;api.hit();api.sfx('pop');let text={mini:'tiny Justin!',peanuts:'peanuts',tag:'a tag',sock:'one sock'}[b.content];if(b.content==='peanuts')burst(b.x,b.y,12);if(lastColor===b.color&&matches<4){matches++;api.hit();text='MATCH!';api.sfx('crit-great')}lastColor=b.color;api.pop(b.x,b.y-b.h,text)}
    else if(phase==='final'&&!final.popped&&Math.abs(p.x-final.x)<W*.3){final.popped=t;burst(final.x,H*.45,40);api.sfx('boom');api.pop(final.x,H*.2,'OVERWEIGHT!')}},
   draw(c,t){c.fillStyle='#3b4049';rr(c,-10,belt,W+20,16*S+10,6);c.fill();c.strokeStyle='#5d6470';c.lineWidth=3;for(let x=-((t*speed)%28);x<W;x+=28){c.beginPath();c.moveTo(x,belt+3);c.lineTo(x+12,belt+13*S+7);c.stroke()}c.fillStyle='#202020';for(let x=20;x<W;x+=60){c.beginPath();c.arc(x,belt+16*S+14,6*S+2,0,Math.PI*2);c.fill()}
    for(const b of bags){c.save();c.translate(b.x,b.y);ink(c);c.fillStyle=colors[b.color];const lid=b.opened?Math.min(1,(t-b.opened)*5):0;rr(c,-b.w/2,-b.h/2,b.w,b.h,8);c.fill();c.stroke();c.save();c.translate(-b.w/2,-b.h/2);c.rotate(-lid*1.1);rr(c,0,-8*S,b.w,10*S+2,5);c.fillStyle='#5d6470';c.fill();c.stroke();c.restore();c.beginPath();c.moveTo(-10*S,-b.h/2-2);c.quadraticCurveTo(0,-b.h/2-16*S,10*S,-b.h/2-2);c.stroke();c.fillStyle='#fff';rr(c,b.w/2-12*S,-6,14*S,20*S,3);c.fill();c.stroke();c.fillStyle=colors[b.color];c.beginPath();c.arc(b.w/2-5*S,2,4*S,0,Math.PI*2);c.fill();
     if(lid>.5){if(b.content==='mini')api.drawFace(c,0,-b.h/2-6*S,28*S+8,Math.sin(t*6)*.2);else if(b.content==='tag'){c.fillStyle=colors[b.color];rr(c,-10*S,-b.h/2-30*S,20*S,26*S,3);c.fill();c.stroke()}else if(b.content==='sock'){c.fillStyle='#fff';c.beginPath();c.moveTo(-6*S,-b.h/2-30*S);c.lineTo(6*S,-b.h/2-30*S);c.lineTo(6*S,-b.h/2-12*S);c.lineTo(16*S,-b.h/2-6*S);c.lineTo(-6*S,-b.h/2-6*S);c.closePath();c.fill();c.stroke()}}c.restore()}
    if(final){const hh=H*.95*(final.popped?1+Math.min(.15,(t-final.popped)*.3):1),ww=hh*387/516;c.save();c.translate(final.x,H*.5+(final.popped?0:Math.sin(t*9)*3));if(final.popped)c.rotate(Math.sin(t*30)*.03);if(photo.complete&&photo.naturalWidth)c.drawImage(photo,-ww/2,-hh/2,ww,hh);c.restore()}
    c.fillStyle='#fffdf2';ink(c,1.5);for(const p of peanuts){c.beginPath();c.ellipse(p.x,p.y,p.r,p.r*.6,p.life*3,0,Math.PI*2);c.fill();c.stroke()}}}});

 /* ---------- Justincredible: Human Pinball ---------- */
 reg('hero',api=>{const {W,H,S}=api,R=22*S+6,pad={x:W/2,y:H-R-16},ball={x:pad.x,y:pad.y,vx:0,vy:0},bumpers=[[.22,.38,'#ff5fb1'],[.5,.26,'#5ec9ff'],[.78,.4,'#b47bff']].map(([x,y,col])=>({x:x*W,y:y*H,r:24*S+8,col,flash:0})),gold={x:W/2,y:H*.11+12,r:17*S+6,flash:0,hits:0,cool:0},tokens=Array.from({length:6},(_,i)=>({x:(.12+i*.152)*W,y:rand(.5,.72)*H*(i%2?1:.75),got:false}));let launches=3,phase='aim',drag=null,flyT=0,landT=0;
  api.banner('Human Pinball','Drag Justin back and let go, or tap where to launch him. 3 launches.');
  const launch=(vx,vy)=>{ball.vx=vx;ball.vy=vy;phase='fly';flyT=0;launches--;api.sfx('whoosh')};
  return {update(dt,t){gold.x=W/2+Math.sin(t*1.3)*W*.32;gold.cool=Math.max(0,gold.cool-dt);for(const b of [...bumpers,gold])b.flash=Math.max(0,b.flash-dt);if(phase==='aim')api.sub(launches+' launch'+(launches===1?'':'es')+' left · tokens and the golden bumper score');
    if(phase==='fly'){flyT+=dt;for(let i=0;i<3;i++){const h=dt/3;ball.x+=ball.vx*h;ball.y+=ball.vy*h;if(ball.x<R){ball.x=R;ball.vx=Math.abs(ball.vx)*.9}if(ball.x>W-R){ball.x=W-R;ball.vx=-Math.abs(ball.vx)*.9}if(ball.y<R){ball.y=R;ball.vy=Math.abs(ball.vy)*.9}if(ball.y>H-R){ball.y=H-R;ball.vy=-Math.abs(ball.vy)*.7}
      for(const b of [...bumpers,gold]){const dx=ball.x-b.x,dy=ball.y-b.y,dd=Math.hypot(dx,dy);if(dd>0&&dd<R+b.r){const nx=dx/dd,ny=dy/dd,dot=ball.vx*nx+ball.vy*ny;if(dot<0){ball.vx-=2*dot*nx;ball.vy-=2*dot*ny;const sp=Math.hypot(ball.vx,ball.vy)||1,boost=Math.max(sp*1.05,380*S);ball.vx*=boost/sp;ball.vy*=boost/sp;b.flash=.25;if(b===gold){if(gold.cool<=0&&gold.hits<3){gold.hits++;gold.cool=.5;api.hit();api.pop(b.x,b.y-30,'GOLDEN!');api.sfx('crit-perfect')}}else{api.pop(b.x,b.y-b.r-8,'BOING','soft');api.sfx('pop')}}ball.x=b.x+nx*(R+b.r);ball.y=b.y+ny*(R+b.r)}}
      for(const k of tokens)if(!k.got&&Math.hypot(ball.x-k.x,ball.y-k.y)<R+12*S){k.got=true;api.hit();api.pop(k.x,k.y-18,'+TOKEN');api.sfx('ping')}}
     const f=Math.pow(.55,dt);ball.vx*=f;ball.vy*=f;if(Math.hypot(ball.vx,ball.vy)<45*S||flyT>5){if(launches>0)phase='return';else{phase='land';landT=t;api.sfx('boom')}}}
    if(phase==='return'){ball.x+=(pad.x-ball.x)*Math.min(1,dt*6);ball.y+=(pad.y-ball.y)*Math.min(1,dt*6);if(Math.hypot(pad.x-ball.x,pad.y-ball.y)<3)phase='aim'}
    if(phase==='land'&&t-landT>2.4)api.end()},
   down(p){if(phase!=='aim')return;if(Math.hypot(p.x-ball.x,p.y-ball.y)<R*2.4)drag={x:p.x,y:p.y};else{const dx=p.x-ball.x,dy=p.y-ball.y,d=Math.hypot(dx,dy)||1;launch(dx/d*760*S,dy/d*760*S)}},
   move(p){if(drag){drag.x=p.x;drag.y=p.y}},
   up(){if(!drag||phase!=='aim')return;const dx=ball.x-drag.x,dy=ball.y-drag.y,len=Math.hypot(dx,dy);drag=null;if(len<14)return;const k=Math.min(150*S+30,len)/len;launch(dx*k*6.4,dy*k*6.4)},
   draw(c,t){ink(c);for(const b of bumpers){c.fillStyle=b.flash>0?'#fff':b.col;c.beginPath();c.arc(b.x,b.y,b.r,0,Math.PI*2);c.fill();c.stroke();c.beginPath();c.arc(b.x,b.y,b.r*.55,0,Math.PI*2);c.stroke()}
    c.fillStyle=gold.flash>0?'#fff':'#ffd400';c.beginPath();c.arc(gold.x,gold.y,gold.r,0,Math.PI*2);c.fill();c.stroke();c.fillStyle=INK;c.font='900 '+Math.round(gold.r)+'px sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText('★',gold.x,gold.y+1);
    for(const k of tokens)if(!k.got){c.fillStyle='#ffe57f';c.beginPath();c.arc(k.x,k.y,11*S+2,0,Math.PI*2);c.fill();c.stroke();c.fillStyle=INK;c.font='900 '+Math.round(11*S+4)+'px sans-serif';c.fillText('J',k.x,k.y+1)}
    c.fillStyle='#ffd400';rr(c,pad.x-50*S,pad.y+R-2,100*S,8,4);c.fill();c.stroke();
    if(drag){const dx=ball.x-drag.x,dy=ball.y-drag.y;c.setLineDash([6,8]);c.beginPath();c.moveTo(ball.x,ball.y);c.lineTo(ball.x+dx*1.6,ball.y+dy*1.6);c.stroke();c.setLineDash([])}
    if(phase==='land'){const k=t-landT,drop=Math.min(1,k/.45),y=-R+(H*.55+R)*drop*drop;if(k>.45&&k<1.1){c.strokeStyle='#ffd400';c.lineWidth=4;c.beginPath();c.ellipse(W/2,H*.55+R,(k-.45)*260*S,(k-.45)*60*S,0,0,Math.PI*2);c.stroke()}c.fillStyle='#e8344e';ink(c);const capeDrop=Math.max(0,Math.min(1,(k-1.2)/.5));c.beginPath();c.moveTo(W/2-R*1.4,y+R*.8-R*2.6*capeDrop);c.lineTo(W/2+R*1.4,y+R*.8-R*2.6*capeDrop);c.lineTo(W/2+R*1.2,y+R*1.9);c.lineTo(W/2-R*1.2,y+R*1.9);c.closePath();c.fill();c.stroke();if(capeDrop<1)api.drawFace(c,W/2,y,R*2);c.fillStyle='#c4006e';c.font='900 '+Math.round(22*S+6)+'px sans-serif';c.textAlign='center';if(k>.5)c.fillText('SUPERHERO LANDING',W/2,H*.2);if(capeDrop>=1){c.font='bold '+Math.round(13*S+5)+'px sans-serif';c.fillText('(the cape fell over his head)',W/2,H*.2+28*S)}}
    else{c.save();c.translate(ball.x,ball.y);c.fillStyle='#e8344e';c.beginPath();c.moveTo(-R*.9,0);c.lineTo(R*.9,0);c.lineTo(R*1.3-ball.vx*.03,R*1.6-ball.vy*.03);c.lineTo(-R*1.3-ball.vx*.03,R*1.6-ball.vy*.03);c.closePath();c.fill();c.stroke();c.restore();api.drawFace(c,ball.x,ball.y,R*1.8,Math.atan2(ball.vy,ball.vx)*.15)}}}});

 /* ---------- Justin Charge: Chain Reaction ---------- */
 reg('charge',api=>{const {W,H,S}=api,shapes=['●','■','▲'],spots=[[.5,.2],[.84,.52],[.5,.82]].sort(()=>Math.random()-.5),names=['Toaster','Desk fan','Rubber chicken'];
  const battery={x:W*.14,y:H*.5,out:0,kind:'battery'},machines=names.map((name,i)=>({x:spots[i][0]*W,y:spots[i][1]*H,in:i,out:i+1,name,kind:i,react:-9})),nodes=[battery,...machines],cascade=[];let route=[battery],phase='wire',spark=null,endAt=0,full=false;
  const NR=36*S+12,release={x:W*.5,y:H*.52,w:120*S+30,h:34*S+10};
  api.banner('Chain Reaction','Tap (or drag across) the machines in order. Each plug must match: ● → ■ → ▲. Then RELEASE.');
  const add=p=>{const n=nodes.find(n=>Math.hypot(n.x-p.x,n.y-p.y)<NR);if(!n)return false;if(n===battery){route=[battery];return true}if(!route.includes(n)&&route.length<4){route.push(n);api.sfx('tick')}return true};
  return {update(dt,t){if(phase==='wire')api.sub(route.length>1?'Route: '+route.slice(1).map(n=>n.name).join(' → '):'Start from the battery.');
    if(phase==='charge'){spark.k+=dt/.7;if(spark.k>=1){const a=route[spark.i],b=route[spark.i+1];if(b.in===a.out){b.react=t;api.hit();api.hit();api.sfx(['pop','tierup','squish'][b.kind]);api.pop(b.x,b.y-NR-8,['TOAST!','WHIRRR','SQUEAK'][b.kind]);spark.i++;spark.k=0;if(spark.i>=route.length-1){if(route.length===4){full=true;api.hit();api.hit();api.pop(W/2,H*.3,'FULL CHAIN!');api.sfx('fanfare');for(let i=0;i<(reduced()?8:26);i++)cascade.push({x:W/2,y:H/2,vx:rand(-220,220)*S,vy:rand(-300,-60)*S,life:1.6})}phase='battery';endAt=t}}else{api.pop(b.x,b.y-NR-8,'BZZT','miss');api.sfx('powerdown');phase='battery';endAt=t}}}
    for(const p of cascade){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=500*S*dt}if(phase==='battery'&&t-endAt>2.4)api.end()},
   down(p,t){if(phase!=='wire')return;if(route.length>1&&Math.abs(p.x-release.x)<release.w/2&&Math.abs(p.y-release.y)<release.h/2){phase='charge';spark={i:0,k:0};api.sfx('beam');return}add(p)},
   move(p){if(phase==='wire')add(p)},
   draw(c,t){ink(c,4);c.strokeStyle='#333';for(let i=1;i<route.length;i++){const a=route[i-1],b=route[i];c.beginPath();c.moveTo(a.x,a.y);c.bezierCurveTo(a.x+40*S,a.y-50*S,b.x-40*S,b.y+50*S,b.x,b.y);c.stroke()}
    if(phase==='charge'){const a=route[spark.i],b=route[spark.i+1];if(b){const x=a.x+(b.x-a.x)*spark.k,y=a.y+(b.y-a.y)*spark.k;c.fillStyle='#fff35a';c.beginPath();c.arc(x,y,9*S+3,0,Math.PI*2);c.fill();c.strokeStyle='#ffd400';c.lineWidth=2;for(let i=0;i<4;i++){c.beginPath();c.moveTo(x,y);c.lineTo(x+rand(-18,18),y+rand(-18,18));c.stroke()}}}
    const sock=(x,y,sym,col)=>{c.fillStyle=col;c.beginPath();c.arc(x,y,11*S+3,0,Math.PI*2);c.fill();ink(c,2);c.stroke();c.fillStyle=INK;c.font='900 '+Math.round(11*S+4)+'px sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText(sym,x,y+1)};
    ink(c);c.fillStyle='#7ae04a';rr(c,battery.x-24*S,battery.y-36*S,48*S,72*S,6);c.fill();c.stroke();c.fillStyle=INK;c.fillRect(battery.x-8*S,battery.y-42*S,16*S,6*S);c.font='900 '+Math.round(14*S+4)+'px sans-serif';c.textAlign='center';c.textBaseline='middle';const pct=phase==='battery'?'1%':'100%';c.fillText(pct,battery.x,battery.y);sock(battery.x+30*S,battery.y,shapes[0],'#fff');
    if(phase==='battery'){c.fillStyle='rgba(120,120,120,.35)';for(let i=0;i<4;i++){const k=((t-endAt)*.8+i*.25)%1;c.beginPath();c.arc(battery.x+Math.sin(k*6+i)*8,battery.y-50*S-k*70*S,(6+k*14)*S,0,Math.PI*2);c.fill()}}
    for(const m of machines){const active=t-m.react<1;c.save();c.translate(m.x,m.y);ink(c);c.fillStyle='#fff';rr(c,-NR,-NR*.8,NR*2,NR*1.6,10);c.fill();c.stroke();
     if(m.kind===0){c.fillStyle='#c0c4cc';rr(c,-NR*.6,-NR*.3,NR*1.2,NR*.8,8);c.fill();c.stroke();c.fillStyle='#c98a4b';const up=active?-(t-m.react)*90*S:0;rr(c,-NR*.3,-NR*.55+up,NR*.6,NR*.4,4);c.fill();c.stroke()}
     else if(m.kind===1){const spin=active?t*30:0;c.rotate(spin);for(let i=0;i<3;i++){c.rotate(Math.PI*2/3);c.fillStyle='#9fe9ff';c.beginPath();c.ellipse(0,-NR*.35,NR*.18,NR*.35,0,0,Math.PI*2);c.fill();c.stroke()}}
     else{const sq=active?1+Math.sin((t-m.react)*30)*.15:1;c.scale(sq,1/sq);c.fillStyle='#ffd400';c.beginPath();c.ellipse(0,0,NR*.55,NR*.35,0,0,Math.PI*2);c.fill();c.stroke();c.fillStyle='#ff8a3d';c.beginPath();c.moveTo(NR*.5,-NR*.05);c.lineTo(NR*.8,0);c.lineTo(NR*.5,NR*.08);c.fill();c.stroke()}
     c.restore();sock(m.x-NR,m.y,shapes[m.in],'#fff');if(m.out<3)sock(m.x+NR,m.y,shapes[m.out],'#fff');c.fillStyle=INK;c.font='bold '+Math.round(10*S+4)+'px sans-serif';c.textAlign='center';c.fillText(m.name,m.x,m.y+NR+12*S)}
    if(phase==='wire'&&route.length>1){c.fillStyle='#fff35a';rr(c,release.x-release.w/2,release.y-release.h/2,release.w,release.h,10);c.fill();ink(c,3);c.stroke();c.fillStyle=INK;c.font='900 '+Math.round(14*S+5)+'px sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText('⚡ RELEASE',release.x,release.y+1)}
    c.fillStyle='#ffe57f';for(const p of cascade)if(p.life>0){c.beginPath();c.arc(p.x,p.y,7*S+2,0,Math.PI*2);c.fill();ink(c,1.5);c.stroke()}}}});

 /* ---------- Justin Debt: Borrowed Equipment ---------- */
 reg('debt',api=>{const {W,H,S}=api,s=game.snapshot(),owned=G.businesses.filter(b=>s.levels[b.id]>0).slice(-6),choices=owned.length?owned:[G.businesses[0]],cards=choices.map((b,i)=>({b,x:W*(.2+(i%3)*.3),y:H*(choices.length>3?(i<3?.36:.72):.55),icon:api.image('assets/icons/upgrade-'+b.id+'.svg')})),extra=api.budget*C.participation,receipts=[];
  let phase='choose',pick=null,t0=0,nextR=0,truckX=-220*S;api.banner('Borrowed Equipment',owned.length?'Choose one of your upgrades to borrow.':'No upgrades yet. Borrow a sample finger!');
  const truck=(c,x,y,load,towing)=>{c.save();c.translate(x,y);ink(c);c.fillStyle='#ffd400';rr(c,-90*S,-30*S,120*S,30*S,4);c.fill();c.stroke();c.fillStyle='#9fe9ff';rr(c,30*S,-44*S,44*S,44*S,6);c.fill();c.stroke();c.fillStyle=INK;for(const wx of [-60,0,52]){c.beginPath();c.arc(wx*S,4*S,12*S,0,Math.PI*2);c.fill()}c.strokeStyle=INK;c.beginPath();c.moveTo(-90*S,-30*S);c.lineTo(-120*S,-60*S);c.lineTo(-128*S,-40*S);c.stroke();if(load&&load.complete){const sz=(towing?70:56)*S;c.drawImage(load,-60*S-sz/2,-30*S-sz,sz,sz)}c.restore()};
  return {update(dt,t){if(phase==='deliver'){truckX+=(W*.42-truckX)*Math.min(1,dt*2.6);if(t-t0>2.2){phase='borrow';t0=t;api.sfx('thud');api.banner('Borrowed Equipment','')}}
    if(phase==='borrow'){const k=Math.min(1,(t-t0)/20);api.sub('Giant '+pick.b.name+' · temporary extra earnings +'+fmt(extra*k)+' · '+Math.ceil(20-(t-t0))+'s left');if(t>nextR){receipts.push({x:rand(.08,.92)*W,y:-20,vy:(rand(38,64))*S+16,sway:rand(0,6),got:false});nextR=t+1.55}for(const r of receipts)r.y+=r.vy*dt;if(k>=1){phase='repo';t0=t;truckX=W+220*S;api.sfx('powerdown');api.banner('REPOSSESSED','The truck takes back only the borrowed copy. Your real upgrades are untouched.')}}
    if(phase==='repo'){truckX-=W*.55*dt;if(t-t0>3)api.end()}},
   down(p,t){if(phase==='choose'){const card=cards.find(k=>Math.abs(k.x-p.x)<70*S+10&&Math.abs(k.y-p.y)<60*S+10);if(card){pick=card;phase='deliver';t0=t;api.sfx('hum')}return}
    if(phase==='borrow'){const r=receipts.find(r=>!r.got&&Math.abs(r.x+Math.sin(r.y/30+r.sway)*14-p.x)<30*S+14&&Math.abs(r.y-p.y)<36*S+14);if(r){r.got=true;if(api.hit())api.pop(r.x,r.y-20,'RECEIPT');else api.pop(r.x,r.y-20,'(folder full)','soft');api.sfx('tick')}}},
   draw(c,t){if(phase==='choose'){for(const k of cards){c.save();c.translate(k.x,k.y);ink(c);c.fillStyle='#fff';rr(c,-66*S,-56*S,132*S,112*S,10);c.fill();c.stroke();if(k.icon.complete)c.drawImage(k.icon,-28*S,-46*S,56*S,56*S);c.fillStyle=INK;c.font='bold '+Math.round(10*S+4)+'px sans-serif';c.textAlign='center';c.fillText(k.b.name.slice(0,18),0,24*S);c.font=Math.round(9*S+4)+'px sans-serif';c.fillText(owned.length?'×'+s.levels[k.b.id]+' owned':'sample',0,40*S);c.restore()}return}
    const giant=pick.icon;if(phase==='borrow'){const k=Math.min(1,(t-t0)/20),sz=Math.min(W,H)*.42;if(giant.complete)c.drawImage(giant,W/2-sz/2,H*.12,sz,sz);c.fillStyle='#ffe57f';ink(c);rr(c,W/2-50*S,H*.12+sz-6,100*S,22*S,6);c.fill();c.stroke();c.fillStyle=INK;c.font='900 '+Math.round(11*S+4)+'px sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText('BORROWED',W/2,H*.12+sz+5*S);c.fillStyle='#eee';rr(c,W*.1,H-18,W*.8,10,5);c.fill();c.fillStyle='#c8102e';rr(c,W*.1,H-18,W*.8*(1-k),10,5);c.fill()}
    truck(c,truckX,H*.86,phase==='deliver'?giant:phase==='repo'?giant:null,phase==='repo');if(phase==='repo'){c.save();c.translate(W/2,H*.35);c.rotate(-.12);c.strokeStyle='#c8102e';c.lineWidth=4;c.font='900 '+Math.round(26*S+8)+'px sans-serif';c.textAlign='center';c.strokeText('REPOSSESSED',0,0);c.restore()}
    for(const r of receipts)if(!r.got){const x=r.x+Math.sin(r.y/30+r.sway)*14;c.save();c.translate(x,r.y);c.rotate(Math.sin(r.y/40+r.sway)*.3);ink(c,1.5);c.fillStyle='#fff';rr(c,-14*S,-20*S,28*S,40*S,2);c.fill();c.stroke();c.beginPath();for(let i=0;i<4;i++){c.moveTo(-9*S,-12*S+i*8*S);c.lineTo(9*S,-12*S+i*8*S)}c.stroke();c.restore()}}}});

 /* ---------- Justin Trouble: Getaway ---------- */
 reg('trouble',api=>{const {W,H,S}=api,R=16*S+6,runner={x:W*.1,y:H*.5,vx:115*S+40,vy:55*S,stun:0,spotCool:0,portalCool:0},lights=[0,1].map(i=>({x:0,y:0,r:58*S+16,ph:i*2.2})),tokens=Array.from({length:5},(_,i)=>({x:(.28+i*.13)*W,y:rand(.18,.82)*H,got:false})),exit={x:W-40*S-14,y:rand(.25,.75)*H,w:40*S+12,h:56*S+14},pairs=[];
  let pending=null,placed=0,phase='run',endT=0,escaped=false,boxAt=null;api.banner('Getaway','Tap twice to place an entrance and an exit portal (3 pairs). Guide Justin to EXIT, dodge the spotlights.');
  return {update(dt,t){for(const l of lights){l.x=W*(.55+.32*Math.sin(t*.75+l.ph));l.y=H*(.5+.3*Math.sin(t*1.15+l.ph*1.7))}
    if(phase==='run'){api.sub(Math.max(0,Math.ceil(22-t))+'s · portal pairs left: '+(3-placed)+(pending?' · tap the exit portal spot':''));if(t>22){phase='box';endT=t;boxAt={x:runner.x,y:runner.y};api.sfx('thud');return}
     runner.spotCool=Math.max(0,runner.spotCool-dt);runner.portalCool=Math.max(0,runner.portalCool-dt);if(runner.stun>0)runner.stun-=dt;else{runner.x+=runner.vx*dt;runner.y+=runner.vy*dt}
     if(runner.x<R){runner.x=R;runner.vx=Math.abs(runner.vx)}if(runner.x>W-R){runner.x=W-R;runner.vx=-Math.abs(runner.vx)}if(runner.y<R){runner.y=R;runner.vy=Math.abs(runner.vy)}if(runner.y>H-R){runner.y=H-R;runner.vy=-Math.abs(runner.vy)}
     for(const l of lights)if(runner.spotCool<=0&&Math.hypot(runner.x-l.x,runner.y-l.y)<l.r){runner.stun=.7;runner.spotCool=1.6;runner.vx*=-1;runner.vy*=-1;api.pop(runner.x,runner.y-R*1.6,'!','miss');api.sfx('glitch')}
     for(const p of pairs)if(runner.portalCool<=0&&Math.hypot(runner.x-p.a.x,runner.y-p.a.y)<R+16*S){runner.x=p.b.x;runner.y=p.b.y;runner.portalCool=.8;api.sfx('portal')}
     for(const k of tokens)if(!k.got&&Math.hypot(runner.x-k.x,runner.y-k.y)<R+12*S){k.got=true;api.hit();api.pop(k.x,k.y-18,'+TOKEN');api.sfx('ping')}
     if(Math.abs(runner.x-exit.x)<exit.w/2+R*.4&&Math.abs(runner.y-exit.y)<exit.h/2){escaped=true;api.hit();api.hit();api.hit();api.pop(exit.x,exit.y-exit.h,'ESCAPED!');api.sfx('fanfare');phase='box';endT=t;boxAt={x:exit.x-exit.w,y:exit.y}}}
    if(phase==='box'&&t-endT>2)api.end()},
   down(p){if(phase!=='run'||placed>=3)return;if(!pending){pending={x:p.x,y:p.y};api.sfx('tick')}else{pairs.push({a:pending,b:{x:p.x,y:p.y}});pending=null;placed++;api.sfx('portal')}},
   draw(c,t){c.fillStyle='rgba(20,16,40,.35)';c.fillRect(0,0,W,H);for(const l of lights){const g=c.createRadialGradient(l.x,l.y,0,l.x,l.y,l.r);g.addColorStop(0,'rgba(255,250,200,.75)');g.addColorStop(1,'rgba(255,250,200,0)');c.fillStyle=g;c.beginPath();c.arc(l.x,l.y,l.r,0,Math.PI*2);c.fill()}
    ink(c);c.fillStyle='#2f9e44';rr(c,exit.x-exit.w/2,exit.y-exit.h/2,exit.w,exit.h,6);c.fill();c.stroke();c.fillStyle='#fff';c.font='900 '+Math.round(10*S+4)+'px sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText('EXIT',exit.x,exit.y-exit.h/2-10*S);
    for(const k of tokens)if(!k.got){c.fillStyle='#ffe57f';c.beginPath();c.arc(k.x,k.y,11*S+2,0,Math.PI*2);c.fill();ink(c,2);c.stroke()}
    const ringAt=(p,col)=>{c.strokeStyle=col;c.lineWidth=6;c.beginPath();c.ellipse(p.x,p.y,18*S+6,24*S+8,0,0,Math.PI*2);c.stroke()};for(const p of pairs){c.setLineDash([4,8]);ink(c,1.5);c.beginPath();c.moveTo(p.a.x,p.a.y);c.lineTo(p.b.x,p.b.y);c.stroke();c.setLineDash([]);ringAt(p.a,'#3b82f6');ringAt(p.b,'#ff8a3d')}if(pending)ringAt(pending,'#3b82f6');
    if(phase==='box'){const k=Math.min(1,(t-endT)/.4),y=boxAt.y-(1-k)*H*.5;c.fillStyle='#c98a4b';ink(c);rr(c,boxAt.x-30*S,y-24*S,60*S,48*S,4);c.fill();c.stroke();c.fillStyle=INK;for(let i=0;i<5;i++){c.beginPath();c.moveTo(boxAt.x-14*S+i*7*S,y-24*S);c.lineTo(boxAt.x-16*S+i*7*S+Math.sin(t*4+i)*2,y-36*S);c.lineTo(boxAt.x-10*S+i*7*S,y-24*S);c.fill()}c.font='bold '+Math.round(10*S+4)+'px sans-serif';c.textAlign='center';c.fillText(escaped?'(definitely not Justin)':'(hiding. badly.)',boxAt.x,y+38*S)}
    else{const bob=runner.stun>0?0:Math.sin(t*20)*3;ink(c,3);c.beginPath();c.moveTo(runner.x-5,runner.y+R*.6);c.lineTo(runner.x-7+bob,runner.y+R*1.3);c.moveTo(runner.x+5,runner.y+R*.6);c.lineTo(runner.x+7-bob,runner.y+R*1.3);c.stroke();api.drawFace(c,runner.x,runner.y,R*2,runner.vx<0?-.15:.15)}}}});
})();
