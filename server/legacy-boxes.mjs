import {backup} from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {randomUUID} from 'node:crypto';
import {createGzip} from 'node:zlib';
import {pipeline} from 'node:stream/promises';
// This release was committed while the running server still charged 25,000.
// Later legacy receipts are also recognised by the old response format.
export const legacyCutoff=1793971304000;
const key='legacy-25k-box-recall-v1',prizes=new Set(['gold','platinum','diamond','rainbow']);
const stamp=id=>Number(String(id||'').split(':').at(-1))||0;
export function initRecall(db){db.exec('CREATE TABLE IF NOT EXISTS inventory_recall_archive(recall_key TEXT NOT NULL,user_id TEXT NOT NULL,original_row TEXT NOT NULL,PRIMARY KEY(recall_key,user_id));CREATE TABLE IF NOT EXISTS inventory_recall_manifest(user_id TEXT PRIMARY KEY,skins TEXT NOT NULL,roll_ids TEXT NOT NULL,created_at INTEGER NOT NULL)')}
export function sanitizeRecallReceipt(db,userId,result){const r=db.prepare('SELECT skins,roll_ids FROM inventory_recall_manifest WHERE user_id=?').get(userId);if(!r||!result.state)return result;const current=JSON.parse(db.prepare('SELECT state FROM players WHERE user_id=?').get(userId).state),removed=new Set(JSON.parse(r.skins).filter(id=>!current.owned.includes(id))),rolls=new Set(JSON.parse(r.roll_ids)),s=result.state;s.owned=s.owned.filter(id=>!removed.has(id));if(removed.has(s.equipped))s.equipped='normal';s.rollQueue=(s.rollQueue||[]).filter(r=>!rolls.has(r.id));if(rolls.has(s.lastRoll?.id))s.lastRoll=null;if(rolls.has(s.lastReward?.id))s.lastReward=null;return result}
export function planLegacyRecall(db,G){
 const epoch=Number(db.prepare("SELECT value FROM game_meta WHERE key='epoch'").get()?.value||1),players=db.prepare('SELECT p.*,u.username FROM players p JOIN users u ON u.id=p.user_id').all(),records=new Map(players.map(p=>[p.user_id,{events:new Map(),gifts:new Map(),ordinals:new Set(),takes:[],grants:[]}])) ;
 function observe(uid,s,legacy=false){const r=records.get(uid);if(!r||!s)return;for(const roll of [...(s.rollQueue||[]),s.lastRoll].filter(Boolean)){if(!['box','milestone'].includes(roll.kind)||typeof roll.id!=='string')continue;const at=stamp(roll.id)||Number(roll.at)||0,cost=Number(roll.cost)||0,isOld=roll.kind==='box'&&(cost===25000||!cost&&(legacy||at<=legacyCutoff)),prior=r.events.get(roll.id);r.events.set(roll.id,{...roll,at,old:isOld||!!prior?.old});if(roll.kind==='box'){const n=Number(roll.id.split(':')[1]);if(Number.isSafeInteger(n)&&n>0)r.ordinals.add(n)}}if(s.lastGift?.skin)r.gifts.set(s.lastGift.id,{skin:s.lastGift.skin,at:stamp(s.lastGift.id),source:'gift'})}
 for(const p of players)observe(p.user_id,JSON.parse(p.state));
 let receipts=0;for(const row of db.prepare('SELECT user_id,response FROM receipts').iterate()){let data;try{data=JSON.parse(row.response)}catch{continue}if(data.epoch!==undefined&&data.epoch!==epoch)continue;receipts++;observe(row.user_id,data.state,!Object.hasOwn(data,'notice'))}
 for(const a of db.prepare("SELECT target_id,kind,details,created_at FROM admin_audit WHERE kind IN ('grant-skin','remove-skin')").all()){const r=records.get(a.target_id);if(!r)continue;let detail;try{detail=JSON.parse(a.details)}catch{continue}(a.kind==='grant-skin'?r.grants:r.takes).push({skin:detail.item,at:a.created_at,source:'admin'})}
 const changes=[],uncertain=[];let oldBoxes=0;
 for(const p of players){const raw=JSON.parse(p.state),s=G.clean(raw),r=records.get(p.user_id),events=[...r.events.values()];oldBoxes+=events.filter(e=>e.old).length;const remove=[];
  for(const skin of s.owned.filter(id=>prizes.has(id))){const sources=[...events.filter(e=>e.skin===skin&&e.fresh),...r.gifts.values()].filter(e=>e.skin===skin).concat(r.grants.filter(e=>e.skin===skin)).sort((a,b)=>a.at-b.at);const latest=sources.at(-1);if(latest?.old&&!r.takes.some(e=>e.skin===skin&&e.at>latest.at))remove.push(skin)}
  const boxes=Number(s.progress?.boxes||raw.progress?.boxes||0),missing=Math.max(0,boxes-r.ordinals.size);if(missing&&s.owned.some(id=>prizes.has(id)&&!remove.includes(id)))uncertain.push({username:p.username,missingBoxes:missing,skins:s.owned.filter(id=>prizes.has(id)&&!remove.includes(id))});
  if(remove.length)changes.push({userId:p.user_id,username:p.username,skins:remove,rollIds:events.filter(e=>e.old).map(e=>e.id)});
 }
 return {changes,uncertain,receipts,oldBoxes,players:players.length};
}
export function recallSummary(plan){return {players:plan.players,oldBoxes:plan.oldBoxes,affected:plan.changes.length,removed:plan.changes.reduce((n,c)=>n+c.skins.length,0),changes:plan.changes.map(({username,skins})=>({username,skins})),uncertain:plan.uncertain}}
export async function applyLegacyRecall(db,G,filename){
 const existing=db.prepare('SELECT value FROM game_meta WHERE key=?').get(key);if(existing)return {alreadyApplied:true,...JSON.parse(existing.value)};
 const directory=path.join(path.dirname(filename),'backups');fs.mkdirSync(directory,{recursive:true});const file=path.join(directory,'before-25k-box-recall-'+Date.now()+'.sqlite.gz'),temporary=path.join(os.tmpdir(),'justin-recall-'+randomUUID()+'.sqlite');try{await backup(db,temporary);await pipeline(fs.createReadStream(temporary),createGzip(),fs.createWriteStream(file,{mode:0o600,flags:'wx'}))}finally{if(fs.existsSync(temporary))fs.unlinkSync(temporary)}
 initRecall(db);db.exec('BEGIN IMMEDIATE');try{const plan=planLegacyRecall(db,G),now=Date.now();for(const c of plan.changes){const row=db.prepare('SELECT * FROM players WHERE user_id=?').get(c.userId),s=G.clean(JSON.parse(row.state)),removed=new Set(c.skins),rolls=new Set(c.rollIds);db.prepare('INSERT INTO inventory_recall_archive VALUES(?,?,?)').run(key,c.userId,JSON.stringify(row));s.owned=s.owned.filter(id=>!removed.has(id));if(removed.has(s.equipped))s.equipped='normal';s.rollQueue=(s.rollQueue||[]).filter(r=>!rolls.has(r.id));if(rolls.has(s.lastRoll?.id))s.lastRoll=null;if(rolls.has(s.lastReward?.id))s.lastReward=null;db.prepare('UPDATE players SET state=?,pps=?,goat=? WHERE user_id=?').run(JSON.stringify(s),G.basePerSecond(s),G.goatScore(s,row.best_combo),c.userId);
   // Filter old response inventories on replay without rewriting the large receipt log.
   db.prepare('INSERT INTO inventory_recall_manifest VALUES(?,?,?,?)').run(c.userId,JSON.stringify(c.skins),JSON.stringify(c.rollIds),now);
   db.prepare('INSERT INTO admin_audit(actor_id,target_id,kind,details,created_at) VALUES(?,?,?,?,?)').run(db.prepare("SELECT value FROM game_meta WHERE key='owner_id'").get().value,c.userId,'legacy-box-recall',JSON.stringify({skins:c.skins,reason:'25,000-point mystery boxes',backup:file}),now);
  }const result={...recallSummary(plan),backup:file,at:now};db.prepare('INSERT INTO game_meta VALUES(?,?)').run(key,JSON.stringify(result));db.exec('COMMIT');return result}catch(e){db.exec('ROLLBACK');throw e}
}
