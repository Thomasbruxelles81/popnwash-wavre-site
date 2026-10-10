import { chromium, firefox, webkit } from 'playwright';
import fs from 'node:fs';
const errors=[], screenshots=[], summaries=[];
const locales=['fr','nl','en','de','it','es','pt','ro','pl','uk','ru'];
const formats=[['iphone-mini',375,812],['phone-small',320,568],['tablet-landscape',1024,768],['desktop',1440,900]];
const zoom=[80,110,150,200], schemes=['light','dark'];
const files=['index.html','refonte-global.js','premium-popwash-v6.css','premium-popwash-v6.js'];
for(const path of files)if(!fs.existsSync(path))errors.push('missing required file '+path);
const translation=fs.readFileSync('refonte-global.js','utf8');
if((translation.match(/\b70\b/g)||[]).length!==11)errors.push('loyalty code 70 must appear in all 11 locale instructions');
if(/\b77\b/.test(translation))errors.push('obsolete loyalty card code 77 remains in instructions');
for(const [engineName,engine] of Object.entries({chromium,firefox,webkit})){
 const browser=await engine.launch({headless:true});
 for(const [format,w,h] of formats){
  const page=await browser.newPage({viewport:{width:w,height:h},colorScheme:'light'});
  const pageErrors=[];
  page.on('pageerror',e=>pageErrors.push(e.message));
  await page.goto('http://127.0.0.1:4173/',{waitUntil:'domcontentloaded'});
  for(const lang of locales)for(const size of zoom)for(const scheme of schemes){
    const mark=engineName+'/'+format+'/'+lang+'/'+size+'/'+scheme;
    const result=await page.evaluate(({lang,size,scheme})=>{
      document.querySelector('[data-lang="'+lang+'"]').click();
      const aaa=document.getElementById('displaySizeRange');
      aaa.value=String(size);
      aaa.dispatchEvent(new Event('input',{bubbles:true}));
      document.querySelector('[data-theme-choice="'+scheme+'"]').click();
      return document.documentElement.lang;
    },{lang,size,scheme});
    if(result!==lang)errors.push(mark+' wrong language '+result);
    await page.waitForTimeout(35);
    const state=await page.evaluate(()=>{
      const ctl=document.getElementById('themeControl');
      const shell=ctl.querySelector('.theme-slider-shell');
      const halves=[...ctl.querySelectorAll('.theme-option-label')];
      const shellBox=shell.getBoundingClientRect();
      const compact=ctl.hasAttribute('data-compact-labels');
      const labels=halves.map((half,i)=>{
        const span=half.querySelector('span'),svg=half.querySelector('svg');
        const rect=half.getBoundingClientRect();
        const textRect=span.getBoundingClientRect();
        const textStyle=getComputedStyle(span);
        return {hidden:textStyle.display==='none',text:span.textContent,svgVisible:svg.getBoundingClientRect().width>=12,
          overflows:!compact&&textStyle.display!=='none'&&(textRect.left<rect.left-2||textRect.right>rect.right+2)};
      });
      const root=document.documentElement;
      const faqItems=[...document.querySelectorAll('.faq-item')];
      const faqLabels=faqItems.map(item=>{
        const span=item.querySelector('summary>span');
        if(!span)return null;
        const label=(span.textContent||'').trim();
        const rect=span.getBoundingClientRect();
        const sr=item.querySelector('summary').getBoundingClientRect();
        const style=getComputedStyle(span);
        const clipped=style.whiteSpace==='nowrap'&&span.scrollWidth>span.clientWidth+2;
        return {label,clipped,bounds:rect.right>sr.right+2};
      }).filter(Boolean);
      const code=faqLabels.find(x=>/après paiement|after payment|na płatności/i.test(x.label));
      const parcels=document.querySelector('[data-faq="parcels"] summary span')?.textContent||'';
      return {scroll:root.scrollWidth-root.clientWidth,theme:root.dataset.theme,
        labels,compact,mode:ctl.dataset.mode,faqClipped:faqLabels.filter(x=>x.clipped||x.bounds).slice(0,4),
        hasCorrectFrench:root.lang!=='fr'||(parcels.includes('bpost')&&/code après paiement/.test(code?.label||'')),
        debugFAQ:{parcels,codeLabel:code?.label,lang:root.lang},
        controlVisible:ctl.getBoundingClientRect().width>1&&getComputedStyle(ctl).display!=='none',
        shell:shellBox.width};
    });
    if(state.scroll>2)errors.push(mark+' horizontal overflow '+state.scroll);
    if(state.theme!==scheme||state.mode!==scheme)errors.push(mark+' theme state incorrect '+state.mode+'/'+state.theme);
    if(state.labels.some(x=>x.overflows))errors.push(mark+' truncated theme label '+JSON.stringify(state.labels));
    if(state.compact&&state.controlVisible&&state.labels.some(x=>!x.hidden||!x.svgVisible))errors.push(mark+' compact theme not icon-only '+JSON.stringify(state.labels));
    if(state.faqClipped.length)errors.push(mark+' clipped FAQ '+JSON.stringify(state.faqClipped));
    if(!state.hasCorrectFrench)errors.push(mark+' French FAQ heading or bpost not corrected '+JSON.stringify(state.debugFAQ));
    if(pageErrors.length)errors.push(mark+' JS '+pageErrors.splice(0,2).join('|'));
    if(['fr','de','ru'].includes(lang)&&[110,200].includes(size)&&['iphone-mini','desktop'].includes(format)&&scheme==='dark'){
     const dir='qa-v7';fs.mkdirSync(dir,{recursive:true});
     const file=dir+'/'+engineName+'-'+format+'-'+lang+'-'+size+'.png';
     await page.screenshot({path:file,fullPage:false});screenshots.push(file);
    }
    summaries.push({engine:engineName,format,lang,size,scheme,compact:state.compact});
  }
  await page.close();
 }
 await browser.close();
}
fs.mkdirSync('qa-v7',{recursive:true});
fs.writeFileSync('qa-v7/report.json',JSON.stringify({total:summaries.length,errors,summary:summaries,screenshots},null,2));
console.log('QA-V7 '+JSON.stringify({cases:summaries.length,failCount:errors.length,firstFailures:errors.slice(0,40),screenshots:screenshots.length}));
if(errors.length)process.exit(1);
