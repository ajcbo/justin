import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
const origin='http://127.0.0.1:8769',frontend='https://ajcbo.github.io';
const server=spawn(process.execPath,['server/server.mjs'],{cwd:new URL('.',import.meta.url),env:{...process.env,PORT:'8769',PUBLIC_ORIGIN:origin,JUSTIN_DB:':memory:'},stdio:['ignore','pipe','pipe'],windowsHide:true});
async function request(route,method='GET',data,headers={}){const response=await fetch(origin+route,{method,headers:{Origin:frontend,...(data?{'Content-Type':'application/json'}:{}),...headers},...(data?{body:JSON.stringify(data)}:{})});return {status:response.status,headers:response.headers,data:response.status===204?null:await response.json()}}
try{
 await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Server startup timed out')),15000);server.stdout.on('data',chunk=>{if(String(chunk).includes('Justin accounts')){clearTimeout(timer);resolve()}});server.on('error',reject);server.on('exit',code=>reject(Error('Server exited '+code)))});
 const preflight=await request('/api/play','OPTIONS',null,{'Access-Control-Request-Method':'POST','Access-Control-Request-Headers':'content-type,x-csrf-token'});assert.equal(preflight.status,204);assert.equal(preflight.headers.get('access-control-allow-origin'),frontend);assert.equal(preflight.headers.get('access-control-allow-credentials'),'true');
 const denied=await request('/api/session','GET',null,{Origin:'https://other.github.io'});assert.equal(denied.status,403);assert.equal(denied.headers.get('access-control-allow-origin'),null);
 assert.equal((await request('/api/play','OPTIONS',null,{'Access-Control-Request-Method':'POST','Access-Control-Request-Headers':'authorization'})).status,403);
 const credentials={username:'Shared_Account',password:'Only-a-test-passphrase!'};
 const registered=await request('/api/register','POST',credentials,{Origin:origin});assert.equal(registered.status,200);const originalCookie=registered.headers.get('set-cookie').split(';')[0];
 const login=await request('/api/login','POST',credentials);assert.equal(login.status,200);assert.equal(login.data.user.id,registered.data.user.id,'Existing Railway accounts must work from GitHub');
 const setCookie=login.headers.get('set-cookie');for(const flag of ['HttpOnly','Secure','SameSite=None','Partitioned'])assert.ok(setCookie.includes(flag));assert.ok(setCookie.startsWith('justin_session_partitioned='));assert.equal(login.data.token,undefined);
 const sessionHeaders={Cookie:setCookie.split(';')[0],'X-CSRF-Token':login.data.csrf};
 assert.equal((await request('/api/session','GET',null,sessionHeaders)).data.user.username,credentials.username);
 const action={requestId:'cross-site-click',actions:[{kind:'click',at:Date.now()}],active:false};
 assert.equal((await request('/api/play','POST',action)).status,401);
 assert.equal((await request('/api/play','POST',action,{...sessionHeaders,'X-CSRF-Token':'invalid'})).status,403);
 const played=await request('/api/play','POST',action,sessionHeaders);assert.equal(played.data.state.clicks,1);
 assert.equal((await request('/api/session','GET',null,{Origin:origin,Cookie:originalCookie})).data.state.clicks,1);
 const board=await request('/api/leaderboard?metric=lifetime','GET',null,sessionHeaders);assert.equal(board.data.me.lifetime,1);
 const logout=await request('/api/logout','POST',{},sessionHeaders);assert.equal(logout.status,200);assert.match(logout.headers.get('set-cookie'),/Max-Age=0/);
 assert.equal((await request('/api/session','GET',null,sessionHeaders)).data.user,null);
 console.log('GitHub CORS/preflight, untrusted-origin denial, existing-account sign-in, partitioned private cookies, CSRF, ranked clicks, shared progress and logout passed.');
}finally{server.kill('SIGTERM')}
