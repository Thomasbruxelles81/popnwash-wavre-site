import {chromium,firefox,webkit} from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const engine=process.env.AUDIT_BROWSER||'chromium';
const engines={chromium,chrome:chromium,msedge:chromium,brave:chromium,firefox,webkit};
const cfg={headless:true};
if(engine==='chrome')cfg.channel='chrome';
if(engine==='msedge')cfg.channel='msedge';
if(engine==='brave'){cfg.executablePath='/usr/bin/brave-browser';cfg.args=['--no-sandbox'];}
const browser=await engines[engine].launch(cfg);
const folder='qa-expanded/'+engine;
fs.mkdirSync(folder,{recursive:true});
const sizes=[80,90,100,110,120,130,140,150];
const locales=['fr','nl','en','de','it','es','pt','ro','pl','uk','ru'];
const devices=[
['iphoneSE',320,568],['smallAndroid',344,750],['android360',360,780],
['iphone8',375,667],['iphone13mini',375,812],['iphone15',393,852],
['iphone16',402,874],['pixel7',412,915],['iphoneProMax',430,932],
['android480',480,854],['landscapeSE',568,320],['landscape8',667,375],
['landscapeMini',812,375],['landscapeProMax',932,430],
['foldedFold',600,720],['ipadMini',744,1133],['tablet768',768,1024],
['androidTablet',800,1280],['ipadAir',820,1180],['ipadPro11',834,1194],
['androidTabLandscape',1280,800],['ipadMiniLandscape',1133,744],
['ipadProLandscape',1194,834],['tablet1024',1024,768],
['chromebook1366',1366,768],['chromebook1280',1280,800],
['macbook13',1440,900],['laptop1536',1536,864],['laptop1600',1600,900],
['desktopFHD',1920,1080],['retina2560',2560,1440],['retina2880',2880,1800],
['ultrawide3440',3440,1440],['fourK',3840,2160]];
const full=new Set(['iphoneSE','iphone13mini','iphoneProMax','landscapeMini',
'ipadMini','tablet768','ipadPro11','ipadProLandscape','chromebook1366',
'macbook13','desktopFHD','ultrawide3440','fourK']);
const pictures=new Set(['iphoneSE','iphone13mini','landscapeMini','ipadMini',
'ipadProLandscape','chromebook1366','desktopFHD','ultrawide3440','fourK']);
const report={engine,version:browser.version(),date:new Date().toISOString(),
cases:0,fullCases:0,sampledCases:0,devices,errors:[],warnings:[],screenshots:[]};
const failed=new Set();
function bad(where,message){const key=where+': '+message;
 if(!failed.has(key)){failed.add(key);if(report.errors.length<200)report.errors.push(key);}}
