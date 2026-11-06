const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
(async()=>{
const elements=new Map(),events={},windowEvents={},intervals=[];let starts=0,stops=0,adminMuted=false,time=10000;
function el(){return {checked:false,value:35,innerHTML:'',events:{},append(){},addEventListener(k,fn){this.events[k]=fn}}}
const document={hidden:false,getElementById(id){if(!elements.has(id))elements.set(id,el());return elements.get(id)},createElement:el,addEventListener(k,fn){events[k]=fn}};
const source=()=>({frequency:{},connect(){},disconnect(){},start(){starts++},stop(){stops++}});
class AudioContext{state='running';currentTime=0;destination={};resume(){return Promise.resolve()}createGain(){return {gain:{value:1,setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){},disconnect(){}}}createDynamicsCompressor(){return {threshold:{},ratio:{},connect(){}}}createOscillator(){return source()}createBufferSource(){return source()}decodeAudioData(){return Promise.resolve({duration:.6})}}
const window={AudioContext,JustinLive:{muted:()=>adminMuted},justinClicker:{snapshot:()=>({levels:{},owned:['normal'],backdrops:['plain'],toys:[],badges:[],rebirths:0})},addEventListener(k,fn){windowEvents[k]=fn}};
vm.runInNewContext(fs.readFileSync(__dirname+'/dist/gui-audio.js','utf8'),{window,document,localStorage:{getItem:()=>null,setItem(){}},performance:{now:()=>time},fetch:async()=>({ok:true,arrayBuffer:async()=>new ArrayBuffer(1)}),setInterval:fn=>intervals.push(fn),MutationObserver:class{observe(){}},JustinGame:{businesses:[]}});
await events.pointerdown();await new Promise(resolve=>setImmediate(resolve));
window.JustinGUIAudio.play('buy');assert.equal(starts,1,'Purchase plays the decoded cha-ching sample');window.JustinGUIAudio.play('buy');assert.equal(starts,1,'Rapid repeats are throttled');
time+=1000;window.JustinGUIAudio.play('achievement');assert.equal(starts,2,'Achievement uses the decoded meme sample');adminMuted=true;window.JustinGUIAudio.play('notification');assert.equal(starts,2);windowEvents['justin-sound-policy']({detail:{muted:true}});assert.ok(stops>=2,'Admin mute stops existing GUI voices');
adminMuted=false;document.getElementById('gui-audio-on').checked=false;document.getElementById('gui-audio-on').events.input();time+=1000;window.JustinGUIAudio.play('rare');assert.equal(starts,2,'Local GUI mute prevents playback');
document.getElementById('gui-audio-on').checked=true;document.getElementById('gui-audio-memes').checked=false;document.getElementById('gui-audio-memes').events.input();time+=1000;window.JustinGUIAudio.play('notification');assert.equal(starts,4,'Meme opt-out retains gentle synthesized cues');time+=1000;window.JustinGUIAudio.play('buy');assert.equal(starts,5,'Cha-ching remains with meme reactions disabled');document.hidden=true;time+=1000;window.JustinGUIAudio.play('buy');assert.equal(starts,5,'Hidden pages never emit GUI sounds');
console.log('GUI audio gesture unlock, decoded meme playback, purchase chimes, throttling, separate preferences, immediate admin mute and hidden-tab silence passed.');
})().catch(e=>{console.error(e);process.exitCode=1});
