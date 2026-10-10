/* POP'n WASH — float only the EXISTING AAA/theme/language controls.
   Reparenting preserves translations, listeners, stored choices and one set of IDs. */
(()=>{
 'use strict';
 const header=document.getElementById('top');
 const actions=header?.querySelector('.header-actions');
 const aaa=document.getElementById('displaySizeButton');
 const panel=document.getElementById('displaySizePanel');
 const langMenu=document.getElementById('langMenu');
 const langButton=document.getElementById('langButton');
 const mobile=document.getElementById('mobileMenu');
 const menuButton=document.getElementById('menuButton');
 if(!header||!actions||!aaa||!langButton||!document.getElementById('themeControl'))return;
 const marker=document.createComment('Original POPnWASH header preferences position');
 actions.parentNode.insertBefore(marker,actions);
 const dock=document.createElement('aside');
 dock.id='popFloatingPreferences';
 dock.className='pop-floating-dock';
 dock.setAttribute('aria-label','Préférences du site');
 dock.hidden=true;
 document.body.appendChild(dock);
 let active=false;
 let requested=false;
 let cutoff=Math.max(125,Math.ceil(header.getBoundingClientRect().height+48));
 function closePopovers(){
  if(panel&&!panel.hidden&&aaa.getAttribute('aria-expanded')==='true')aaa.click();
  if(langMenu){langMenu.hidden=true;langButton.setAttribute('aria-expanded','false')}
  if(mobile){mobile.hidden=true;if(menuButton)menuButton.setAttribute('aria-expanded','false')}
 }
 function setFloating(float){
  if(float===active)return;
  active=float;
  closePopovers();
  if(float){
    header.style.setProperty('--pop-stable-header-height',Math.ceil(header.getBoundingClientRect().height)+'px');
    dock.hidden=false;
    dock.appendChild(actions);
    header.classList.add('pop-floating-replaced');
    header.setAttribute('aria-hidden','true');
    dock.setAttribute('aria-label','Préférences du site : taille, thème et langue');
    // Full theme labels must not compete for the compact dock's width.
    document.getElementById('themeControl')?.setAttribute('data-compact-labels','true');
  }else{
    header.classList.remove('pop-floating-replaced');
    header.removeAttribute('aria-hidden');
    marker.parentNode.insertBefore(actions,marker.nextSibling);
    dock.hidden=true;
  }
 }
 function sync(){
  requested=false;
  // Do not move the existing controls between header and floating dock
  // while a finger or mouse is dragging the AAA slider.
  if(document.body.classList.contains('pop-aaa-dragging'))return;
  setFloating(window.scrollY>cutoff);
 }
 function schedule(){
  if(requested)return;
  requested=true;
  requestAnimationFrame(sync);
 }
 window.addEventListener('scroll',schedule,{passive:true});
 window.addEventListener('resize',()=>{
  if(!active)cutoff=Math.max(125,Math.ceil(header.getBoundingClientRect().height+48));
  schedule();
 },{passive:true});
 window.addEventListener('pageshow',schedule);
 // Returning from a hash link or browser history can start midway down.
 schedule();
})();
