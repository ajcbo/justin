import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {DatabaseSync} from 'node:sqlite';
import {mkdtemp,rm} from 'node:fs/promises';
import {createRequire} from 'node:module';
import os from 'node:os';
import path from 'node:path';
const G=createRequire(import.meta.url)('./dist/clicker-core.js'),directory=await mkdtemp(path.join(os.tmpdir(),'justin-growth-test-')),dbPath=path.join(directory,'test.sqlite'),origin='http://127.0.0.1:8773';
const server=spawn(process.execPath,['server/server.mjs'],{cwd:new URL('.',import.meta.url),env:{...process.env,PORT:'8773',PUBLIC_ORIGIN:origin,JUSTIN_DB:dbPath},stdio:['ignore','pipe','pipe'],windowsHide:true});
let db,cookie='',csrf='';
async function call(route,body){const response=await fetch(origin+route,{method:body?'POST':'GET',headers:{Origin:origin,...(cookie?{Cookie:cookie}:{}),...(body?{'Content-Type':'application/json','X-CSRF-Token':csrf}:{})},...(body?{body:JSON.stringify(body)}:{})});const data=await response.json();if(response.headers.has('set-cookie'))cookie=response.headers.get('set-cookie').split(';')[0];if(data.csrf)csrf=data.csrf;assert.equal(response.status,200,JSON.stringify(data));return data}
try{
 await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Server startup timed out')),15000);server.stdout.on('data',chunk=>{if(String(chunk).includes('Justin accounts')){clearTimeout(timer);resolve()}});server.on('error',reject);server.on('exit',code=>reject(Error('Server exited '+code)))});
 const user=await call('/api/register',{username:'Growth_Test',password:'Only-local-growth-test!'});db=new DatabaseSync(dbPath);
 const seed=G.fresh();seed.levels.chat=4;seed.bank=seed.lifetime=50;
 db.prepare('UPDATE players SET state=?,lifetime=?,pps=?,updated_at=?,active=1 WHERE user_id=?').run(JSON.stringify(seed),50,4,Date.now()-2*86400000,user.user.id);
 const first=await call('/api/session');assert.equal(first.offlineEarned,86400);assert.equal(first.state.bank,86450);assert.ok(first.state.badges.includes('offline'));
 const second=await call('/api/session');assert.ok(second.state.bank-first.state.bank<.2,'Returning twice must not repeat the offline payout');
 const forged=await call('/api/play',{requestId:'growth-forged',active:true,offlineSeconds:1e12,offlineEarned:1e15,actions:[]});assert.ok(forged.state.bank<86452,'Client cannot submit its own offline reward');
 const retry=await call('/api/play',{requestId:'growth-forged',active:true,actions:[]});assert.deepEqual(retry,forged,'Retry must not double-pay offline earnings');
 db.prepare('UPDATE players SET updated_at=?,active=0 WHERE user_id=?').run(Date.now()-3600000,user.user.id);
 const resumed=await call('/api/play',{requestId:'growth-resumed',active:true,actions:[]});assert.ok(resumed.offlineEarned>=3600&&resumed.offlineEarned<3601);
 const board=await call('/api/leaderboard?metric=goat');assert.equal(board.me.goat,G.goatScore(resumed.state,resumed.bestCombo));assert.equal(board.me.lifetime,resumed.state.lifetime);
 console.log('Server-timed offline rewards, 24-hour cap, repeat-claim prevention, forged-time rejection, idempotence, achievements and ranking updates passed.');
}finally{
 db?.close();if(server.exitCode===null)await new Promise(resolve=>{server.once('exit',resolve);server.kill('SIGTERM')});
 if(!path.resolve(directory).startsWith(path.resolve(os.tmpdir())+path.sep+'justin-growth-test-'))throw Error('Unexpected cleanup directory');
 await rm(directory,{recursive:true,force:true});
}
