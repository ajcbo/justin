'use strict';
(()=>{
 const layers=[0,1].map(()=>{const image=document.createElement('img');image.className='album-ambience';image.alt='';image.setAttribute('aria-hidden','true');document.body.prepend(image);return image});
 const cover=document.createElement('img');cover.id='album-cover';cover.alt='';cover.hidden=true;document.getElementById('stage').prepend(cover);
 let currentLayer=0,generation=0,overrideURL=null;
 const status=text=>{document.getElementById('artwork-status').textContent=text};
 function showArtwork(url,version){return new Promise(resolve=>{const next=layers[1-currentLayer];next.onload=()=>{if(version!==generation){resolve(false);return}next.classList.add('visible');layers[currentLayer].classList.remove('visible');currentLayer=1-currentLayer;cover.src=url;cover.hidden=false;document.body.classList.add('has-artwork');resolve(true)};next.onerror=()=>resolve(false);next.src=url})}
 function jsonp(url){return new Promise((resolve,reject)=>{const callback='justinArtwork'+Math.random().toString(36).slice(2),script=document.createElement('script');const clean=()=>{clearTimeout(timer);script.remove();delete window[callback]};const timer=setTimeout(()=>{clean();reject(Error('Artwork lookup timed out'))},10000);window[callback]=data=>{clean();resolve(data)};script.onerror=()=>{clean();reject(Error('Artwork unavailable'))};url.searchParams.set('callback',callback);script.src=url.href;document.head.append(script)})}
 async function load(entry){const version=++generation;cover.hidden=true;layers.forEach(layer=>layer.classList.remove('visible'));document.body.classList.remove('has-artwork');status('Finding album artwork…');
  try{const parsed=LyricCore.appleURL(entry.url),url=new URL(parsed.url),parts=url.pathname.split('/').filter(Boolean),id=url.searchParams.get('i')||parts.at(-1);if(!/^\d+$/.test(id)){status('For playlist artwork, choose a cover below. Add a song link for automatic artwork.');return}
   const endpoint=new URL('https://itunes.apple.com/lookup');endpoint.search=new URLSearchParams({id,country:parsed.country,entity:parsed.type==='album'&&!url.searchParams.has('i')?'album':'song'}).toString();
   const data=await jsonp(endpoint);if(version!==generation)return;
   const record=data.results?.find(r=>String(r.trackId)===id)||data.results?.find(r=>r.artworkUrl100);if(!record?.artworkUrl100)throw Error('No artwork found');
   const imageURL=new URL(record.artworkUrl100);if(imageURL.protocol!=='https:'||!imageURL.hostname.endsWith('.mzstatic.com'))throw Error('Unrecognized artwork host');
   imageURL.pathname=imageURL.pathname.replace(/\d+x\d+bb(?=[.-])/,'1000x1000bb');
   if(!await showArtwork(imageURL.href,version))throw Error('Cover could not load');if(version!==generation)return;
   const title=record.trackName||record.collectionName||entry.title,artist=record.artistName||entry.artist;
   document.getElementById('now-title').textContent=title;document.getElementById('now-artist').textContent=artist||'Apple Music';document.getElementById('lyrics-title').value=title;document.getElementById('lyrics-artist').value=artist||'';
   document.getElementById('genius-link').href='https://genius.com/search?q='+encodeURIComponent(title+' '+(artist||''));status('Album artwork loaded from Apple.');
  }catch{if(version===generation)status('Artwork is unavailable for this link. You can choose a cover below.');}
 }
 window.addEventListener('apple-track',event=>load(event.detail));
 document.getElementById('cover-upload').onchange=event=>{const file=event.target.files[0];if(!file)return;if(file.size>12*1024*1024){status('Choose an image under 12 MB.');return}const version=++generation;if(overrideURL)URL.revokeObjectURL(overrideURL);overrideURL=URL.createObjectURL(file);showArtwork(overrideURL,version).then(ok=>status(ok?'Your cover is active. It stays on this device.':'Could not read this image.'))};
 // The artwork listener must be ready before room.js restores a saved track.
})();
