/* POP'n WASH R12: measure actual translated navigation down from 125% to 80%.
   Utility bar stays 160% unless the available screen width requires reduction.
   Both are independent from the customer's page-only AAA control. */
(()=>{
  'use strict';
  const header=document.getElementById('top');
  const nav=header?.querySelector('.desktop-nav');
  const brand=header?.querySelector('.brand-lockup');
  const actions=header?.querySelector('.header-actions');
  const button=document.getElementById('menuButton');
  const caption=button?.querySelector('.menu-caption');
  const utility=document.querySelector('.refonte-utility');
  if(!header||!nav||!brand||!actions||!button||!caption)return;

  const captions={
    fr:['Parcourir','Parcourir les rubriques'],nl:['Menu','Menu openen'],
    en:['Browse','Browse site menu'],de:['Menü','Menü öffnen'],
    it:['Esplora','Apri il menu'],es:['Explorar','Abrir el menú'],
    pt:['Explorar','Abrir o menu'],ro:['Meniu','Deschide meniul'],
    pl:['Menu','Otwórz menu'],uk:['Меню','Відкрити меню'],
    ru:['Меню','Открыть меню']
  };
  const labels={
    fr:['Wi-Fi','Espace coworking','Snacks · bientôt disponibles','Mode d’emploi des produits ↗'],
    nl:['Wi-Fi','Coworkingruimte','Snacks · binnenkort verkrijgbaar','Gebruiksaanwijzing producten ↗'],
    en:['Wi-Fi','Coworking space','Snacks · coming soon','How to use the products ↗'],
    de:['WLAN','Coworking-Bereich','Snacks · demnächst erhältlich','Produktanleitung ↗'],
    it:['Wi-Fi','Spazio coworking','Snack · prossimamente disponibili','Istruzioni per i prodotti ↗'],
    es:['Wi-Fi','Espacio coworking','Snacks · próximamente disponibles','Cómo usar los productos ↗'],
    pt:['Wi-Fi','Espaço de coworking','Snacks · em breve','Como usar os produtos ↗'],
    ro:['Wi-Fi','Spațiu coworking','Gustări · în curând','Cum se utilizează produsele ↗'],
    pl:['Wi-Fi','Strefa coworkingowa','Przekąski · wkrótce dostępne','Jak używać produktów ↗'],
    uk:['Wi-Fi','Коворкінг-простір','Снеки · незабаром','Як користуватися засобами ↗'],
    ru:['Wi-Fi','Зона коворкинга','Снеки · скоро в продаже','Как пользоваться средствами ↗']
  };
  function localize(){
    const lang=(document.documentElement.lang||'fr').split('-')[0].toLowerCase();
    const captionText=captions[lang]||captions.fr;
    if(caption.textContent!==captionText[0])caption.textContent=captionText[0];
    if(button.getAttribute('aria-label')!==captionText[1])button.setAttribute('aria-label',captionText[1]);
    const values=labels[lang]||labels.fr;
    ['wifi','cowork','snacks','products-link'].forEach((key,i)=>{
      document.querySelectorAll('[data-pop-r12="'+key+'"]').forEach(el=>{
        if(el.textContent!==values[i])el.textContent=values[i];
      });
    });
  }

  function fitNavigation(){
    if(header.classList.contains('pop-floating-replaced'))return;
    // Probe out of the visible viewport; the burger must not consume width.
    header.classList.add('pop-nav-measuring');
    const style=getComputedStyle(header);
    const padding=(parseFloat(style.paddingLeft)||0)+(parseFloat(style.paddingRight)||0);
    const gap=parseFloat(style.columnGap||style.gap)||6;
    const available=header.clientWidth-padding-
      brand.getBoundingClientRect().width-actions.getBoundingClientRect().width-
      2*gap-12;
    let fit=false;
    for(let pct=125;pct>=80;pct-=5){
      header.style.setProperty('--pop-header-nav-factor',String(pct/100));
      const wanted=nav.getBoundingClientRect().width;
      if(wanted<=available && available>0){fit=true;break;}
    }
    header.classList.toggle('nav-fit-compact',!fit);
    header.classList.add('pop-nav-ready');
    header.classList.remove('pop-nav-measuring');
  }

  function fitUtility(){
    if(!utility)return;
    utility.classList.remove('pop-utility-wrap');
    const style=getComputedStyle(utility);
    const inner=utility.clientWidth-(parseFloat(style.paddingLeft)||0)-
      (parseFloat(style.paddingRight)||0);
    const gap=parseFloat(style.columnGap||style.gap)||8;
    let fits=false;
    for(let font=19.2;font>=10.4;font-=0.4){
      utility.style.setProperty('--pop-utility-font',font.toFixed(1)+'px');
      const kids=Array.from(utility.children).filter(el=>getComputedStyle(el).display!=='none');
      const width=kids.reduce((n,el)=>n+el.getBoundingClientRect().width,0)+Math.max(0,kids.length-1)*gap;
      if(width<=inner){fits=true;break;}
    }
    if(!fits)utility.classList.add('pop-utility-wrap');
  }

  let queued=false;
  function schedule(){
    if(queued)return;
    queued=true;
    requestAnimationFrame(()=>{
      queued=false;
      localize();
      fitUtility();
      fitNavigation();
    });
  }
  new MutationObserver(schedule).observe(document.documentElement,{
    attributes:true,attributeFilter:['lang']
  });
  if(utility){
    new MutationObserver(schedule).observe(utility,{childList:true,subtree:true,characterData:true});
  }
  window.addEventListener('resize',schedule,{passive:true});
  window.addEventListener('orientationchange',schedule,{passive:true});
  window.addEventListener('pageshow',schedule);
  window.addEventListener('scroll',()=>{
    if(!header.classList.contains('pop-floating-replaced'))schedule();
  },{passive:true});
  if(typeof ResizeObserver!=='undefined'){
    const observer=new ResizeObserver(schedule);
    observer.observe(header);
    if(utility)observer.observe(utility);
  }
  if(document.fonts?.ready)document.fonts.ready.then(schedule);
  localize();
  schedule();
})();
