'use strict';
// Source previews sometimes bake in a pale checkerboard. Mask only edge-connected
// neutral background pixels, then trim the empty margins before fitting each prop.
const propSprites={};
const propFiles={'top-hat':'assets/props/top-hat.png','sunglasses':'assets/props/sunglasses.png','moustache':'assets/props/moustache.png','tomato':'assets/props/tomato.png','egg':'assets/props/egg.png','fried-egg':'assets/props/fried-egg.png','ufo':'assets/props/ufo.png'};
function drawProp(ctx,name,x,y,width){const image=propSprites[name];if(!image)return;const height=width*image.height/image.width;ctx.drawImage(image,x-width/2,y-height/2,width,height)}
const propsReady=Promise.all(['top-hat','sunglasses','moustache','tomato','egg','fried-egg','ufo'].map(name=>new Promise(resolve=>{
 const img=new Image();img.onload=()=>{try{const c=document.createElement('canvas');const downscale=Math.min(1,480/Math.max(img.width,img.height));c.width=Math.max(1,Math.round(img.width*downscale));c.height=Math.max(1,Math.round(img.height*downscale));const cx=c.getContext('2d',{willReadFrequently:true});cx.drawImage(img,0,0,c.width,c.height);const data=cx.getImageData(0,0,c.width,c.height),p=data.data,W=c.width,H=c.height,seen=new Uint8Array(W*H),queue=new Int32Array(W*H);let tail=0,head=0;
 const background=i=>{const j=i*4,r=p[j],g=p[j+1],b=p[j+2];return p[j+3]<8||(Math.min(r,g,b)>=222&&Math.max(r,g,b)-Math.min(r,g,b)<=3)};
 const visit=i=>{if(!seen[i]){seen[i]=1;if(background(i)){p[i*4+3]=0;queue[tail++]=i}}};
 for(let x=0;x<W;x++){visit(x);visit((H-1)*W+x)}for(let y=0;y<H;y++){visit(y*W);visit(y*W+W-1)}while(head<tail){const i=queue[head++],x=i%W;if(x>0)visit(i-1);if(x<W-1)visit(i+1);if(i>=W)visit(i-W);if(i<W*(H-1))visit(i+W)}
 let left=W,right=0,top=H,bottom=0;for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(p[(y*W+x)*4+3]>20){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y)}
 cx.putImageData(data,0,0);if(right>left&&bottom>top){const sprite=document.createElement('canvas'),sw=right-left+1,sh=bottom-top+1,scale=Math.min(1,700/Math.max(sw,sh));sprite.width=Math.max(1,Math.round(sw*scale));sprite.height=Math.max(1,Math.round(sh*scale));sprite.getContext('2d').drawImage(c,left,top,sw,sh,0,0,sprite.width,sprite.height);propSprites[name]=sprite;const url=sprite.toDataURL();document.querySelectorAll(`[data-prop="${name}"]`).forEach(node=>node.src=url)}}catch(error){propSprites[name]=img;document.querySelectorAll(`[data-prop="${name}"]`).forEach(node=>node.src=img.src)}resolve()};img.onerror=()=>resolve();img.src=propFiles[name];
})));
