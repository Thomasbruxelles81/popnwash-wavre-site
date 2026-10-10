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

  /* Real pointer interaction regression from customer screenshot:
     moving the AAA slider at 130% must NOT move its dialog beneath the cursor. */
  await page.evaluate(()=>{
    document.querySelector('[data-lang="fr"]').click();
    document.querySelector('[data-theme-choice="light"]').click();
    let slider=document.getElementById('displaySizeRange');
    slider.value='110';
    slider.dispatchEvent(new Event('input',{bubbles:true}));
  });
  await page.locator('#displaySizeButton').click();
  const popup=page.locator('#displaySizePanel');
  const slider=page.locator('#displaySizeRange');
  if(!await popup.isVisible())errors.push(engineName+'/'+format+' AAA panel not visible after opening');
  const initial=await popup.boundingBox();
  const sliderPos=await slider.boundingBox();
  if(!initial||!sliderPos)errors.push(engineName+'/'+format+' AAA panel or slider has no bounding box');
  else{
    if(initial.x<0||initial.y<0||initial.x+initial.width>w+2||initial.y+initial.height>h+2)
      errors.push(engineName+'/'+format+' AAA panel extends beyond viewport '+JSON.stringify(initial));
    // Using real pointer movement rather than setting the value programmatically.
    await page.mouse.move(sliderPos.x+sliderPos.width*.25,sliderPos.y+sliderPos.height/2);
    await page.mouse.down();
    await page.mouse.move(sliderPos.x+sliderPos.width*.45,sliderPos.y+sliderPos.height/2,{steps:6});
    await page.mouse.up();
    const after130=Number(await page.locator('html').getAttribute('data-display-scale'));
    const popup130=await popup.boundingBox();
    if(!popup130||Math.abs(popup130.y-initial.y)>3)
      errors.push(engineName+'/'+format+' AAA popup jumped after 130% drag '+JSON.stringify({initial,popup130}));
    // The thumb must remain accessible after the first layout reflow.
    const slider130=await slider.boundingBox();
    if(slider130){
      await page.mouse.move(slider130.x+slider130.width*.46,slider130.y+slider130.height/2);
      await page.mouse.down();
      await page.mouse.move(slider130.x+slider130.width*.75,slider130.y+slider130.height/2,{steps:6});
      await page.mouse.up();
    }
    const afterContinue=Number(await page.locator('html').getAttribute('data-display-scale'));
    if(afterContinue<=after130)
      errors.push(engineName+'/'+format+' AAA slider cannot increase after reflow '+JSON.stringify({after130,afterContinue}));
    if(!await popup.isVisible())
      errors.push(engineName+'/'+format+' AAA popup closed while dragging');
  }
  await page.keyboard.press('Escape');
  const layout=await page.evaluate(()=>{
    let vending=document.querySelector('.refonte-tariff-product');
    let box=vending?.getBoundingClientRect();
    let textPieces=vending?[...vending.querySelectorAll('.tariff-copy strong,.tariff-copy small,.tariff-price b,.tariff-price span')]:[];
    const clipped=textPieces.filter(n=>n.scrollWidth>n.clientWidth+3||n.getBoundingClientRect().right>box.right+3).map(n=>n.textContent?.trim());
    const submit=document.querySelector('.contact-form-card .form-submit');
    const form=submit?.closest('form')?.getBoundingClientRect();
    const submitRect=submit?.getBoundingClientRect();
    const social=[...document.querySelectorAll('.social-link.facebook,.social-link.instagram')].map(x=>({name:x.className,bg:getComputedStyle(x).backgroundColor,gradient:getComputedStyle(x).backgroundImage}));
    return {vendingWidth:box?.width,clipped,formCenterOffset:form&&submitRect?Math.abs((form.left+form.right)/2-(submitRect.left+submitRect.right)/2):null,social};
  });
  if(layout.vendingWidth!=null&&layout.vendingWidth<Math.min(196,w-32))
    errors.push(engineName+'/'+format+' vending card remains too narrow '+layout.vendingWidth);
  if(layout.clipped.length)
    errors.push(engineName+'/'+format+' vending card clipped text '+JSON.stringify(layout.clipped));
  if(layout.formCenterOffset!=null&&layout.formCenterOffset>5)
    errors.push(engineName+'/'+format+' submit not centered '+layout.formCenterOffset);
  if(layout.social.some(x=>/24,\s*119,\s*242|131,\s*58,\s*180|253,\s*29,\s*29/.test(x.bg+' '+x.gradient)))
    errors.push(engineName+'/'+format+' social colors are not POPn WASH brand '+JSON.stringify(layout.social));
  await page.close();
 }
 await browser.close();
}
fs.mkdirSync('qa-v7',{recursive:true});
fs.writeFileSync('qa-v7/report.json',JSON.stringify({total:summaries.length,errors,summary:summaries,screenshots},null,2));
console.log('QA-V7 '+JSON.stringify({cases:summaries.length,failCount:errors.length,firstFailures:errors.slice(0,40),screenshots:screenshots.length}));
if(errors.length)process.exit(1);
