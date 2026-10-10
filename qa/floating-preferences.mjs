import { chromium, firefox, webkit } from 'playwright';
import fs from 'node:fs';
const errors=[],shots=[],formats=[
  ['iphone13mini',375,812],
  ['smallAndroid',320,640],
  ['tablet',820,1180],
  ['laptop',1366,768],
  ['wide',1920,1080]
];
for(const [engineName,engine] of Object.entries({chromium,firefox,webkit})){
 const browser=await engine.launch({headless:true});
 for(const [screen,w,h] of formats){
  const page=await browser.newPage({viewport:{width:w,height:h},colorScheme:'light'});
  const id=engineName+'/'+screen;
  page.on('pageerror',e=>errors.push(id+' JS '+e.message));
  await page.goto('http://127.0.0.1:4173/',{waitUntil:'domcontentloaded'});
  const top=await page.evaluate(()=>{
   const dock=document.getElementById('popFloatingPreferences');
   const header=document.getElementById('top');
   return {hidden:dock?.hidden,header:getComputedStyle(header).visibility,headParent:header?.querySelector('.header-actions')!==null}
  });
  if(!top.hidden||top.header==='hidden'||!top.headParent)errors.push(id+' initial header/dock mismatch '+JSON.stringify(top));
  await page.evaluate(()=>window.scrollTo({top:850,behavior:'instant'}));
  await page.waitForFunction(()=>window.scrollY>300&&document.getElementById('popFloatingPreferences')?.hidden===false,{timeout:6000});
  await page.waitForTimeout(60);
  let floating=await page.evaluate(()=>{
   const dock=document.getElementById('popFloatingPreferences'),bounds=dock?.getBoundingClientRect(),header=document.getElementById('top');
   const theme=document.getElementById('themeControl');
   const sv=getComputedStyle(document.getElementById('themeLightText'));
   return {hidden:dock?.hidden,header:getComputedStyle(header).visibility,
    childCount:dock?.querySelector('.header-actions')?.children.length,
    parent:document.querySelector('.header-actions')?.parentElement?.id,
    x:bounds?.x,y:bounds?.y,right:bounds?.right,
    w:bounds?.width,
    iconsOnly:sv.display==='none',
    themeControls:document.querySelectorAll('#themeControl').length,
    aaaControls:document.querySelectorAll('#displaySizeButton').length,
    langControls:document.querySelectorAll('#langButton').length,
    menuButton:getComputedStyle(document.getElementById('menuButton')).display,
    horizontalOverflow:document.documentElement.scrollWidth>document.documentElement.clientWidth+2
   };
  });
  if(floating.hidden||floating.header!=='hidden'||floating.parent!=='popFloatingPreferences'||!floating.iconsOnly
   ||floating.menuButton!=='none'||floating.childCount!==4||floating.themeControls!==1||floating.aaaControls!==1||floating.langControls!==1
   ||floating.right>w+1||floating.y>25||floating.x<0||floating.horizontalOverflow)
    errors.push(id+' floating geometry '+JSON.stringify(floating));
  const basename='qa-floating/'+engineName+'-'+screen;
  fs.mkdirSync('qa-floating',{recursive:true});
  await page.screenshot({path:basename+'-floating.png',fullPage:false});
  shots.push(basename+'-floating.png');
  try{
    await page.locator('#popFloatingPreferences [data-theme-choice="dark"]').click({timeout:4500});
    await page.waitForTimeout(60);
    const theme=await page.evaluate(()=>document.documentElement.dataset.theme);
    if(theme!=='dark')errors.push(id+' clicking moon did not select dark');
    await page.locator('#popFloatingPreferences #langButton').click({timeout:4500});
    const menuVisible=await page.locator('#langMenu').isVisible();
    if(!menuVisible)errors.push(id+' language popup not visible');
    await page.locator('#langMenu button[data-lang="de"]').click({timeout:4500});
    if((await page.evaluate(()=>document.documentElement.lang))!=='de')errors.push(id+' German language not applied');
    await page.locator('#popFloatingPreferences #displaySizeButton').click({timeout:4500});
    if(!(await page.locator('#displaySizePanel').isVisible()))errors.push(id+' AAA panel not visible');
    await page.locator('#displaySizeRange').evaluate(el=>{
      el.value='130';el.dispatchEvent(new Event('input',{bubbles:true}))
    });
    await page.waitForTimeout(160);
    const scale=await page.evaluate(()=>{
      const dock=document.getElementById('popFloatingPreferences').getBoundingClientRect();
      const panel=document.getElementById('displaySizePanel').getBoundingClientRect();
      return {zoom:document.documentElement.dataset.displayScale,lang:document.documentElement.lang,
       dockRight:dock.right,visible:!document.getElementById('displaySizePanel').hidden,
       panelBounds:{left:panel.left,right:panel.right,top:panel.top,bottom:panel.bottom},
       scrollW:document.documentElement.scrollWidth,clientW:document.documentElement.clientWidth};
    });
    if(scale.zoom!=='130'||!scale.visible||scale.dockRight>w+1
       ||scale.panelBounds.left<0||scale.panelBounds.right>w+1||scale.scrollW>scale.clientW+2)
      errors.push(id+' AAA/130 interaction '+JSON.stringify(scale));
    await page.locator('#popFloatingPreferences #displaySizeButton').click({timeout:4500});
    await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));
    await page.waitForFunction(()=>window.scrollY<20&&document.getElementById('popFloatingPreferences')?.hidden===true,{timeout:6000});
    await page.waitForTimeout(60);
    const reset=await page.evaluate(()=>({
      hidden:document.getElementById('popFloatingPreferences').hidden,
      original:document.getElementById('top').contains(document.querySelector('.header-actions')),
      visibility:getComputedStyle(document.getElementById('top')).visibility,
      lang:document.documentElement.lang,
      zoom:document.documentElement.dataset.displayScale,
      theme:document.documentElement.dataset.theme
    }));
    if(!reset.hidden||!reset.original||reset.visibility==='hidden'||reset.lang!=='de'||reset.zoom!=='130'||reset.theme!=='dark')
      errors.push(id+' header restoration/state '+JSON.stringify(reset));
    await page.evaluate(()=>window.scrollTo({top:650,behavior:'instant'}));
    await page.waitForFunction(()=>window.scrollY>250&&document.getElementById('popFloatingPreferences')?.hidden===false,{timeout:6000});
    await page.waitForTimeout(60);
    if(await page.locator('#popFloatingPreferences').isHidden())errors.push(id+' floating did not reappear on downward scroll');
  }catch(e){errors.push(id+' interaction '+e.message.substring(0,550))}
  await page.close();
 }
 await browser.close();
}
fs.mkdirSync('qa-floating',{recursive:true});
fs.writeFileSync('qa-floating/report.json',JSON.stringify({scenarios:formats.length*3,errors,shots},null,2));
console.log('QA-FLOATING '+JSON.stringify({scenarios:formats.length*3,failCount:errors.length,firstFailures:errors.slice(0,40),screenshots:shots.length}));
if(errors.length)process.exit(1);
