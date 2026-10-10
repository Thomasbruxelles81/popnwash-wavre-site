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
