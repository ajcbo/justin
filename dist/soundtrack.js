'use strict';
// Original soundtrack, synthesized live with Web Audio: no downloads, no licensing, and it reacts to the game.
// A 16th-note look-ahead sequencer plays one theme at a time on the music bus from gui-audio.js.
// Background music (optional) gets busier with your combo; each invasion variant has its own theme.
(()=>{
 const el=id=>document.getElementById(id);
 let prefs={events:true,lobby:false,volume:45};try{prefs={...prefs,...JSON.parse(localStorage.getItem('justin-music')||'{}')}}catch{}
 const save=()=>{try{localStorage.setItem('justin-music',JSON.stringify(prefs))}catch{}};
 const midi=n=>440*Math.pow(2,(n-69)/12);
 let custom={},customBuffers=new Map(),customSource=null,customFor='';
 let E=null,voices=0,theme=null,themeName='',step=0,next=0,timer=0,intensity=0,tempo=1,event=null,danceVolume=null;

 /* ---------- instruments ---------- */
 function tone(t,freq,dur,o={}){if(!E||voices>40)return;const ac=E.ac,osc=ac.createOscillator(),g=ac.createGain();osc.type=o.type||'sine';osc.frequency.setValueAtTime(freq,t);if(o.glide)osc.frequency.exponentialRampToValueAtTime(o.glide,t+(o.glideTime||dur));if(o.detune)osc.detune.value=o.detune;let head=osc;
  if(o.cutoff){const f=ac.createBiquadFilter();f.type='lowpass';f.Q.value=o.q||.8;f.frequency.setValueAtTime(o.cutoff,t);if(o.sweep)f.frequency.exponentialRampToValueAtTime(o.sweep,t+dur);osc.connect(f);head=f}
  let lfo=null;if(o.vib){lfo=ac.createOscillator();const depth=ac.createGain();lfo.frequency.value=o.vib;depth.gain.value=freq*.018;lfo.connect(depth);depth.connect(osc.frequency);lfo.start(t);lfo.stop(t+dur+.05)}
  const level=o.level??.08,attack=o.attack??.005;g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(level,t+attack);if(o.hold)g.gain.setValueAtTime(level,t+Math.max(attack,dur*o.hold));g.gain.exponentialRampToValueAtTime(.0001,t+dur);head.connect(g);g.connect(E.music);voices++;osc.onended=()=>{voices--;g.disconnect();head!==osc&&head.disconnect()};osc.start(t);osc.stop(t+dur+.05)}
 function hiss(t,dur,level,type,freq,q=1){if(!E||voices>40)return;const ac=E.ac,src=ac.createBufferSource(),f=ac.createBiquadFilter(),g=ac.createGain();src.buffer=E.noise();f.type=type;f.frequency.value=freq;f.Q.value=q;g.gain.setValueAtTime(level,t);g.gain.exponentialRampToValueAtTime(.0001,t+dur);src.connect(f);f.connect(g);g.connect(E.music);voices++;src.onended=()=>{voices--;g.disconnect()};src.start(t,Math.random()*1.5);src.stop(t+dur+.02)}
 const kick=(t,v=.42)=>tone(t,150,.3,{glide:42,glideTime:.12,level:v});
 const snare=(t,v=.16)=>{hiss(t,.16,v,'bandpass',1900,.9);tone(t,200,.09,{type:'triangle',level:v*.5,glide:150})};
 const hat=(t,v=.05,open=false)=>hiss(t,open?.22:.045,v,'highpass',7600);
 const bass=(t,n,dur,v=.13)=>tone(t,midi(n),dur,{type:'sawtooth',cutoff:620,sweep:180,level:v,attack:.01});
 const pluck=(t,n,v=.05,type='triangle')=>tone(t,midi(n),.26,{type,level:v});
 const pad=(t,notes,dur,v=.024)=>{for(const n of notes)for(const d of [-9,9])tone(t,midi(n),dur,{type:'sawtooth',detune:d,cutoff:1300,level:v,attack:Math.min(.4,dur*.3),hold:.7})};
 const stab=(t,notes,v=.04)=>{for(const n of notes)tone(t,midi(n),.38,{type:'sawtooth',cutoff:2600,sweep:420,level:v,attack:.004})};
 const taiko=(t,v=.5)=>{tone(t,96,.55,{glide:44,glideTime:.18,level:v});hiss(t,.22,v*.5,'lowpass',420)};
 const bell=(t,n,v=.04)=>{tone(t,midi(n),1.1,{level:v});tone(t,midi(n)*2.76,.5,{level:v*.25})};
 const tick=(t,f=2400,v=.035)=>tone(t,f,.03,{type:'square',level:v});
 const theremin=(t,from,to,dur,v=.05)=>tone(t,midi(from),dur,{glide:midi(to),glideTime:dur*.35,vib:6.2,level:v,attack:.09,hold:.75});

 /* ---------- themes: step(s = 16th index, t = time, k = intensity 0..1) ---------- */
 const THEMES={
  lobby:{bpm:92,step(s,t,k){const b=s%16,bar=Math.floor(s/16)%4,chord=[[60,64,67,71],[57,60,64,67],[53,57,60,64],[55,59,62,65]][bar],root=[36,33,29,31][bar];
   if(b===0)bass(t,root,.45,.1);if(b===10)bass(t,root+7,.2,.07);if(b===12)bass(t,root,.2,.08);
   if(b%2===0&&(k>=.25||b%4===0))pluck(t,chord[(b/2)%4]+12,.035);
   if(b===0||b===10)kick(t,.22+k*.12);if(k>=.25&&b%4===2)hat(t,.03);if(k>=.75&&b%2===1)hat(t,.022);if(k>=.5&&(b===4||b===12))snare(t,.08);
   if(k>=.75&&b===0)pad(t,chord,1.9,.012);if(k>=1&&[0,6,12].includes(b))bell(t,chord[Math.floor(Math.random()*4)]+24,.025)}},
  countdown:{bpm:96,step(s,t,k){const b=s%16,root=event?.root??33;
   if(b%8===0)kick(t,.4);if(b%8===2)kick(t,.26);
   if(s%32===0)tone(t,midi(root),3.6,{type:'sawtooth',cutoff:220+k*700,level:.05,attack:.8,hold:.8});
   if(k>.4&&b%4===2)hat(t,.025);if(k>.75&&b%2===1)tick(t,1800,.02)}},
  swarm:{bpm:150,step(s,t,k){const b=s%16,bar=Math.floor(s/16)%2,line=[57,60,64,60,57,60,65,60,57,60,64,60,55,59,62,59];
   pluck(t,line[b]+12-(bar?0:0),.042);if([0,3,6,8,11,14].includes(b))bass(t,bar?29:33,.14,.11);
   if(b%4===0)kick(t);if(b===4||b===12)snare(t);hat(t,b%2?.025:.035);
   if(k>=.8&&b===0&&bar===0)stab(t,[57,60,64,69]);if(Math.random()<.06)pluck(t,line[b]+24,.025,'square')}},
  giant:{bpm:76,step(s,t,k){const b=s%16,bar=Math.floor(s/16)%2;
   if([0,6,8].includes(b)||(k>=.8&&[12,14].includes(b)))taiko(t,b===0?.55:.38);
   if(b===0)stab(t,bar?[46,50,53]:[50,53,57],.05);if(b===0)tone(t,midi(bar?34:38),3,{type:'sawtooth',cutoff:300,level:.07,attack:.3,hold:.8});
   if(k>=.8&&b>=12)snare(t,.07+(b-12)*.02);if(b===8&&bar===1)bell(t,62,.035)}},
  loki:{bpm:112,step(s,t,k){const b=s%16,bar=Math.floor(s/16),tones=[60,62,64,66,68,70];
   if(b%8===0)tick(t,2400,.04);if(b%8===4)tick(t,1600,.035);
   if(b%2===0)tone(t,midi(tones[(s/2)%6]+12),.5,{level:.03,detune:bar%2?-30:15});
   if(b===0||b===8)bass(t,bar%2?34:36,.3,.11);if(b===0||b===10)kick(t,.34);if(k>=.6&&b===8)snare(t,.1);
   if(bar%4===3&&b>=12)tick(t,800+Math.random()*2400,.03)}},
  ufo:{bpm:124,step(s,t,k){const b=s%16,bar=Math.floor(s/16),arp=[52,55,59,62,66,62,59,55],melody=[76,79,74,71,76,83,81,79];
   pluck(t,arp[b%8]+12,.03,'square');if(b%4===0)kick(t,.36);if(b%4===2)hat(t,.03);if(b===0||b===8)bass(t,40,.25,.1);
   if(b===0)theremin(t,melody[(bar+7)%8],melody[bar%8],60/124*4,.045);if(b===0&&bar%2===0)pad(t,[64,67,71],3.6,.01)}},
  victory:{bpm:140,step(s,t,k){const b=s%16,bar=Math.floor(s/16)%4,chord=[[60,64,67],[65,69,72],[67,71,74],[60,64,67]][bar],root=[36,41,43,36][bar];
   if(b===0||b===8)bass(t,root,.25,.11);if(b%2===0)pluck(t,chord[(b/2)%3]+12,.04);if(b===0||b===8)kick(t,.36);if(b===4||b===12)snare(t,.12);if(b%2===1)hat(t,.025);
   if([0,3,6].includes(b))bell(t,chord[[0,3,6].indexOf(b)]+24,.03)}}
 };

 /* ---------- sequencer and mixing ---------- */
 const enabled=()=>!document.hidden&&!window.JustinLive?.muted();
 // Optional owner-supplied tracks (assets/music/tracks.json). Only files listed there are ever requested.
 fetch('assets/music/tracks.json').then(r=>r.ok?r.json():{}).then(map=>{if(map&&typeof map==='object')custom=map}).catch(()=>{});
 // Player-chosen tracks live only in this browser (IndexedDB). They are never uploaded or shared with other players.
 const deviceTracks={};let dbPromise=null;
 function db(){if(!dbPromise)dbPromise=new Promise((resolve,reject)=>{if(!window.indexedDB){reject(Error('no storage'));return}const req=indexedDB.open('justin-music',1);req.onupgradeneeded=()=>req.result.createObjectStore('tracks');req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error)});return dbPromise}
 async function storeTrack(variant,record){deviceTracks[variant]=record;customBuffers.delete(variant);try{const d=await db();await new Promise((resolve,reject)=>{const tx=d.transaction('tracks','readwrite');if(record)tx.objectStore('tracks').put(record,variant);else tx.objectStore('tracks').delete(variant);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)});return true}catch{return false}}
 db().then(d=>new Promise(resolve=>{const tx=d.transaction('tracks','readonly'),store=tx.objectStore('tracks'),req=store.openCursor();req.onsuccess=()=>{const c=req.result;if(c){deviceTracks[c.key]=c.value;c.continue()}else resolve()};req.onerror=()=>resolve()})).then(()=>window.dispatchEvent(new Event('justin-music-tracks'))).catch(()=>{});
 const hasCustom=variant=>Boolean(deviceTracks[variant]||custom[variant]);
 async function customBuffer(variant){if(!E)return null;const own=deviceTracks[variant],url=custom[variant];if(!own&&!url)return null;if(!customBuffers.has(variant))customBuffers.set(variant,(own?Promise.resolve(own.bytes.slice(0)):fetch(url).then(r=>{if(!r.ok)throw Error();return r.arrayBuffer()})).then(b=>E.ac.decodeAudioData(b)).catch(()=>null));return customBuffers.get(variant)}
 function stopCustom(){if(customSource){try{customSource.stop()}catch{}customSource.disconnect();customSource=null}customFor=''}
 async function startCustom(variant){if(customFor===variant)return true;customFor=variant;const buffer=await customBuffer(variant);if(!buffer||customFor!==variant){if(customFor===variant)customFor='';return false}if(customSource)try{customSource.stop()}catch{}const src=E.ac.createBufferSource();src.buffer=buffer;src.loop=true;src.connect(E.music);src.start();customSource=src;level();return true}
 function level(){if(!E)return;const want=enabled()&&((theme||customSource)?1:0)*(prefs.volume/100)*2.2;E.music.gain.setTargetAtTime(want||0,E.ac.currentTime,.12)}
 function run(){if(!E||!theme)return;const ac=E.ac;if(next<ac.currentTime-.2)next=ac.currentTime+.05;while(next<ac.currentTime+.18){if(enabled())theme.step(step,next,intensity);next+=60/(theme.bpm*tempo)/4;step++}}
 function play(name){if(themeName===name)return;themeName=name;theme=THEMES[name]||null;step=0;tempo=1;if(E)next=E.ac.currentTime+.08;clearInterval(timer);timer=theme?setInterval(run,40):0;level()}
 function engine(){if(!E)E=window.JustinGUIAudio?.engine?.()||null;return E}
 function duckDance(on){const a=el('audio');if(!a)return;if(on&&!a.paused&&danceVolume===null){danceVolume=a.volume;a.volume=Math.min(a.volume,.12)}else if(!on&&danceVolume!==null){a.volume=danceVolume;danceVolume=null}}
 // Decide what should be playing a few times a second.
 setInterval(()=>{if(!engine()){return}const cut=window.JustinCutscenes?.playing()||(window.JustinCinema?.playing()&&!event);
  const own=event&&prefs.events&&hasCustom(event.variant)&&['silence','theme','victory'].includes(event.phase);if(own){play('');startCustom(event.variant);duckDance(true);level();return}if(customSource&&!own)stopCustom();
  if(event&&prefs.events){const want=event.phase==='countdown'?'countdown':event.phase==='theme'?event.variant:event.phase==='victory'?'victory':'';if(event.phase==='countdown')intensity=Math.min(1,Math.max(0,1-(event.until-Date.now())/20000));if(event.phase==='theme'||event.phase==='victory')intensity=event.final?1:.6;tempo=event.final?1.12:1;play(want);duckDance(Boolean(want))}
  else{duckDance(false);const dance=el('audio')&&!el('audio').paused;intensity=Math.min(1,Number(el('stage')?.dataset.comboTier||0)/4);play(prefs.lobby&&!cut&&!dance?'lobby':'')}
  level()},250);
 document.addEventListener('visibilitychange',level);window.addEventListener('justin-sound-policy',level);

 /* ---------- public API used by invasion.js and cinema.js ---------- */
 const roots={swarm:33,giant:26,loki:34,ufo:28};
 window.JustinMusic={
  event(variant,phase,extra={}){if(phase==='end'){if(event){event.phase='fading';if(E)E.music.gain.setTargetAtTime(0,E.ac.currentTime,.5);setTimeout(()=>{if(event?.phase==='fading'){event=null;stopCustom()}},1600)}return}
   if(phase==='silence'){event={...(event||{}),variant,phase:'silence'};play('');if(E&&!hasCustom(variant))E.music.gain.setTargetAtTime(0,E.ac.currentTime,.05);return}
   event={variant,root:roots[variant],phase,until:extra.until??event?.until??Date.now(),final:Boolean(extra.final)}},
  final(){if(event)event.final=true},
  setPrefs(next){prefs={...prefs,...next};save();if(!prefs.events)stopCustom();level()},
  prefs:()=>({...prefs}),
  state:()=>({theme:themeName,phase:event?.phase||'',custom:customFor,voices,running:Boolean(E)})};

 /* ---------- settings + header toggle ---------- */
 const field=document.createElement('fieldset');field.innerHTML='<legend>Music</legend><label><input id="music-events" type="checkbox"> invasion and cutscene music</label><label><input id="music-lobby" type="checkbox"> background music while clicking</label><label>music volume <input id="music-volume" type="range" min="0" max="100"></label><p>Original music generated live in your browser. Background music gets busier as your combo grows.</p><div class="own-music"><label>your own invasion music <select id="music-own-variant"><option value="loki">Loki invasion</option><option value="swarm">Tiny Justin swarm</option><option value="giant">Giant Justin</option><option value="ufo">UFO invasion</option></select></label><input id="music-own-file" type="file" accept="audio/*" aria-label="Choose your own invasion music"><button id="music-own-clear" type="button">Remove</button><small id="music-own-status" role="status"></small><p class="local-note">Plays from that invasion’s entrance for you only. The file stays in this browser; it is never uploaded and other players don’t hear it.</p></div>';el('settings').append(field);
 el('music-events').checked=prefs.events;el('music-lobby').checked=prefs.lobby;el('music-volume').value=prefs.volume;
 for(const id of ['music-events','music-lobby','music-volume'])el(id).addEventListener('input',()=>{window.JustinMusic.setPrefs({events:el('music-events').checked,lobby:el('music-lobby').checked,volume:Number(el('music-volume').value)});sync()});
 function ownStatus(){const v=el('music-own-variant').value,own=deviceTracks[v];el('music-own-status').textContent=own?'Playing for '+el('music-own-variant').selectedOptions[0].textContent+': '+own.name:'Using the built-in theme.';el('music-own-clear').disabled=!own}
 el('music-own-variant').addEventListener('change',ownStatus);window.addEventListener('justin-music-tracks',ownStatus);
 el('music-own-file').addEventListener('change',async e=>{const file=e.target.files[0];e.target.value='';if(!file)return;if(file.size>40*1024*1024){el('music-own-status').textContent='Choose a file under 40 MB.';return}el('music-own-status').textContent='Checking the file…';try{const bytes=await file.arrayBuffer();await window.JustinGUIAudio?.unlock?.();const e2=engine();if(e2)await e2.ac.decodeAudioData(bytes.slice(0));const saved=await storeTrack(el('music-own-variant').value,{name:file.name.slice(0,80),bytes});ownStatus();if(!saved)el('music-own-status').textContent+=' (only until you close this tab)'}catch{el('music-own-status').textContent='That file could not be played. Try an MP3, M4A or WAV.'}});
 el('music-own-clear').onclick=async()=>{const v=el('music-own-variant').value;if(customFor===v)stopCustom();await storeTrack(v,null);delete deviceTracks[v];ownStatus()};ownStatus();
 const toggle=document.createElement('button');toggle.id='music-toggle';toggle.type='button';toggle.innerHTML='<img class="ui-icon" src="assets/icons/music.svg" alt="">';const header=document.querySelector('body>header');header.insertBefore(toggle,el('settings-open'));
 function sync(){toggle.setAttribute('aria-pressed',String(prefs.lobby));toggle.setAttribute('aria-label',prefs.lobby?'Turn background music off':'Turn background music on');toggle.title=prefs.lobby?'Background music: on':'Background music: off';el('music-lobby').checked=prefs.lobby}
 toggle.onclick=async()=>{await window.JustinGUIAudio?.unlock?.();window.JustinMusic.setPrefs({lobby:!prefs.lobby});sync();if(prefs.lobby)window.JustinJuice?.say('♪ music ♪',{force:true})};sync();
})();
