'use strict';
(()=>{
 const inMusic=document.body.dataset.mode==='apple';
 const store=(key,value)=>{try{sessionStorage.setItem(key,JSON.stringify(value))}catch{}};
 const read=key=>{try{return JSON.parse(sessionStorage.getItem(key))}catch{return null}};
 const character=read('justin-mode-character');
 if(character?.image&&character.image.startsWith('data:image/png;')){
  const picture=new Image();picture.onload=()=>{customImage=picture;$('oval').checked=false;$('crop-zoom').value=1;$('crop-y').value=0;redrawFace();$('person-name').value=character.name||'Justin Tangarorang';$('person-name').dispatchEvent(new Event('input'));setMode(Number(character.mode)||0);if(character.costume)mischief.restore(character.costume)};picture.src=character.image;
 }
 if(!inMusic){const playback=read('justin-main-playback');if(playback&&tracks[playback.track]){changeSong(playback.track);const seek=()=>{audio.currentTime=Math.min(playback.time||0,Math.max(0,audio.duration-.1));audio.removeEventListener('loadedmetadata',seek)};if(audio.readyState>=1)seek();else audio.addEventListener('loadedmetadata',seek)}}
 window.addEventListener('pagehide',()=>{if(faceReady)store('justin-mode-character',{image:cut.toDataURL('image/png'),name:$('person-name').value,mode,costume:mischief.snapshot()});if(!inMusic)store('justin-main-playback',{track,time:audio.currentTime})});
})();
