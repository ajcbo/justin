import {DatabaseSync,backup} from 'node:sqlite';
import {randomUUID} from 'node:crypto';
import {createRequire} from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import {createAdministration} from './administration.mjs';
const G=createRequire(import.meta.url)('../dist/clicker-core.js'),filename=process.env.JUSTIN_DB;
if(!filename||!fs.existsSync(filename))throw Error('JUSTIN_DB must point to the existing private game database.');
const db=new DatabaseSync(filename);db.exec('PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;');
const admin=createAdministration(db,G,(status,message)=>Object.assign(Error(message),{status})),actor=admin.ownerId(),command=process.argv[2];
if(!actor)throw Error('Existing owner account not found. No game data was reset.');
try{
 if(command==='status'){const data=admin.overview(actor);console.log(JSON.stringify({epoch:data.epoch,players:data.players.length,owner:data.players.find(p=>p.id===actor)?.username,backups:data.archives.length}));}
 else if(command==='reset'){
  const directory=path.join(path.dirname(filename),'backups');fs.mkdirSync(directory,{recursive:true});const target=path.join(directory,'before-reset-'+Date.now()+'.sqlite');await backup(db,target);
  console.log('Private recovery database saved: '+target);
  console.log(JSON.stringify(admin.reset(actor,{requestId:randomUUID(),confirm:'RESET EVERYONE',label:process.argv[3]||'Season 2 balance reset'})));
 }else throw Error('Use status or reset.');
}finally{db.close()}
