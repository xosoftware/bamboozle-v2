import pkg from '/node_modules/playwright-core/index.js'; const { chromium, devices } = pkg;import fs from 'fs';
const P=JSON.parse(fs.readFileSync('/workspace/bamboozle-v2/photos.json')).venues['618'];
const norm=s=>s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/&/g,' and ').replace(/['’]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
const b=await chromium.launch({executablePath:'/usr/bin/google-chrome'});const pg=await (await b.newContext({...devices['iPhone 13']})).newPage();
const errs=[];pg.on('pageerror',e=>errs.push(e.message));pg.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
await pg.goto('http://localhost:8799/#/spot/618');await pg.waitForSelector('[data-mt]');await pg.waitForTimeout(1500);
const tabs=await pg.$$eval('[data-mt]',x=>x.map(e=>e.getAttribute('data-mt')));const rows=[];const shots={};
for(const t of tabs){await pg.click(`[data-mt="${t}"]`);await pg.waitForTimeout(300);
  await pg.$$eval('details.ms',d=>d.forEach(x=>x.open=true));
  if(t==='dn'){await pg.evaluate(()=>document.getElementById('menublock').scrollIntoView());await pg.screenshot({path:'/workspace/op_menu_tab.png'})}
  const n=await pg.locator('#menublock li').count();
  for(let i=0;i<n;i++){const li=pg.locator('#menublock li').nth(i);const name=(await li.locator('.nm').evaluate(e=>e.childNodes[0].textContent)).trim();const price=(await li.locator('.pr').textContent()).trim();
    const isPh=await li.evaluate(e=>e.classList.contains('ph'));const exp=P.items[norm(name)]?.[0]||null;const before=errs.length;let r={tab:t,item:name,price,expected:exp,photo:isPh,result:'PASS',note:''};
    if(!!exp!==isPh){r.result='FAIL';r.note='indicator mismatch'}
    await li.scrollIntoViewIfNeeded();await li.click();await pg.waitForTimeout(150);
    const v=await pg.evaluate(()=>{const p=document.getElementById('pv');if(!p)return null;const im=p.querySelector('img');return {src:im.getAttribute('src'),cap:p.querySelector('.pvcap b').textContent,pr:p.querySelector('.pvp').textContent}});
    if(isPh){if(!v){r.result='FAIL';r.note='viewer did not open'}else{await pg.waitForFunction(()=>{const im=document.querySelector('#pv img');return im.complete&&im.naturalWidth>0},null,{timeout:8000}).catch(()=>{r.result='FAIL';r.note='image did not load'});
        if(v.src!==exp){r.result='FAIL';r.note='src '+v.src}if(v.cap!==name){r.result='FAIL';r.note+=' caption '+v.cap}
        const cat=/cocktail|zero proof|fashionably/i.test(await li.evaluate(e=>e.closest('details')?.querySelector('summary')?.textContent||''))?'cocktail':/brunch/i.test(await li.evaluate(e=>e.closest('details')?.querySelector('summary')?.textContent||''))?'brunch':null;
        const want={starter:'POINT JUDITH CALAMARI',main:'Miso Black Cod',cocktail:'Black Orchid',brunch:'Crabcake Eggs Benedict'};for(const [k,nm] of Object.entries(want))if(nm===name&&!shots[k]){shots[k]=1;await pg.screenshot({path:`/workspace/op_viewer_${k}.png`})}
        await pg.click('#pv .pvx');await pg.waitForTimeout(100);if(await pg.$('#pv')){r.result='FAIL';r.note+=' close failed'}}}
    else if(v){r.result='FAIL';r.note='viewer opened for non-photo item'}
    if(errs.length>before){r.result='FAIL';r.note+=' JS error: '+errs.slice(before).join(';')}
    rows.push(r)}}
const used=new Set(rows.filter(r=>r.photo).map(r=>r.expected));const allFiles=new Set(Object.values(P.items).flat());
const csv=['tab,item,price,has_photo,expected_src,result,note',...rows.map(r=>[r.tab,r.item,r.price,r.photo,r.expected||'',r.result,r.note].map(x=>'"'+String(x).replace(/"/g,'""')+'"').join(','))].join('\n');
fs.writeFileSync('/workspace/op_photo_test.csv',csv);
const pass=rows.filter(r=>r.result==='PASS').length;
console.log(JSON.stringify({tabs,items:rows.length,photoItems:rows.filter(r=>r.photo).length,pass,fail:rows.length-pass,photosReachable:used.size+'/'+allFiles.size,shots:Object.keys(shots),errs}));
rows.filter(r=>r.result!=='PASS').forEach(r=>console.log('FAIL',r));await b.close();
