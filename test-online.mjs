import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {createRequire} from 'node:module';
import http from 'node:http';
const require=createRequire(import.meta.url),G=require('./dist/clicker-core.js');
const origin='http://127.0.0.1:8766';
const server=spawn(process.execPath,['server/server.mjs'],{cwd:new URL('.',import.meta.url),env:{...process.env,PORT:'8766',PUBLIC_ORIGIN:origin,JUSTIN_DB:':memory:'},stdio:['ignore','pipe','pipe'],windowsHide:true});
try{
 await new Promise((resolve,reject)=>{const timeout=setTimeout(()=>reject(Error('Server did not start')),15000);server.stdout.on('data',chunk=>{if(String(chunk).includes('Justin accounts')){clearTimeout(timeout);resolve()}});server.on('error',reject);server.on('exit',code=>reject(Error('Server exited '+code)))});
 const client=()=>{let cookie='',csrf='';return async(route,method='GET',body,extra={})=>{const response=await fetch(origin+route,{method,headers:{Origin:origin,...(cookie?{Cookie:cookie}:{}),...(body?{'Content-Type':'application/json','X-CSRF-Token':csrf}:{}),...extra},...(body?{body:JSON.stringify(body)}:{})});const data=await response.json();if(response.headers.get('set-cookie'))cookie=response.headers.get('set-cookie').split(';')[0];if(data.csrf)csrf=data.csrf;return {status:response.status,data,headers:response.headers}}};
 const guest=client(),alice=client(),bob=client();
 const probe=(route,host)=>new Promise((resolve,reject)=>{http.get(origin+route,{headers:{Host:host}},res=>{let body='';res.on('data',chunk=>body+=chunk);res.on('end',()=>resolve({status:res.statusCode,data:JSON.parse(body)}))}).on('error',reject)});
 const health=await probe('/health','healthcheck.railway.app');assert.equal(health.status,200);assert.deepEqual(health.data,{ok:true});
 assert.equal((await probe('/api/session','unrelated.example')).status,403);
 assert.equal((await guest('/api/session')).data.user,null);
 assert.equal((await guest('/api/play','POST',{actions:[],requestId:'unauth001'})).status,401);
 const a=await alice('/api/register','POST',{username:'Alice_Justin',password:'Test-only-passphrase-2026!'});assert.equal(a.status,200);assert.equal(a.data.state.bank,0);assert.match(a.headers.get('set-cookie'),/HttpOnly/);assert.match(a.headers.get('set-cookie'),/SameSite=Lax/);assert.equal(a.data.password_hash,undefined);
 const duplicate=await bob('/api/register','POST',{username:'alice_justin',password:'Test-only-passphrase-2026!'});assert.equal(duplicate.status,409);
 const b=await bob('/api/register','POST',{username:'Bob_Justin',password:'Another-test-passphrase!'});assert.equal(b.status,200);
 assert.equal((await guest('/api/login','POST',{username:'Alice_Justin',password:'wrong-password-2026'})).status,401);
 const injection=await alice('/api/play','POST',{requestId:'inject001',actions:[],active:true,state:{bank:1e15,lifetime:1e15}});assert.equal(injection.data.state.bank,0);
 const now=Date.now(),actions=Array.from({length:100},(_,i)=>({kind:'click',at:now-2000+i*20}));
 const clicked=await alice('/api/play','POST',{requestId:'clicks001',actions,active:true});assert.equal(clicked.status,200);assert.ok(clicked.data.state.clicks>0);assert.ok(clicked.data.state.clicks<=25);assert.ok(clicked.data.rejected>0);assert.equal(clicked.data.state.lifetime,clicked.data.state.clicks);
 const replay=await alice('/api/play','POST',{requestId:'clicks001',actions,active:true});assert.deepEqual(replay.data,clicked.data,'Retries must not double-credit clicks');
 const buy=await alice('/api/play','POST',{requestId:'unafford01',actions:[{kind:'skin',id:'fried'}],active:true});assert.equal(buy.data.state.bank,clicked.data.state.bank);assert.equal(buy.data.rejected,1);
 const forged=await alice('/api/play','POST',{requestId:'future001',actions:[{kind:'click',at:Date.now()+100000}],active:true});assert.equal(forged.data.state.clicks,clicked.data.state.clicks);
 assert.equal((await alice('/api/play','POST',{requestId:'csrf0011',actions:[]},{'X-CSRF-Token':'invalid'})).status,403);
 assert.equal((await alice('/api/play','POST',{requestId:'origin001',actions:[]},{Origin:'https://unrelated.example'})).status,403);
 for(const metric of ['lifetime','pps','goat']){const board=await alice('/api/leaderboard?metric='+metric);assert.equal(board.status,200);assert.equal(board.data.total,2);assert.equal(board.data.rows.length,2);assert.equal(board.data.me.username,'Alice_Justin');if(metric!=='pps')assert.equal(board.data.rows[0].username,'Alice_Justin');else assert.ok(board.data.rows.every(row=>row.rank===1));assert.ok(board.data.rows.every(row=>row.state===undefined&&row.password_hash===undefined));}
 const goat=await alice('/api/leaderboard?metric=goat');assert.equal(goat.data.me.goat,G.goatScore(clicked.data.state,clicked.data.bestCombo));
 assert.equal((await alice('/api/leaderboard?metric=invalid')).status,400);
 assert.equal((await alice('/api/logout','POST',{})).status,200);assert.equal((await alice('/api/session')).data.user,null);
 const login=await alice('/api/login','POST',{username:'ALICE_JUSTIN',password:'Test-only-passphrase-2026!'});assert.equal(login.status,200);assert.equal(login.data.state.clicks,clicked.data.state.clicks);
 console.log('Real account registration/login, private sessions, duplicate names, server-controlled scores, click rate limits, idempotent retries, purchase validation, all three rankings, ties, GOAT formula, CSRF and logout passed.');
}finally{server.kill('SIGTERM')}
