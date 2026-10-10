/* POP'n WASH V6 — small, accessibility-aware tactile reactions.
   No QR code, no external JS libraries and no replacement navigation handlers. */
(()=>{
 'use strict';
 if(typeof window.matchMedia!=='function')return;
 const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
 const eligible='.btn,.rf-bonus-choices button,.display-size-button,.lang-button';
 document.addEventListener('pointerdown',event=>{
  if(reduced.matches || event.button!==0)return;
  const el=event.target instanceof Element?event.target.closest(eligible):null;
  if(!el || el.disabled || el.getAttribute('aria-disabled')==='true')return;
  const rect=el.getBoundingClientRect();
  if(rect.width<=0||rect.height<=0)return;
  const mark=document.createElement('span');
  mark.className='popwash-ripple';
  mark.setAttribute('aria-hidden','true');
  mark.style.left=(event.clientX-rect.left)+'px';
  mark.style.top=(event.clientY-rect.top)+'px';
  el.querySelectorAll('.popwash-ripple').forEach(old=>old.remove());
  el.appendChild(mark);
  mark.addEventListener('animationend',()=>mark.remove(),{once:true});
 },{passive:true});
})();


/* POP'n WASH V7: show both full theme words ONLY if both really fit.
   At narrower widths, high AAA scales or long translations, show just
   sun/moon pictograms. No clipped labels and never an "Auto" option. */
(()=>{
 'use strict';
 const control=document.querySelector('#themeControl');
 const shell=control?.querySelector('.theme-slider-shell');
 if(!control||!shell)return;
 const spans=[document.querySelector('#themeLightText'),document.querySelector('#themeDarkText')];
 const cells=[control.querySelector('.theme-light-label'),control.querySelector('.theme-dark-label')];
 if(spans.some(x=>!x)||cells.some(x=>!x))return;
 let pending=false;
 function measure(){
  pending=false;
  // Probe the uncropped version first; otherwise the compact width would
  // keep the picker permanently collapsed after a window resize.
  control.removeAttribute('data-compact-labels');
  const shellWidth=shell.getBoundingClientRect().width;
  const canvas=document.createElement('canvas');
  const ctx=canvas.getContext('2d');
  let widest=0;
  for(let i=0;i<2;i++){
    const labelStyle=getComputedStyle(cells[i]),textStyle=getComputedStyle(spans[i]);
    if(!ctx)continue;
    ctx.font=textStyle.font&&textStyle.font!=='normal normal normal normal 16px / normal serif'?
      textStyle.font:labelStyle.font;
    const text=spans[i].textContent?.trim()||'';
    const letterSpacing=parseFloat(labelStyle.letterSpacing)||0;
    const textWidth=ctx.measureText(text).width+Math.max(0,text.length-1)*letterSpacing;
    const svgWidth=parseFloat(getComputedStyle(cells[i].querySelector('svg')).width)||16;
    const gap=parseFloat(labelStyle.columnGap)||6;
    widest=Math.max(widest,textWidth+svgWidth+gap+18);
  }
  const forcedHidden=spans.some(s=>getComputedStyle(s).display==='none');
  const logo=document.querySelector('.site-header .brand-lockup');
  const actions=document.querySelector('.site-header .header-actions');
  const overlap=!!(logo&&actions&&
    logo.getBoundingClientRect().right>actions.getBoundingClientRect().left+2);
  const compact=forcedHidden||!shellWidth||shellWidth<2*widest||overlap;
  control.toggleAttribute('data-compact-labels',compact);
  // Preserve clickable 50/50 zones and their accessible language labels.
  shell.setAttribute('data-words-fit',compact?'icons':'full');
 }
 function schedule(){
  if(pending)return;
  pending=true;
  requestAnimationFrame(measure);
 }
 const watch=new MutationObserver(schedule);
 watch.observe(document.documentElement,{attributes:true,attributeFilter:['lang','data-display-scale']});
 window.addEventListener('resize',schedule,{passive:true});
 window.addEventListener('orientationchange',schedule,{passive:true});
 if(document.fonts?.ready)document.fonts.ready.then(schedule);
 schedule();
})();
