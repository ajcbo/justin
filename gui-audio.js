'use strict';
(()=>{
 let prefs={on:true,memes:true,volume:35};try{prefs={...prefs,...JSON.parse(localStorage.getItem('justin-gui-audio')||'{}')}}catch{}
 prefs.volume=Math.max(0,Math.min(100,Number(prefs.volume)||0));let ac,gain,wet,unlocked=false;const clips=new Map(),playing=new Set(),last=new Map();
 const muted=()=>!prefs.on||window.JustinLive?.muted()||document.hidden;
 const field=document.createElement('fieldset');field.innerHTML='<legend>GUI sounds</legend><label><input id="gui-audio-on" type="checkbox"> interface sounds</label><label><input id="gui-audio-memes" type="checkbox"> meme reactions</label><label>volume <input id="gui-audio-volume" type="range" min="0" max="100"></label><button id="gui-audio-preview" type="button">Test sound</button><p>Purchases, achievements, rewards, and announcements. Separate from the click sound.</p><a href="sound-credits.html">Sound credits</a>';document.getElementById('settings').append(field);
 const $=id=>document.getElementById(id);$('gui-audio-on').checked=prefs.on;$('gui-audio-memes').checked=prefs.memes;$('gui-audio-volume').value=prefs.volume;
 function stop(){for(const source of playing)try{source.stop()}catch{}playing.clear()}
 function save(){prefs={on:$('gui-audio-on').checked,memes:$('gui-audio-memes').checked,volume:Number($('gui-audio-volume').value)};if(!prefs.on)stop();try{localStorage.setItem('justin-gui-audio',JSON.stringify(prefs))}catch{}}
 for(const id of ['gui-audio-on','gui-audio-memes','gui-audio-volume'])$(id).addEventListener('input',save);
 async function unlock(){if(!ac){try{const C=window.AudioContext||window.webkitAudioContext;if(!C)return;ac=new C({latencyHint:'interactive'});gain=ac.createGain();const limiter=ac.createDynamicsCompressor();limiter.threshold.value=-20;limiter.ratio.value=8;gain.connect(limiter);limiter.connect(ac.destination);wet=ac.createGain();wet.connect(gain);if(ac.createConvolver){try{const length=Math.floor(ac.sampleRate*2.4),impulse=ac.createBuffer(2,length,ac.sampleRate);for(let c=0;c<2;c++){const d=impulse.getChannelData(c);for(let i=0;i<length;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/length,3.2)}const room=ac.createConvolver(),send=ac.createGain();room.buffer=impulse;send.gain.value=.42;wet.connect(room);room.connect(send);send.connect(gain);}catch{}}for(const name of ['bruh','duck','alert','wow','cash-register'])fetch('assets/gui-sfx/'+name+(name==='cash-register'?'.wav':'.mp3')).then(r=>{if(!r.ok)throw Error();return r.arrayBuffer()}).then(b=>ac.decodeAudioData(b)).then(b=>clips.set(name,b)).catch(()=>{})}catch{return}}try{await ac.resume();unlocked=ac.state==='running'}catch{}}
 function tone(frequency,at,duration=.065,type='sine',level=.11,glide=0,dest=gain){if(!ac||playing.size>=18)return;const o=ac.createOscillator(),g=ac.createGain();o.type=type;const pitch=o.frequency;if(pitch.setValueAtTime){pitch.setValueAtTime(frequency,at);if(glide)pitch.exponentialRampToValueAtTime(glide,at+duration)}else pitch.value=frequency;g.gain.setValueAtTime(.0001,at);g.gain.exponentialRampToValueAtTime(level,at+.006);g.gain.exponentialRampToValueAtTime(.001,at+duration);o.connect(g);g.connect(dest||gain);playing.add(o);o.onended=()=>{playing.delete(o);o.disconnect();g.disconnect()};o.start(at);o.stop(at+duration+.01)}
 // Filtered noise for rumbles, impacts, whooshes and shatters (one shared buffer, created lazily).
 let noiseBuffer=null;function noiseData(){if(!noiseBuffer){noiseBuffer=ac.createBuffer(1,ac.sampleRate*2,ac.sampleRate);const d=noiseBuffer.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1}return noiseBuffer}
 function noise(at,duration,level,type='lowpass',from=400,to=from,q=.8,dest=gain){if(!ac||playing.size>=18)return;noiseData();const src=ac.createBufferSource(),f=ac.createBiquadFilter?.(),g=ac.createGain();src.buffer=noiseBuffer;g.gain.setValueAtTime(.0001,at);g.gain.exponentialRampToValueAtTime(level,at+Math.min(.04,duration/4));g.gain.exponentialRampToValueAtTime(.0005,at+duration);if(f){f.type=type;f.Q.value=q;f.frequency.setValueAtTime(from,at);f.frequency.exponentialRampToValueAtTime(to,at+duration);src.connect(f);f.connect(g)}else src.connect(g);g.connect(dest||gain);playing.add(src);src.onended=()=>{playing.delete(src);src.disconnect();g.disconnect()};src.start(at);src.stop(at+duration+.02)}
 // Short synthesized cues: graded critical hits, roll ticks, rarity fanfares and character noises.
 const synth={
  'crit-good':at=>{tone(880,at,.07,'triangle',.12);tone(1320,at+.06,.12,'triangle',.11)},
  'crit-great':at=>{[880,1175,1568].forEach((f,i)=>tone(f,at+i*.05,.11,'triangle',.12))},
  'crit-perfect':at=>{[1047,1319,1568,2093].forEach((f,i)=>tone(f,at+i*.045,.14,'square',.05));tone(2637,at+.2,.28,'sine',.08)},
  tick:at=>tone(2300,at,.025,'square',.025),
  boop:at=>tone(700,at,.12,'sine',.12,1500),
  creak:at=>{tone(190,at,.42,'sawtooth',.035,120);tone(260,at+.18,.3,'sawtooth',.025,170)},
  squeak:at=>tone(1300,at,.16,'sine',.08,2400),
  hop:at=>tone(330,at,.09,'triangle',.07,620),
  poof:at=>{tone(500,at,.18,'triangle',.06,180);tone(900,at+.03,.12,'sine',.05,300)},
  'reveal-common':at=>{tone(523,at,.1,'triangle',.1);tone(659,at+.08,.16,'triangle',.1)},
  'reveal-rare':at=>{[523,659,784,1047].forEach((f,i)=>tone(f,at+i*.07,.18,'triangle',.11))},
  'reveal-epic':at=>{[392,523,659,784,1047].forEach((f,i)=>tone(f,at+i*.07,.2,'triangle',.11));tone(1568,at+.38,.4,'sine',.06)},
  'reveal-legendary':at=>{[523,659,784,1047,1319,1568].forEach((f,i)=>tone(f,at+i*.065,.24,'square',.045));tone(2093,at+.42,.5,'sine',.08)},
  rumble:at=>{noise(at,1.8,.35,'lowpass',90,60,.8,wet);tone(42,at,1.8,'sine',.16,38,wet)},
  riser:at=>{noise(at,2,.22,'bandpass',180,5200,1.6,wet);tone(110,at,2,'sawtooth',.035,880,wet);tone(165,at,2,'sawtooth',.025,1320,wet)},
  boom:at=>{tone(58,at,2.2,'sine',.42,24,wet);noise(at,1.4,.35,'lowpass',380,40,.8,wet);tone(116,at,.9,'triangle',.08,40,wet)},
  gong:at=>{[110,163,221,302,413].forEach((f,i)=>tone(f,at,3.2-i*.4,'sine',.1-i*.015,f*.985,wet));noise(at,.3,.12,'bandpass',900,400,1,wet)},
  shimmer:at=>{[2093,2637,3136,3951,4699].forEach((f,i)=>tone(f,at+i*.06,1.1,'sine',.035,0,wet))},
  brass:at=>{[147,220,294,349].forEach((f,i)=>tone(f*(1+(i%2?.003:-.003)),at,1.1,'sawtooth',.05,0,wet));tone(73,at,1.2,'sine',.2,0,wet)},
  heartbeat:at=>{tone(60,at,.18,'sine',.28,40);tone(55,at+.2,.2,'sine',.22,38)},
  zap:at=>{tone(1500,at,.16,'square',.04,220);noise(at,.12,.08,'highpass',3000,8000)},
  squish:at=>{tone(900+Math.random()*500,at,.1,'sine',.1,2200);tone(300,at,.08,'triangle',.05,120)},
  ow:at=>{tone(260,at,.32,'sawtooth',.06,140,wet);tone(75,at,.4,'sine',.22,36,wet)},
  glitch:at=>{for(let i=0;i<4;i++)tone(200+Math.random()*1800,at+i*.03,.03,'square',.04)},
  tierup:at=>{[523,784,1047].forEach((f,i)=>tone(f,at+i*.05,.16,'triangle',.07))},
  ping:at=>{tone(1568,at,.22,'sine',.06,0,wet);tone(2349,at+.04,.18,'sine',.03,0,wet)},
  fanfare:at=>{[[392,494,587],[440,554,659],[523,659,784,1047]].forEach((chord,i)=>chord.forEach(f=>tone(f,at+i*.18,i===2?1.1:.2,'sawtooth',.035,0,wet)));tone(131,at+.36,1.1,'sine',.18,0,wet)},
  musicbox:at=>{[1047,1319,1568,2093,1568,1319,1760,2093].forEach((f,i)=>tone(f,at+i*.11,.5,'sine',.05,0,wet))},
  cheer:at=>{for(let i=0;i<6;i++)noise(at+i*.05,.9,.05,'bandpass',700+i*240,1100+i*300,3,wet);tone(523,at,.7,'triangle',.05,0,wet)},
  hit:at=>{[131,196,262,330,392].forEach((f,i)=>tone(f*(1+(i%2?.004:-.004)),at,.75,'sawtooth',.05,0,wet));noise(at,.35,.25,'lowpass',2400,300,.8,wet);tone(65,at,.6,'sine',.2,45,wet)},
  thud:at=>{tone(72,at,.38,'sine',.3,34,wet);noise(at,.25,.3,'lowpass',260,80,.8,wet)},
  impact:at=>{tone(95,at,1.1,'sine',.32,26,wet);noise(at,.9,.32,'lowpass',500,60,.8,wet);tone(190,at,.5,'triangle',.06,60,wet)},
  crash:at=>{noise(at,.9,.12,'lowpass',700,120,.8,wet);tone(60,at,.5,'sine',.08,30,wet);noise(at+.12,.5,.06,'bandpass',1800,600,2,wet)},
  whoosh:at=>noise(at,1.1,.18,'bandpass',200,900,1.4),
  hum:at=>{tone(55,at,2.6,'sawtooth',.03,110);tone(110,at,2.6,'sine',.05,220);noise(at,2.6,.04,'bandpass',300,700,3)},
  beam:at=>{tone(380,at,1.1,'sine',.06,1500);tone(760,at+.05,1,'triangle',.03,2900)},
  deep1:at=>{tone(520,at,.35,'square',.05,480);tone(130,at,.4,'sine',.15,120)},
  deep2:at=>{tone(330,at,.5,'square',.05,300);tone(82,at,.6,'sine',.2,74)},
  deep3:at=>{tone(196,at,.8,'square',.06,170);tone(49,at,.9,'sine',.26,40);noise(at,.5,.15,'lowpass',300,80)},
  powerdown:at=>{tone(320,at,.9,'sawtooth',.05,38);tone(160,at,.9,'square',.03,20)},
  pop:at=>tone(280,at,.14,'sine',.14,980),
  shatter:at=>{noise(at,.45,.2,'highpass',2500,6000);[1760,2350,2960].forEach((f,i)=>tone(f,at+i*.04,.25,'triangle',.04))},
  crack:at=>noise(at,.18,.25,'highpass',1800,3200),
  portal:at=>{tone(140,at,.6,'sine',.12,520);noise(at,.6,.1,'bandpass',300,1600,2)},
  'reveal-mythic':at=>{[523,587,659,784,880,1047,1175,1319,1568].forEach((f,i)=>tone(f,at+i*.05,.26,i%2?'triangle':'square',.05));tone(2093,at+.48,.7,'sine',.09);tone(2637,at+.6,.6,'sine',.06)}
 };
 const gaps={riser:1500,boom:500,gong:1200,shimmer:400,brass:300,heartbeat:350,zap:60,squish:50,ow:120,glitch:120,tierup:300,ping:800,fanfare:1500,musicbox:1500,cheer:1500,thud:250,hit:250,deep1:200,deep2:200,deep3:200,pop:90,shatter:150,crack:120,portal:200,impact:400,rumble:900,ui:65,buy:400,tick:35,'crit-good':50,'crit-great':50,'crit-perfect':50,boop:500,squeak:600,hop:150,poof:400,creak:1500};
 function play(kind){if(muted()||!unlocked||!ac)return;const now=performance.now(),gap=gaps[kind]??(kind.startsWith('reveal-')?600:900);if(now-(last.get(kind)||-Infinity)<gap)return;last.set(kind,now);gain.gain.value=prefs.volume/100;if(synth[kind]){synth[kind](ac.currentTime);return}const meme={buy:'cash-register',achievement:'wow',rare:'wow',catch:'duck',duplicate:'bruh',notification:'alert',toy:'duck'}[kind];if((prefs.memes||kind==='buy')&&meme&&clips.has(meme)){if(playing.size>=3)return;const source=ac.createBufferSource();source.buffer=clips.get(meme);const quiet=ac.createGain();quiet.gain.value=.22;source.connect(quiet);quiet.connect(gain);playing.add(source);source.onended=()=>{playing.delete(source);source.disconnect();quiet.disconnect()};source.start(0,0,Math.min(2.2,source.buffer.duration));return}const at=ac.currentTime;tone(kind==='hover'?420:kind==='ui'?650:kind==='duplicate'?230:880,at);if(!['ui','hover'].includes(kind))tone(1175,at+.075,.12)}
 window.JustinGUIAudio={play,stop,muted,unlock};document.addEventListener('pointerdown',()=>unlock(),{passive:true});document.addEventListener('keydown',()=>unlock(),{passive:true});$('gui-audio-preview').onclick=()=>{unlock().then(()=>play('achievement'))};
 document.addEventListener('pointerover',e=>{if(e.pointerType==='touch')return;const b=e.target.closest('button,a,summary');if(b&&!b.disabled&&!b.contains(e.relatedTarget)&&b.id!=='face-button'&&!b.classList.contains('critical-target'))play('hover')},{passive:true});
 document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b||b.disabled||b.id==='face-button'||b.classList.contains('critical-target')||b.classList.contains('escape-justin')||b.closest('.business-card,.face-card,.backdrop-card,.distraction-card')||b.id==='gui-audio-preview')return;play('ui')});
 window.addEventListener('justin-sound-policy',e=>{if(e.detail.muted)stop()});document.addEventListener('visibilitychange',()=>{if(document.hidden)stop()});
 let previous=null,quietUntil=0;window.addEventListener('justin-account-change',()=>{previous=null;quietUntil=performance.now()+1500});
 setInterval(()=>{if(document.hidden)return;const s=window.justinClicker.snapshot(),current={levels:JustinGame.businesses.reduce((n,b)=>n+s.levels[b.id],0),faces:s.owned.length,backdrops:s.backdrops.length,toys:s.toys?.length||0,badges:s.badges.length,rebirths:s.rebirths,reward:s.lastReward?.id};if(previous&&performance.now()>quietUntil){if(current.badges>previous.badges)play('achievement');else if(current.levels>previous.levels||current.faces>previous.faces||current.backdrops>previous.backdrops||current.toys>previous.toys){if(!s.lastRoll||s.lastReward?.id!==s.lastRoll.id)play('buy')}if(current.rebirths>previous.rebirths)play('rare');if(current.reward!==previous.reward&&s.lastReward&&s.lastReward.id!==s.lastRoll?.id)play(s.lastReward.label==='Escapee caught'?'catch':'reward')}previous=current},250);
 const announcements=document.getElementById('live-notices');if(announcements)new MutationObserver(records=>{if(records.some(r=>r.addedNodes.length))play('notification')}).observe(announcements,{childList:true});
})();
