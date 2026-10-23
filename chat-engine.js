/* BamBoozle v2 chat engine: validates one command object and runs it against data.json + menus.json.
   Pure data in, data out (no AI text). Works in the browser (window.BBChat) and Node (module.exports). */
(function(root){
'use strict';
var DAYS=['mon','tue','wed','thu','fri','sat','sun'];
var DEAL={happy_hour:'hh',brunch:'br',late_night:'ln'};
var ICAT={hh:'hh',br:'brunch',ln:'late'};
var TABS=['happy_hour','brunch','dinner','drinks'];
var SORTS_V=['distance','rating','ending_soon'];
var LIMIT_MAX=10;

/* ---------- strict schema ---------- */
var T={str:function(v){return typeof v==='string'&&v.trim().length>0&&v.length<=100},
  place:function(v){return typeof v==='string'&&v.trim().length>0&&v.length<=100},
  num:function(lo,hi){return function(v){return typeof v==='number'&&isFinite(v)&&v>=lo&&v<=hi}},
  int:function(lo,hi){return function(v){return typeof v==='number'&&v%1===0&&v>=lo&&v<=hi}},
  bool:function(v){return typeof v==='boolean'},
  hhmm:function(v){return typeof v==='string'&&/^([01]\d|2[0-3]):[0-5]\d$/.test(v)},
  en:function(list){return function(v){return list.indexOf(v)>=0}}};
var SCHEMA={
  find_venues:{item:T.str,deal_type:T.en(['happy_hour','brunch','late_night','any']),day:T.en(['today','now'].concat(DAYS)),
    time_from:T.hhmm,time_to:T.hhmm,near:T.place,radius_miles:T.num(0.05,50),route_from:T.place,route_to:T.place,
    price_max:T.num(0,1000),in_kind:T.bool,min_rating:T.num(0,5),sort:T.en(SORTS_V),limit:T.int(1,LIMIT_MAX)},
  cheapest_items:{item:T.str,venue:T.place,near:T.place,radius_miles:T.num(0.05,50),route_from:T.place,route_to:T.place,
    deal_type:T.en(['happy_hour','brunch','late_night','any']),price_max:T.num(0,1000),min_rating:T.num(0,5),limit:T.int(1,LIMIT_MAX)},
  open_spot:{venue:T.place,tab:T.en(TABS)},
  clarify:{question:T.str}
};
var REQUIRED={open_spot:['venue'],clarify:['question'],cheapest_items:['item']};
function validate(c){
  if(!c||typeof c!=='object'||Array.isArray(c))return {ok:false,error:'not an object'};
  var keys=Object.keys(c);if(keys.some(function(k){return k!=='cmd'&&k!=='args'}))return {ok:false,error:'unknown top-level key'};
  var s=SCHEMA[c.cmd];if(!s)return {ok:false,error:'unknown cmd'};
  var a=c.args==null?{}:c.args;if(typeof a!=='object'||Array.isArray(a))return {ok:false,error:'args must be object'};
  for(var k in a){if(!Object.prototype.hasOwnProperty.call(s,k))return {ok:false,error:'unknown arg '+k};
    if(a[k]===null)continue;if(!s[k](a[k]))return {ok:false,error:'bad value for '+k}}
  var req=REQUIRED[c.cmd]||[];for(var i=0;i<req.length;i++)if(a[req[i]]==null)return {ok:false,error:'missing '+req[i]};
  if((a.route_from==null)!==(a.route_to==null))return {ok:false,error:'route needs route_from and route_to'};
  var clean={};for(k in a)if(a[k]!==null)clean[k]=typeof a[k]==='string'?a[k].trim():a[k];
  return {ok:true,cmd:{cmd:c.cmd,args:clean}};
}

/* ---------- geo ---------- */
function hav(a,b){var R=3958.8,p=Math.PI/180,dLa=(b[0]-a[0])*p,dLo=(b[1]-a[1])*p;
  var x=Math.sin(dLa/2)*Math.sin(dLa/2)+Math.cos(a[0]*p)*Math.cos(b[0]*p)*Math.sin(dLo/2)*Math.sin(dLo/2);return 2*R*Math.asin(Math.min(1,Math.sqrt(x)))}
/* distance (mi) from P to segment AB and projection t (0..1 = within the segment's extent) */
function segInfo(P,A,B){var lat0=(A[0]+B[0])/2*Math.PI/180,kx=69.172*Math.cos(lat0),ky=69.0;
  var ax=0,ay=0,bx=(B[1]-A[1])*kx,by=(B[0]-A[0])*ky,px=(P[1]-A[1])*kx,py=(P[0]-A[0])*ky;
  var L2=bx*bx+by*by,t=L2?((px*bx+py*by)/L2):0;var cx=t*bx,cy=t*by;
  return {t:t,d:Math.sqrt((px-cx)*(px-cx)+(py-cy)*(py-cy)),len:Math.sqrt(L2)}}

/* ---------- text ---------- */
function norm(s){return String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/&/g,' and ').replace(/['’]/g,'').replace(/[^a-z0-9]+/g,' ').trim()}
function stem(w){if(w.length>4&&/ies$/.test(w))return w.slice(0,-3)+'y';if(w.length>3&&/(ches|shes|xes|oes)$/.test(w))return w.slice(0,-2);if(w.length>3&&/s$/.test(w)&&!/ss$/.test(w))return w.slice(0,-1);return w}
function toks(s){return norm(s).split(' ').filter(Boolean).map(stem)}
var SYN=[
 ['burger','cheeseburger','hamburger','smashburger','smash','slider','patty melt'],
 ['wing','chicken wing','buffalo wing'],['taco','street taco','birria'],['margarita','marg'],
 ['beer','draft','draught','ipa','lager','pilsner','pint','ale','stout','domestic','bud light','michelob'],
 ['wine','cabernet','chardonnay','pinot','sauvignon','prosecco','rose','merlot','malbec','riesling'],
 ['cocktail','old fashioned','mule','martini','negroni','spritz','mojito'],['martini','espresso martini','dirty martini'],
 ['oyster','oysters on the half shell'],['pizza','flatbread','margherita pizza'],['fry','fries','french fry','tots'],
 ['nacho'],['sushi','nigiri','sashimi','roll','maki','hand roll'],['mimosa','bellini','bottomless mimosa'],
 ['well','well drink','house spirit','house liquor'],['shot','shots','tequila shot'],['sangria'],['bloody mary','bloody maria'],
 ['dumpling','gyoza','potsticker','bao'],['shrimp','prawn','shrimp cocktail'],['steak','filet','ribeye','sirloin','new york strip'],
 ['dessert','cake','brownie','churro','ice cream'],['pancake','waffle','french toast'],['egg','eggs benedict','omelet','omelette'],
 ['seltzer','hard seltzer','white claw'],['sake'],['whiskey','whisky','bourbon','scotch','rye']
];
var SYN_IDX={};SYN.forEach(function(g){g.forEach(function(w){var k=toks(w).join(' ');(SYN_IDX[k]=SYN_IDX[k]||[]).push(g)})});
function itemTerms(q){var k=toks(q).join(' '),out=[k],gs=SYN_IDX[k]||[];
  if(!gs.length)toks(q).forEach(function(w){(SYN_IDX[w]||[]).forEach(function(g){if(g[0]===w||toks(g[0]).join(' ')===w)gs.push(g)})});
  gs.forEach(function(g){if(toks(g[0]).join(' ')===k||g.indexOf(q.toLowerCase())>=0||toks(g[0]).join(' ')===toks(q).join(' '))g.forEach(function(w){out.push(toks(w).join(' '))})});
  return out.filter(function(x,i){return x&&out.indexOf(x)===i})}
/* term matches a name if: multi-word term appears as phrase; single short term (<=3) matches a whole token; longer term matches a token prefix/suffix (cheeseburger contains burger) */
function termHit(term,nameToks){var tw=term.split(' ');
  if(tw.length>1){var s=' '+nameToks.join(' ')+' ';return s.indexOf(' '+term+' ')>=0}
  for(var i=0;i<nameToks.length;i++){var w=nameToks[i];if(w===term)return true;if(term.length>=4&&(w.indexOf(term)===0||(w.length>term.length&&w.slice(-term.length)===term)))return true}return false}
function itemMatcher(q){if(!q)return function(){return true};var terms=itemTerms(q);return function(name){var nt=toks(name);return terms.some(function(t){return termHit(t,nt)})}}

/* fuzzy venue match: returns {v,score} list best-first */
function bigrams(s){var a=[];s=' '+s+' ';for(var i=0;i<s.length-1;i++)a.push(s.slice(i,i+2));return a}
function dice(a,b){var A=bigrams(a),B=bigrams(b),m=0,used={};A.forEach(function(x){for(var j=0;j<B.length;j++)if(!used[j]&&B[j]===x){used[j]=1;m++;break}});return 2*m/(A.length+B.length||1)}
var STOP=['the','restaurant','bar','grill','las','vegas','and','at','lv','kitchen','lounge'];
function venueScore(q,v){var a=norm(q).replace(/^the /,''),n=norm(v.name).replace(/^the /,'');if(!a)return 0;
  if(a===n)return 1;var base=n.replace(/\s*\(.*$/,'').trim();if(a===norm(base))return 0.97;
  if((' '+n+' ').indexOf(' '+a+' ')>=0)return a.length>=4?0.92:0.6;
  var qt=a.split(' ').filter(function(w){return STOP.indexOf(w)<0}),nt=n.split(' ');
  var hit=qt.length?qt.filter(function(w){return nt.some(function(x){return x===w||(w.length>=4&&x.indexOf(w)===0)})}).length/qt.length:0;
  return Math.max(dice(a,base)*0.9,hit*0.85)}
function matchVenue(q,data){var r=data.map(function(v){return {v:v,score:venueScore(q,v)}}).filter(function(x){return x.score>0.35}).sort(function(a,b){return b.score-a.score||(b.v.reviews||0)-(a.v.reviews||0)});
  var best=r[0];if(!best||best.score<0.75)return {status:'none',suggestions:r.slice(0,5).map(function(x){return x.v})};
  var tie=r.filter(function(x){return x.score>=best.score-0.02&&x.score>=0.75});
  if(tie.length>1){var names={};tie.forEach(function(x){names[x.v.name]=1});return {status:'ambiguous',suggestions:tie.slice(0,6).map(function(x){return x.v})}}
  return {status:'ok',v:best.v}}

/* ---------- schedule (sch: day 0=Mon..6=Sun -> [[startMin,endMin]], end may exceed 1440) ---------- */
function windowsAround(c,day){var out=[];if(!c||!c.sch)return out;
  (c.sch[day]||[]).forEach(function(w){out.push([w[0],w[1]])});
  (c.sch[(day+6)%7]||[]).forEach(function(w){if(w[1]>1440)out.push([w[0]-1440,w[1]-1440])});return out}
function activeAt(c,day,min){var ws=windowsAround(c,day);for(var i=0;i<ws.length;i++)if(min>=ws[i][0]&&min<ws[i][1])return {left:ws[i][1]-min,w:ws[i]};return null}
function overlaps(c,day,a,b){if(b<=a)b+=1440;var ws=windowsAround(c,day);for(var i=0;i<ws.length;i++)if(ws[i][0]<b&&ws[i][1]>a)return ws[i];return null}
function hm(s){var p=s.split(':');return (+p[0])*60+(+p[1])}

/* ---------- run ---------- */
function resolvePlace(p,ctx,role){var k=norm(p);
  if(k==='me'||k==='my location'||k==='here'||k==='current location'){
    if(ctx.me)return {ok:true,pt:ctx.me,label:'you'};
    if(ctx.home)return {ok:true,pt:ctx.home,label:'Home',note:'Location is off, so this uses Home.'};
    return {ok:false,res:{type:'need_home',message:'Turn on location or set Home in Me to search near you.'}}}
  if(k==='home'||k==='my home'||k==='my house'){if(ctx.home)return {ok:true,pt:ctx.home,label:'Home'};
    return {ok:false,res:{type:'need_home',message:'Set Home in Me first.'}}}
  var m=matchVenue(p,ctx.data);
  if(m.status==='ok'){if(m.v.lat==null)return {ok:false,res:{type:'clarify',question:'I don’t have a location for '+m.v.name+'. Try another place.',suggestions:[],role:role}};return {ok:true,pt:[m.v.lat,m.v.lng],label:m.v.name,venue:m.v}}
  return {ok:false,res:{type:'clarify',question:m.status==='ambiguous'?'Which “'+p+'” did you mean?':'I couldn’t find “'+p+'”. Did you mean one of these?',suggestions:m.suggestions.map(function(v){return {id:v.id,name:v.name,addr:v.addr}}),role:role,query:p}}}
function spatial(a,ctx){var s={filter:function(){return true},dist:function(){return null},label:'',notes:[]};
  if(a.route_from){var A=resolvePlace(a.route_from,ctx,'route_from');if(!A.ok)return A.res;var B=resolvePlace(a.route_to,ctx,'route_to');if(!B.ok)return B.res;
    if(A.note)s.notes.push(A.note);if(B.note&&s.notes.indexOf(B.note)<0)s.notes.push(B.note);
    var W=a.radius_miles!=null&&a.radius_miles<=1?a.radius_miles:1;
    s.filter=function(v){if(v.lat==null)return false;var g=segInfo([v.lat,v.lng],A.pt,B.pt);v._t=g.t;return g.t>=0&&g.t<=1&&g.d<=W};
    s.dist=function(v){return hav(A.pt,[v.lat,v.lng])};s.route=true;s.label='between '+A.label+' and '+B.label;s.from=A.pt;return s}
  if(a.near){var O=resolvePlace(a.near,ctx,'near');if(!O.ok)return O.res;if(O.note)s.notes.push(O.note);var R=a.radius_miles!=null?a.radius_miles:1;
    s.filter=function(v){return v.lat!=null&&hav(O.pt,[v.lat,v.lng])<=R};s.dist=function(v){return v.lat==null?null:hav(O.pt,[v.lat,v.lng])};
    s.label='within '+R+' mi of '+O.label;s.radius=R;s.from=O.pt;return s}
  var o=ctx.me||ctx.home;if(o){s.dist=function(v){return v.lat==null?null:hav(o,[v.lat,v.lng])};s.from=o}return s}
function catsFor(dt){return !dt||dt==='any'?['hh','br','ln']:[DEAL[dt]]}
function dealItems(v,cats){return (v.items||[]).filter(function(i){return i.q!=='meta'&&cats.some(function(k){return v[k]&&ICAT[k]===i.category})})}
function menuItems(v,menus){var M=menus&&menus[v.id],out=[];if(!M)return out;
  [['f','dinner'],['d','drinks']].forEach(function(p){(M[p[0]]||[]).forEach(function(s){s[1].forEach(function(it){out.push({name:it[0],price:it[1]==null?null:it[1],src:p[1],sec:s[0]})})})});return out}
function timeCheck(v,a,cats,now){var day=a.day,ws=null,left=null;
  var dIdx=day==null||day==='today'||day==='now'?now.day:DAYS.indexOf(day);
  var anyTime=day==null&&a.time_from==null&&a.time_to==null;
  for(var i=0;i<cats.length;i++){var c=v[cats[i]];if(!c)continue;
    if(anyTime)return {k:cats[i],left:(activeAt(c,now.day,now.min)||{}).left};
    if(day==='now'){var ac=activeAt(c,now.day,now.min);if(ac&&(left==null||ac.left>left)){left=ac.left;ws={k:cats[i],left:ac.left}}continue}
    var from=a.time_from!=null?hm(a.time_from):(day==='today'||day==null?now.min:0),to=a.time_to!=null?hm(a.time_to):(a.time_from!=null?hm(a.time_from)+1:1440);
    if(a.time_from!=null&&a.time_to==null)to=hm(a.time_from)+1;
    var w=overlaps(c,dIdx,from,to);if(w&&!ws)ws={k:cats[i],left:(dIdx===now.day?(activeAt(c,now.day,now.min)||{}).left:null)}}
  return ws}
function run(cmd,ctx){var a=cmd.args||{},now=ctx.now,data=ctx.data,lim=a.limit||LIMIT_MAX;
  if(cmd.cmd==='clarify')return {type:'clarify',question:a.question,suggestions:[]};
  if(cmd.cmd==='open_spot'){var m=matchVenue(a.venue,data);
    if(m.status!=='ok')return {type:'clarify',question:m.status==='ambiguous'?'Which “'+a.venue+'” did you mean?':'I couldn’t find “'+a.venue+'”. Did you mean one of these?',suggestions:m.suggestions.map(function(v){return {id:v.id,name:v.name,addr:v.addr}}),role:'venue',query:a.venue};
    return {type:'open',id:m.v.id,name:m.v.name,tab:{happy_hour:'hh',brunch:'br',dinner:'dn',drinks:'dr'}[a.tab]||null}}
  var sp=spatial(a,ctx);if(sp.type)return sp;
  var cats=catsFor(a.deal_type),matchI=itemMatcher(a.item);
  if(cmd.cmd==='cheapest_items'){var vfilter=null;if(a.venue){var mv=matchVenue(a.venue,data);if(mv.status!=='ok')return {type:'clarify',question:'Which “'+a.venue+'” did you mean?',suggestions:mv.suggestions.map(function(v){return {id:v.id,name:v.name,addr:v.addr}}),role:'venue',query:a.venue};vfilter=mv.v}
    var rows=[],skipped=0;data.forEach(function(v){if(vfilter&&v!==vfilter)return;if(!vfilter&&!sp.filter(v))return;if(a.min_rating!=null&&!(v.rating>=a.min_rating))return;
      var its=dealItems(v,cats).map(function(i){return {name:i.name,price:i.price,src:i.category==='hh'?'hh':i.category==='brunch'?'br':'ln'}});
      if(!a.deal_type||a.deal_type==='any')its=its.concat(menuItems(v,ctx.menus));
      var seen={};its.forEach(function(i){if(!matchI(i.name))return;if(i.price==null){skipped++;return}if(a.price_max!=null&&i.price>a.price_max)return;
        var key=norm(i.name)+'|'+i.price;if(seen[key])return;seen[key]=1;rows.push({v:v,name:i.name,price:i.price,src:i.src,d:sp.dist(v)})})});
    rows.sort(function(x,y){return x.price-y.price||(x.d==null?1e9:x.d)-(y.d==null?1e9:y.d)});
    return {type:'items',rows:rows.slice(0,lim),total:rows.length,skippedUnpriced:skipped,label:sp.label,notes:sp.notes,args:a}}
  var out=[];data.forEach(function(v){if(!sp.filter(v))return;if(a.in_kind&&!(v.ik&&v.ik.s==='Yes'))return;if(a.min_rating!=null&&!(v.rating>=a.min_rating))return;
    var tc=timeCheck(v,a,cats,now);
    var needSched=a.deal_type&&a.deal_type!=='any'||a.day||a.time_from||a.time_to;if(needSched&&!tc)return;if(!needSched&&!cats.some(function(k){return v[k]}))return;
    if(a.item||a.price_max!=null){var its=dealItems(v,tc?[tc.k]:cats);if(!a.deal_type||a.deal_type==='any')its=its.concat(menuItems(v,ctx.menus));
      var hit=its.filter(function(i){return matchI(i.name)&&(a.price_max==null||(i.price!=null&&i.price<=a.price_max))});if(!hit.length)return;
      hit.sort(function(x,y){return (x.price==null?1e9:x.price)-(y.price==null?1e9:y.price)});out.push({v:v,k:tc&&tc.k,d:sp.dist(v),left:tc&&tc.left,hit:hit[0]});return}
    out.push({v:v,k:tc&&tc.k,d:sp.dist(v),left:tc&&tc.left})});
  var sort=a.sort||'distance';
  out.sort(function(x,y){if(sort==='rating')return (y.v.rating||0)-(x.v.rating||0)||(y.v.reviews||0)-(x.v.reviews||0);
    if(sort==='ending_soon')return (x.left==null?1e9:x.left)-(y.left==null?1e9:y.left);
    if(sp.route)return x.v._t-y.v._t;return (x.d==null?1e9:x.d)-(y.d==null?1e9:y.d)});
  return {type:'venues',rows:out.slice(0,lim),total:out.length,label:sp.label,notes:sp.notes,args:a}}

/* ---------- local keyword parser (fallback when the AI endpoint is unavailable) ---------- */
var ITEM_WORDS=['cheeseburger','smash burger','burger','slider','wings','wing','tacos','taco','margarita','margs','beer','draft','ipa','wine','cocktail','old fashioned','martini','oysters','oyster','pizza','fries','nachos','sushi','mimosa','mimosas','well drinks','well','shots','sangria','bloody mary','dumplings','shrimp','steak','dessert','pancakes','waffles','sake','whiskey','bourbon','seltzer','sliders'];
var NUMW={a:1,an:1,one:1,two:2,three:3,four:4,five:5,six:6,seven:7,eight:8,nine:9,ten:10,half:0.5,quarter:0.25};
function cap(s){return s.replace(/[?.!,]+$/,'').trim()}
function localParse(text,nowDay){var t=' '+String(text||'').toLowerCase().replace(/[“”]/g,'"').replace(/\s+/g,' ').trim()+' ',a={},m;
  if(t.trim().length<2)return {cmd:'clarify',args:{question:'What are you looking for? Try “happy hour near me now”.'}};
  // open spot
  if((m=t.match(/\b(?:open|show(?: me)?|see|view|pull up)\s+(?:the\s+)?(.+?)(?:'s|’s)?\s+(happy hour|hh|brunch|dinner|food|drinks?|cocktail|bar|wine)?\s*menu\b/))||(m=t.match(/\bmenu (?:for|at) (.+?)\s*$/))){
    var tabw=m[2]||'';var tab=/happy|hh/.test(tabw)?'happy_hour':/brunch/.test(tabw)?'brunch':/dinner|food/.test(tabw)?'dinner':/drink|cocktail|bar|wine/.test(tabw)?'drinks':null;
    var r={cmd:'open_spot',args:{venue:cap(m[1])}};if(tab)r.args.tab=tab;return r}
  if((m=t.match(/^\s*(?:open|go to|take me to)\s+(.+?)\s*$/)))return {cmd:'open_spot',args:{venue:cap(m[1])}};
  var cheap=/\b(cheapest|least expensive|lowest price|lowest-priced|cheap)\b/.test(t);
  // deal type
  if(/\bhappy ?hours?\b|\bhh\b/.test(t))a.deal_type='happy_hour';else if(/\bbrunch/.test(t))a.deal_type='brunch';else if(/\blate[ -]?night\b|after midnight|\bafter hours\b/.test(t))a.deal_type='late_night';
  // item
  for(var i=0;i<ITEM_WORDS.length;i++){var re=new RegExp('\\b'+ITEM_WORDS[i]+'\\b');if(re.test(t)){a.item=ITEM_WORDS[i].replace(/^smash burger$/,'burger');break}}
  // time
  if(/\b(right now|open now|now|currently|at the moment|live)\b/.test(t))a.day='now';
  else if(/\btonight\b/.test(t)){a.day='today';a.time_from='17:00';a.time_to='02:00'}
  else if(/\btoday\b/.test(t))a.day='today';
  else if(/\btomorrow\b/.test(t))a.day=DAYS[((nowDay==null?0:nowDay)+1)%7];
  else{var dm=t.match(/\b(mon|tue|wed|thu|fri|sat|sun)[a-z]*\b/);if(dm)a.day=dm[1]}
  if((m=t.match(/\b(?:at|around)\s+(\d{1,2})(?::(\d\d))?\s*(am|pm)\b/))){var h=+m[1]%12+(m[3]==='pm'?12:0);a.time_from=(h<10?'0':'')+h+':'+(m[2]||'00');if(!a.day||a.day==='now')a.day='today'}
  // distance
  if((m=t.match(/\bwithin\s+(?:a\s+)?(\d+(?:\.\d+)?|half|quarter|a|an|one|two|three|four|five|ten)\s*(?:a\s+)?(?:mi\b|miles?\b)/))){var n=parseFloat(m[1]);a.radius_miles=isNaN(n)?NUMW[m[1]]:n}
  else if(/\b(?:within|in)\s+(?:a\s+)?half(?: a)? ?mile\b|\bhalf a mile\b/.test(t))a.radius_miles=0.5;
  else if(/\bquarter(?: of a)? mile\b/.test(t))a.radius_miles=0.25;
  else if((m=t.match(/\b(\d+(?:\.\d+)?)\s*(?:mi|miles?)\b/)))a.radius_miles=parseFloat(m[1]);
  if(a.radius_miles!=null)a.radius_miles=Math.min(50,Math.max(0.05,a.radius_miles));
  // price
  if((m=t.match(/\b(?:under|less than|below|max|up to|no more than|cheaper than)\s*\$?\s*(\d+(?:\.\d+)?)/))||(m=t.match(/\$(\d+(?:\.\d+)?)\s*(?:or less|and under|max)/)))a.price_max=parseFloat(m[1]);
  // rating / inkind / sort
  if((m=t.match(/\b(\d(?:\.\d)?)\+?\s*(?:stars?|rating|rated)/))||(m=t.match(/\brated\s+(?:at least\s+|over\s+|above\s+)?(\d(?:\.\d)?)/)))a.min_rating=Math.min(5,parseFloat(m[1]));
  if(/\b(top|best|highest)[ -]rated\b|\bbest\b/.test(t))a.sort='rating';
  if(/\bending soon\b|\bending\b|last call/.test(t))a.sort='ending_soon';
  if(/\bin ?kind\b/.test(t))a.in_kind=true;
  // place: route
  var P='(home|me|my location|here|.+?)';
  if((m=t.match(new RegExp('\\bbetween\\s+'+P+'\\s+and\\s+(.+?)(?=\\s+(?:under|within|now|tonight|today|top|with|for|on|that)\\b|\\s*$)')))||(m=t.match(new RegExp('\\bfrom\\s+'+P+'\\s+to\\s+(.+?)(?=\\s+(?:under|within|now|tonight|today|top|with|for|that)\\b|\\s*$)')))){
    a.route_from=pl(m[1]);a.route_to=pl(m[2])}
  else if((m=t.match(/\bon (?:my|the) way (?:to|home)\s*(.*?)(?=\s+(?:under|within|now|tonight|today)\b|\s*$)/))){a.route_from='me';a.route_to=/on (?:my|the) way home/.test(t)?'home':pl(m[1]||'home')}
  else if(/\b(?:near|by|around|close to)\s+(?:my\s+)?(?:home|house|place)\b|\bnear home\b|\bfrom home\b/.test(t))a.near='home';
  else if(/\bnear me\b|\bnearby\b|\bclose by\b|\baround me\b|\bclosest\b|\bnearest\b|\bnear here\b/.test(t))a.near='me';
  else if((m=t.match(/\b(?:near|by|around|close to|at)\s+(?!me\b)(.+?)(?=\s+(?:under|within|now|tonight|today|top|with|for|on)\b|\s*$)/))){var cand=cap(m[1]).replace(/^the\s+/,'');if(cand&&!/^\d|^(am|pm)$/.test(cand))a.near=cand}
  if(!a.near&&!a.route_from)a.near='me';
  if(cheap){if(!a.item)return {cmd:'clarify',args:{question:'Cheapest what? Try “cheapest burger near me” or “cheapest margarita near home”.'}};
    var c={item:a.item};['near','radius_miles','route_from','route_to','deal_type','price_max','min_rating'].forEach(function(k){if(a[k]!=null)c[k]=a[k]});return {cmd:'cheapest_items',args:c}}
  if(!a.deal_type&&!a.item&&a.day==null&&a.price_max==null&&!a.in_kind&&!a.sort&&!/\b(deals?|specials?|spots?|places?|bars?|restaurants?|food|drinks?)\b/.test(t))
    return {cmd:'clarify',args:{question:'What are you looking for? Try “happy hour near me now” or “cheapest tacos near home”.'}};
  if(!a.deal_type&&a.day)a.deal_type='any';
  return {cmd:'find_venues',args:a};
  function pl(s){s=cap(s).replace(/^the\s+/,'');if(/^(me|my location|here|my current location)$/.test(s))return 'me';if(/^(home|my home|my house|my place)$/.test(s))return 'home';return s}
}

var api={validate:validate,run:run,localParse:localParse,matchVenue:matchVenue,itemMatcher:itemMatcher,activeAt:activeAt,overlaps:overlaps,segInfo:segInfo,hav:hav,SCHEMA:SCHEMA,DAYS:DAYS};
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.BBChat=api;
})(typeof self!=='undefined'?self:this);
