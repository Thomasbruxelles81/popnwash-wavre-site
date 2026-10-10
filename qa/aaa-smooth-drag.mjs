import { chromium, firefox, webkit } from 'playwright';
import fs from 'node:fs';
const failures=[],cases=[];
const sizes=[['iphone-mini',375,812],['tablet',820,1180],['desktop',1440,900]];
for(const [name,engine] of Object.entries({chromium,firefox,webkit})){
 const browser=await engine.launch({headless:true});
 for(const [format,width,height] of sizes){
  for(const mode of ['header','floating']){
   const page=await browser.newPage({viewport:{width,height},colorScheme:'light'});
   const prefix=name+'/'+format+'/'+mode;
   page.on('pageerror',e=>failures.push(prefix+' pageerror '+e.message));
   try{
    await page.goto('http://127.0.0.1:4173/',{waitUntil:'domcontentloaded'});
    await page.evaluate(()=>{
      localStorage.setItem('popnwash-display-size','110');
      document.getElementById('displaySizeReset')?.click();
    });
    if(mode==='floating'){
      await page.evaluate(()=>window.scrollTo({top:700,behavior:'instant'}));
      await page.waitForFunction(()=>!document.getElementById('popFloatingPreferences')?.hidden);
    }
    await page.locator('#displaySizeButton').click();
    await page.locator('#displaySizeRange').waitFor({state:'visible'});
    const slider=page.locator('#displaySizeRange');
    const box=await slider.boundingBox();
    const panel=await page.locator('#displaySizePanel').boundingBox();
    if(!box||!panel)throw Error('range or dialog missing');
    const y=box.y+box.height/2;
    // A physical mouse drag through 120,130,...,190,200. Repeated readings
    // make pointer drift and jumping dialog observable across browsers.
    await page.mouse.move(box.x+13,y);
    await page.mouse.down();
    const readings=[];
    for(let i=0;i<=20;i++){
      const x=box.x+13+(box.width-26)*i/20;
      await page.mouse.move(x,y,{steps:1});
      const current=await page.evaluate(()=>{
        const r=document.getElementById('displaySizeRange').getBoundingClientRect();
        const p=document.getElementById('displaySizePanel').getBoundingClientRect();
        return {level:Number(document.documentElement.dataset.displayScale),
          rect:{x:r.x,y:r.y,w:r.width,h:r.height},
          panel:{x:p.x,y:p.y,w:p.width,h:p.height},
          active:document.body.classList.contains('pop-aaa-dragging'),
          visible:!document.getElementById('displaySizePanel').hidden};
      });
      readings.push(current);
    }
    await page.mouse.up();
    await page.waitForTimeout(140);
    const tol=1.4;
    for(const [i,r] of readings.entries()){
      const dx=Math.abs(r.rect.x-box.x),dy=Math.abs(r.rect.y-box.y),
            dw=Math.abs(r.rect.w-box.width),dh=Math.abs(r.rect.h-box.height);
      if(dx>tol||dy>tol||dw>tol||dh>tol)
        failures.push(prefix+' range moved while held step '+i+' '+JSON.stringify({dx,dy,dw,dh,level:r.level}));
      const pdx=Math.abs(r.panel.x-panel.x),pdy=Math.abs(r.panel.y-panel.y);
      if(pdx>tol||pdy>tol)
        failures.push(prefix+' panel jumped step '+i+' '+JSON.stringify({pdx,pdy,level:r.level}));
      if(!r.active||!r.visible)
        failures.push(prefix+' drag lost / dialog closed at '+i);
      if(i&&r.level<readings[i-1].level)
        failures.push(prefix+' AAA reversed during forward drag '+i);
    }
    const final=await page.evaluate(()=>({
      level:Number(document.documentElement.dataset.displayScale),
      saved:Number(localStorage.getItem('popnwash-display-size')),
      dragging:document.body.classList.contains('pop-aaa-dragging')
    }));
    if(final.level<190||final.saved!==final.level||final.dragging)
      failures.push(prefix+' final scale not persisted '+JSON.stringify(final));
    cases.push({name,format,mode,levels:[...new Set(readings.map(x=>x.level))],final,rangeDrift:Math.max(...readings.map(x=>Math.abs(x.rect.y-box.y)))});
    fs.mkdirSync('qa-aaa-drag',{recursive:true});
    await page.screenshot({path:'qa-aaa-drag/'+name+'-'+format+'-'+mode+'.png'});
   }catch(e){failures.push(prefix+' error '+String(e).slice(0,380))}
   await page.close();
  }
 }
 await browser.close();
}
fs.mkdirSync('qa-aaa-drag',{recursive:true});
fs.writeFileSync('qa-aaa-drag/report.json',JSON.stringify({tested:cases.length,failures,cases},null,2));
console.log('QA-AAA-DRAG '+JSON.stringify({tested:cases.length,failCount:failures.length,firstFailures:failures.slice(0,25),rangeDrift:cases.map(x=>x.rangeDrift)}));
if(failures.length)process.exit(1);
