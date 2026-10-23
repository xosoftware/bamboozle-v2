import { createRequire } from 'module';import fs from 'fs';
const require=createRequire(import.meta.url);const E=require('../chat-engine.js');
const data=JSON.parse(fs.readFileSync(new URL('../data.json',import.meta.url)));data.forEach((v,i)=>v.id=i);
const menus=JSON.parse(fs.readFileSync(new URL('../menus.json',import.meta.url))).m;
let pass=0,fail=0;const ok=(c,n)=>{if(c)pass++;else{fail++;console.log('FAIL',n)}};
const STRIP=[36.1147,-115.1728];
const ctx=(o={})=>({data,menus,now:{day:4,min:17*60},me:STRIP,home:null,...o});
// validator
ok(E.validate({cmd:'find_venues',args:{deal_type:'happy_hour',day:'now',near:'me'}}).ok,'valid basic');
ok(!E.validate({cmd:'find_venues',args:{deal_type:'happyhour'}}).ok,'bad enum');
ok(!E.validate({cmd:'find_venues',args:{foo:1}}).ok,'unknown arg');
ok(!E.validate({cmd:'nuke',args:{}}).ok,'unknown cmd');
ok(!E.validate({cmd:'find_venues',args:{time_from:'25:00'}}).ok,'bad time');
ok(!E.validate({cmd:'cheapest_items',args:{}}).ok,'missing item');
ok(!E.validate({cmd:'find_venues',args:{route_from:'home'}}).ok,'half route');
ok(!E.validate({cmd:'find_venues',args:{limit:50}}).ok,'limit cap');
ok(!E.validate({cmd:'find_venues',args:{},extra:1}).ok,'extra top key');
// midnight windows
const c={sch:{4:[[1320,1560]]}}; // Fri 10pm - Sat 2am
ok(E.activeAt(c,5,60),'active Sat 1am from Fri window');ok(!E.activeAt(c,5,180),'not Sat 3am');ok(E.activeAt(c,4,1400),'Fri 11:20pm');
ok(E.overlaps(c,5,0,90),'overlap Sat 0-1:30');ok(E.overlaps(c,4,1380,120),'range crossing midnight');ok(!E.overlaps(c,3,1380,120),'Thu none');
// late night search at 1am Saturday finds venues with cross-midnight windows
const ln=E.run({cmd:'find_venues',args:{deal_type:'late_night',day:'now'}},ctx({now:{day:5,min:60},me:null,home:null}));
ok(ln.total>0&&ln.rows.every(r=>E.activeAt(r.v.ln,5,60)),'late night now at 1am');
// synonyms
const m=E.itemMatcher('burger');ok(m('Classic Cheeseburger'),'cheeseburger');ok(m('Smash Burger Single'),'smash');ok(m('Wagyu Sliders'),'slider');ok(!m('Burrata'),'not burrata');
ok(E.itemMatcher('wings')('Boneless Wings & Fries'),'wings plural');ok(!E.itemMatcher('ipa')('Tilapia'),'short token whole word');
// route corridor
const A=[36.10,-115.17],B=[36.20,-115.17];
ok(E.segInfo([36.15,-115.165],A,B).d<1,'near segment');ok(E.segInfo([36.25,-115.17],A,B).t>1,'beyond extent');ok(E.segInfo([36.15,-115.10],A,B).d>1,'far side');
const rt=E.run({cmd:'find_venues',args:{deal_type:'happy_hour',route_from:'home',route_to:'Ocean Prime'}},ctx({home:[36.17,-115.14]}));
const op=data.find(v=>v.name==='Ocean Prime');
ok(rt.type==='venues'&&rt.total>0&&rt.rows.every(r=>{const g=E.segInfo([r.v.lat,r.v.lng],[36.17,-115.14],[op.lat,op.lng]);return g.d<=1&&g.t>=0&&g.t<=1}),'route corridor results');
// missing prices skipped, sorted ascending, price_max
const ch=E.run({cmd:'cheapest_items',args:{item:'burger',near:'me',radius_miles:0.5}},ctx());
ok(ch.type==='items'&&ch.rows.length>0&&ch.rows.every(r=>r.price!=null&&r.d<=0.5),'cheapest priced within radius');
ok(ch.rows.every((r,i)=>!i||ch.rows[i-1].price<=r.price),'ascending');ok(ch.skippedUnpriced>=0,'skip count');
const pm=E.run({cmd:'find_venues',args:{item:'burger',price_max:10,near:'me',radius_miles:3}},ctx());ok(pm.rows.every(r=>r.hit.price<=10),'price_max');
// origins
ok(E.run({cmd:'find_venues',args:{near:'me',deal_type:'happy_hour'}},ctx({me:null,home:[36.17,-115.14]})).notes.length===1,'me falls back to home');
ok(E.run({cmd:'find_venues',args:{near:'me'}},ctx({me:null})).type==='need_home','no location no home');
ok(E.run({cmd:'open_spot',args:{venue:'hash house'}},ctx()).type==='clarify','ambiguous clarify');
ok(E.run({cmd:'open_spot',args:{venue:'zzqx blorp'}},ctx()).type==='clarify','unknown clarify');
const os=E.run({cmd:'open_spot',args:{venue:'ocean prime',tab:'drinks'}},ctx());ok(os.type==='open'&&os.id===op.id&&os.tab==='dr','open ocean prime');
// filters/sorts
const ik=E.run({cmd:'find_venues',args:{in_kind:true,near:'me',radius_miles:3,sort:'rating',min_rating:4.5}},ctx());
ok(ik.rows.every(r=>r.v.ik.s==='Yes'&&r.v.rating>=4.5),'inkind+rating');ok(ik.rows.every((r,i)=>!i||ik.rows[i-1].v.rating>=r.v.rating),'rating sort');ok(ik.rows.length<=10,'limit 10');
const es=E.run({cmd:'find_venues',args:{deal_type:'happy_hour',day:'now',sort:'ending_soon',radius_miles:5,near:'me'}},ctx());ok(es.rows.every((r,i)=>!i||es.rows[i-1].left<=r.left),'ending soon');
// local parser -> valid commands
const P=s=>E.validate(E.localParse(s,4));
for(const [s,cmd] of [['happy hour near me now','find_venues'],['cheapest burger within half a mile','cheapest_items'],['happy hours between home and Ocean Prime','find_venues'],['open Ocean Prime drinks menu','open_spot'],['brunch near home on sunday under $20','find_venues'],['top rated late night tonight within 2 miles','find_venues'],['inkind spots near me','find_venues'],['hi','clarify']]){const r=P(s);ok(r.ok&&r.cmd.cmd===cmd,'parse '+s+' '+JSON.stringify(r))}
const h=E.localParse('cheapest burger within half a mile');ok(h.args.radius_miles===0.5&&h.args.item==='burger','half mile');
const r2=E.localParse('happy hours between home and Ocean Prime');ok(r2.args.route_from==='home'&&r2.args.route_to==='ocean prime','route parse');
console.log(`engine tests: ${pass} passed, ${fail} failed`);process.exit(fail?1:0);
