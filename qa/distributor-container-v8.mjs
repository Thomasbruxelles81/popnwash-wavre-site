import { chromium,firefox,webkit } from 'playwright';
import fs from 'node:fs';
const failures=[],report=[],shots=[];
const locales=['fr','nl','en','de','it','es','pt','ro','pl','uk','ru'];
const widths=[320,375,430,600,718,1024,1440];
const sizes=[80,110,130,140,150,170,200];
let cases=0;
for(const [engineName,engine] of Object.entries({chromium,firefox,webkit})){
 const browser=await engine.launch({headless:true});
 for(const width of widths){
  const page=await browser.newPage({viewport:{width,height:900},colorScheme:'light'});
  page.on('pageerror',e=>failures.push(engineName+'/'+width+' JS error '+e.message));
  await page.goto('http://127.0.0.1:4173/',{waitUntil:'domcontentloaded'});
  const card=page.locator('.services-secondary-grid .products-card');
  if(await card.count()!==1)failures.push(engineName+'/'+width+' distributor missing');
  for(const lang of locales)for(const size of sizes)for(const theme of ['light','dark']){
   const id=engineName+'/'+width+'/'+lang+'/'+size+'/'+theme;
   try{
    await page.evaluate(({lang,size,theme})=>{
      const opt=document.querySelector('[data-lang="'+lang+'"]');
      if(!opt)throw Error('No locale '+lang);
      opt.click();
      const slider=document.getElementById('displaySizeRange');
      slider.value=String(size);
      slider.dispatchEvent(new Event('input',{bubbles:true}));
      document.querySelector('[data-theme-choice="'+theme+'"]').click();
      const el=document.querySelector('.products-card');
      // This specific card's geometry must be evaluated in the visible viewport.
      if(el.getBoundingClientRect().top>window.innerHeight||el.getBoundingClientRect().bottom<0)
        el.scrollIntoView({block:'center',behavior:'instant'});
    },{lang,size,theme});
    await page.waitForTimeout(23);
    const test=await page.evaluate(()=>{
      const card=document.querySelector('.services-secondary-grid .products-card');
      const grid=card.querySelector('.product-chips-v2');
      const title=card.querySelector('h3');
      const tiles=[...grid.children],gr=grid.getBoundingClientRect(),cr=card.getBoundingClientRect();
      const cells=tiles.map((tile,i)=>{
        const a=tile.getBoundingClientRect(),strong=tile.querySelector('strong'),r=strong.getBoundingClientRect();
        const overflowWords=[];
        const walker=document.createTreeWalker(strong,NodeFilter.SHOW_TEXT);
        for(let node=walker.nextNode();node;node=walker.nextNode()){
          for(const m of node.textContent.matchAll(/[\p{L}\p{N}][\p{L}\p{N}'’-]*/gu)){
            const range=document.createRange();
            range.setStart(node,m.index);range.setEnd(node,m.index+m[0].length);
            const rects=[...range.getClientRects()];
            if(rects.length!==1){overflowWords.push(m[0]+' split '+rects.length);continue}
            const word=rects[0];
            if(word.left<a.left-2||word.right>a.right+2)
              overflowWords.push(m[0]+' outside tile '+Math.round(word.left-a.left)+' / '+Math.round(word.right-a.right));
          }
        }
        return {i,text:strong.textContent,rect:{left:a.left,right:a.right,top:a.top,bottom:a.bottom},
          glyphOutside:overflowWords,childWidth:r.width,scrollWidth:strong.scrollWidth,
          wordNotFitting:strong.scrollWidth>strong.clientWidth+3};
      });
      const overlaps=[];
      for(let i=0;i<cells.length;i++)for(let j=i+1;j<cells.length;j++){
       const a=cells[i].rect,b=cells[j].rect,
        intersectW=Math.min(a.right,b.right)-Math.max(a.left,b.left),
        intersectH=Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top);
       if(intersectW>1.5&&intersectH>1.5)overlaps.push(i+' overlaps '+j);
      }
      const tr=title.getBoundingClientRect();
      const css=getComputedStyle(grid);
      return {cardWidth:cr.width,gridWidth:gr.width,columns:css.gridTemplateColumns.split(' ').length,
        titleFont:parseFloat(getComputedStyle(title).fontSize),
        titleOutside:tr.left<cr.left-2||tr.right>cr.right+2||title.scrollWidth>title.clientWidth+3,
        gridOutside:gr.left<cr.left-2||gr.right>cr.right+2,
        tilesOutside:cells.filter(c=>c.rect.left<gr.left-2||c.rect.right>gr.right+2).map(c=>c.i),
        wordFails:cells.filter(c=>c.glyphOutside.length||c.wordNotFitting).map(c=>({text:c.text,words:c.glyphOutside,excess:c.scrollWidth-c.childWidth})),
        overlaps,articleHeight:cr.height,
        horizontalPageOverflow:document.documentElement.scrollWidth>document.documentElement.clientWidth+2,
        lang:document.documentElement.lang,scale:document.documentElement.dataset.displayScale,
        theme:document.documentElement.dataset.theme};
    });
    if(test.wordFails.length||test.overlaps.length||test.gridOutside||test.tilesOutside.length||test.titleOutside||test.horizontalPageOverflow)
      failures.push(id+' layout '+JSON.stringify(test).slice(0,700));
    if(test.cardWidth<1080&&test.columns>2)failures.push(id+' forced '+test.columns+' columns in '+test.cardWidth+'px card');
    if(test.cardWidth<360&&test.columns!==1)failures.push(id+' needs one column at '+test.cardWidth+'px');
    if(test.titleFont>46)failures.push(id+' oversized distributor heading '+test.titleFont);
    if(test.lang!==lang||test.scale!==String(size)||test.theme!==theme)
      failures.push(id+' wrong state '+JSON.stringify({lang:test.lang,scale:test.scale,theme:test.theme}));
    cases++;
    if(['fr','nl','de','ru'].includes(lang)&&[110,150,200].includes(size)&&['light','dark'].includes(theme)
      &&[320,375,718,1440].includes(width)){
      const out='qa-distributor/'+engineName+'-'+width+'-'+lang+'-'+size+'-'+theme+'.png';
      fs.mkdirSync('qa-distributor',{recursive:true});
      await card.screenshot({path:out});
      shots.push(out);
    }
    if(['fr','de'].includes(lang)&&[110,150,200].includes(size)&&width===718&&theme==='light')
      report.push({id,...test});
   }catch(e){failures.push(id+' error '+String(e).slice(0,450))}
   if(failures.length>150)break;
  }
  await page.close();
 }
 await browser.close();
}
fs.mkdirSync('qa-distributor',{recursive:true});
fs.writeFileSync('qa-distributor/report.json',JSON.stringify({cases,failures,report,screenshots:shots},null,2));
console.log('QA-DISTRIBUTOR '+JSON.stringify({cases,failCount:failures.length,firstFailures:failures.slice(0,38),screenshots:shots.length,midWidth:report.slice(0,3)}));
if(failures.length)process.exitCode=1;
