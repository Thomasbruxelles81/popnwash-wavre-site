import {chromium,firefox,webkit} from 'playwright';
import fs from 'node:fs';
const issues=[],cases=[];
const profiles=[['mini',375,812],['smallAndroid',360,780],['split',820,900],
 ['tablet',1024,768],['landscapeTablet',1194,834],['chromebook',1366,768],
 ['macbook',1440,900],['windowed',1280,800],['fullHD',1920,1080],
 ['wide',2560,1440],['tiny',320,568]];
fs.mkdirSync('qa-r12',{recursive:true});
const base='http://127.0.0.1:4173/';
function issue(where,why){if(issues.length<140)issues.push(where+': '+why)}
const pageEvaluate=()=>{
 const head=document.querySelector('#top'),bar=document.querySelector('.refonte-utility');
 const nav=head.querySelector('.desktop-nav'),brand=head.querySelector('.brand-lockup');
 const label=head.querySelector('.brand-label'),name=head.querySelector('.brand-main'),place=head.querySelector('.brand-place');
 const actions=head.querySelector('.header-actions'),menu=head.querySelector('.menu-button');
 const panel=document.querySelector('.products-card'),chips=[...panel.querySelectorAll('.product-chips-v2>a.product-chip-link')];
 const rect=e=>{let r=e.getBoundingClientRect();return {x:r.x,right:r.right,y:r.y,bottom:r.bottom,w:r.width,h:r.height}};
 const shown=e=>{const s=getComputedStyle(e),r=e.getBoundingClientRect();return s.display!=='none'&&s.visibility!=='hidden'&&r.width>0&&r.height>0};
 const utilitySize=parseFloat(getComputedStyle(bar).fontSize),navSize=parseFloat(getComputedStyle(nav.querySelector('a')).fontSize);
 const navShown=shown(nav);
 const headerRect=rect(head),brandRect=rect(brand),actionsRect=rect(actions),nameRect=rect(name),labelRect=rect(label);
 let couldFit80=false;
 if(!navShown){
   const prev=head.style.getPropertyValue('--pop-header-nav-factor');
   head.classList.add('pop-nav-measuring');
   head.style.setProperty('--pop-header-nav-factor','0.8');
   const st=getComputedStyle(head);
   const pad=(parseFloat(st.paddingLeft)||0)+(parseFloat(st.paddingRight)||0);
   const gap=parseFloat(st.columnGap||st.gap)||6;
   const available=head.clientWidth-pad-brand.getBoundingClientRect().width-actions.getBoundingClientRect().width-2*gap-12;
   couldFit80=rect(nav).w<=available && available>0;
   head.style.setProperty('--pop-header-nav-factor',prev);
   head.classList.remove('pop-nav-measuring');
 }
 return {
   viewport:innerWidth,navShown,couldFit80,navSize,utilitySize,
   scale:document.documentElement.dataset.displayScale,
   navScale:getComputedStyle(head).getPropertyValue('--pop-header-nav-factor').trim(),
   headerRect,brandRect,actionsRect,nameRect,labelRect,
   menuShown:shown(menu),productShown:shown(panel),productRect:rect(panel),
   chips:chips.map(e=>({box:rect(e),text:e.querySelector('strong')?.textContent||''})),
   productLink:!!panel.querySelectorAll('a.product-chip-link[href="#first-visit"][data-guide-open="products"]').length===7,
   labels:['wifi','cowork','snacks'].map(key=>document.querySelector('[data-pop-r12="'+key+'"]')?.textContent||''),
   overflow:Math.max(document.documentElement.scrollWidth,document.body.scrollWidth)-innerWidth,
   headerOver:headerRect.right>innerWidth+2,
   nameOverlap:shown(label)&&nameRect.right>labelRect.right+3,
   wordmarkCollision:shown(label)&&rect(place).y<nameRect.bottom-1,
   wordmarkClipped:shown(label)&&(rect(place).right>labelRect.right+3||nameRect.right>labelRect.right+3),
   navOverlap:navShown&&rect(nav).right>actionsRect.x+2,
   navBrandOverlap:navShown&&rect(nav).x<brandRect.right-2
 };
};
for(const [engineName,engine] of Object.entries({chromium,firefox,webkit})){
 const browser=await engine.launch({headless:true});
 for(const [device,width,height] of profiles){
   const page=await browser.newPage({viewport:{width,height}});
   const name=engineName+'/'+device;
   page.on('pageerror',e=>issue(name,'JS error '+e.message));
   try{
     await page.goto(base,{waitUntil:'domcontentloaded'});
     await page.waitForFunction(()=>document.querySelector('#top')?.classList.contains('pop-nav-ready'),{timeout:8000});
     await page.evaluate(()=>document.fonts.ready);
     await page.waitForTimeout(120);
     const baseline=await page.evaluate(pageEvaluate);
     if(baseline.navShown&&baseline.menuShown)issue(name,'both full nav and Browse shown');
     if(!baseline.navShown&&!baseline.menuShown)issue(name,'no visible navigation');
     if(baseline.couldFit80)issue(name,'Browse shown despite full nav fitting at 80%');
     if(baseline.navOverlap||baseline.navBrandOverlap)issue(name,'full nav overlaps another header element');
     if(baseline.nameOverlap||baseline.wordmarkCollision||baseline.wordmarkClipped)issue(name,'POP’n WASH and WAVRE wordmark overlap or clip');
     if(baseline.headerOver||baseline.overflow>2)issue(name,'horizontal overflow '+baseline.overflow);
     if(!baseline.productShown||!baseline.productLink||baseline.chips.length!==7)issue(name,'product card/link/chips missing');
     for(const x of baseline.chips){
       if(x.box.x<baseline.productRect.x-3||x.box.right>baseline.productRect.right+3)
         issue(name,'product pill escapes its card: '+x.text);
     }
     if(baseline.labels.some(x=>!x))issue(name,'new labels missing');
     if(width>=1920&&Math.abs(baseline.utilitySize-19.2)>.2)
       issue(name,'utility 160% baseline lost: '+baseline.utilitySize);
     if(baseline.navShown&&(baseline.navSize<11.0||baseline.navSize>17.7))
       issue(name,'navigation font not inside 80–125% limits: '+baseline.navSize);
     // AAA changes the page, never header measurements.
     for(const scale of [80,150,200]){
       await page.evaluate(n=>{
         const r=document.getElementById('displaySizeRange');
         r.value=String(n);r.dispatchEvent(new Event('input',{bubbles:true}));
       },scale);
       await page.waitForTimeout(75);
       const cur=await page.evaluate(pageEvaluate);
       if(cur.navShown!==baseline.navShown||Math.abs(cur.navSize-baseline.navSize)>.25||
          Math.abs(cur.utilitySize-baseline.utilitySize)>.25)
         issue(name,'AAA changed locked header at '+scale+'%');
       if(cur.headerOver||cur.overflow>2||cur.nameOverlap||cur.navOverlap||cur.wordmarkCollision||cur.wordmarkClipped)
         issue(name,'overflow or overlap at AAA '+scale+'%');
       if(!cur.productShown||cur.chips.length!==7)issue(name,'products gone at AAA '+scale+'%');
     }
     if(!baseline.navShown){
       await page.locator('#menuButton').click();
       const pop=await page.locator('#mobileMenu').boundingBox();
       if(!pop||pop.width>442||pop.x<0||pop.x+pop.width>width+2)
         issue(name,'Browse dropdown overflows or becomes full screen '+JSON.stringify(pop));
       await page.locator('#menuButton').click();
     }
     if(engineName==='chromium'&&['mini','chromebook','macbook','fullHD','split'].includes(device)){
       await page.evaluate(()=>document.getElementById('displaySizeReset')?.click());
       await page.screenshot({path:'qa-r12/'+device+'-header.png'});
     }
     cases.push({engineName,device,width,height,baseline});
   }catch(e){issue(name,String(e).slice(0,380))}
   await page.close();
 }

 // R16: actual opening geometry in 11 languages, 80% and 200% AAA,
 // 4 compact formats, Chromium/Firefox/WebKit. The first item must be visible
 // immediately even after reopening a previously scrolled dropdown.
 const testPage=await browser.newPage({viewport:{width:820,height:900}});
 for(const [device,w,h] of [['mini',375,812],['split',820,900],['tablet',1024,768],['landscape',568,320]]){
   await testPage.setViewportSize({width:w,height:h});
   await testPage.goto(base,{waitUntil:'domcontentloaded'});
   await testPage.waitForFunction(()=>document.querySelector('#top')?.classList.contains('pop-nav-ready'));
   for(const lang of ['fr','nl','en','de','it','es','pt','ro','pl','uk','ru']){
     for(const scale of [80,200]){
       const key=engineName+'/'+device+'/'+lang+'/'+scale+'/dropdown';
       await testPage.evaluate(({lang,scale})=>{
         document.querySelector('[data-lang="'+lang+'"]').click();
         const r=document.getElementById('displaySizeRange');r.value=String(scale);
         r.dispatchEvent(new Event('input',{bubbles:true}));
       },{lang,scale});
       await testPage.waitForTimeout(180);
       if(!await testPage.locator('#menuButton').isVisible()){
         if(w<=820)issue(key,'Browse button missing');
         continue;
       }
       const opened=await testPage.evaluate(()=>{
         const btn=document.getElementById('menuButton');
         if(getComputedStyle(btn).display==='none')return false;
         btn.click();
         return !document.getElementById('mobileMenu').hidden;
       });
       if(!opened){issue(key,'Browse did not open on compact header');continue;}
       const state=await testPage.evaluate(()=>{
         const menu=document.getElementById('mobileMenu');
         const links=[...menu.querySelectorAll('a[href]')];
         const panel=menu.getBoundingClientRect();
         const first=links[0]?.getBoundingClientRect();
         const anchor=document.getElementById('menuButton').getBoundingClientRect();
         const header=document.getElementById('top').getBoundingClientRect();
         const topLinkBefore=menu.scrollTop;
         menu.scrollTop=menu.scrollHeight;
         const last=links.at(-1)?.getBoundingClientRect();
         return {
           menuTop:panel.top,menuBottom:panel.bottom,
           menuLeft:panel.left,menuRight:panel.right,
           firstTop:first?.top,firstBottom:first?.bottom,
           headerBottom:header.bottom,anchorBottom:anchor.bottom,
           viewportHeight:innerHeight,viewportWidth:innerWidth,
           links:links.length,firstHref:links[0]?.getAttribute('href'),
           lastHref:links.at(-1)?.getAttribute('href'),
           lastTop:last?.top,lastBottom:last?.bottom,
           scrollBefore:topLinkBefore,
           scrollAfter:menu.scrollTop,
           maxScroll:menu.scrollHeight-menu.clientHeight
         };
       });
       if(state.links!==8||state.firstHref!=='#machines'||state.lastHref!=='#contact')
         issue(key,'menu link list incomplete: '+JSON.stringify(state));
       if(state.menuTop<Math.max(state.headerBottom,state.anchorBottom)+4||
          state.firstTop<state.menuTop+4||state.firstBottom>Math.min(state.menuBottom,state.viewportHeight)+2)
         issue(key,'first Tarifs link hidden behind header: '+JSON.stringify(state));
       if(state.scrollBefore>2)issue(key,'menu reopened partway down at '+state.scrollBefore);
       if(state.menuLeft< -1||state.menuRight>state.viewportWidth+2||
          state.menuBottom>state.viewportHeight+2)
         issue(key,'menu escapes viewport: '+JSON.stringify(state));
       if(state.lastBottom>Math.min(state.menuBottom,state.viewportHeight)+3)
         issue(key,'Contact not reachable after scroll: '+JSON.stringify(state));
       if(engineName==='chromium'&&lang==='fr'&&scale===80){
         await testPage.screenshot({path:'qa-r12/menu-'+device+'.png'});
       }
       await testPage.evaluate(()=>document.getElementById('menuButton').click());
     }
   }
 }
 await testPage.close();
 await browser.close();
}
// Translation switch, actual product link, first-visit hover, light + dark checks.
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1440,height:900}});
await page.goto(base,{waitUntil:'domcontentloaded'});
for(const lang of ['fr','nl','en','de','it','es','pt','ro','pl','uk','ru']){
 try{
  await page.evaluate(lang=>document.querySelector('[data-lang="'+lang+'"]').click(),lang);
  await page.waitForTimeout(90);
  const state=await page.evaluate(pageEvaluate);
  if(state.labels.some(x=>!x))issue('translation '+lang,'missing label');
  if(state.overflow>2||state.navOverlap)issue('translation '+lang,'header overflow');
 }catch(e){issue('translation '+lang,String(e).slice(0,220))}
}
await page.evaluate(()=>document.querySelector('[data-lang="fr"]').click());
await page.locator('.product-chip-link').first().click();
if(!(await page.locator('[data-guide-panel="products"]').evaluate(el=>el.open)))
 issue('products','CTA did not open Products first-visit instructions');
await page.locator('.visit-washer summary').hover();
await page.waitForTimeout(390);
const bubble=await page.locator('.visit-washer .visit-icon').evaluate(el=>parseFloat(getComputedStyle(el,'::before').opacity));
if(!(bubble>0.7))issue('first visit','hover bubble not visible: '+bubble);
for(const mode of ['light','dark']){
 await page.locator('[data-theme-choice="'+mode+'"]').click();
 await page.screenshot({path:'qa-r12/visit-'+mode+'.png'});
}
await browser.close();
fs.writeFileSync('qa-r12/report.json',JSON.stringify({cases:cases.length,issues,details:cases},null,2));
console.log('R12 QA '+JSON.stringify({cases:cases.length,errors:issues.length,firstIssues:issues.slice(0,35)}));
if(issues.length)process.exit(1);
