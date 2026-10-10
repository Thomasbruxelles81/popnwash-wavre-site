/* POP'n WASH — 130%-fixed main navigation and readable mobile Browse control.
   The header's font metrics are independent of the customer's AAA page scale. */
(()=>{
  'use strict';
  const header=document.getElementById('top');
  const nav=header?.querySelector('.desktop-nav');
  const brand=header?.querySelector('.brand-lockup');
  const actions=header?.querySelector('.header-actions');
  const button=document.getElementById('menuButton');
  const caption=button?.querySelector('.menu-caption');
  if(!header||!nav||!brand||!actions||!button||!caption)return;

  const captions={
    fr:['Parcourir','Parcourir les rubriques'],
    nl:['Menu','Menu openen'],
    en:['Browse','Browse site menu'],
    de:['Menü','Menü öffnen'],
    it:['Esplora','Apri il menu'],
    es:['Explorar','Abrir el menú'],
    pt:['Explorar','Abrir o menu'],
    ro:['Meniu','Deschide meniul'],
    pl:['Menu','Otwórz menu'],
    uk:['Меню','Відкрити меню'],
    ru:['Меню','Открыть меню']
  };
  function localize(){
    const lang=(document.documentElement.lang||'fr').split('-')[0].toLowerCase();
    const entry=captions[lang]||captions.fr;
    if(caption.textContent!==entry[0])caption.textContent=entry[0];
    if(button.getAttribute('aria-label')!==entry[1])button.setAttribute('aria-label',entry[1]);
  }
  let requested=false;
  function fit(){
    requested=false;
    localize();
    // At small and medium widths the labelled Browse button is always used.
    if(window.innerWidth<=1359){
      header.classList.add('nav-fit-compact');
      return;
    }
    if(header.classList.contains('pop-floating-replaced'))return;
    // Temporarily lay out navigation off-screen. This accurately measures
    // translated link widths even when the menu was collapsed previously.
    header.classList.add('pop-nav-measuring');
    const navWidth=Math.ceil(nav.getBoundingClientRect().width);
    const styles=getComputedStyle(header);
    const pad=(parseFloat(styles.paddingLeft)||0)+(parseFloat(styles.paddingRight)||0);
    const gap=parseFloat(styles.columnGap||styles.gap)||10;
    const available=header.clientWidth-pad-brand.getBoundingClientRect().width-
      actions.getBoundingClientRect().width-2*gap-12;
    header.classList.remove('pop-nav-measuring');
    header.classList.toggle('nav-fit-compact',navWidth>available||available<0);
  }
  function schedule(){
    if(requested)return;
    requested=true;
    requestAnimationFrame(fit);
  }
  new MutationObserver(schedule).observe(document.documentElement,{
    attributes:true,attributeFilter:['lang']
  });
  window.addEventListener('resize',schedule,{passive:true});
  window.addEventListener('orientationchange',schedule,{passive:true});
  window.addEventListener('pageshow',schedule);
  window.addEventListener('scroll',()=>{
    // Returning to top restores the normal header from the floating dock.
    if(!header.classList.contains('pop-floating-replaced'))schedule();
  },{passive:true});
  if(typeof ResizeObserver!=='undefined'){
    // Observe dimensions, not class/style mutations made by fit().
    new ResizeObserver(schedule).observe(header);
  }
  if(document.fonts?.ready)document.fonts.ready.then(schedule);
  localize();
  schedule();
})();
