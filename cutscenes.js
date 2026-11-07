'use strict';
// Pre-rendered Blender cutscenes (assets/cutscenes, built by tools/cutscenes.py). Silent H.264 clips play muted and
// inline, so phones decode them in hardware. Every cutscene is skippable, optional, and skipped under reduced motion.
(()=>{
 const el=id=>document.getElementById(id),version='cutscenes-20261107b',base='assets/cutscenes/';
 let prefs={on:true};try{prefs={...prefs,...JSON.parse(localStorage.getItem('justin-cutscenes')||'{}')}}catch{}
 const reduced=()=>el('gentle')?.checked||matchMedia('(prefers-reduced-motion: reduce)').matches;
 const enabled=()=>prefs.on!==false&&!reduced();
 const dialog=document.createElement('dialog');dialog.className='cutscene';dialog.setAttribute('aria-label','Cutscene');
 dialog.innerHTML='<div class="cutscene-frame"><video muted playsinline disablepictureinpicture preload="none" aria-hidden="true"></video><div class="cutscene-caption" hidden><b></b><span></span></div></div><button type="button" class="cutscene-skip">Skip ›</button>';
 document.body.append(dialog);
 const video=dialog.querySelector('video'),frame=dialog.querySelector('.cutscene-frame'),caption=dialog.querySelector('.cutscene-caption');video.muted=true;video.playsInline=true;
 let current=null,queue=[],timers=[];
 const url=name=>base+name+'.mp4?v='+version;
 function clear(){for(const t of timers)clearTimeout(t);timers=[]}
 function finish(){if(!current)return;const done=current;current=null;clear();video.pause();video.removeAttribute('src');video.load();caption.hidden=true;if(dialog.open)dialog.close();try{done.onEnd?.()}catch(error){console.error(error)}if(queue.length)setTimeout(()=>{if(!current&&queue.length)start(queue.shift())},300)}
 function start(job){current=job;clear();frame.dataset.scene=job.name;frame.dataset.tint=job.tint||'';caption.hidden=true;caption.querySelector('b').textContent=job.title||'';caption.querySelector('span').textContent=job.sub||'';video.src=url(job.name);if(!dialog.open)dialog.showModal();let began=false;
  video.play().then(()=>{began=true}).catch(()=>finish());
  // Slow connection or blocked playback: never leave the player waiting on a black box.
  timers.push(setTimeout(()=>{if(!began&&video.currentTime<.05)finish()},4500));
  if(job.title)timers.push(setTimeout(()=>{caption.hidden=false;caption.classList.remove('show');void caption.offsetWidth;caption.classList.add('show')},(job.captionAt??1.2)*1000));
  if(job.sound)window.JustinGUIAudio?.play(job.sound);
  timers.push(setTimeout(finish,(job.max||10)*1000))}
 video.addEventListener('ended',()=>{if(current)timers.push(setTimeout(finish,current.hold??800))});
 dialog.querySelector('.cutscene-skip').onclick=finish;
 dialog.addEventListener('cancel',e=>{e.preventDefault();finish()});
 // Returns true when a cutscene was started or queued; otherwise onEnd runs immediately.
 function play(name,options={}){const job={name,...options};if(!job.force&&!enabled()||document.hidden){try{job.onEnd?.()}catch(error){console.error(error)}return false}if(current){queue.push(job);return true}start(job);return true}
 function prefetch(name){if(!enabled()||navigator.connection?.saveData)return;fetch(url(name)).catch(()=>{})}
 // First-time rare unlocks get a reveal made for their material; other drops use the gift box.
 const materials={gold:'gold','lucky-gold':'gold',platinum:'platinum',diamond:'diamond',rainbow:'rainbow'};
 function sceneFor(id){const m=materials[id];if(m)return {name:m,tint:'',captionAt:m==='platinum'?3.4:3.2,sound:''};const skin=JustinGame.skins.find(x=>x.id===id);return {name:'rare',tint:{mythic:'mythic',legendary:'legendary',epic:'epic',special:'special'}[skin?.rarity]||'',captionAt:1.4,sound:'crit-great'}}
 window.JustinCutscenes={play,prefetch,enabled,sceneFor,playing:()=>Boolean(current),url};

 /* Settings: on/off and a replay button. */
 const field=document.createElement('fieldset');field.innerHTML='<legend>Cutscenes</legend><label><input id="cutscenes-on" type="checkbox"> play cutscenes</label><button id="cutscene-replay" type="button">Replay intro</button><p>Short, skippable videos for the intro, rebirths, rare unlocks and milestones. Off automatically with reduced motion.</p>';el('settings').append(field);
 el('cutscenes-on').checked=prefs.on!==false;el('cutscenes-on').addEventListener('input',()=>{prefs={on:el('cutscenes-on').checked};try{localStorage.setItem('justin-cutscenes',JSON.stringify(prefs))}catch{}});
 el('cutscene-replay').onclick=()=>{el('settings').close();intro(true)};

 /* First visit: a short intro once the page is ready and nothing else is open. */
 const introCaption={title:'JUSTIN CLICKER',sub:'one face. zero dignity. click him.',captionAt:4.3,hold:1200};
 function intro(force=false){play('intro',{...introCaption,onEnd:()=>window.JustinJuice?.say('hi.',{force:true})});if(!force)try{localStorage.setItem('justin-intro-seen','1')}catch{}}
 let seen=true;try{seen=localStorage.getItem('justin-intro-seen')==='1'}catch{}
 if(!seen&&!new URLSearchParams(location.search).has('ownerView')){const wait=setInterval(()=>{if(document.hidden||document.querySelector('dialog[open]'))return;clearInterval(wait);intro()},700)}
})();
