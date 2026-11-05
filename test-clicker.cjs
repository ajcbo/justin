const assert=require('node:assert/strict');
const G=require('./dist/clicker-core.js');
const s=G.fresh();
assert.equal(G.buySkin(s,'pixel'),false);
for(let i=0;i<400;i++)G.click(s);
assert.equal(s.bank,400);assert.equal(s.clicks,400);
assert.equal(G.buySkin(s,'pixel'),true);assert.equal(s.bank,0);assert.equal(G.perClick(s),2);
assert.equal(G.buySkin(s,'pixel'),false);assert.equal(s.owned.length,2);
s.equipped='normal';assert.equal(G.perClick(s),2,'Cosmetic choice must keep earned click power');
G.earn(s,800);assert.equal(G.buyBusiness(s,'chat'),true);assert.equal(G.perSecond(s),.5);assert.equal(s.bank,0);
assert.equal(G.price(s,G.businesses.find(b=>b.id==='chat')),1200);
G.earn(s,G.perSecond(s)*3.5);assert.equal(s.bank,1.75);
const saved=G.clean(JSON.parse(JSON.stringify(s)));assert.equal(saved.equipped,'normal');assert.equal(G.perSecond(saved),.5);assert.equal(G.perClick(saved),2);
assert.equal(G.buyBusiness(s,'unknown'),false);assert.equal(G.buySkin(s,'unknown'),false);
const corrupted=G.clean({version:1,bank:-20,lifetime:Infinity,owned:123,equipped:'missing',levels:{finger:-8,chat:1.9,intern:10000}});
assert.equal(corrupted.bank,0);assert.equal(corrupted.equipped,'normal');assert.equal(corrupted.levels.chat,1);assert.equal(corrupted.levels.intern,100);
console.log('Click rewards, face unlocks, cumulative boosts, upgrade prices, passive earnings and save recovery passed.');
let combo=null,previousRate=0;
for(let i=0;i<50;i++){combo=G.comboHit(combo,i*100);assert.equal(combo.count,i+1);assert.ok(combo.rate>=previousRate);assert.ok(combo.rate<=4);previousRate=combo.rate}
assert.equal(combo.tier,2);assert.ok(combo.rate<1.4,'Voice must rise gradually');
assert.equal(G.comboHit({count:9,at:0},100).rate,1);
for(let i=50;i<210;i++)combo=G.comboHit(combo,i*100);assert.equal(combo.rate,4);assert.equal(combo.tier,4);
combo=G.comboHit(combo,combo.at+G.comboWindow+1);assert.equal(combo.count,1);assert.equal(combo.rate,1);assert.equal(combo.tier,0);
combo=G.comboHit(combo,combo.at+G.comboWindow);assert.equal(combo.count,2);
assert.equal(G.comboHit({count:9999,at:0},100).count,9999);
console.log('Fast-click combo, rising pitch, pitch ceiling, expiry and boundary timing passed.');

const old=G.clean({version:1,bank:100,lifetime:200,clicks:50,owned:['normal','gold'],equipped:'gold',levels:{chat:2},savedAt:1});
assert.equal(old.equipped,'gold');assert.equal(G.offlinePerDay(old),21600);
assert.equal(G.accrueOffline(old,30*3600),21600);assert.equal(old.bank,21700);assert.equal(old.offlineTotal,21600);
assert.equal(G.accrueOffline(old,-10),0);
assert.equal(G.buySkin(old,'lucky-gold'),false);assert.equal(G.rollGolden(old,.099),false);assert.equal(G.rollGolden(old,NaN),false);
old.clicks=5000;assert.equal(G.rollGolden(old,.1),false);const power=G.perClick(old);assert.equal(G.rollGolden(old,0),true);assert.equal(G.perClick(old),power+250);assert.equal(G.rollGolden(old,0),false);
const badges=G.award(old,210);assert.ok(badges.includes('golden'));assert.ok(badges.includes('offline'));assert.ok(badges.includes('combo200'));assert.equal(G.award(old,210).length,0);
console.log('Old saves, offline rate/day/cap, rare unlock eligibility, permanent boosts and one-time achievements passed.');

for(const clicks of [0,1,4999,5001,9999]){const s=G.fresh();s.clicks=clicks;assert.equal(G.rollGolden(s,0),false)}
for(const clicks of [5000,10000,50000]){for(let i=0;i<10;i++){const s=G.fresh();s.clicks=clicks;assert.equal(G.rollGolden(s,i/10),i===0)}}
console.log('Golden drops only roll at multiples of 5,000, with exactly one winning outcome out of ten.');
