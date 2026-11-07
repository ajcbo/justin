'use strict';
// Owner-only Cutscene Lab, mounted inside the owner panel. Every button is a preview: nothing is sent to the server
// and no reward, roll, rebirth or invasion progress is created.
(()=>{
 const G=JustinGame;
 function sample(){const s=window.justinClicker.snapshot(),pool=G.sortedSkins().map(x=>x.id),owned=s.owned.length>=6?s.owned:pool.slice(0,10);return {s,owned,newest:owned[owned.length-1]}}
 const W=()=>innerWidth,H=()=>innerHeight;
 const scenes=[
  ['Videos',[
   ['Intro',()=>window.JustinCutscenes.play('intro',{force:true,title:'JUSTIN CLICKER',sub:'one face. zero dignity. click him.',captionAt:4.3,hold:1200})],
   ['Points milestone',()=>window.JustinCutscenes.play('milestone',{force:true,title:'1 MILLION POINTS',sub:'he is worth something now',captionAt:1.1,sound:'reveal-rare'})],
   ...[['Gold','gold'],['Platinum','platinum'],['Diamond','diamond'],['Rainbow','rainbow'],['Gift box (Invader/Party)','invader']].map(([label,id])=>[label+' reveal',()=>{const scene=window.JustinCutscenes.sceneFor(id),skin=G.skins.find(x=>x.id===id);window.JustinCutscenes.play(scene.name,{force:true,tint:scene.tint,title:skin.name.toUpperCase()+'!',sub:'+'+skin.power+' per click, forever',captionAt:scene.captionAt,sound:scene.sound})}])]],
  ['Scenes',[
   ['Rebirth',()=>{const {s}=sample();window.JustinCinema.rebirth({rebirths:s.rebirths+1,mult:G.rebirthMultiplier(s)+.5,kept:s.owned.filter(id=>G.skins.find(x=>x.id===id)?.dropOnly).length})}],
   ['Collection milestone',()=>{const {owned,newest}=sample();window.JustinCinema.collection({count:Math.min(20,Math.max(5,owned.length-owned.length%5)),owned,newest})}],
   ['Community milestone',()=>window.JustinCinema.community({goal:50000,avatars:[...document.querySelectorAll('#chat-messages [data-avatar]')].map(i=>i.dataset.avatar)})]]],
  ...G.Progression.invasionVariants.map(v=>[v.name,[
   ['Intro',()=>window.JustinCinema.invasionIntro(v.id,{preview:true})],
   ['Ending',()=>window.JustinCinema.invasionOutro(v.id,{points:[[W()*.3,H()*.4],[W()*.55,H()*.3],[W()*.45,H()*.62]],decoys:[[W()*.25,H()*.35],[W()*.7,H()*.6]],real:[W()*.45,H()*.5]})],
   ['Full preview · 40s, no rewards',()=>window.JustinInvasion.preview(v.id)]]])
 ];
 function mount(panel){window.JustinCinema?.preload(G.skins.map(s=>s.id));if(panel.querySelector('.cutscene-lab'))return;const box=document.createElement('section');box.className='cutscene-lab';box.innerHTML='<h3>Cutscene lab</h3><p>Owner-only previews. The panel closes while a scene plays. Nothing here sends anything to the server or grants rewards.</p>';
  for(const [title,items] of scenes){const h=document.createElement('h4');h.textContent=title;const row=document.createElement('div');row.className='lab-row';for(const [label,fn] of items){const b=document.createElement('button');b.type='button';b.textContent=label;b.onclick=()=>{panel.close();setTimeout(()=>{try{fn()}catch(error){console.error(error)}},250)};row.append(b)}box.append(h,row)}
  const anchor=panel.querySelector('#owner-status');(anchor?.parentElement||panel).insertBefore(box,anchor?anchor.nextSibling:null)}
 window.JustinCutsceneLab={mount};
})();
