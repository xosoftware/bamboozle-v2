/* BamBoozle v2 — layout modeled on the Replit "BamBoozle" Expo app (Now / Deals / Map / Search / Me tabs), wired to the BamBoozle PWA data. */
(function(){
"use strict";
var INKIND_URL='https://app.inkind.com/refer/VMDEOCC5';
var STRIP=[36.1147,-115.1728];
var KS=['hh','br','ln'];
var META={hh:{label:'Happy Hour',color:'#FF5C8A',icon:'glass',icat:'hh'},br:{label:'Brunch',color:'#FF7A59',icon:'cup',icat:'brunch'},ln:{label:'Late Night',color:'#A78BFA',icon:'moon',icat:'late'}};
var ICONS={chat:'<path d="M4 5h16v11H9l-5 4z"/><path d="M8 10h8M8 13h5"/>',camera:'<path d="M3 8h4l2-3h6l2 3h4v11H3z"/><circle cx="12" cy="13" r="3.5"/>',send:'<path d="M4 12 20 4l-6 16-3-7z"/>',
 flame:'<path d="M12 2s5 5 5 10a5 5 0 0 1-10 0c0-2 1-3 1-3s0 2 2 2c0-4 2-9 2-9z" fill="currentColor" stroke="none"/>',
 glass:'<path d="M5 4h14l-7 8zM12 12v8M8 20h8"/>',cup:'<path d="M4 8h13v5a6 6 0 0 1-12 0zM17 9h2a2 2 0 0 1 0 4h-2M8 3v2M12 3v2"/>',moon:'<path d="M20 14A8 8 0 1 1 10 4a6 6 0 0 0 10 10z"/>',
 pin:'<path d="M12 21s-7-6-7-12a7 7 0 0 1 14 0c0 6-7 12-7 12z"/><circle cx="12" cy="9" r="2.5"/>',clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
 chev:'<path d="m9 6 6 6-6 6"/>',back:'<path d="m15 6-6 6 6 6"/>',heart:'<path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10z"/>',
 share:'<path d="M12 3v12M7 8l5-5 5 5M5 14v5h14v-5"/>',gift:'<rect x="3" y="8" width="18" height="13" rx="2"/><path d="M12 8v13M3 12h18M12 8S10 3 7.5 4.5 9 8 12 8zm0 0s2-5 4.5-3.5S15 8 12 8z"/>',
 nav:'<path d="M3 11 21 3l-8 18-2-8z"/>',ext:'<path d="M14 4h6v6M20 4l-9 9M18 14v6H4V6h6"/>',search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',x:'<path d="M6 6l12 12M18 6 6 18"/>',
 loc:'<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/><circle cx="12" cy="12" r="7"/>',home:'<path d="M3 11 12 4l9 7v9h-6v-6H9v6H3z"/>',person:'<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6"/>',star:'<path d="m12 3 2.8 5.8 6.2.9-4.5 4.4 1 6.3L12 17.5 6.5 20.4l1-6.3L3 9.7l6.2-.9z" fill="currentColor" stroke="none"/>',beer:'<path d="M6 7h10v13H6zM16 10h2a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-2M6 7a3 3 0 0 1 5-2 3 3 0 0 1 5 2"/>'
};
function ic(n,st){return '<svg viewBox="0 0 24 24"'+(st?' style="'+st+'"':'')+'>'+ICONS[n]+'</svg>'}
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function present(s){return s&&String(s).trim()&&String(s).trim().toLowerCase()!=='not listed'}
function safeUrl(u){return /^https?:\/\//i.test(u||'')?u:null}
function rgba(hex,a){var h=hex.replace('#','');return 'rgba('+parseInt(h.slice(0,2),16)+','+parseInt(h.slice(2,4),16)+','+parseInt(h.slice(4,6),16)+','+a+')'}
var $=function(id){return document.getElementById(id)};
var view=$('view');
var DATA=[],MENUS=null,menusP=null;
function ls(k,d){try{var v=localStorage.getItem(k);return v==null?d:JSON.parse(v)}catch(e){return d}}
function lsSet(k,v){try{if(v==null)localStorage.removeItem(k);else localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
/* v2 keeps its own keys (same github.io origin as v1); first run imports v1 saved spots + home read-only */
if(ls('bb2Init',null)==null){lsSet('bb2Saved',ls('bbSaved',{})||{});var h1=ls('bbHome',null);if(h1&&isFinite(h1.lat)&&isFinite(h1.lng))lsSet('bb2Home',{label:h1.label||'Home',lat:h1.lat,lng:h1.lng,kind:h1.kind||'addr'});lsSet('bb2Init',1)}
var saved=ls('bb2Saved',{})||{};
function vkey(v){return v.name+'|'+v.addr}
function isSaved(v){return !!saved[vkey(v)]}
function toggleSave(v){var k=vkey(v);if(saved[k])delete saved[k];else saved[k]=1;lsSet('bb2Saved',saved);toast(saved[k]?'Saved':'Removed from saved')}
function toast(m,ms){var t=$('toast');t.textContent=m;t.classList.add('show');clearTimeout(toast._t);toast._t=setTimeout(function(){t.classList.remove('show')},ms||2500)}

/* ---------- origin (Set home / live location) ---------- */
var live=null;            // [lat,lng] from device
function home(){return ls('bb2Home',null)}
function useHome(){return ls('bb2UseHome',true)!==false}
function origin(){var h=home();if(h&&useHome())return [h.lat,h.lng];return live}
function originLabel(){var h=home();if(h&&useHome())return 'from Home';return live?'from you':''}
function locate(cb,explicit){
  if(!navigator.geolocation){if(explicit)toast('Location isn’t available on this device');cb&&cb(null);return}
  navigator.geolocation.getCurrentPosition(function(p){live=[p.coords.latitude,p.coords.longitude];cb&&cb(live)},function(){if(explicit)toast('Couldn’t get your location');cb&&cb(null)},{enableHighAccuracy:false,timeout:8000,maximumAge:300000});
}
function miles(a,v){if(!a||v.lat==null)return null;var R=3958.8,p=Math.PI/180,dLa=(v.lat-a[0])*p,dLo=(v.lng-a[1])*p;var x=Math.sin(dLa/2)*Math.sin(dLa/2)+Math.cos(a[0]*p)*Math.cos(v.lat*p)*Math.sin(dLo/2)*Math.sin(dLo/2);return 2*R*Math.asin(Math.sqrt(x))}
function fmtMi(d,v){if(d==null)return '';var n=d<0.1?'<0.1':d<10?d.toFixed(1):String(Math.round(d));return ((v&&v.approx)?'~':'')+n+' mi'}

/* ---------- time windows (Las Vegas time) ---------- */
var NOW_OVERRIDE=null; // {day:0..6 Mon=0, min}
function vegasNow(){
  if(NOW_OVERRIDE)return NOW_OVERRIDE;
  try{var o={};new Intl.DateTimeFormat('en-US',{timeZone:'America/Los_Angeles',weekday:'short',hour:'numeric',minute:'numeric',hour12:false}).formatToParts(new Date()).forEach(function(p){o[p.type]=p.value});
    return {day:({Mon:0,Tue:1,Wed:2,Thu:3,Fri:4,Sat:5,Sun:6})[o.weekday],min:(parseInt(o.hour,10)%24)*60+parseInt(o.minute,10)}}catch(e){var n=new Date();return {day:(n.getDay()+6)%7,min:n.getHours()*60+n.getMinutes()}}
}
function clock(m){m=((m%1440)+1440)%1440;var h=Math.floor(m/60),mi=m%60,ap=h<12?'AM':'PM';h=h%12||12;return h+(mi?':'+(mi<10?'0':'')+mi:'')+' '+ap}
function dur(m){var h=Math.floor(m/60),mi=m%60;return h?(h+'h'+(mi?' '+mi+'m':'')):mi+'m'}
function winLabel(w){var a=clock(w[0]).split(' '),b=clock(w[1]).split(' ');return a[1]===b[1]?a[0]+'–'+b[0]+' '+b[1]:a.join(' ')+'–'+b.join(' ')}
/* status for one special: live | soon (starts within 2h) | later (later today) | null */
function catStatus(c,n){
  if(!c||!c.sch)return null;var i,w,t=c.sch[n.day]||[],y=c.sch[(n.day+6)%7]||[],m2=n.min+1440;
  for(i=0;i<y.length;i++){w=y[i];if(m2>=w[0]&&m2<w[1])return {bucket:'live',endsIn:dur(w[1]-m2),win:winLabel(w),start:w[0]}}
  for(i=0;i<t.length;i++){w=t[i];if(n.min>=w[0]&&n.min<w[1])return {bucket:'live',endsIn:dur(w[1]-n.min),win:winLabel(w),start:w[0]}}
  var best=null;for(i=0;i<t.length;i++){w=t[i];if(w[0]>n.min&&(!best||w[0]<best[0]))best=w}
  if(best)return {bucket:best[0]-n.min<=120?'soon':'later',startsAt:clock(best[0]),startsIn:dur(best[0]-n.min),win:winLabel(best),start:best[0]};
  return null;
}
var RANK={live:0,soon:1,later:2};
function venueStatus(v,only){var n=vegasNow(),best=null;KS.forEach(function(k){if(only&&only!==k)return;var s=catStatus(v[k],n);if(s){s.k=k;if(!best||RANK[s.bucket]<RANK[best.bucket]||(s.bucket===best.bucket&&s.start<best.start))best=s}});return best}

/* ---------- items ---------- */
function fmtPrice(i){if(i.price!=null)return String(i.range||('$'+i.price)).replace(/\s+/g,'');if(i.off)return i.off==='half'?'½ off':i.off==='bogo'?'BOGO':/%$/.test(i.off)?i.off+' off':i.off;return ''}
function itemsFor(v,k){var cs=k?[META[k].icat]:KS.filter(function(x){return v[x]}).map(function(x){return META[x].icat});return (v.items||[]).filter(function(i){return i.q!=='meta'&&cs.indexOf(i.category)>=0})}
function headline(v,k){var its=itemsFor(v,k).slice().sort(function(a,b){var pa=a.price!=null,pb=b.price!=null;if(pa!==pb)return pa?-1:1;return (a.price||0)-(b.price||0)});return its}
function cheapest(v,k){var p=null;itemsFor(v,k).forEach(function(i){if(i.price!=null&&(p==null||i.price<p))p=i.price});return p}
function primaryK(v,k){return k||(KS.filter(function(x){return v[x]})[0])||null}
function onIK(v){return !!(v.ik&&v.ik.s==='Yes')}
function street(a){return a?String(a).split(',')[0].trim():''}
function dirUrl(v){var d=(v.lat!=null&&!v.approx)?(v.lat+','+v.lng):(v.name+', '+v.addr);return 'https://www.google.com/maps/dir/?api=1&destination='+encodeURIComponent(d)}

/* ---------- shared bits ---------- */
function header(greet){return '<div class="hdr"><div><div class="brand">'+ic('flame')+'BamBoozle</div><div class="greet">'+esc(greet)+'</div></div><div class="hbtns"><a class="round gold" href="#/chat" aria-label="Ask BamBoozle">'+ic('chat')+'</a><a class="round" href="#/me" aria-label="Me">'+ic('person')+'</a></div></div>'}
function chipsHtml(list,cur,attr){return '<div class="chips" role="tablist">'+list.map(function(c){return '<button class="chip'+(c[0]===cur?' on':'')+'" data-'+attr+'="'+c[0]+'" role="tab" aria-selected="'+(c[0]===cur)+'">'+esc(c[1])+'</button>'}).join('')+'</div>'}
var TYPE_CHIPS=[['all','All'],['hh','Happy Hour'],['br','Brunch'],['ln','Late Night']];
function empty(icon,title,text,btn){return '<div class="empty"><div class="ic">'+ic(icon)+'</div><h3>'+esc(title)+'</h3><p>'+esc(text)+'</p>'+(btn||'')+'</div>'}
function metaRow(v,k,extra){var m=META[k]||{label:'inKind',color:'#E8A317',icon:'gift'};return '<div class="meta" style="color:'+m.color+'">'+ic(m.icon)+'<span>'+m.label+'</span>'+(extra||'')+'</div>'}

/* Deal card — mirrors Replit DealCard: price token + item/venue, 2 secondary deals, footer chips + Live badge */
function dealCard(v,k,hitHtml){
  k=primaryK(v,k);var m=META[k]||{label:'inKind',color:'#E8A317',icon:'gift'};
  var its=k?headline(v,k):[],h=its[0],tok=h&&fmtPrice(h);
  var rest=its.slice(1,3),extra=Math.max(0,its.length-1-rest.length);
  var st=k?catStatus(v[k],vegasNow()):null,d=miles(origin(),v);
  var times=k&&v[k]&&present(v[k].times)?String(v[k].times).split(' | ')[0]:'';
  var s='<a class="dcard grad" href="#/spot/'+v.id+'"><div class="body"><div class="hrow">';
  if(tok)s+='<div class="token" style="background:'+rgba(m.color,.1)+';border-color:'+rgba(m.color,.28)+'"><b class="'+(tok.length>4?'sm':'')+'" style="color:'+m.color+'">'+esc(tok)+'</b><small>'+esc(h.type||'deal')+'</small></div>';
  s+='<div class="info"><div class="in">'+esc(h?h.name:v.name)+'</div>'+(h?'<div class="bn2">'+esc(v.name)+'</div>':'')+'<div class="ad">'+esc(v.addr||v.loc||'')+'</div></div><svg class="chev" viewBox="0 0 24 24">'+ICONS.chev+'</svg></div>';
  if(rest.length){s+='<div class="sec">';rest.forEach(function(i){s+='<div class="srow"><b style="color:'+m.color+'">'+esc(fmtPrice(i)||'•')+'</b><span>'+esc(i.name)+'</span></div>'});if(extra)s+='<div class="more">+'+extra+' more deal'+(extra>1?'s':'')+'</div>';s+='</div>'}
  else if(!h&&k&&v[k]){var dl=k==='br'?(v.br.spec||v.br.bname):v[k].deals;if(present(dl))s+='<div class="more" style="font-size:13px;color:#9A9AA0">'+esc(dl)+'</div>'}
  if(hitHtml)s+=hitHtml;
  s+='</div><div class="foot"><div class="fl">'+(k?'<span class="ty" style="color:'+m.color+'">'+ic(m.icon)+m.label+'</span>':'')+(times?'<span>'+ic('clock')+esc(times)+'</span>':'')+(d!=null?'<span>'+ic('pin')+fmtMi(d,v)+'</span>':'')+'</div><div class="fr">'+(onIK(v)?'<span class="ikb">'+ic('gift')+'inKind</span>':'')+(st&&st.bucket==='live'?'<span class="liveb"><i></i>Live</span>':'')+'</div></div></a>';
  return s;
}

/* ---------- NOW (Replit index tab) ---------- */
var nowFilter='all';
function renderNow(){
  var n=vegasNow(),o=origin(),f=nowFilter==='all'?null:nowFilter;
  var list=DATA.map(function(v){return {v:v,s:venueStatus(v,f)}}).filter(function(x){return x.s});
  list.forEach(function(x){x.d=miles(o,x.v)});
  list.sort(function(a,b){return (a.d==null?1e9:a.d)-(b.d==null?1e9:b.d)||(b.v.rating||0)-(a.v.rating||0)});
  var L=list.filter(function(x){return x.s.bucket==='live'}),S=list.filter(function(x){return x.s.bucket==='soon'}),T=list.filter(function(x){return x.s.bucket==='later'});
  var h=header('What’s on right now.')+chipsHtml(TYPE_CHIPS,nowFilter,'nf');
  if(L.length){h+='<div class="railh"><b>'+ic('flame')+'Happening Now</b><span>Live</span></div><div class="rail">';
    L.slice(0,12).forEach(function(x){var v=x.v,m=META[x.s.k],it=headline(v,x.s.k)[0];h+='<a class="lcard grad" href="#/spot/'+v.id+'"><div><div class="bn">'+esc(v.name)+'</div><div class="win">'+esc(x.s.win)+'</div>'+metaRow(v,x.s.k)+(it?'<div class="ldeal">'+esc((fmtPrice(it)?fmtPrice(it)+' ':'')+it.name)+'</div>':'')+'</div><div class="pills"><span class="livep"><i></i>LIVE</span><span class="endp">'+ic('flame','width:12px;height:12px')+'ends '+esc(x.s.endsIn)+'</span></div></a>'});
    h+='</div>'}
  h+='<div class="pad">';
  function sect(title,color,arr,id){if(!arr.length)return '';var s='<div class="sech" id="'+id+'"><i style="background:'+color+'"></i>'+title+'<em>'+arr.length+'</em></div>';var lim=nowLimit[id]||25;arr.slice(0,lim).forEach(function(x){s+=feedRow(x)});if(arr.length>lim)s+='<button class="btn ghost loadmore" data-more="'+id+'">Show more ('+(arr.length-lim)+')</button>';return s}
  h+=sect('Live now','#2DD4BF',L,'live')+sect('Starting soon','#E8A317',S,'soon')+sect('Later today','#5C5C64',T,'later');
  if(!list.length)h+=empty('clock','Nothing happening now','No specials live or starting later today. Check back closer to happy hour.');
  h+='</div>';
  view.innerHTML=h;
  bindChips('nf',function(v){nowFilter=v;nowLimit={};renderNow()});
  view.querySelectorAll('[data-more]').forEach(function(b){b.onclick=function(){var id=b.getAttribute('data-more');nowLimit[id]=(nowLimit[id]||25)+50;var y=scrollY;renderNow();scrollTo(0,y)}});
}
var nowLimit={};
function feedRow(x){
  var v=x.v,s=x.s,m=META[s.k],it=headline(v,s.k)[0],live=s.bucket==='live',sp=(s.startsAt||'').split(' ');
  var times=v[s.k]&&present(v[s.k].times)?String(v[s.k].times).split(' | ')[0]:'';
  var extra=(street(v.addr)?'<span class="dot">·</span><span class="loc">'+esc(street(v.addr))+'</span>':'')+(x.d!=null?'<span class="dot">·</span><span class="loc" style="flex:none">'+fmtMi(x.d,v)+'</span>':'');
  return '<a class="frow grad" href="#/spot/'+v.id+'"><div class="main"><div class="bn">'+esc(v.name)+'</div>'+metaRow(v,s.k,extra)+(it?'<span class="dchip">'+esc((fmtPrice(it)?fmtPrice(it)+' ':'')+it.name)+'</span>':'')+(onIK(v)?'<div style="margin-top:8px"><span class="ikb">'+ic('gift')+'inKind</span></div>':'')+'</div><div class="vdiv"></div><div class="tcol">'+
   (live?'<span class="livep"><i></i>LIVE</span><div class="left">'+esc(s.endsIn)+' left</div>':ic('clock')+'<div class="h">'+esc(sp[0])+'</div><div class="p">'+esc(sp[1]||'')+'</div>')+
   '<div class="tt">'+esc(s.win)+'</div></div></a>';
}
function bindChips(attr,fn){view.querySelectorAll('[data-'+attr+']').forEach(function(b){b.onclick=function(){fn(b.getAttribute('data-'+attr))}})}

/* ---------- DEALS ---------- */
var dealF='all',dealSort='distance',dealLimit=30;
var DEAL_CHIPS=TYPE_CHIPS.concat([['ik','inKind'],['saved','Saved']]);
function dealList(){
  var o=origin(),f=dealF;
  var arr=DATA.filter(function(v){if(f==='ik')return onIK(v);if(f==='saved')return isSaved(v);if(f==='all')return KS.some(function(k){return v[k]})||onIK(v);return !!v[f]});
  var k=(f==='all'||f==='ik'||f==='saved')?null:f;
  arr=arr.map(function(v){return {v:v,d:miles(o,v),p:cheapest(v,k)}});
  if(dealSort==='price')arr.sort(function(a,b){return (a.p==null?1e9:a.p)-(b.p==null?1e9:b.p)||(a.d||0)-(b.d||0)});
  else arr.sort(function(a,b){return (a.d==null?1e9:a.d)-(b.d==null?1e9:b.d)||(b.v.rating||0)-(a.v.rating||0)});
  return {arr:arr,k:k};
}
function renderDeals(){
  var r=dealList();
  var h=header('Don’t pay full price.')+chipsHtml(DEAL_CHIPS,dealF,'df')+'<div class="sortrow">Sort:<button class="schip'+(dealSort==='distance'?' on':'')+'" data-ds="distance">Distance</button><button class="schip'+(dealSort==='price'?' on':'')+'" data-ds="price">Price</button><span style="margin-left:auto">'+r.arr.length+' spots'+(originLabel()?' · '+originLabel():'')+'</span></div><div class="pad">';
  r.arr.slice(0,dealLimit).forEach(function(x){h+=dealCard(x.v,r.k)});
  if(r.arr.length>dealLimit)h+='<button class="btn ghost loadmore" id="more">Show more ('+(r.arr.length-dealLimit)+')</button>';
  if(!r.arr.length)h+=dealF==='saved'?empty('heart','No saved spots yet','Tap the heart on any spot to keep it here.'):empty('beer','No deals here','Try a different filter.');
  view.innerHTML=h+'</div>';
  bindChips('df',function(v){dealF=v;dealLimit=30;renderDeals()});bindChips('ds',function(v){dealSort=v;dealLimit=30;renderDeals()});
  if($('more'))$('more').onclick=function(){dealLimit+=40;var y=scrollY;renderDeals();scrollTo(0,y)};
}

/* ---------- SEARCH ---------- */
var sq='',sLimit=30;
var SUGG=['wings','tacos','margarita','oysters','burger','mimosa','sushi','pizza','martini','beer'];
function reEsc(x){return x.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}
function renderSearch(){
  view.innerHTML=header('Find a spot, a dish, or a drink.')+'<label class="sbox">'+ic('search')+'<input id="sq" type="search" placeholder="Search spots, dishes, drinks, areas" autocomplete="off" enterkeyhint="search" value="'+esc(sq)+'"><button id="sx" aria-label="Clear search"'+(sq?'':' hidden')+'>'+ic('x')+'</button></label><div id="sres"></div>';
  var inp=$('sq');inp.oninput=function(){sq=inp.value;sLimit=30;$('sx').hidden=!sq;searchResults()};$('sx').onclick=function(){sq='';inp.value='';$('sx').hidden=true;searchResults();inp.focus()};
  searchResults();loadMenus().then(function(){if(location.hash.indexOf('#/search')===0&&sq)searchResults()});
}
function searchResults(){
  var box=$('sres');if(!box)return;var q=sq.trim();
  if(!q){box.innerHTML='<div class="hint">Try one of these</div><div class="chips" style="flex-wrap:wrap">'+SUGG.map(function(s){return '<button class="chip" data-sg="'+s+'">'+s+'</button>'}).join('')+'</div>';
    box.querySelectorAll('[data-sg]').forEach(function(b){b.onclick=function(){sq=b.getAttribute('data-sg');$('sq').value=sq;$('sx').hidden=false;searchResults()}});return}
  var re=new RegExp('(^|[^a-z])'+reEsc(q.toLowerCase()),'i'),o=origin(),res=[];
  DATA.forEach(function(v){
    var score=0,hits=[];
    if(re.test(v.name))score+=10;if(re.test(v.loc||'')||re.test(v.addr||''))score+=3;
    (v.items||[]).forEach(function(i){if(i.q!=='meta'&&re.test(i.name))hits.push([i.name,fmtPrice(i),'deal'])});
    var M=MENUS&&MENUS[v.id];if(M)['f','d'].forEach(function(t){(M[t]||[]).forEach(function(s){s[1].forEach(function(it){if(re.test(it[0]))hits.push([it[0],it[1]!=null?'$'+it[1]:'','menu'])})})});
    if(hits.length)score+=5;if(score)res.push({v:v,score:score,hits:hits,d:miles(o,v)});
  });
  res.sort(function(a,b){return b.score-a.score||(a.d==null?1e9:a.d)-(b.d==null?1e9:b.d)});
  var h='<div class="hint">'+res.length+' result'+(res.length===1?'':'s')+(MENUS?'':' · loading full menus…')+'</div><div class="pad">';
  res.slice(0,sLimit).forEach(function(x){var hh='';if(x.hits.length){var f=x.hits[0];hh='<div class="hit"><span class="hn">'+(f[2]==='menu'?'On menu: ':'Deal: ')+esc(f[0])+(x.hits.length>1?' <em>· +'+(x.hits.length-1)+' more</em>':'')+'</span>'+(f[1]?'<b class="hp">'+esc(f[1])+'</b>':'')+'</div>'}h+=dealCard(x.v,null,hh)});
  if(res.length>sLimit)h+='<button class="btn ghost loadmore" id="smore">Show more ('+(res.length-sLimit)+')</button>';
  if(!res.length)h+=empty('search','No results','Try a different search term');
  box.innerHTML=h+'</div>';if($('smore'))$('smore').onclick=function(){sLimit+=40;searchResults()};
}

/* ---------- MAP (Explorer: floating glass search + chips, gold live pins / gray others, bottom carousel) ---------- */
var map=null,mapLayer=null,mapF='live',mapQ='',mapSel=null,meMarker=null,mapEl=null;
var MAP_CHIPS=[['live','Live now'],['all','All'],['hh','Happy Hour'],['br','Brunch'],['ln','Late Night'],['ik','inKind']];
function mapVisible(){var re=mapQ.trim()?new RegExp(reEsc(mapQ.trim()),'i'):null;return DATA.filter(function(v){
  if(v.lat==null)return false;if(mapF==='live'){if(!venueStatus(v)||venueStatus(v).bucket!=='live')return false}else if(mapF==='ik'){if(!onIK(v))return false}else if(mapF==='all'){if(!KS.some(function(k){return v[k]})&&!onIK(v))return false}else if(!v[mapF])return false;
  if(re&&!re.test(v.name)&&!re.test(v.loc||'')&&!(v.items||[]).some(function(i){return re.test(i.name)}))return false;return true})}
function renderMap(){
  view.innerHTML='<div class="mapwrap"><div id="mapc" style="position:absolute;inset:0"></div><div class="mapover"><label class="sbox glass">'+ic('search')+'<input id="mq" type="search" placeholder="Search the map" autocomplete="off" value="'+esc(mapQ)+'"></label>'+chipsHtml(MAP_CHIPS,mapF,'mf')+'</div><button class="locbtn glass" id="loc" aria-label="Center on me">'+ic('loc')+'</button><div class="carousel" id="car"></div></div>';
  if(!mapEl){mapEl=document.createElement('div');mapEl.id='map';$('mapc').appendChild(mapEl);map=L.map(mapEl,{zoomControl:false,attributionControl:true}).setView(STRIP,12);map.on('moveend',function(){if(!origin()&&location.hash.indexOf('#/map')===0)drawCarousel(mapVisible())});
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,className:'darktiles',attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'}).addTo(map)}
  if(mapEl.parentNode!==$('mapc'))$('mapc').appendChild(mapEl);map.invalidateSize();
  bindChips('mf',function(v){mapF=v;view.querySelectorAll('[data-mf]').forEach(function(b){b.classList.toggle('on',b.getAttribute('data-mf')===v)});drawMap(true)});
  $('mq').oninput=function(){mapQ=this.value;drawMap(false)};
  $('loc').onclick=function(){locate(function(p){if(p){map.setView(p,14);drawMe();drawMap(false)}},true)};
  drawMe();drawMap(true);
}
function drawMe(){var o=origin();if(meMarker){map.removeLayer(meMarker);meMarker=null}if(o)meMarker=L.marker(o,{icon:L.divIcon({className:'',html:'<div class="me-dot"></div>',iconSize:[14,14],iconAnchor:[7,7]}),interactive:false}).addTo(map)}
function drawMap(fit){
  var vis=mapVisible();if(mapLayer)map.removeLayer(mapLayer);
  mapLayer=L.markerClusterGroup({showCoverageOnHover:false,maxClusterRadius:40,disableClusteringAtZoom:15});
  vis.forEach(function(v){var st=venueStatus(v),on=st&&st.bucket==='live';var mk=L.marker([v.lat,v.lng],{icon:L.divIcon({className:'',html:'<div class="pin'+(on?' on':'')+(mapSel===v.id?' sel':'')+'"></div>',iconSize:[16,16],iconAnchor:[8,8]}),title:v.name});mk.on('click',function(){selectOnMap(v.id,true)});mapLayer.addLayer(mk)});
  map.addLayer(mapLayer);
  if(fit&&vis.length){var o=origin();if(o&&mapF!=='all')map.setView(o,13);else map.fitBounds(L.latLngBounds(vis.map(function(v){return [v.lat,v.lng]})),{padding:[40,40],maxZoom:14})}
  drawCarousel(vis);
}
function drawCarousel(vis){
  var c=$('car');if(!c)return;var ref=origin()||[map.getCenter().lat,map.getCenter().lng];
  var arr=vis.map(function(v){return {v:v,d:miles(ref,v)}}).sort(function(a,b){return a.d-b.d}).slice(0,25);
  if(mapSel!=null&&!arr.some(function(x){return x.v.id===mapSel})){var sv=DATA[mapSel];if(vis.indexOf(sv)>=0)arr.unshift({v:sv,d:miles(ref,sv)})}
  c.innerHTML=arr.map(function(x){var v=x.v,st=venueStatus(v),k=st?st.k:primaryK(v),m=META[k];
    return '<a class="ccard grad'+(mapSel===v.id?' sel':'')+'" data-cid="'+v.id+'" href="#/spot/'+v.id+'"><div class="bn">'+esc(v.name)+'</div>'+(m?metaRow(v,k,st?'<span class="dot">·</span><span class="loc">'+esc(st.win)+'</span>':''):'')+'<div class="row">'+(st&&st.bucket==='live'?'<span class="livep"><i></i>LIVE</span>':st?'<span class="endp">'+esc(st.bucket==='soon'?'in '+st.startsIn:'at '+st.startsAt)+'</span>':'<span style="color:#5C5C64">Not on now</span>')+'<span>'+(x.d!=null&&origin()?fmtMi(x.d,v):esc(street(v.addr)))+'</span>'+(onIK(v)?'<span class="ikb">'+ic('gift')+'inKind</span>':'')+'</div></a>'}).join('')||'<div class="ccard grad"><div class="bn">No spots match</div><div class="row">Try another filter</div></div>';
}
function selectOnMap(id,pan){mapSel=id;var v=DATA[id];if(pan)map.panTo([v.lat,v.lng]);drawMap(false);var el=document.querySelector('[data-cid="'+id+'"]');if(el)el.scrollIntoView({behavior:'smooth',inline:'center',block:'nearest'})}

/* ---------- DETAIL ---------- */
var PHOTOS=null,photosP=null;
function loadPhotos(){if(photosP)return photosP;photosP=fetch('photos.json').then(function(r){if(!r.ok)throw 0;return r.json()}).then(function(j){PHOTOS=j.venues||{};return PHOTOS}).catch(function(){photosP=null;PHOTOS={};return PHOTOS});return photosP}
function vPhotos(v){var P=PHOTOS&&PHOTOS[v.id];return P&&P.name===v.name?P:null}
function photoFor(P,name){if(!P)return null;var a=P.items[BBChat.norm(name)];return a&&a.length?a:null}
function loadMenus(){if(menusP)return menusP;loadPhotos();menusP=fetch('menus.json').then(function(r){if(!r.ok)throw 0;return r.json()}).then(function(j){MENUS=j.m||{};return MENUS}).catch(function(){menusP=null;return null});return menusP}
var MT={hh:'Happy Hour',br:'Brunch',ln:'Late Night',dn:'Dinner',dr:'Drinks'};
var dTab={};
function renderDetail(id){
  var v=DATA[id];if(!v){view.innerHTML=empty('beer','Spot not found','It may have been removed.','<a class="btn" href="#/now">Back to Now</a>');return}
  var d=miles(origin(),v),st=venueStatus(v);
  var h='<div class="dhdr"><button class="ibtn" id="dback" aria-label="Back">'+ic('back')+'</button><h2>'+esc(v.name)+'</h2><button class="ibtn'+(isSaved(v)?' on':'')+'" id="dsave" aria-label="Save">'+ic('heart')+'</button><button class="ibtn" id="dshare" aria-label="Share">'+ic('share')+'</button></div>';
  h+='<div class="dhero"><h1>'+esc(v.name)+'</h1><div class="ad">'+esc(v.addr||'')+(d!=null?' · '+fmtMi(d,v)+' '+originLabel():'')+'</div>'+(v.rating?'<div class="rt"><span style="color:#E8A317">'+ic('star','width:13px;height:13px;vertical-align:-2px')+'</span> '+v.rating+(v.reviews?' ('+v.reviews+' '+esc(v.src||'')+' reviews)':'')+'</div>':'')+
     (st?'<div class="pills" style="margin-top:12px">'+(st.bucket==='live'?'<span class="livep"><i></i>LIVE · '+esc(META[st.k].label)+'</span><span class="endp">ends in '+esc(st.endsIn)+'</span>':'<span class="endp">'+esc(META[st.k].label)+' '+(st.bucket==='soon'?'starts in '+st.startsIn:'at '+st.startsAt)+'</span>')+'</div>':'')+'</div>';
  h+='<div class="acts"><a class="btn" href="'+esc(dirUrl(v))+'" target="_blank" rel="noopener">'+ic('nav')+'Directions</a>'+(onIK(v)?'<a class="btn ghost" href="'+INKIND_URL+'" target="_blank" rel="noopener">'+ic('gift')+'inKind</a>':'')+'</div>';
  if(v.lat!=null)h+='<div class="mini" id="mini"></div>';
  KS.forEach(function(k){var c=v[k];if(!c)return;var m=META[k],s=catStatus(c,vegasNow()),dl=k==='br'?c.spec:c.deals;
    h+='<div class="card grad"><h4 style="color:'+m.color+'">'+ic(m.icon)+m.label+(s&&s.bucket==='live'?' <span class="livep" style="margin-left:auto"><i></i>LIVE</span>':'')+'</h4><div class="tm">'+esc([present(c.days)?c.days:'',present(c.times)?c.times:''].filter(Boolean).join(' · ')||'Times not listed')+'</div>'+(present(dl)?'<p>'+esc(dl)+'</p>':'')+'</div>'});
  h+='<div id="menublock"></div>';
  if(v.ik)h+='<div class="card grad badge-ik"><div class="gi">'+ic('gift')+'</div><div style="flex:1"><h4>'+(onIK(v)?'On inKind':'Possibly on inKind')+'</h4><div class="tm">'+(onIK(v)?'Pay with inKind credit for bonus value.':'Unclear match — check the app.')+'</div><a class="src" href="'+INKIND_URL+'" target="_blank" rel="noopener">Open inKind (referral link)</a></div></div>';
  var notes=KS.map(function(k){return v[k]&&present(v[k].notes)?v[k].notes:''}).filter(Boolean);
  if(notes.length)h+='<p class="note" style="margin:16px 20px 0">'+esc(notes[0])+'</p>';
  view.innerHTML=h;scrollTo(0,0);
  $('dback').onclick=function(){if(history.length>1)history.back();else location.hash='#/now'};
  $('dsave').onclick=function(){toggleSave(v);this.classList.toggle('on',isSaved(v))};
  $('dshare').onclick=function(){var t=v.name+' — '+(v.addr||'');if(navigator.share)navigator.share({title:v.name,text:t,url:location.href}).catch(function(){});else if(navigator.clipboard)navigator.clipboard.writeText(t+' '+location.href).then(function(){toast('Copied')})};
  if(v.lat!=null){var mm=L.map('mini',{zoomControl:false,attributionControl:false,dragging:false,scrollWheelZoom:false,doubleClickZoom:false,touchZoom:false,boxZoom:false,keyboard:false}).setView([v.lat,v.lng],15);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{className:'darktiles'}).addTo(mm);L.marker([v.lat,v.lng],{icon:L.divIcon({className:'',html:'<div class="pin on"></div>',iconSize:[16,16],iconAnchor:[8,8]})}).addTo(mm);
    $('mini').onclick=function(){mapSel=v.id;mapF='all';location.hash='#/map';setTimeout(function(){map.setView([v.lat,v.lng],16);drawMap(false)},50)}}
  menuBlock(v);if(!MENUS||!PHOTOS)Promise.all([loadMenus(),loadPhotos()]).then(function(){if(location.hash==='#/spot/'+v.id)menuBlock(v)});
}
function menuTabs(v){var M=MENUS&&MENUS[v.id],t=[],X=vPhotos(v);if(X){M=M||{};if(!M.f&&X.extra.f.length)M={f:[],d:M.d,u:M.u};if(!M.d&&X.extra.d.length)M={f:M.f,d:[],u:M.u}}KS.forEach(function(k){if(v[k]&&itemsFor(v,k).length)t.push(k)});if(M&&M.f)t.push('dn');if(M&&M.d)t.push('dr');return t}
function menuBlock(v){
  var b=$('menublock');if(!b)return;var tabs=menuTabs(v),M=MENUS&&MENUS[v.id];
  if(!tabs.length){b.innerHTML='<div class="card grad"><h4>Menu</h4><div class="tm">'+(MENUS?'No menu found for this spot yet.':'Loading menu…')+'</div></div>';return}
  var sel=tabs.indexOf(dTab[v.id])>=0?dTab[v.id]:tabs[0],X=vPhotos(v),PH=[];
  var li=function(name,price,md){var ph=photoFor(X,name),at='';if(ph){at=' class="ph" data-ph="'+PH.length+'" role="button" tabindex="0" aria-label="'+esc(name)+' photo"';PH.push({name:name,price:price,srcs:ph})}
    return '<li'+at+'><span class="nm">'+esc(name)+(ph?'<span class="phi" title="Photo">'+ic('camera')+'</span>':'')+(md?'<span class="md">'+esc(md)+'</span>':'')+'</span><span class="pr">'+esc(price)+'</span></li>'};
  var h='<div class="tabs" role="tablist">'+tabs.map(function(t){return '<button class="chip'+(t===sel?' on':'')+'" data-mt="'+t+'" role="tab">'+MT[t]+'</button>'}).join('')+'</div><div class="card grad">';
  if(META[sel]){var its=itemsFor(v,sel);h+='<h4>'+MT[sel]+' deals</h4><ul class="items">'+its.map(function(i){return li(i.name,fmtPrice(i))}).join('')+'</ul>';var u=safeUrl(v[sel].url);if(u)h+='<a class="src" href="'+esc(u)+'" target="_blank" rel="noopener">Source: '+esc(u.replace(/^https?:\/\/(www\.)?/,'').split('/')[0])+'</a>'}
  else{var secs=((M&&M[sel==='dn'?'f':'d'])||[]).concat(X?X.extra[sel==='dn'?'f':'d']:[]),tot=0;secs.forEach(function(s){tot+=s[1].length});h+='<h4>'+MT[sel]+' menu <small style="color:#9A9AA0;font-weight:500">'+tot+' items</small></h4>';
    secs.forEach(function(s,si){h+='<details class="ms"'+(tot<=40||si<2?' open':'')+'><summary>'+esc(s[0]||'Menu')+' ('+s[1].length+')</summary><ul class="items">'+s[1].map(function(it){var p=it[1]==null?'':'$'+(it[1]%1?it[1].toFixed(2):it[1])+(it[3]!=null&&it[3]>it[1]?'–$'+it[3]:'');return li(it[0],p,it[2])}).join('')+'</ul></details>'});
    h+='<div class="note">Menu from the restaurant’s site; prices may change.'+(X?' '+esc(X.credit)+'; items without a price are from the photo set.':'')+'</div>';var u2=safeUrl(M&&M.u);if(u2)h+='<a class="src" href="'+esc(u2)+'" target="_blank" rel="noopener">Source: '+esc(u2.replace(/^https?:\/\/(www\.)?/,'').split('/')[0])+'</a>'}
  b.innerHTML=h+'</div>';
  b.querySelectorAll('[data-mt]').forEach(function(x){x.onclick=function(){dTab[v.id]=x.getAttribute('data-mt');menuBlock(v)}});
  b.querySelectorAll('li.ph').forEach(function(x){var go=function(){openViewer(PH,+x.getAttribute('data-ph'))};x.onclick=go;x.onkeydown=function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();go()}}});
}

/* ---------- ME (replaces Replit Account tab: Set home, saved, inKind) ---------- */
function zipCentroid(z){var la=0,ln=0,n=0;DATA.forEach(function(v){if(v.zip===z&&v.lat!=null&&!v.approx){la+=v.lat;ln+=v.lng;n++}});return n?[la/n,ln/n]:null}
function validHome(q){q=q.trim();if(/^\d{5}(-\d{4})?$/.test(q))return 'zip';return /^\d+[A-Za-z]?\s+[A-Za-z0-9.'’ -]*[A-Za-z]/.test(q)?'addr':'bad'}
function renderMe(){
  var hm=home(),sv=DATA.filter(isSaved);
  var h=header('Your spots and settings.');
  h+='<div class="grp grad"><h3>Home</h3><p class="sub">Set home with a street address or a ZIP code, or use your current location. Distances and “nearest” start from it.</p>';
  if(hm)h+='<div class="homecur"><div><b>'+ic('home','width:14px;height:14px;vertical-align:-2px;color:#E8A317')+' '+esc(hm.label)+'</b><small>'+(hm.kind==='zip'?'ZIP code':hm.kind==='gps'?'Current location':'Street address')+'</small></div><button class="lnk red" id="hrm">Remove</button></div>'+
    '<div class="toggle" style="margin-bottom:12px"><span>Measure distance from Home</span><button class="sw'+(useHome()?' on':'')+'" id="huse" role="switch" aria-checked="'+useHome()+'" aria-label="Measure distance from Home"></button></div>';
  h+='<div class="field"><input id="hin" placeholder="e.g. 123 Main St, Las Vegas or 89109" autocomplete="street-address" enterkeyhint="done"><button class="btn" id="hsave">'+(hm?'Change':'Save')+'</button></div><div class="row2"><button class="btn ghost" id="hgps">'+ic('loc')+'Use current location</button></div><div class="msg" id="hmsg"></div></div>';
  h+='<div class="grp grad"><h3>inKind</h3><p class="sub">'+DATA.filter(onIK).length+' spots take inKind credit. Join with Biv’s referral link for bonus credit.</p><a class="btn" href="'+INKIND_URL+'" target="_blank" rel="noopener">'+ic('gift')+'Open inKind</a> <a class="btn ghost" href="#/deals" id="ikl">See inKind spots</a></div>';
  h+='<div class="sech" style="margin:8px 22px 12px"><i style="background:#E8A317"></i>Saved spots<em>'+sv.length+'</em></div><div class="pad">';
  h+=sv.length?sv.map(function(v){return dealCard(v,null)}).join(''):empty('heart','No saved spots yet','Tap the heart on any spot to keep it here.');
  h+='</div><p class="note" style="text-align:center;margin:20px">BamBoozle v2 preview · '+DATA.length+' spots · data shared with BamBoozle</p>';
  view.innerHTML=h;
  var msg=function(t,e){var m=$('hmsg');m.textContent=t||'';m.classList.toggle('err',!!e)};
  var saveH=function(o){o.t=Date.now();lsSet('bb2Home',o);lsSet('bb2UseHome',true);toast('Home saved');renderMe()};
  if($('hrm'))$('hrm').onclick=function(){lsSet('bb2Home',null);toast('Home removed');renderMe()};
  if($('huse'))$('huse').onclick=function(){lsSet('bb2UseHome',!useHome());renderMe()};
  $('ikl').onclick=function(){dealF='ik'};
  $('hgps').onclick=function(){msg('Getting your location…');locate(function(p){if(p)saveH({label:'Current location',lat:p[0],lng:p[1],kind:'gps'});else msg('Couldn’t get your location. Check location permission.',true)},true)};
  $('hsave').onclick=function(){var q=$('hin').value,t=validHome(q),btn=this;
    if(t==='bad'){msg('Enter a 5-digit ZIP or a street address that starts with a house number.',true);return}
    if(t==='zip'){var z=q.trim().slice(0,5),c=zipCentroid(z);if(c){saveH({label:'ZIP '+z,lat:c[0],lng:c[1],kind:'zip'});return}}
    btn.disabled=true;msg('Looking it up…');
    var url='https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=us&'+(t==='zip'?'postalcode='+encodeURIComponent(q.trim().slice(0,5)):'q='+encodeURIComponent(q.trim()+(/\b(nv|nevada|las vegas|henderson)\b/i.test(q)?'':', Las Vegas, NV')));
    fetch(url,{headers:{Accept:'application/json'}}).then(function(r){if(!r.ok)throw 0;return r.json()}).then(function(a){btn.disabled=false;
      if(!a||!a.length){msg('We couldn’t find that. Check it and try again.',true);return}
      var lbl=t==='zip'?'ZIP '+q.trim().slice(0,5):String(a[0].display_name||q).split(',').slice(0,3).join(',');
      if(t==='zip'||confirm('Save this as home?\n\n'+a[0].display_name))saveH({label:lbl,lat:+a[0].lat,lng:+a[0].lon,kind:t});else msg('')
    }).catch(function(){btn.disabled=false;msg('Couldn’t reach the address lookup. Try a ZIP instead.',true)});
  };
}

/* ---------- photo viewer ---------- */
function openViewer(list,idx){var flat=[];list.forEach(function(p){p.srcs.forEach(function(s,j){flat.push({name:p.name,price:p.price,src:s,n:j+1,of:p.srcs.length})})});
  var start=0;for(var i=0;i<idx;i++)start+=list[i].srcs.length;var cur=start,el=document.createElement('div');el.id='pv';el.setAttribute('role','dialog');el.setAttribute('aria-modal','true');
  el.innerHTML='<button class="pvx" aria-label="Close">'+ic('x')+'</button><div class="pvimg"><img alt=""></div><button class="pvnav prev" aria-label="Previous photo">‹</button><button class="pvnav next" aria-label="Next photo">›</button><div class="pvcap"><b></b><span class="pvp"></span><small></small></div>';
  document.body.appendChild(el);document.body.classList.add('noscroll');
  var img=el.querySelector('img');
  function show(){var f=flat[cur];img.src=f.src;img.alt=f.name;el.querySelector('.pvcap b').textContent=f.name;el.querySelector('.pvp').textContent=f.price||'';el.querySelector('.pvcap small').textContent=(cur+1)+' / '+flat.length;el.querySelector('.prev').hidden=flat.length<2;el.querySelector('.next').hidden=flat.length<2}
  function step(d){cur=(cur+d+flat.length)%flat.length;show()}
  function close(){document.removeEventListener('keydown',key);el.remove();document.body.classList.remove('noscroll')}
  function key(e){if(e.key==='Escape')close();else if(e.key==='ArrowRight')step(1);else if(e.key==='ArrowLeft')step(-1)}
  el.querySelector('.pvx').onclick=close;el.querySelector('.prev').onclick=function(){step(-1)};el.querySelector('.next').onclick=function(){step(1)};
  var sx=null;el.addEventListener('touchstart',function(e){sx=e.touches[0].clientX},{passive:true});el.addEventListener('touchend',function(e){if(sx==null)return;var dx=e.changedTouches[0].clientX-sx;if(Math.abs(dx)>40)step(dx<0?1:-1);sx=null});
  document.addEventListener('keydown',key);show();el.querySelector('.pvx').focus();window.BB2.viewer={close:close,step:step,cur:function(){return flat[cur]}};
}

/* ---------- chat ---------- */
var API_BASE=ls('bb2ApiBase','https://bamboozle.mobile');
var chatLog=[],chatBusy=false,chatSeq=0;
var CHAT_EX=['happy hour near me now','cheapest burger within half a mile','brunch near home on sunday','late night tonight top rated','happy hours between home and Ocean Prime','open Ocean Prime drinks menu'];
function vegasStamp(){try{var o={};new Intl.DateTimeFormat('en-US',{timeZone:'America/Los_Angeles',weekday:'short',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false}).formatToParts(new Date()).forEach(function(p){o[p.type]=p.value});return o.weekday+' '+o.year+'-'+o.month+'-'+o.day+' '+(o.hour==='24'?'00':o.hour)+':'+o.minute}catch(e){return new Date().toISOString().slice(0,16)}}
function rateOk(){var now=Date.now(),a=(ls('bb2ChatRL',[])||[]).filter(function(t){return now-t<60000});if(a.length>=10)return false;a.push(now);lsSet('bb2ChatRL',a);return true}
function homePt(){var h=home()||ls('bbHome',null);return h&&h.lat!=null?[+h.lat,+h.lng]:null}
function remoteParse(text,onWake){
  var down=+(sessionStorage.getItem('bb2ChatDown')||0);if(!API_BASE||Date.now()<down)return Promise.reject('down');
  function once(){var ctl=typeof AbortController!=='undefined'?new AbortController():null,t=setTimeout(function(){ctl&&ctl.abort()},12000),w=setTimeout(onWake,1500);
    return fetch(API_BASE.replace(/\/$/,'')+'/api/chat-parse',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:text,today:vegasStamp()}),signal:ctl&&ctl.signal})
      .then(function(r){if(!r.ok)throw {http:r.status};return r.json()}).then(function(j){var c=j&&(j.cmd?j:{cmd:j.tool||j.name,args:j.args||j.arguments});var v=BBChat.validate(c);if(!v.ok)throw {invalid:v.error};return v.cmd})
      .finally(function(){clearTimeout(t);clearTimeout(w)})}
  return once().catch(function(e){if(e&&e.invalid)return once();throw e}).catch(function(e){if(!(e&&e.invalid))sessionStorage.setItem('bb2ChatDown',String(Date.now()+10*60000));throw e});
}
function parseText(text,onWake){return remoteParse(text,onWake).then(function(c){c.src='ai';return c}).catch(function(){var v=BBChat.validate(BBChat.localParse(text,vegasNow().day));if(!v.ok)v={cmd:{cmd:'clarify',args:{question:'Sorry, I didn’t get that. Try “happy hour near me now”.'}}};v.cmd.src='local';return v.cmd})}
function needsMe(c){var a=c.args||{};return [a.near,a.route_from,a.route_to].some(function(x){return x&&/^(me|my location|here|current location)$/i.test(x)})}
function getLive(){return new Promise(function(res){if(live)return res(live);var done=false;setTimeout(function(){if(!done){done=true;res(null)}},9000);locate(function(p){if(!done){done=true;res(p)}})})}
function execCmd(c){return Promise.all([loadMenus(),needsMe(c)?getLive():Promise.resolve(live)]).then(function(r){
  return BBChat.run(c,{data:DATA,menus:MENUS||{},now:vegasNow(),me:r[1]||null,home:homePt()})})}
function chatSend(text){text=String(text||'').replace(/\s+/g,' ').trim().slice(0,300);if(!text||chatBusy)return;
  if(!rateOk()){chatLog.push({who:'bot',res:{type:'msg',message:'You’re sending a lot of requests. Wait a minute and try again.'}});renderChat();return}
  chatLog.push({who:'me',text:text});chatBusy='Thinking…';renderChat();
  parseText(text,function(){if(chatBusy){chatBusy='Waking up…';renderChat()}}).then(runAndShow);}
function runAndShow(c){chatBusy='Searching…';renderChat();execCmd(c).then(function(res){chatBusy=false;
  if(res.type==='open'){chatLog.push({who:'bot',cmd:c,res:res});if(res.tab)dTab[res.id]=res.tab;location.hash='#/spot/'+res.id;return}
  chatLog.push({who:'bot',cmd:c,res:res});renderChat()}).catch(function(){chatBusy=false;chatLog.push({who:'bot',res:{type:'msg',message:'Something went wrong. Try again.'}});renderChat()})}
function clone(o){return JSON.parse(JSON.stringify(o))}
function botHtml(e,i){var r=e.res,h='';
  if(r.type==='msg')return '<div class="bub bot">'+esc(r.message)+'</div>';
  if(r.type==='need_home')return '<div class="bub bot">'+esc(r.message)+'<div class="acts2"><a class="schip on" href="#/me">Set Home</a></div></div>';
  if(r.type==='open')return '<div class="bub bot">Opened '+esc(r.name)+(r.tab?' · '+esc(MT[r.tab]):'')+'. <a href="#/spot/'+r.id+'" class="lnk">Open again</a></div>';
  if(r.type==='clarify'){h='<div class="bub bot">'+esc(r.question)+'<div class="acts2">';
    if(r.suggestions&&r.suggestions.length)h+=r.suggestions.map(function(s,j){return '<button class="schip" data-cl="'+i+':'+j+'">'+esc(s.name)+'<small> '+esc(street(s.addr))+'</small></button>'}).join('');
    else h+=CHAT_EX.slice(0,3).map(function(x){return '<button class="schip" data-ex="'+esc(x)+'">'+esc(x)+'</button>'}).join('');
    return h+'</div></div>'}
  var a=e.cmd.args||{},kind=r.type==='items'?'item'+(r.total===1?'':'s'):'spot'+(r.total===1?'':'s');
  var what=(r.type==='items'?'Cheapest '+esc(a.item):(a.deal_type&&a.deal_type!=='any'?esc({happy_hour:'Happy hours',brunch:'Brunch',late_night:'Late night'}[a.deal_type]):'Spots')+(a.item?' with '+esc(a.item):''))+(a.day==='now'?' live now':a.day&&a.day!=='today'?' on '+esc(a.day[0].toUpperCase()+a.day.slice(1)):a.day==='today'?' today':'')+(a.price_max!=null?' under $'+a.price_max:'')+(a.in_kind?' on inKind':'');
  h='<div class="bub bot"><b>'+what+'</b><div class="rs">'+r.total+' '+kind+(r.label?' · '+esc(r.label):'')+(r.total>r.rows.length?' · showing '+r.rows.length:'')+'</div>'+(r.notes||[]).map(function(n){return '<div class="rs">'+esc(n)+'</div>'}).join('')+(e.cmd.src==='local'?'<div class="rs dim">Matched with on-phone search</div>':'')+'</div>';
  if(!r.rows.length){h+='<div class="nomatch"><h3>No matches</h3><div class="acts2">'+(a.route_from?'':'<button class="schip on" data-wd="'+i+'">Widen to '+((a.radius_miles||1)*2)+' mi</button>')+(a.day||a.time_from?'<button class="schip on" data-wt="'+i+'">Any time</button>':'')+(a.price_max!=null?'<button class="schip on" data-wp="'+i+'">Any price</button>':'')+'</div></div>';return h}
  h+='<div class="cres">';
  if(r.type==='items')h+=r.rows.map(function(x){return '<a class="irow" href="#/spot/'+x.v.id+'"><div class="in2"><b>'+esc(x.name)+'</b><small>'+esc(x.v.name)+(x.d!=null?' · '+fmtMi(x.d,x.v):'')+(x.src&&META[x.src]?' · '+META[x.src].label:x.src==='drinks'?' · Drinks menu':' · Menu')+'</small></div><span class="ip">$'+(x.price%1?x.price.toFixed(2):x.price)+'</span></a>'}).join('');
  else h+=r.rows.map(function(x){return dealCard(x.v,x.k||null,x.hit?'<div class="hit"><span class="hn">'+esc(x.hit.name)+'</span>'+(x.hit.price!=null?'<b class="hp">$'+x.hit.price+'</b>':'')+'</div>':'')}).join('');
  return h+'</div>'}
function renderChat(){
  var h=header('Ask for deals in plain words.')+'<div id="chatlog" class="chatlog">';
  if(!chatLog.length)h+='<div class="bub bot">Hi! Tell me what you’re after and I’ll search BamBoozle’s spots. Results come straight from our data.<div class="acts2">'+CHAT_EX.map(function(x){return '<button class="schip" data-ex="'+esc(x)+'">'+esc(x)+'</button>'}).join('')+'</div></div>';
  chatLog.forEach(function(e,i){h+=e.who==='me'?'<div class="bub me">'+esc(e.text)+'</div>':botHtml(e,i)});
  if(chatBusy)h+='<div class="bub bot typing"><i></i><i></i><i></i><span>'+esc(chatBusy)+'</span></div>';
  h+='</div><form class="chatbar" id="chatf"><input id="chatin" maxlength="300" placeholder="e.g. cheapest tacos near home" autocomplete="off" enterkeyhint="send" aria-label="Message"><button class="send" aria-label="Send"'+(chatBusy?' disabled':'')+'>'+ic('send')+'</button></form>';
  var keep=$('chatin')?$('chatin').value:'';view.innerHTML=h;var inp=$('chatin');inp.value=keep;
  $('chatf').onsubmit=function(e){e.preventDefault();var t=inp.value;inp.value='';chatSend(t)};
  view.querySelectorAll('[data-ex]').forEach(function(b){b.onclick=function(){chatSend(b.getAttribute('data-ex'))}});
  view.querySelectorAll('[data-cl]').forEach(function(b){b.onclick=function(){var p=b.getAttribute('data-cl').split(':'),e=chatLog[+p[0]],s=e.res.suggestions[+p[1]];
    if(e.cmd&&e.res.role){var c=clone(e.cmd);c.args[e.res.role]=s.name;chatLog.push({who:'me',text:s.name});runAndShow(c)}else{chatLog.push({who:'me',text:s.name});runAndShow({cmd:'open_spot',args:{venue:s.name}})}}});
  var widen=function(attr,fn){view.querySelectorAll('[data-'+attr+']').forEach(function(b){b.onclick=function(){var e=chatLog[+b.getAttribute('data-'+attr)],c=clone(e.cmd);fn(c.args);chatLog.push({who:'me',text:b.textContent});runAndShow(c)}})};
  widen('wd',function(a){a.radius_miles=Math.min(50,(a.radius_miles||1)*2);if(!a.near)a.near='me'});widen('wt',function(a){delete a.day;delete a.time_from;delete a.time_to});widen('wp',function(a){delete a.price_max});
  var lg=$('chatlog');scrollTo(0,document.body.scrollHeight);
}

/* ---------- router ---------- */
function route(){
  var hsh=location.hash||'#/now',m;
  var tab=hsh.split('/')[1]||'now';
  document.querySelectorAll('#tabbar a').forEach(function(a){a.classList.toggle('on',a.getAttribute('data-tab')===tab)});
  if(tab!=='map'&&mapEl&&mapEl.parentNode)mapEl.parentNode.removeChild(mapEl);
  if((m=hsh.match(/^#\/spot\/(\d+)/)))return renderDetail(+m[1]);
  ({now:renderNow,deals:renderDeals,map:renderMap,search:renderSearch,me:renderMe,chat:renderChat}[tab]||renderNow)();
  if(tab!=='map'&&tab!=='spot'&&tab!=='chat')scrollTo(0,0);
}
window.addEventListener('hashchange',route);
window.BB2={setNow:function(d,m){NOW_OVERRIDE=d==null?null:{day:d,min:m};route()}};
setInterval(function(){var t=location.hash.split('/')[1]||'now';if(t==='now'&&!NOW_OVERRIDE){var y=scrollY;renderNow();scrollTo(0,y)}},60000);
fetch('data.json',{cache:'no-cache'}).then(function(r){return r.json()}).then(function(d){
  DATA=d;DATA.forEach(function(v,i){v.id=i});
  if(!location.hash)history.replaceState(null,'','#/now');
  route();
  locate(function(p){if(p&&!(home()&&useHome())&&!/^#\/(spot|search|me)/.test(location.hash))route()});
}).catch(function(){view.innerHTML=empty('beer','Couldn’t load spots','Check your connection and reload.')});
if('serviceWorker' in navigator&&location.protocol==='https:')navigator.serviceWorker.register('sw.js').catch(function(){});
})();