function warning(where,message){if(report.warnings.length<90)report.warnings.push(where+': '+message);}
const base='http://127.0.0.1:4173/';
const page=await browser.newPage({viewport:{width:375,height:812},deviceScaleFactor:2,
hasTouch:true,isMobile:engine==='webkit'||engine==='chromium'||engine==='chrome'});
const jsErrors=[];
page.on('pageerror',e=>{if(jsErrors.length<15)jsErrors.push(e.message);});
await page.goto(base,{waitUntil:'domcontentloaded'});
await page.evaluate(()=>document.fonts.ready);
const refs=await page.evaluate(()=>({
 missing:[...document.querySelectorAll('a[href^="#"]')].map(a=>a.getAttribute('href')).filter(h=>!document.getElementById(h.slice(1))),
 src:[...document.querySelectorAll('link[rel="stylesheet"][href],script[src],img[src]')].map(a=>a.getAttribute('src')||a.getAttribute('href'))
}));
for(const h of refs.missing)bad('links','broken internal anchor '+h);
for(const src of [...new Set(refs.src)]){
 if(!src||src.startsWith('data:')||/^https?:/.test(src))continue;
 try{const r=await page.request.get(base+src.replace(/^\/+/,''));if(!r.ok())bad('assets','missing '+src+' HTTP '+r.status());}
 catch(e){bad('assets',src+' '+String(e).slice(0,70));}
}
function stateChecks({lang,size,theme,width,height,deep}){
 const root=document.documentElement;
 document.querySelector('[data-lang="'+lang+'"]').click();
 document.querySelector('[data-display-size="'+size+'"]').click();
 document.querySelector('[data-theme-choice="'+theme+'"]').click();
 const rect=e=>{const r=e.getBoundingClientRect();return {x:r.left,right:r.right,top:r.top,bottom:r.bottom,w:r.width,h:r.height};};
 const sel=s=>document.querySelector(s);
 const vis=e=>{const c=getComputedStyle(e),r=e.getBoundingClientRect();return c.display!=='none'&&c.visibility!=='hidden'&&r.width>0&&r.height>0;};
 const header=rect(sel('.site-header')),brand=rect(sel('.brand-title')),label=rect(sel('.brand-label')),
 button=rect(sel('#displaySizeButton')),shell=rect(sel('.theme-slider-shell')),knob=rect(sel('.theme-knob'));
 const quick=[...document.querySelectorAll('.mobile-quick-link')].filter(vis).map(rect);
 const hero=rect(sel('.hero-copy h1')),first=rect(sel('.first-visit-showcase')),photo=rect(sel('.hero-photo-stack'));
 const mobile=width<=700||(width<=1000&&width>height&&height<=550);
 const errs=[],smallFonts=[];
 const scroll=Math.max(root.scrollWidth,document.body.scrollWidth);
 if(scroll>width+2)errs.push('page overflows '+(scroll-width)+'px');
 if(root.lang!==lang||root.dataset.displayScale!==String(size)||root.dataset.theme!==theme)errs.push('state incorrect');
 if(brand.right>label.right+3)errs.push('brand cropped');
 if(brand.right>button.x-2)errs.push('brand overlaps AAA');
 if(button.x<0||button.right>width+2)errs.push('AAA outside screen');
 if(header.w>width+2)errs.push('header width exceeds screen');
 const middle=(shell.x+shell.right)/2,knobMiddle=(knob.x+knob.right)/2;
 if(theme==='dark'&&knobMiddle<=middle+1)errs.push('dark knob stuck left');
 if(theme==='light'&&knobMiddle>=middle-1)errs.push('light knob stuck right');
 if(mobile){
  if(quick.length!==3)errs.push('quick buttons not all visible');
  if(quick.some(q=>q.x<0||q.right>width+2||q.h<38))errs.push('quick buttons inaccessible');
  if(quick[0]&&quick[0].top<header.bottom-3)errs.push('quick buttons over header');
  if(quick[0]&&quick[0].top>hero.top+3)errs.push('quick buttons after hero');
  if(first.top<hero.top-2)errs.push('First Visit before heading');
  if(photo.top<hero.top-2)errs.push('photo before heading');
  const bar=sel('.mobile-actionbar');
  if(bar&&vis(bar))errs.push('obsolete bottom actions visible');
  if(!vis(sel('.hero-mobile-sub')))errs.push('mobile short intro missing');
 }
 if([...document.querySelectorAll('.hero-photo')].some(e=>!e.naturalWidth))errs.push('hero photo not loaded');
 if(deep){
  const textTargets=[...document.querySelectorAll('h1,h2,h3,h4,.visit-summary-copy strong,.tariff-copy strong')].filter(vis);
  for(const el of textTargets){
   const walker=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);
   for(let node=walker.nextNode();node;node=walker.nextNode()){
    for(const match of node.textContent.matchAll(/[\p{L}\p{N}][\p{L}\p{N}’'‑-]{4,}/gu)){
     const range=document.createRange();range.setStart(node,match.index);range.setEnd(node,match.index+match[0].length);
     if(range.getClientRects().length>1&&errs.length<10)errs.push('word split '+match[0]);
    }
   }
  }
  for(const e of [...document.querySelectorAll('p,small,strong,button,a')].filter(vis)){
    if(e.closest('.brand-lockup'))continue;
    const text=(e.innerText||'').trim(),style=getComputedStyle(e);
    if(text.length>=12&&parseFloat(style.fontSize)<10.5&&smallFonts.length<3)
       smallFonts.push(text.slice(0,24)+' '+style.fontSize);
    if((style.overflowX==='hidden'||style.overflowX==='clip')&&e.scrollWidth>e.clientWidth+3&&errs.length<10)
       errs.push('text clipped '+text.slice(0,22));
  }
 }
 return {errors:errs.slice(0,12),smallFonts};
}
for(const [name,width,height] of devices){
 await page.setViewportSize({width,height});
 await page.goto(base,{waitUntil:'domcontentloaded'});
 await page.evaluate(()=>document.fonts.ready);
 const detailed=full.has(name);
 const langs=detailed?locales:['fr','nl','de','uk'];
 const levels=detailed?sizes:[80,110,150];
 for(const lang of langs)for(const size of levels)for(const theme of ['light','dark']){
  const id=engine+'/'+name+'/'+width+'x'+height+'/'+lang+'/'+size+'/'+theme;
  try{
   const r=await page.evaluate(stateChecks,{lang,size,theme,width,height,deep:size===80||size===110||size===150});
   report.cases++;if(detailed)report.fullCases++;else report.sampledCases++;
   for(const e of r.errors)bad(id,e);
   for(const f of r.smallFonts)warning(id,'font under 10.5px '+f);
  }catch(e){bad(id,'JS evaluator '+String(e).slice(0,100));}
 }
 if(pictures.has(name)){
  for(const [size,lang,theme] of [[110,'fr','light'],[150,'de','dark'],[80,'nl','light']]){
   await page.evaluate(stateChecks,{lang,size,theme,width,height,deep:false});
   await page.waitForTimeout(280);
   const filename=path.join(folder,name+'-'+size+'-'+lang+'-'+theme+'.png');
   await page.screenshot({path:filename,fullPage:false});
   report.screenshots.push(filename);
  }
 }
 if(report.errors.length>=160)break;
}
for(const e of jsErrors)bad(engine,'JS '+e);
fs.writeFileSync(path.join(folder,'report.json'),JSON.stringify(report,null,2));
console.log('AUDIT-RESULT '+JSON.stringify({engine,checks:report.cases,full:report.fullCases,
sampled:report.sampledCases,failCount:report.errors.length,errors:report.errors.slice(0,55),
warnings:report.warnings.slice(0,12),screenshots:report.screenshots.length}));
await browser.close();
if(report.errors.length)process.exit(1);