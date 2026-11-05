import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtemp,rm} from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
const directory=await mkdtemp(path.join(os.tmpdir(),'justin-railway-test-')),origin='http://127.0.0.1:8768';
let server;
async function start(){server=spawn(process.execPath,['server/server.mjs'],{cwd:new URL('.',import.meta.url),env:{...process.env,PORT:'8768',HOST:'127.0.0.1',PUBLIC_ORIGIN:origin,RAILWAY_ENVIRONMENT_ID:'isolated-test',RAILWAY_VOLUME_MOUNT_PATH:directory,JUSTIN_DB:path.join(directory,'game.sqlite')},stdio:['ignore','pipe','pipe'],windowsHide:true});await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Server startup timed out')),15000);server.stdout.on('data',chunk=>{if(String(chunk).includes('Justin accounts')){clearTimeout(timer);resolve()}});server.on('error',reject);server.on('exit',code=>reject(Error('Server exited '+code)))})}
async function stop(){if(server&&server.exitCode===null)await new Promise(resolve=>{server.once('exit',resolve);server.kill('SIGTERM')})}
let cookie='',csrf='';
async function call(route,body,ip='192.0.2.1'){const response=await fetch(origin+route,{method:body?'POST':'GET',headers:{Origin:origin,'X-Real-IP':ip,...(cookie?{Cookie:cookie}:{}),...(body?{'Content-Type':'application/json','X-CSRF-Token':csrf}:{})},...(body?{body:JSON.stringify(body)}:{})});const data=await response.json();if(response.headers.has('set-cookie'))cookie=response.headers.get('set-cookie').split(';')[0];if(data.csrf)csrf=data.csrf;return {status:response.status,data}}
try{
 await start();
 for(let i=0;i<20;i++)assert.equal((await call('/api/login',{username:'!',password:'test-invalid-input'})).status,400);
 assert.equal((await call('/api/login',{username:'!',password:'test-invalid-input'})).status,429);
 assert.equal((await call('/api/login',{username:'!',password:'test-invalid-input'},'192.0.2.2')).status,400,'Different players must have separate login limits');
 const registered=await call('/api/register',{username:'Persistent_Test',password:'Isolated-test-passphrase!'},'192.0.2.2');assert.equal(registered.status,200);
 const clicked=await call('/api/play',{requestId:'persistent-click',actions:[{kind:'click',at:Date.now()}],active:false});assert.equal(clicked.data.state.clicks,1);
 await stop();await start();
 const restored=await call('/api/session');assert.equal(restored.data.user.username,'Persistent_Test');assert.equal(restored.data.state.clicks,1);
 assert.equal((await call('/api/leaderboard')).data.total,1);
 console.log('Railway client login limits are separate; account, session and ranked progress survive a process restart on persistent storage.');
}finally{
 await stop();
 if(!path.resolve(directory).startsWith(path.resolve(os.tmpdir())+path.sep+'justin-railway-test-'))throw Error('Unexpected test cleanup directory');
 await rm(directory,{recursive:true,force:true});
}
