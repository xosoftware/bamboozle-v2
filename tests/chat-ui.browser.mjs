import pkg from '/node_modules/playwright-core/index.js'; const { chromium, devices } = pkg;
const b=await chromium.launch({executablePath:'/usr/bin/google-chrome'});
const ctx=await b.newContext({...devices['iPhone 13'],geolocation:{latitude:36.1147,longitude:-115.1728},permissions:['geolocation']});
await ctx.addInitScript(()=>{localStorage.setItem('bb2Home',JSON.stringify({label:'ZIP 89146',lat:36.1440,lng:-115.2240,kind:'zip'}));localStorage.setItem('bb2UseHome','false')});
const pg=await ctx.newPage();const errs=[];pg.on('pageerror',e=>errs.push('pageerror '+e.message));pg.on('console',m=>{if(m.type()==='error'&&!/chat-parse|CORS|Failed to load resource|net::/.test(m.text()))errs.push('console '+m.text())});
const U='http://localhost:8799/';const out={};
await pg.goto(U+'#/now');await pg.waitForSelector('.hdr');await pg.evaluate(()=>BB2.setNow(4,17*60));
await pg.click('a[href="#/chat"]');await pg.waitForSelector('#chatin');
async function ask(q,shot){await pg.evaluate(()=>localStorage.removeItem('bb2ChatRL'));const n=await pg.evaluate(()=>BB2.chatLen());await pg.fill('#chatin',q);await pg.press('#chatin','Enter');
  await pg.waitForFunction(n=>BB2.chatLen()>=n+2,n,{timeout:20000});await pg.waitForTimeout(400);
  const r=await pg.evaluate(()=>({hash:location.hash,last:[...document.querySelectorAll('.bub.bot')].pop()?.innerText.slice(0,160),cards:document.querySelectorAll('.cres:last-of-type .dcard').length,items:document.querySelectorAll('.irow').length,nomatch:!!document.querySelector('.nomatch'),tab:document.querySelector('[data-mt].on')?.textContent}));
  if(shot){if(!r.hash.startsWith('#/spot')){const els=await pg.locator('.bub.me').last();await els.scrollIntoViewIfNeeded();await pg.evaluate(()=>{const e=[...document.querySelectorAll('.bub.me')].pop();scrollTo(0,e.getBoundingClientRect().top+scrollY-90)})}else{await pg.waitForTimeout(1500);await pg.evaluate(()=>document.getElementById('menublock').scrollIntoView())}await pg.waitForTimeout(300);await pg.screenshot({path:'/workspace/chat_'+shot+'.png'})}
  out[q]=r;return r}
await ask('happy hour near me now','hh_near_me');
await ask('cheapest burger within half a mile','cheapest_burger');
await ask('happy hours between home and Ocean Prime','route');
await ask('brunch near me under $1 on tuesday within a quarter mile','nomatch');
await pg.click('[data-wd]').catch(()=>{});await pg.waitForTimeout(800);
await ask('open hash house menu','clarify');
await pg.locator('[data-cl]').first().click();await pg.waitForTimeout(1500);out.clarifyTap=await pg.evaluate(()=>location.hash);
await pg.goto(U+'#/chat');await pg.waitForSelector('#chatin');
await ask('open Ocean Prime drinks menu','open_spot');
// cap + rate limit
await pg.goto(U+'#/chat');await pg.waitForSelector('#chatin');out.maxlen=await pg.getAttribute('#chatin','maxlength');
await pg.evaluate(()=>localStorage.setItem('bb2ChatRL',JSON.stringify(Array(10).fill(Date.now()))));await pg.fill('#chatin','happy hour');await pg.press('#chatin','Enter');await pg.waitForTimeout(300);out.rate=await pg.evaluate(()=>[...document.querySelectorAll('.bub.bot')].pop().innerText);
console.log(JSON.stringify(out,null,1));console.log('ERRORS',errs);await b.close();
